export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS
    const headers = {
      "Content-Type": "application/json; charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    // 動作確認
    if (url.pathname === "/") {
      return new Response(
        JSON.stringify({
          ok: true,
          message: "tsunagaru-meishi API is running",
        }),
        { headers }
      );
    }

    // 名刺を取得
    if (url.pathname.startsWith("/api/card/") && request.method === "GET") {
      const id = url.pathname.split("/").pop();

      const card = await env.DB.prepare(
        "SELECT * FROM cards WHERE id = ?"
      )
        .bind(id)
        .first();

      if (!card) {
        return new Response(
          JSON.stringify({ ok: false, error: "Card not found" }),
          { status: 404, headers }
        );
      }

      return new Response(
        JSON.stringify({ ok: true, card }),
        { headers }
      );
    }

    // 名刺を保存・更新
    if (url.pathname === "/api/card" && request.method === "POST") {
      const data = await request.json();

      if (!data.id) {
        return new Response(
          JSON.stringify({ ok: false, error: "id is required" }),
          { status: 400, headers }
        );
      }

      await env.DB.prepare(`
        INSERT INTO cards (
          id,
          name,
          company,
          position,
          phone,
          email
        )
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          company = excluded.company,
          position = excluded.position,
          phone = excluded.phone,
          email = excluded.email
      `)
        .bind(
          data.id,
          data.name || "",
          data.company || "",
          data.position || "",
          data.phone || "",
          data.email || ""
        )
        .run();

      return new Response(
        JSON.stringify({
          ok: true,
          id: data.id,
        }),
        { headers }
      );
    }

    return new Response(
      JSON.stringify({
        ok: false,
        error: "Not found",
      }),
      { status: 404, headers }
    );
  },
};
