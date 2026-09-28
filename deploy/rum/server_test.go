package main

// Интеграционные: настоящий HTTP-сервер и журнал на диске — как у сервиса на проде за nginx

import (
	"bytes"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

const validEvent = `{"lang":"ru","role":"backend","device":"mobile","paint":"lcp","paintMs":420,"loadMs":900,` +
	`"js":63000,"sections":["about","case-1"],"cta":["telegram"]}`

// Сервис поверх журнала path; остановка — вместе с тестом
func startServer(t *testing.T, path string) (*httptest.Server, *store) {
	t.Helper()
	s, err := openStore(path, 30)
	if err != nil {
		t.Fatal(err)
	}
	server := httptest.NewServer(newHandler(s, newLimiter()))
	t.Cleanup(func() {
		server.Close()
		s.file.Close()
	})
	return server, s
}

func post(t *testing.T, server *httptest.Server, body string) int {
	t.Helper()
	res, err := http.Post(server.URL+"/api/rum", "text/plain", strings.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	res.Body.Close()
	return res.StatusCode
}

func getSummary(t *testing.T, server *httptest.Server) (summary, http.Header) {
	t.Helper()
	res, err := http.Get(server.URL + "/api/rum/summary")
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	if res.StatusCode != http.StatusOK {
		t.Fatalf("сводка: %d %s", res.StatusCode, body)
	}
	return decodeSummary(t, body), res.Header
}

func TestBeaconToJournal(t *testing.T) {
	path := filepath.Join(t.TempDir(), "events.jsonl")
	server, _ := startServer(t, path)

	// Время ставит сервер: присланное браузером игнорируем
	body := strings.Replace(validEvent, "{", `{"t":1,`, 1)
	if code := post(t, server, body); code != http.StatusNoContent {
		t.Fatalf("корректный beacon: %d", code)
	}

	journal, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	events, err := readEvents(path, time.Now().Add(-time.Minute))
	if err != nil || len(events) != 1 || bytes.Count(journal, []byte("\n")) != 1 {
		t.Fatalf("журнал: %s (%v)", journal, err)
	}
	e := events[0]
	if e.Lang != "ru" || e.Role != "backend" || e.Device != "mobile" || *e.PaintMs != 420 ||
		len(e.Sections) != 2 || e.CTA[0] != "telegram" {
		t.Fatalf("событие записано не так: %+v", e)
	}

	sum, header := getSummary(t, server)
	if sum.Visitors != 1 || sum.LCP.P50 != 420 || sum.Load.P50 != 900 || sum.JS.P50 != 63000 {
		t.Fatalf("сводка %+v", sum)
	}
	if header.Get("Content-Type") != "application/json" || header.Get("Cache-Control") != "public, max-age=300" {
		t.Fatalf("заголовки сводки %v", header)
	}
}

func TestRejectsGarbage(t *testing.T) {
	path := filepath.Join(t.TempDir(), "events.jsonl")
	server, _ := startServer(t, path)

	for name, body := range map[string]string{
		"не JSON":        "lcp=420",
		"чужой язык":     strings.Replace(validEvent, `"ru"`, `"de"`, 1),
		"больше 4 КБ":    strings.Replace(validEvent, "{", "{"+strings.Repeat(" ", maxBody), 1),
		"пустое тело":    "",
		"массив событий": "[" + validEvent + "]",
	} {
		if code := post(t, server, body); code != http.StatusBadRequest {
			t.Errorf("%s: %d, ожидался 400", name, code)
		}
	}

	for _, req := range []struct{ method, path string }{
		{http.MethodGet, "/api/rum"},
		{http.MethodPost, "/api/rum/summary"},
	} {
		r, _ := http.NewRequest(req.method, server.URL+req.path, nil)
		res, err := http.DefaultClient.Do(r)
		if err != nil {
			t.Fatal(err)
		}
		res.Body.Close()
		if res.StatusCode != http.StatusMethodNotAllowed {
			t.Errorf("%s %s: %d, ожидался 405", req.method, req.path, res.StatusCode)
		}
	}

	if journal, _ := os.ReadFile(path); len(journal) != 0 {
		t.Fatalf("мусор попал в журнал: %s", journal)
	}
}

func TestRateLimit(t *testing.T) {
	server, _ := startServer(t, filepath.Join(t.TempDir(), "events.jsonl"))

	for i := range int(limitBurst) {
		if code := post(t, server, validEvent); code != http.StatusNoContent {
			t.Fatalf("запрос %d: %d", i+1, code)
		}
	}
	if code := post(t, server, validEvent); code != http.StatusTooManyRequests {
		t.Fatalf("сверх запаса: %d, ожидался 429", code)
	}
}

// После перезапуска (выкладка из CI) сводка та же: события читаются из журнала
func TestJournalSurvivesRestart(t *testing.T) {
	path := filepath.Join(t.TempDir(), "events.jsonl")
	old := line(t, Event{Time: time.Now().Add(-40 * 24 * time.Hour).Unix(), Lang: "en", Role: "frontend",
		Device: "desktop", Paint: "lcp", PaintMs: ptr(9000)})
	if err := os.WriteFile(path, []byte(old+"\n"), 0o644); err != nil {
		t.Fatal(err)
	}

	server, s := startServer(t, path)
	for range 3 {
		post(t, server, validEvent)
	}
	server.Close()
	s.file.Close()

	server, _ = startServer(t, path)
	sum, _ := getSummary(t, server)
	if sum.Visitors != 3 || sum.LCP.P50 != 420 {
		t.Fatalf("после перезапуска %+v", sum)
	}

	// Новые события дописываются, старые не теряются
	post(t, server, validEvent)
	if events, _ := readEvents(path, time.Time{}); len(events) != 5 {
		t.Fatalf("в журнале %d событий, ожидалось 5", len(events))
	}
}

func TestReport(t *testing.T) {
	path := filepath.Join(t.TempDir(), "events.jsonl")
	server, _ := startServer(t, path)
	post(t, server, validEvent)
	post(t, server, strings.NewReplacer(`"ru"`, `"en"`, `"mobile"`, `"desktop"`, `["telegram"]`, `[]`).Replace(validEvent))

	var out bytes.Buffer
	if err := report(&out, path, 30); err != nil {
		t.Fatal(err)
	}
	for _, want := range []string{
		"Визитов за 30 дн.: 2",
		"LCP: медиана 420 мс",
		"JS при загрузке: медиана 62 КБ",
		"about                       2  100%",
		"telegram                    1   50%",
	} {
		if !strings.Contains(out.String(), want) {
			t.Errorf("в отчёте нет %q:\n%s", want, out.String())
		}
	}
}
