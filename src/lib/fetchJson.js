/** Fetch JSON safely; never throw on empty/non-JSON bodies. */
export async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text.slice(0, 200) || `Invalid JSON (${res.status})` };
    }
  } else {
    data = { error: `Empty response (${res.status})` };
  }
  return { res, data, ok: res.ok };
}
