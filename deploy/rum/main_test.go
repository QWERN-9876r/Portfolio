package main

import "testing"

func ptr(v float64) *float64 { return &v }

func TestValidate(t *testing.T) {
	ok := Event{Lang: "ru", Role: "frontend", Device: "desktop", Paint: "lcp", PaintMs: ptr(420), JSBytes: ptr(63000),
		Sections: []string{"about", "case-1"}, CTA: []string{"telegram", "resume"}}
	if err := ok.validate(); err != nil {
		t.Fatalf("корректное событие отклонено: %v", err)
	}
	bad := []Event{
		{Lang: "de", Role: "frontend", Device: "desktop"},
		{Lang: "ru", Role: "frontend", Device: "desktop", PaintMs: ptr(-1)},
		{Lang: "ru", Role: "frontend", Device: "desktop", Sections: []string{"<script>"}},
		{Lang: "ru", Role: "frontend", Device: "desktop", CTA: []string{"evil"}},
	}
	for i, e := range bad {
		if e.validate() == nil {
			t.Errorf("событие %d должно быть отклонено", i)
		}
	}
}

func TestSummarize(t *testing.T) {
	var events []Event
	for _, ms := range []float64{100, 200, 300, 400} {
		events = append(events, Event{Paint: "lcp", PaintMs: ptr(ms)})
	}
	events = append(events, Event{Paint: "fcp", PaintMs: ptr(9999)}) // FCP не смешиваем с LCP
	s := summarize(events, 30)
	if s.Visitors != 5 || s.LCP.Count != 4 || s.LCP.P50 != 200 || s.LCP.P75 != 300 {
		t.Fatalf("сводка %+v", s)
	}
}
