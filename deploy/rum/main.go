// Метрики настоящих посетителей портфолио (RUM). Страница при уходе шлёт один beacon
// с замерами, увиденными секциями и кликами по контактам; сервис пишет его в JSONL
// и отдаёт медианы за последние дни — их показывает блок «Почему я».
// Только стандартная библиотека. Ни IP, ни cookie, ни идентификаторов не храним.
//
//	portfolio-rum -addr 127.0.0.1:8090 -data events.jsonl   — сервер
//	portfolio-rum report -data events.jsonl                  — что смотрят посетители
package main

import (
	"bufio"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"log"
	"math"
	"net/http"
	"os"
	"regexp"
	"slices"
	"sort"
	"strings"
	"sync"
	"time"
)

type Event struct {
	Time     int64    `json:"t"` // unix-время приёма, с
	Lang     string   `json:"lang"`
	Role     string   `json:"role"`
	Device   string   `json:"device"`
	Paint    string   `json:"paint,omitempty"` // lcp или fcp (в Safari LCP нет)
	PaintMs  *float64 `json:"paintMs,omitempty"`
	LoadMs   *float64 `json:"loadMs,omitempty"`
	JSBytes  *float64 `json:"js,omitempty"`
	Sections []string `json:"sections,omitempty"`
	CTA      []string `json:"cta,omitempty"`
}

var (
	langs    = []string{"en", "ru"}
	roles    = []string{"frontend", "fullstack", "backend"}
	devices  = []string{"mobile", "desktop"}
	paints   = []string{"", "lcp", "fcp"}
	ctas     = []string{"telegram", "resume", "email", "github", "hh"}
	idFormat = regexp.MustCompile(`^[a-z0-9-]{1,40}$`)
)

const maxBody = 4 << 10

// Проверяем всё, что пришло от браузера: чужое в журнал не попадает
func (e *Event) validate() error {
	if !slices.Contains(langs, e.Lang) || !slices.Contains(roles, e.Role) ||
		!slices.Contains(devices, e.Device) || !slices.Contains(paints, e.Paint) {
		return errors.New("bad enum")
	}
	for _, v := range []*float64{e.PaintMs, e.LoadMs} {
		if v != nil && (*v <= 0 || *v > 60_000) {
			return errors.New("bad timing")
		}
	}
	if e.JSBytes != nil && (*e.JSBytes <= 0 || *e.JSBytes > 20e6) {
		return errors.New("bad size")
	}
	if len(e.Sections) > 40 || len(e.CTA) > 20 {
		return errors.New("too many items")
	}
	for _, id := range e.Sections {
		if !idFormat.MatchString(id) {
			return errors.New("bad section")
		}
	}
	for _, c := range e.CTA {
		if !slices.Contains(ctas, c) {
			return errors.New("bad cta")
		}
	}
	return nil
}

type store struct {
	mu     sync.Mutex
	file   *os.File
	events []Event
	window time.Duration

	cached   []byte
	cachedAt time.Time
}

func readEvents(path string, since time.Time) ([]Event, error) {
	f, err := os.Open(path)
	if errors.Is(err, os.ErrNotExist) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	defer f.Close()

	var events []Event
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		var e Event
		if json.Unmarshal(scanner.Bytes(), &e) == nil && e.Time >= since.Unix() {
			events = append(events, e)
		}
	}
	return events, scanner.Err()
}

func (s *store) add(e Event) error {
	line, err := json.Marshal(e)
	if err != nil {
		return err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, err := s.file.Write(append(line, '\n')); err != nil {
		return err
	}
	s.events = append(s.events, e)
	return nil
}

type stat struct {
	Count int     `json:"count"`
	P50   float64 `json:"p50"`
	P75   float64 `json:"p75"`
}

func percentile(sorted []float64, p float64) float64 {
	if len(sorted) == 0 {
		return 0
	}
	return sorted[int(math.Ceil(p*float64(len(sorted))))-1]
}

func statOf(values []float64) stat {
	sort.Float64s(values)
	return stat{Count: len(values), P50: percentile(values, 0.5), P75: percentile(values, 0.75)}
}

type summary struct {
	Days     int  `json:"days"`
	Visitors int  `json:"visitors"`
	LCP      stat `json:"lcp"`
	Load     stat `json:"load"`
	JS       stat `json:"js"`
}

func summarize(events []Event, days int) summary {
	var lcp, load, js []float64
	for _, e := range events {
		if e.Paint == "lcp" && e.PaintMs != nil {
			lcp = append(lcp, *e.PaintMs)
		}
		if e.LoadMs != nil {
			load = append(load, *e.LoadMs)
		}
		if e.JSBytes != nil {
			js = append(js, *e.JSBytes)
		}
	}
	return summary{Days: days, Visitors: len(events), LCP: statOf(lcp), Load: statOf(load), JS: statOf(js)}
}

// Сводку пересчитываем не чаще раза в минуту
func (s *store) summary() []byte {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.cached != nil && time.Since(s.cachedAt) < time.Minute {
		return s.cached
	}
	since := time.Now().Add(-s.window).Unix()
	s.events = slices.DeleteFunc(s.events, func(e Event) bool { return e.Time < since })
	s.cached, _ = json.Marshal(summarize(s.events, int(s.window.Hours()/24)))
	s.cachedAt = time.Now()
	return s.cached
}

// Грубое ограничение частоты на весь сервис: защита журнала от заливки мусором
const limitRate, limitBurst = 20.0, 40.0

type limiter struct {
	mu     sync.Mutex
	tokens float64
	last   time.Time
}

func newLimiter() *limiter { return &limiter{tokens: limitBurst, last: time.Now()} }

func (l *limiter) allow() bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := time.Now()
	l.tokens = math.Min(limitBurst, l.tokens+now.Sub(l.last).Seconds()*limitRate)
	l.last = now
	if l.tokens < 1 {
		return false
	}
	l.tokens--
	return true
}

// События за окно — в память, журнал — на дозапись
func openStore(path string, days int) (*store, error) {
	window := time.Duration(days) * 24 * time.Hour
	events, err := readEvents(path, time.Now().Add(-window))
	if err != nil {
		return nil, err
	}
	file, err := os.OpenFile(path, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0o644)
	if err != nil {
		return nil, err
	}
	return &store{file: file, events: events, window: window}, nil
}

func newHandler(s *store, limit *limiter) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/rum", func(w http.ResponseWriter, r *http.Request) {
		if !limit.allow() {
			w.WriteHeader(http.StatusTooManyRequests)
			return
		}
		body, err := io.ReadAll(http.MaxBytesReader(w, r.Body, maxBody))
		var e Event
		if err != nil || json.Unmarshal(body, &e) != nil || e.validate() != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		e.Time = time.Now().Unix()
		if err := s.add(e); err != nil {
			log.Printf("rum: запись: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	})
	mux.HandleFunc("GET /api/rum/summary", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "public, max-age=300")
		w.Write(s.summary())
	})
	return mux
}

func serve(addr, path string, days int) error {
	s, err := openStore(path, days)
	if err != nil {
		return err
	}
	defer s.file.Close()

	log.Printf("rum: %s, журнал %s, окно %d дн., загружено %d событий", addr, path, days, len(s.events))
	server := &http.Server{Addr: addr, Handler: newHandler(s, newLimiter()), ReadHeaderTimeout: 5 * time.Second}
	return server.ListenAndServe()
}

// Отчёт для владельца: сколько визитов, какие секции досматривают, по каким контактам кликают
func report(w io.Writer, path string, days int) error {
	events, err := readEvents(path, time.Now().Add(-time.Duration(days)*24*time.Hour))
	if err != nil {
		return err
	}
	n := len(events)
	fmt.Fprintf(w, "Визитов за %d дн.: %d\n", days, n)
	if n == 0 {
		return nil
	}

	count := func(key func(Event) []string) []string {
		counts := map[string]int{}
		for _, e := range events {
			for _, k := range key(e) {
				counts[k]++
			}
		}
		keys := make([]string, 0, len(counts))
		for k := range counts {
			keys = append(keys, k)
		}
		sort.Slice(keys, func(i, j int) bool { return counts[keys[i]] > counts[keys[j]] })
		lines := make([]string, len(keys))
		for i, k := range keys {
			lines[i] = fmt.Sprintf("  %-24s %4d  %3.0f%%", k, counts[k], 100*float64(counts[k])/float64(n))
		}
		return lines
	}
	one := func(v string) []string { return []string{v} }

	sum := summarize(events, days)
	fmt.Fprintf(w, "LCP: медиана %.0f мс, p75 %.0f мс (%d замеров)\n", sum.LCP.P50, sum.LCP.P75, sum.LCP.Count)
	fmt.Fprintf(w, "JS при загрузке: медиана %.0f КБ\n", sum.JS.P50/1024)
	for _, block := range []struct {
		title string
		key   func(Event) []string
	}{
		{"Устройства", func(e Event) []string { return one(e.Device) }},
		{"Язык", func(e Event) []string { return one(e.Lang) }},
		{"Роль", func(e Event) []string { return one(e.Role) }},
		{"Досмотрели до секции (доля визитов)", func(e Event) []string { return e.Sections }},
		{"Клики по контактам", func(e Event) []string { return e.CTA }},
	} {
		fmt.Fprintf(w, "\n%s:\n%s\n", block.title, strings.Join(count(block.key), "\n"))
	}
	return nil
}

func main() {
	command := "serve"
	args := os.Args[1:]
	if len(args) > 0 && !strings.HasPrefix(args[0], "-") {
		command, args = args[0], args[1:]
	}

	flags := flag.NewFlagSet(command, flag.ExitOnError)
	addr := flags.String("addr", "127.0.0.1:8090", "адрес сервера (за nginx)")
	data := flags.String("data", "events.jsonl", "журнал событий")
	days := flags.Int("days", 30, "окно для медиан и отчёта, дней")
	flags.Parse(args)

	var err error
	switch command {
	case "serve":
		err = serve(*addr, *data, *days)
	case "report":
		err = report(os.Stdout, *data, *days)
	default:
		err = fmt.Errorf("неизвестная команда %q: serve или report", command)
	}
	if err != nil {
		log.Fatal(err)
	}
}
