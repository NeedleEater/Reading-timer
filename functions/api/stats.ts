interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const url = new URL(context.request.url);
  const monthStr = url.searchParams.get("month"); // YYYY-MM

  if (!monthStr) {
    return Response.json({ ok: false, error: "Month is required" }, { status: 400 });
  }

  try {
    // 1. Daily totals for the month
    const startOfMonth = `${monthStr}-01T00:00:00Z`;
    const endOfMonth = new Date(new Date(monthStr + "-01").setMonth(new Date(monthStr + "-01").getMonth() + 1)).toISOString();

    const dailyQuery = await DB.prepare(`
      SELECT 
        strftime('%Y-%m-%d', started_at) as date,
        SUM(duration_seconds) as total_seconds
      FROM sessions
      WHERE started_at >= ? AND started_at < ? AND ended_at IS NOT NULL
      GROUP BY date
    `).bind(startOfMonth, endOfMonth).all();

    const dailyTotals: Record<string, number> = {};
    dailyQuery.results.forEach((row: any) => {
      dailyTotals[row.date] = row.total_seconds;
    });

    // 2. Monthly total
    const monthlyTotalSeconds = Object.values(dailyTotals).reduce((a, b) => a + b, 0);

    // 3. Weekly total (Sunday start)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - dayOfWeek);
    sunday.setHours(0, 0, 0, 0);
    const sundayStr = sunday.toISOString();

    const weeklyQuery = await DB.prepare(`
      SELECT SUM(duration_seconds) as total_seconds
      FROM sessions
      WHERE started_at >= ? AND ended_at IS NOT NULL
    `).bind(sundayStr).first<{ total_seconds: number }>();

    const weeklyTotalSeconds = weeklyQuery?.total_seconds || 0;

    return Response.json({
      ok: true,
      data: {
        dailyTotals,
        weeklyTotalSeconds,
        monthlyTotalSeconds,
      },
    });
  } catch (err: any) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
};
