// Cloudflare Pages Function — Proxy JSON da API ML
// Endpoint: GET /ml-proxy?path=/users/me  (Authorization: Bearer <token>)
// Suporta GET, POST, PATCH, DELETE, OPTIONS

export async function onRequest(context) {
  const { request } = context;
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  };

  if (request.method === "OPTIONS") {
    return new Response("", { status: 200, headers: cors });
  }

  const url = new URL(request.url);
  const mlPath = url.searchParams.get("path") || "/users/me";

  const mlHeaders = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0",
  };
  const auth = request.headers.get("authorization") || request.headers.get("Authorization");
  if (auth) mlHeaders["Authorization"] = auth;

  const init = {
    method: request.method,
    headers: mlHeaders,
  };

  // Para métodos com body, encaminha
  if (["POST", "PATCH", "PUT"].includes(request.method)) {
    try { init.body = await request.text(); } catch { init.body = ""; }
  }

  try {
    const mlResp = await fetch(`https://api.mercadolibre.com${mlPath}`, init);
    const body = await mlResp.text();
    return new Response(body, {
      status: mlResp.status,
      headers: {
        ...cors,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message, detail: "proxy_error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
}
