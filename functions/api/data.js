// GET /api/data  -> devuelve SOLO los datos permitidos según la sesión.
//
//   scope = "ALL"        -> todos los edificios + manifest completo
//   scope = "<Edificio>" -> solo ese edificio (con su avg_otros para el
//                           comparativo contra el promedio del portafolio).
//                           Si el edificio no tiene auditoría cargada,
//                           se devuelve un marcador { pending: true }.
//
// Importante: los JSON de los OTROS edificios nunca se envían al navegador
// cuando el scope es un edificio puntual. El filtrado ocurre en el servidor.

import { verifyToken, readSessionCookie, getSecret } from "../_session.js";
import { ALL_BUILDINGS_LIST } from "../_users.js";

export async function onRequestGet({ request, env, ASSETS }) {
  const token = readSessionCookie(request);
  const session = await verifyToken(token, getSecret(env));
  if (!session) {
    return json({ ok: false, error: "No autorizado" }, 401);
  }

  // helper para leer un archivo estático del propio sitio (carpeta /data)
  const origin = new URL(request.url).origin;
  async function readData(file) {
    const r = await fetch(`${origin}/data/${file}`);
    if (!r.ok) return null;
    return r.json();
  }
  async function readText(file) {
    const r = await fetch(`${origin}/data/${file}`);
    if (!r.ok) return null;
    return r.text();
  }

  const manifest = await readData("manifest.json");
  const larLogo = await readText("lar_logo.txt");
  if (!manifest) return json({ ok: false, error: "Sin manifest" }, 500);

  // Mapa nombre -> archivo, según manifest
  const fileByName = {};
  for (const b of manifest.buildings) fileByName[b.name] = b.file;

  // ---- Comité: ve todo ----
  if (session.scope === "ALL") {
    const entries = await Promise.all(
      manifest.buildings.map(async b => [b.name, await readData(b.file)])
    );
    const buildings = Object.fromEntries(entries.filter(([, v]) => v));
    return json({
      ok: true,
      scope: "ALL",
      order: manifest.order,
      buildings,
      larLogo,
    });
  }

  // ---- BM / BMA: ve solo su edificio ----
  const name = session.scope;

  // ¿El edificio existe en la lista oficial de 12?
  const known = ALL_BUILDINGS_LIST.includes(name);

  // ¿Tiene auditoría cargada?
  const file = fileByName[name];
  if (!file) {
    // Edificio válido pero sin data todavía -> aviso amable
    return json({
      ok: true,
      scope: name,
      pending: true,
      buildingName: name,
      known,
      larLogo,
    });
  }

  const data = await readData(file);
  if (!data) {
    return json({ ok: true, scope: name, pending: true, buildingName: name, known, larLogo });
  }

  // Solo este edificio. El avg_otros embebido ya permite el comparativo
  // contra el promedio del portafolio sin exponer a los demás.
  return json({
    ok: true,
    scope: name,
    order: [name],
    buildings: { [name]: data },
    larLogo,
  });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
