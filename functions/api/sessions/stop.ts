interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const body: any = await context.request.json();
  const { sessionId } = body;

  if (!sessionId) {
    return Response.json({ ok: false, error: "Session ID is required" }, { status: 400 });
  }

  const endedAt = new Date().toISOString();

  try {
    // Get the start time first
    const session = await DB.prepare("SELECT started_at FROM sessions WHERE id = ?")
      .bind(sessionId)
      .first<{ started_at: string }>();

    if (!session) {
      return Response.json({ ok: false, error: "Session not found" }, { status: 404 });
    }

    const start = new Date(session.started_at).getTime();
    const end = new Date(endedAt).getTime();
    const durationSeconds = Math.max(0, Math.floor((end - start) / 1000));

    await DB.prepare(
      "UPDATE sessions SET ended_at = ?, duration_seconds = ? WHERE id = ?"
    )
      .bind(endedAt, durationSeconds, sessionId)
      .run();

    return Response.json({
      ok: true,
      data: {
        sessionId,
        endedAt,
        durationSeconds,
      },
    });
  } catch (err: any) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
};
