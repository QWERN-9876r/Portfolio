package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func ptr(v float64) *float64 { return &v }

func TestValidate(t *testing.T) {
	ok := Event{Lang: "ru", Role: "frontend", Device: "desktop", Paint: "lcp", PaintMs: ptr(420), JSBytes: ptr(63000),
		Sections: []string{"about", "case-1"}, CTA: []string{"telegram", "resume"}}
	if err := ok.validate(); err != nil {
		t.Fatalf("корректное событие отклонено: %v", err)
	}

	// Меняем в корректном событии одно поле
	cases := []struct {
		name  string
		edit  func(e *Event)
		valid bool
	}{
		{"без отрисовки (Safari без FCP)", func(e *Event) { e.Paint, e.PaintMs = "", nil }, true},
		{"FCP", func(e *Event) { e.Paint = "fcp" }, true},
		{"граница времени", func(e *Event) { e.PaintMs, e.LoadMs = ptr(60_000), ptr(60_000) }, true},
		{"секция из 40 символов", func(e *Event) { e.Sections = []string{strings.Repeat("a", 40)} }, true},
		{"клик по MangoScript", func(e *Event) { e.CTA = []string{"mangoscript"} }, true},
		{"чужой язык", func(e *Event) { e.Lang = "de" }, false},
		{"чужая роль", func(e *Event) { e.Role = "designer" }, false},
		{"чужое устройство", func(e *Event) { e.Device = "tv" }, false},
		{"чужая отрисовка", func(e *Event) { e.Paint = "fp" }, false},
		{"нулевое время", func(e *Event) { e.PaintMs = ptr(0) }, false},
		{"отрицательная загрузка", func(e *Event) { e.LoadMs = ptr(-1) }, false},
		{"загрузка дольше минуты", func(e *Event) { e.LoadMs = ptr(60_001) }, false},
		{"JS больше 20 МБ", func(e *Event) { e.JSBytes = ptr(21e6) }, false},
		{"разметка в секции", func(e *Event) { e.Sections = []string{"<script>"} }, false},
		{"секция из 41 символа", func(e *Event) { e.Sections = []string{strings.Repeat("a", 41)} }, false},
		{"41 секция", func(e *Event) { e.Sections = strings.Fields(strings.Repeat("a ", 41)) }, false},
		{"чужой контакт", func(e *Event) { e.CTA = []string{"evil"} }, false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			e := ok
			c.edit(&e)
			if err := e.validate(); (err == nil) != c.valid {
				t.Errorf("validate() = %v, ожидалось valid=%v", err, c.valid)
			}
		})
	}
}

func TestPercentile(t *testing.T) {
	if got := percentile(nil, 0.5); got != 0 {
		t.Errorf("пустой ряд: %v", got)
	}
	if got := percentile([]float64{7}, 0.75); got != 7 {
		t.Errorf("одно значение: %v", got)
	}
	// Nearest-rank: без интерполяции, всегда одно из настоящих значений
	values := []float64{1, 2, 3, 4, 5}
	if p50, p75 := percentile(values, 0.5), percentile(values, 0.75); p50 != 3 || p75 != 4 {
		t.Errorf("p50=%v p75=%v", p50, p75)
	}
}

func TestSummarize(t *testing.T) {
	var events []Event
	for _, ms := range []float64{400, 100, 300, 200} { // порядок не важен
		events = append(events, Event{Paint: "lcp", PaintMs: ptr(ms), LoadMs: ptr(ms * 2)})
	}
	events = append(events, Event{Paint: "fcp", PaintMs: ptr(9999)}) // FCP не смешиваем с LCP
	s := summarize(events, 30)
	if s.Days != 30 || s.Visitors != 5 || s.LCP.Count != 4 || s.LCP.P50 != 200 || s.LCP.P75 != 300 {
		t.Fatalf("сводка %+v", s)
	}
	if s.Load.Count != 4 || s.Load.P50 != 400 || s.JS.Count != 0 {
		t.Fatalf("загрузка и JS %+v %+v", s.Load, s.JS)
	}
}

func TestReadEvents(t *testing.T) {
	events, err := readEvents(filepath.Join(t.TempDir(), "нет.jsonl"), time.Now())
	if err != nil || events != nil {
		t.Fatalf("нет журнала — пусто и без ошибки: %v %v", events, err)
	}

	now := time.Now()
	path := filepath.Join(t.TempDir(), "events.jsonl")
	// Устаревшее событие и оборванная при падении строка не мешают читать остальное
	lines := []string{
		line(t, Event{Time: now.Add(-40 * 24 * time.Hour).Unix(), Lang: "en"}),
		`{"t": битая строка`,
		line(t, Event{Time: now.Unix(), Lang: "ru"}),
	}
	if err := os.WriteFile(path, []byte(strings.Join(lines, "\n")+"\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	events, err = readEvents(path, now.Add(-30*24*time.Hour))
	if err != nil || len(events) != 1 || events[0].Lang != "ru" {
		t.Fatalf("события %+v, ошибка %v", events, err)
	}
}

func TestLimiter(t *testing.T) {
	l := newLimiter()
	for i := range int(limitBurst) {
		if !l.allow() {
			t.Fatalf("запрос %d из запаса отклонён", i+1)
		}
	}
	if l.allow() {
		t.Fatal("запас исчерпан, а запрос пропущен")
	}

	// Через секунду запас пополняется на limitRate, но не выше limitBurst
	l.last = l.last.Add(-time.Second)
	allowed := 0
	for l.allow() {
		allowed++
	}
	if allowed != int(limitRate) {
		t.Fatalf("за секунду пополнилось %d, ожидалось %v", allowed, limitRate)
	}
	l.last = l.last.Add(-time.Hour)
	allowed = 0
	for l.allow() {
		allowed++
	}
	if allowed != int(limitBurst) {
		t.Fatalf("после простоя %d, ожидалось не больше %v", allowed, limitBurst)
	}
}

func TestStoreSummary(t *testing.T) {
	path := filepath.Join(t.TempDir(), "events.jsonl")
	s, err := openStore(path, 30)
	if err != nil {
		t.Fatal(err)
	}
	defer s.file.Close()

	now := time.Now()
	s.events = []Event{
		{Time: now.Add(-31 * 24 * time.Hour).Unix(), Paint: "lcp", PaintMs: ptr(5000)}, // устарело, пока сервис работал
		{Time: now.Unix(), Paint: "lcp", PaintMs: ptr(300)},
	}
	if got := decodeSummary(t, s.summary()); got.Visitors != 1 || got.LCP.P50 != 300 {
		t.Fatalf("устаревшее событие попало в сводку: %+v", got)
	}
	if len(s.events) != 1 {
		t.Fatalf("устаревшее событие осталось в памяти: %d", len(s.events))
	}

	// Минуту отдаём ту же сводку, потом пересчитываем
	if err := s.add(Event{Time: now.Unix(), Paint: "lcp", PaintMs: ptr(100)}); err != nil {
		t.Fatal(err)
	}
	if got := decodeSummary(t, s.summary()); got.Visitors != 1 {
		t.Fatalf("сводка пересчитана раньше минуты: %+v", got)
	}
	s.cachedAt = s.cachedAt.Add(-time.Minute)
	if got := decodeSummary(t, s.summary()); got.Visitors != 2 || got.LCP.P50 != 100 {
		t.Fatalf("сводка не пересчитана через минуту: %+v", got)
	}
}

func line(t *testing.T, e Event) string {
	t.Helper()
	b, err := json.Marshal(e)
	if err != nil {
		t.Fatal(err)
	}
	return string(b)
}

func decodeSummary(t *testing.T, body []byte) summary {
	t.Helper()
	var s summary
	if err := json.Unmarshal(body, &s); err != nil {
		t.Fatalf("сводка не JSON: %v: %s", err, body)
	}
	return s
}

func TestRecent(t *testing.T) {
	s := &store{window: 30 * 24 * time.Hour}
	if visits, total := s.recent(20); total != 0 || visits == nil || len(visits) != 0 {
		t.Fatalf("пустой журнал — пустой список, не null: %v %d", visits, total)
	}

	now := time.Now()
	s.events = []Event{{Time: now.Add(-40 * 24 * time.Hour).Unix(), Role: "устарело"}}
	for _, role := range []string{"a", "b", "c"} {
		s.events = append(s.events, Event{Time: now.Unix(), Role: role})
	}
	visits, total := s.recent(2)
	if total != 3 || len(visits) != 2 || visits[0].Role != "c" || visits[1].Role != "b" {
		t.Fatalf("последние два, новые первыми, без устаревших: %+v из %d", visits, total)
	}
	// Копия: разворот не трогает журнал в памяти
	if s.events[len(s.events)-1].Role != "c" {
		t.Fatal("recent изменил порядок событий в журнале")
	}
}

func TestHub(t *testing.T) {
	var h hub
	ch, ok := h.subscribe()
	if !ok {
		t.Fatal("подписка отклонена")
	}
	// Отстающий зритель: буфер полон — визит пропускается, publish не блокируется
	done := make(chan struct{})
	go func() {
		for range cap(ch) + 5 {
			h.publish(Event{Role: "backend"})
		}
		close(done)
	}()
	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("publish ждёт медленного зрителя")
	}
	if len(ch) != cap(ch) {
		t.Fatalf("в буфере %d из %d", len(ch), cap(ch))
	}

	h.unsubscribe(ch)
	h.publish(Event{})
	if len(h.clients) != 0 {
		t.Fatal("отписка не сработала")
	}

	for range maxLiveClients {
		h.subscribe()
	}
	if _, ok := h.subscribe(); ok {
		t.Fatalf("больше %d зрителей", maxLiveClients)
	}
}
