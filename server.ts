import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const isProd = process.env.NODE_ENV === "production";
const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Initialize local SQLite for preview
  const db = new Database("local.db");
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      duration_seconds INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
  `);

  // API Routes (Mocking Cloudflare Functions for Preview)
  
  app.post("/api/sessions/start", (req, res) => {
    const startedAt = new Date().toISOString();
    try {
      const stmt = db.prepare("INSERT INTO sessions (started_at) VALUES (?)");
      const info = stmt.run(startedAt);
      res.json({
        ok: true,
        data: {
          sessionId: info.lastInsertRowid,
          startedAt: startedAt,
        },
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.post("/api/sessions/stop", (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ ok: false, error: "Session ID required" });

    const endedAt = new Date().toISOString();
    try {
      const session = db.prepare("SELECT started_at FROM sessions WHERE id = ?").get(sessionId) as any;
      if (!session) return res.status(404).json({ ok: false, error: "Session not found" });

      const start = new Date(session.started_at).getTime();
      const end = new Date(endedAt).getTime();
      const durationSeconds = Math.max(0, Math.floor((end - start) / 1000));

      db.prepare("UPDATE sessions SET ended_at = ?, duration_seconds = ? WHERE id = ?")
        .run(endedAt, durationSeconds, sessionId);

      res.json({
        ok: true,
        data: { sessionId, endedAt, durationSeconds },
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.get("/api/stats", (req, res) => {
    const { month } = req.query;
    if (!month) return res.status(400).json({ ok: false, error: "Month required" });

    try {
      const startOfMonth = `${month}-01T00:00:00Z`;
      const endOfMonth = new Date(new Date(month + "-01").setMonth(new Date(month + "-01").getMonth() + 1)).toISOString();

      const dailyRows = db.prepare(`
        SELECT 
          strftime('%Y-%m-%d', started_at) as date,
          SUM(duration_seconds) as total_seconds
        FROM sessions
        WHERE started_at >= ? AND started_at < ? AND ended_at IS NOT NULL
        GROUP BY date
      `).all(startOfMonth, endOfMonth) as any[];

      const dailyTotals: Record<string, number> = {};
      dailyRows.forEach(row => {
        dailyTotals[row.date] = row.total_seconds;
      });

      const monthlyTotalSeconds = Object.values(dailyTotals).reduce((a, b) => a + b, 0);

      const now = new Date();
      const dayOfWeek = now.getDay();
      const sunday = new Date(now);
      sunday.setDate(now.getDate() - dayOfWeek);
      sunday.setHours(0, 0, 0, 0);
      const sundayStr = sunday.toISOString();

      const weeklyRow = db.prepare(`
        SELECT SUM(duration_seconds) as total_seconds
        FROM sessions
        WHERE started_at >= ? AND ended_at IS NOT NULL
      `).get(sundayStr) as any;

      const weeklyTotalSeconds = weeklyRow?.total_seconds || 0;

      res.json({
        ok: true,
        data: { dailyTotals, weeklyTotalSeconds, monthlyTotalSeconds },
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.get("/api/export", (req, res) => {
    const { month } = req.query;
    if (!month) return res.status(400).send("Month required");

    try {
      const startOfMonth = `${month}-01T00:00:00Z`;
      const endOfMonth = new Date(new Date(month + "-01").setMonth(new Date(month + "-01").getMonth() + 1)).toISOString();

      const results = db.prepare(`
        SELECT 
          strftime('%Y-%m-%d', started_at) as date,
          started_at as session_start,
          ended_at as session_end,
          duration_seconds
        FROM sessions
        WHERE started_at >= ? AND started_at < ? AND ended_at IS NOT NULL
        ORDER BY started_at ASC
      `).all(startOfMonth, endOfMonth) as any[];

      let csv = "date,session_start,session_end,duration_minutes\n";
      results.forEach(row => {
        const durationMinutes = (row.duration_seconds / 60).toFixed(2);
        csv += `${row.date},${row.session_start},${row.session_end},${durationMinutes}\n`;
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="reading_log_${month}.csv"`);
      res.send(csv);
    } catch (err: any) {
      res.status(500).send("Error generating export");
    }
  });

  // Vite integration
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
