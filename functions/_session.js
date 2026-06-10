// ============================================================
//  SESIÓN  —  token firmado (HMAC) guardado en cookie httpOnly
// ============================================================
// No usamos librerías externas: solo Web Crypto, disponible en Cloudflare.
// El token contiene { user, scope, exp } y va firmado con un secreto
// (variable de entorno SESSION_SECRET). Si alguien modifica el contenido,
// la firma no valida y la sesión se rechaza.

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64url(bytes) {
  let bin = "";
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const bin = atob(str);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

async function getKey(secret) {
  return crypto.subtle.importKey(
    "raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign", "verify"]
  );
}

export async function createToken(payload, secret, maxAgeSec = 60 * 60 * 12) {
  const body = { ...payload, exp: Math.floor(Date.now() / 1000) + maxAgeSec };
  const data = b64url(enc.encode(JSON.stringify(body)));
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return `${data}.${b64url(sig)}`;
}

export async function verifyToken(token, secret) {
  if (!token || !token.includes(".")) return null;
  const [data, sig] = token.split(".");
  try {
    const key = await getKey(secret);
    const ok = await crypto.subtle.verify(
      "HMAC", key, b64urlDecode(sig), enc.encode(data)
    );
    if (!ok) return null;
    const body = JSON.parse(dec.decode(b64urlDecode(data)));
    if (!body.exp || body.exp < Math.floor(Date.now() / 1000)) return null;
    return body;
  } catch (e) {
    return null;
  }
}

// Lee la cookie de sesión de la request.
export function readSessionCookie(request) {
  const cookie = request.headers.get("Cookie") || "";
  const m = cookie.match(/(?:^|;\s*)lar_session=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

// Devuelve el secreto: variable de entorno o uno por defecto (solo dev).
export function getSecret(env) {
  return (env && env.SESSION_SECRET) || "dev-secret-cambiar-en-produccion";
}
