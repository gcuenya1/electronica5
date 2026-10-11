// Netlify Function: guarda y entrega qué temas están habilitados.
// GET  /api/estado            -> público (lo usa la página del alumno)
// POST /api/estado            -> requiere header "x-clave" = variable de entorno DOCENTE_PASSWORD
//      body: { accion: "login" }                 -> verifica la clave
//      body: { accion: "guardar", estado: {...} } -> guarda el estado completo
import { getStore } from "@netlify/blobs";

const CLAVE_BLOB = "estado-v1";

const ESTADO_INICIAL = {
  temas: { "metodos-lineales": { on: true, sol: false } },
  foco: "metodos-lineales",
  aviso: "",
  actualizado: null,
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

function limpiar(estado) {
  const out = { temas: {}, foco: null, aviso: "", actualizado: new Date().toISOString() };
  if (estado && typeof estado === "object") {
    const temas = estado.temas && typeof estado.temas === "object" ? estado.temas : {};
    for (const [id, v] of Object.entries(temas)) {
      if (!/^[a-z0-9-]{1,60}$/.test(id)) continue;
      out.temas[id] = { on: !!(v && v.on), sol: !!(v && v.sol) };
    }
    if (typeof estado.foco === "string" && /^[a-z0-9-]{1,60}$/.test(estado.foco)) out.foco = estado.foco;
    if (typeof estado.aviso === "string") out.aviso = estado.aviso.slice(0, 400);
  }
  return out;
}

export default async (req) => {
  const store = getStore("clases-electronica");

  if (req.method === "GET") {
    const guardado = await store.get(CLAVE_BLOB, { type: "json" });
    return json(guardado || ESTADO_INICIAL);
  }

  if (req.method === "POST") {
    const claveReal = process.env.DOCENTE_PASSWORD;
    if (!claveReal) {
      return json({ error: "Falta configurar la variable de entorno DOCENTE_PASSWORD en Netlify." }, 500);
    }
    if (req.headers.get("x-clave") !== claveReal) {
      return json({ error: "Clave incorrecta" }, 401);
    }
    let body = {};
    try { body = await req.json(); } catch { /* vacío */ }

    if (body.accion === "login") return json({ ok: true });

    if (body.accion === "guardar") {
      const nuevo = limpiar(body.estado);
      await store.setJSON(CLAVE_BLOB, nuevo);
      return json({ ok: true, estado: nuevo });
    }
    return json({ error: "Acción desconocida" }, 400);
  }

  return json({ error: "Método no permitido" }, 405);
};

export const config = { path: "/api/estado" };
