package handlers

import (
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestUserIDFromContext(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("int64", func(t *testing.T) {
		c, _ := gin.CreateTestContext(httptest.NewRecorder())
		c.Set("user_id", int64(42))
		got, ok := userIDFromContext(c)
		if !ok || got != 42 {
			t.Fatalf("expected ok=true and 42, got ok=%v id=%d", ok, got)
		}
	})

	t.Run("uint", func(t *testing.T) {
		c, _ := gin.CreateTestContext(httptest.NewRecorder())
		c.Set("user_id", uint(7))
		got, ok := userIDFromContext(c)
		if !ok || got != 7 {
			t.Fatalf("expected ok=true and 7, got ok=%v id=%d", ok, got)
		}
	})

	t.Run("missing", func(t *testing.T) {
		c, _ := gin.CreateTestContext(httptest.NewRecorder())
		_, ok := userIDFromContext(c)
		if ok {
			t.Fatalf("expected ok=false")
		}
	})
}
