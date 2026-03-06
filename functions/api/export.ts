interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const url = new URL(context.request.url);
  const monthStr = url.searchParams.get("month"); // YYYY-MM

  if (!monthStr) {
    return new Response("Month is required", { status: 400 });
  }

  try {
    const startOfMonth = `${monthStr}-01T00:00:00Z`;
    const endOfMonth = new Date(new Date(monthStr + "-01").setMonth(new Date(monthStr + "-01").getMonth() + 1)).toISOString();

    const { results } = await DB.prepare(`
      SELECT 
        strftime('%Y-%m-%d', started_at) as date,
        started_at as session_start,
        ended_at as session_end,
        duration_seconds
      FROM sessions
      WHERE started_at >= ? AND started_at < ? AND ended_at IS NOT NULL
      ORDER BY started_at ASC
    `).bind(startOfMonth, endOfMonth).all();

    let csv = "date,session_start,session_end,duration_minutes\n";
    results.forEach((row: any) => {
      const durationMinutes = (row.duration_seconds / 60).toFixed(2);
      csv += `${row.date},${row.session_start},${row.session_end},${durationMinutes}\n`;
    });

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="reading_log_${monthStr}.csv"`,
      },
    });
  } catch (err: any) {
    return new Response("Error generating export", { status: 500 });
  }
};
