import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const BASE = "https://cricket.sportmonks.com/api/v2.0";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const token = Deno.env.get("SPORTMONKS_API_TOKEN");
  if (!token) {
    return new Response(JSON.stringify({ error: "SPORTMONKS_API_TOKEN is not configured" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const incoming = new URL(req.url);
  const mode = incoming.searchParams.get("mode") || "latest";
  const paths: Record<string, string> = {
    latest: "/livescores/latest",
    live: "/livescores",
    inplay: "/livescores/inplay",
  };

  if (!paths[mode]) {
    return new Response(JSON.stringify({ error: "Unsupported mode" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const target = new URL(BASE + paths[mode]);
  target.searchParams.set("api_token", token);
  const include = incoming.searchParams.get("include");
  if (include) target.searchParams.set("include", include);

  try {
    const response = await fetch(target, { headers: { Accept: "application/json" } });
    return new Response(await response.text(), {
      status: response.status,
      headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 502,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
