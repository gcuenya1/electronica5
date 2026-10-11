// Servidor local para probar el sitio en tu compu (sin instalar nada: solo Node).
// Uso:  npm run dev      (o)   node dev-server.mjs
// Abre http://localhost:8888  — panel docente en http://localhost:8888/docente.html
// La clave docente local es "docente" (cambiala con la variable DOCENTE_PASSWORD).
// El estado de los temas se guarda en .estado-local.json (no se sube a Netlify).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8888;
const CLAVE = process.env.DOCENTE_PASSWORD || 'docente';
const ARCHIVO_ESTADO = path.join(ROOT, '.estado-local.json');

// --- Emulación de Netlify Blobs con un archivo JSON ---
let memoria = null;
try { memoria = JSON.parse(fs.readFileSync(ARCHIVO_ESTADO, 'utf8')); } catch { /* primera vez */ }
const storeLocal = {
  async get() { return memoria; },
  async setJSON(_k, v) { memoria = v; fs.writeFileSync(ARCHIVO_ESTADO, JSON.stringify(v, null, 2)); },
};

// Cargamos la función real reemplazando el import de @netlify/blobs por el store local
const fuente = fs.readFileSync(path.join(ROOT, 'netlify/functions/estado.mjs'), 'utf8')
  .replace(/import\s*\{\s*getStore\s*\}\s*from\s*["']@netlify\/blobs["'];?/, 'const getStore = () => globalThis.__storeLocal;');
globalThis.__storeLocal = storeLocal;
process.env.DOCENTE_PASSWORD = CLAVE;
const { default: funcionEstado } = await import('data:text/javascript;base64,' + Buffer.from(fuente).toString('base64'));

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.ico': 'image/x-icon', '.md': 'text/plain; charset=utf-8',
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    if (url.pathname === '/api/estado') {
      const body = req.method === 'POST' ? await new Promise(r => { let d = ''; req.on('data', c => d += c); req.on('end', () => r(d)); }) : undefined;
      const r = await funcionEstado(new Request(url, { method: req.method, headers: req.headers, body }));
      res.writeHead(r.status, Object.fromEntries(r.headers));
      res.end(await r.text());
      return;
    }
    let p = decodeURIComponent(url.pathname);
    if (p.endsWith('/')) p += 'index.html';
    const archivo = path.normalize(path.join(ROOT, p));
    if (!archivo.startsWith(ROOT) || !fs.existsSync(archivo) || fs.statSync(archivo).isDirectory()) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); res.end('No encontrado'); return;
    }
    res.writeHead(200, { 'content-type': TIPOS[path.extname(archivo).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
    fs.createReadStream(archivo).pipe(res);
  } catch (e) {
    console.error(e);
    res.writeHead(500); res.end('Error: ' + e.message);
  }
});

server.listen(PORT, () => {
  const u = `http://localhost:${PORT}`;
  console.log('\n  Electrónica 5.º — servidor local');
  console.log(`  Sitio (alumno):  ${u}`);
  console.log(`  Panel docente:   ${u}/docente.html   (clave: ${CLAVE})`);
  console.log('  Ctrl + C para detener.\n');
  if (!process.env.NO_ABRIR) {
    const cmd = process.platform === 'win32' ? `start "" "${u}"` : process.platform === 'darwin' ? `open "${u}"` : `xdg-open "${u}"`;
    exec(cmd, () => {});
  }
});
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') console.error(`El puerto ${PORT} está ocupado. Probá:  set PORT=8889 && npm run dev`);
  else console.error(e);
  process.exit(1);
});
