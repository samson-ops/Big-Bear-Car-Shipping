// Cloudflare Pages Function — proxies the BeRocker Lead Source API so the key
// stays server-side and browser CORS is avoided (the page calls this, same-origin).
//
// The lead-source key is read from an env var if set (recommended), else this default.
// To use an env var: Cloudflare dashboard -> your Pages project -> Settings ->
// Environment variables -> add  BEROCKER_LEAD_KEY = <your lead source key>
const DEFAULT_KEY = '6ac78bd5bcce1';   // <-- the "AD number" for THIS website (BeRocker Lead Source key)

export async function onRequest(context) {
  const { request, params, env } = context;
  const key = (env && env.BEROCKER_LEAD_KEY) || DEFAULT_KEY;
  const sub = Array.isArray(params.path) ? params.path.join('/') : (params.path || '');
  const base = 'https://app.shipguy.com/api/v1/auto-logistics/client/webhooks/lead/' + key;
  const target = base + (sub ? '/' + sub : '');

  const init = { method: request.method, headers: { 'Content-Type': 'application/json' } };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.text();
  }

  try {
    const res = await fetch(target, init);
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ message: 'proxy_error: ' + (e && e.message) }), {
      status: 502, headers: { 'Content-Type': 'application/json' }
    });
  }
}
