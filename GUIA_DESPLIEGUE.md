# Dashboard Auditorías LAR — Despliegue con acceso por contraseña

Sitio protegido: cada persona entra con su usuario y clave, y ve solo lo que le corresponde.
Alojado en Cloudflare Pages (gratis), con backend para validar el acceso.

---

## CÓMO FUNCIONA (resumen)

- Cada persona tiene un **usuario + contraseña**.
- Hay 3 tipos de acceso (lo define el campo `scope`):
  - Un **edificio** (ej. "Brooklyn"): ve solo ese edificio + comparativo contra el promedio del portafolio.
  - **"ALL"**: el comité, ve los 12 edificios.
- Los datos de los demás edificios **nunca llegan** al navegador de un BM: el servidor solo le entrega lo suyo.
- Un edificio sin auditoría cargada aún muestra un aviso amable; su BM ya puede tener clave desde hoy.

---

## LO QUE NECESITO DE TI: las 28 credenciales

Pásamelas en este formato (una línea por persona):

    usuario | contraseña | qué ve

Ejemplo:

    bm_brooklyn   | Tn7$kp2aR  | Brooklyn
    bma_brooklyn  | Wq3#mz9bL  | Brooklyn
    bm_imu        | Lp5@xv4cT  | IMU
    ...
    comite_jperez | Zx8!nb6dF  | ALL
    comite_mlopez | Vk2&qw7eH  | ALL

Reglas:
- El "qué ve" debe ser el nombre EXACTO del edificio (con tildes y mayúsculas) o la palabra `ALL`.
- Una contraseña distinta por persona, que no sea obvia.
- Los 12 nombres de edificio: Brooklyn, IMU, Holley, SPOT Nueva Kennedy, SOHO,
  SPOT Residence, BLEND, y los 5 que faltan (dame los nombres reales).

Yo convierto esa lista al formato técnico (`USERS_JSON`) que se pega en Cloudflare. No hay que editar código.

---

## PASOS DE DESPLIEGUE (en Cloudflare)

### 1. Subir el proyecto a GitHub
Podés usar el mismo repo (reemplazando todo) o crear uno nuevo, ej. `dashboard-lar-seguro`.
Sube el CONTENIDO de este zip (index.html, login.html, las carpetas data/ y functions/),
con la misma estructura.

### 2. Crear cuenta en Cloudflare
- Entra a https://dash.cloudflare.com/sign-up y crea una cuenta gratis.

### 3. Crear el proyecto de Pages
- En el panel: "Workers & Pages" → "Create" → pestaña "Pages" → "Connect to Git".
- Autoriza tu GitHub y elige el repositorio.
- En configuración de build: deja todo vacío / por defecto
  (no hay framework; build command vacío; output directory `/`).
- "Save and Deploy". Espera 1-2 min.

### 4. Configurar las variables secretas
En el proyecto → "Settings" → "Environment variables" → agrega DOS variables (tipo "Secret"):

  - `SESSION_SECRET` = una frase larga y aleatoria (ej. 40+ caracteres al azar).
    Sirve para firmar las sesiones. No la compartas.

  - `USERS_JSON` = el listado de usuarios en formato JSON (yo te lo armo a partir
    de tu tabla). Se ve así:
    [{"user":"bm_brooklyn","pass":"...","scope":"Brooklyn"}, ... ]

Guarda y vuelve a desplegar (Deployments → "Retry deployment") para que tome las variables.

### 5. Probar
- Abre la URL del proyecto (algo como https://dashboard-lar-seguro.pages.dev).
- Debe mandarte al login. Entra con una credencial de prueba y verifica que
  un BM solo ve su edificio y el comité ve todo.

### 6. (Opcional) Dominio propio
- Settings → "Custom domains" → agrega `dashboards.largroup.cl`.
- Cloudflare te indica el registro DNS a crear. (Requiere acceso al DNS de largroup.cl.)

---

## MANTENIMIENTO

- **Cargar una auditoría nueva**: agrega su `data/<edificio>.json`, actualízalo en
  `data/manifest.json`, y haz commit. El BM de ese edificio lo verá automáticamente.
- **Agregar / quitar personas o cambiar claves**: edita la variable `USERS_JSON`
  en Cloudflare y vuelve a desplegar. (Pásame los cambios y te doy el JSON actualizado.)

---

## NOTA DE SEGURIDAD (honesta)

- Las contraseñas se guardan en `USERS_JSON` (en las variables de Cloudflare, no en el
  código público). Es razonable para un grupo interno. Si esto creciera mucho o manejara
  información muy sensible, conviene que sistemas de LAR evalúe hashear las claves y/o
  usar un proveedor de identidad. Te lo dejo señalado.
- El archivo `functions/_users.js` trae 3 usuarios de EJEMPLO solo para pruebas.
  En producción manda la variable `USERS_JSON`, que tiene prioridad sobre esos ejemplos.
