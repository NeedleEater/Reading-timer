interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const startedAt = new Date().toISOString();

  try {
    const result = await DB.prepare(
      "INSERT INTO sessions (started_at) VALUES (?) RETURNING id, started_at"
    )
      .bind(startedAt)
      .first<{ id: number; started_at: string }>();

    if (!result) {
      return Response.json({ ok: false, error: "Failed to start session" }, { status: 500 });
    }

    return Response.json({
      ok: true,
      data: {
        sessionId: result.id,
        startedAt: result.started_at,
      },
    });
  } catch (err: any) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
};
