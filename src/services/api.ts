export interface Session {
  id: number;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  created_at: string;
}

export interface Stats {
  dailyTotals: Record<string, number>;
  weeklyTotalSeconds: number;
  monthlyTotalSeconds: number;
}

export const api = {
  async startSession(): Promise<{ ok: boolean; data?: { sessionId: number; startedAt: string }; error?: string }> {
    try {
      const res = await fetch("/api/sessions/start", { method: "POST" });
      if (!res.ok) return { ok: false, error: `Server error: ${res.status}` };
      const text = await res.text();
      return text ? JSON.parse(text) : { ok: false, error: "Empty response" };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  },

  async stopSession(sessionId: number): Promise<{ ok: boolean; data?: { sessionId: number; endedAt: string; durationSeconds: number }; error?: string }> {
    try {
      const res = await fetch("/api/sessions/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) return { ok: false, error: `Server error: ${res.status}` };
      const text = await res.text();
      return text ? JSON.parse(text) : { ok: false, error: "Empty response" };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  },

  async getStats(month: string): Promise<{ ok: boolean; data?: Stats; error?: string }> {
    try {
      const res = await fetch(`/api/stats?month=${month}`);
      if (!res.ok) return { ok: false, error: `Server error: ${res.status}` };
      const text = await res.text();
      return text ? JSON.parse(text) : { ok: false, error: "Empty response" };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  },

  getExportUrl(month: string): string {
    return `/api/export?month=${month}`;
  }
};
