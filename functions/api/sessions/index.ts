interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const url = new URL(context.request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  if (!from || !to) {
    return Response.json({ ok: false, error: "From and To dates are required" }, { status: 400 });
  }

  try {
    const { results } = await DB.prepare(
      "SELECT * FROM sessions WHERE started_at >= ? AND started_at <= ? AND ended_at IS NOT NULL ORDER BY started_at DESC"
    )
      .bind(from, to)
      .all();

    return Response.json({ ok: true, data: results });
  } catch (err: any) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
};
