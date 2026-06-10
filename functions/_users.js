// ============================================================
//  CONFIGURACIÓN DE USUARIOS Y PERMISOS  —  Dashboard Auditorías LAR
// ============================================================
//
//  Cada usuario tiene: { user, pass, scope }
//    - user:  nombre de usuario (lo que escribe al entrar)
//    - pass:  contraseña (texto plano aquí; ver nota de seguridad abajo)
//    - scope: qué puede ver:
//             * el NOMBRE EXACTO de un edificio  -> ve solo ese edificio + comparativo
//             * "ALL"                            -> ve todo el portafolio
//
//  Los nombres de edificio deben coincidir EXACTAMENTE con el campo
//  "edificio" / la clave en el manifest (sensible a mayúsculas y tildes).
//
//  NOTA DE SEGURIDAD: lo ideal es no tener contraseñas en texto plano en
//  el repositorio. Por eso este archivo está pensado para LEERSE DESDE
//  UNA VARIABLE DE ENTORNO en Cloudflare (USERS_JSON). Si esa variable
//  existe, se usa esa; si no, se cae a esta lista local (útil para pruebas).
//
//  >>> JO: ENVÍAME TUS 28 CREDENCIALES Y LAS PONGO ACÁ (o en la variable). <<<
//  Mientras tanto dejo 3 usuarios de EJEMPLO para poder probar el flujo.
// ============================================================

export const FALLBACK_USERS = [
  // --- EJEMPLOS (borrar cuando lleguen las reales) ---
  { user: "demo_brooklyn", pass: "cambiar-esta-clave-1", scope: "Brooklyn" },
  { user: "demo_imu",      pass: "cambiar-esta-clave-2", scope: "IMU" },
  { user: "demo_comite",   pass: "cambiar-esta-clave-3", scope: "ALL" },
];

// Lista de los 12 edificios (los 7 con data + 5 por llegar).
// Esto permite crear claves de edificios aún sin auditoría: si el edificio
// no tiene JSON cargado, el dashboard muestra un aviso amable.
export const ALL_BUILDINGS_LIST = [
  "Brooklyn",
  "IMU",
  "Holley",
  "SPOT Nueva Kennedy",
  "SOHO",
  "SPOT Residence",
  "BLEND",
  // --- edificios sin auditoría cargada aún (muestran aviso) ---
  "Bellet",
  "Central",
  "Park",
  "Boldo",
  "Nativo",
];

// Devuelve la lista de usuarios: prioriza la variable de entorno USERS_JSON.
export function getUsers(env) {
  if (env && env.USERS_JSON) {
    try {
      const parsed = JSON.parse(env.USERS_JSON);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch (e) {
      // si la variable está mal formada, caemos al fallback
    }
  }
  return FALLBACK_USERS;
}
