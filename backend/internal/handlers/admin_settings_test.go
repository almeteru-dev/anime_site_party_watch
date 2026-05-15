package handlers

import (
	"testing"
	"time"
)

func TestLoadScheduleLocation(t *testing.T) {
	loc, normalized, err := loadScheduleLocation("UTC")
	if err != nil {
		t.Fatalf("expected nil err, got %v", err)
	}
	if normalized != "UTC" {
		t.Fatalf("expected UTC normalized, got %q", normalized)
	}
	if loc != time.UTC {
		t.Fatalf("expected time.UTC")
	}

	loc, normalized, err = loadScheduleLocation("UTC+5")
	if err != nil {
		t.Fatalf("expected nil err for UTC+5, got %v", err)
	}
	if normalized != "UTC+5" {
		t.Fatalf("expected normalized UTC+5, got %q", normalized)
	}
	_, offset := time.Now().In(loc).Zone()
	if offset != 5*60*60 {
		t.Fatalf("expected offset 5h, got %d", offset)
	}

	_, _, err = loadScheduleLocation("Not/A_Timezone")
	if err == nil {
		t.Fatalf("expected error for invalid timezone")
	}
}

func TestRecalcScheduleUTC_PreservesLocalClock(t *testing.T) {
	oldLoc := time.FixedZone("UTC+5", 5*60*60)
	newLoc := time.FixedZone("UTC+2", 2*60*60)

	oldUTC := time.Date(2026, 5, 3, 15, 0, 0, 0, time.UTC)
	got := recalcScheduleUTC(oldUTC, oldLoc, newLoc)
	want := time.Date(2026, 5, 3, 18, 0, 0, 0, time.UTC)
	if !got.Equal(want) {
		t.Fatalf("expected %s, got %s", want.Format(time.RFC3339), got.Format(time.RFC3339))
	}

	back := recalcScheduleUTC(got, newLoc, oldLoc)
	if !back.Equal(oldUTC) {
		t.Fatalf("expected roundtrip back to %s, got %s", oldUTC.Format(time.RFC3339), back.Format(time.RFC3339))
	}
}
