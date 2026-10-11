/* api.js — comunicación con la Netlify Function /api/estado */
const API = (() => {
  const URL_API = '/api/estado';
  const CLAVE_SS = 'clave-docente-e5';
  const CACHE_LS = 'estado-cache-e5';
  const esLocal = location.protocol === 'file:';

  const leerClave = () => { try { return sessionStorage.getItem(CLAVE_SS) || ''; } catch { return ''; } };
  const guardarClave = (c) => { try { c ? sessionStorage.setItem(CLAVE_SS, c) : sessionStorage.removeItem(CLAVE_SS); } catch { } };

  /** Devuelve { estado, origen: 'servidor'|'cache'|'local' } */
  async function obtener() {
    if (esLocal) return { estado: null, origen: 'local' };
    try {
      const r = await fetch(URL_API, { cache: 'no-store' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const estado = await r.json();
      try { localStorage.setItem(CACHE_LS, JSON.stringify(estado)); } catch { }
      return { estado, origen: 'servidor' };
    } catch (e) {
      let cache = null;
      try { cache = JSON.parse(localStorage.getItem(CACHE_LS) || 'null'); } catch { }
      // Sin función disponible (p. ej. abriendo con un servidor local simple): modo local
      if (!cache && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) return { estado: null, origen: 'local' };
      return { estado: cache, origen: 'cache' };
    }
  }

  async function post(body, clave = leerClave()) {
    const r = await fetch(URL_API, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-clave': clave },
      body: JSON.stringify(body),
    });
    let data = {};
    try { data = await r.json(); } catch { }
    if (!r.ok) { const e = new Error(data.error || ('Error ' + r.status)); e.status = r.status; throw e; }
    return data;
  }

  async function login(clave) {
    await post({ accion: 'login' }, clave);
    guardarClave(clave);
    return true;
  }
  const guardar = (estado) => post({ accion: 'guardar', estado });
  const salir = () => guardarClave('');

  return { obtener, login, guardar, salir, leerClave, esLocal };
})();
