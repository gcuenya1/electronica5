# Electrónica General 5.º — sitio de clases

Teoría, simulaciones, ejercicios con pistas y soluciones, autoevaluaciones y guía docente para 16 temas.
El docente habilita los temas desde un panel y el alumno los ve aparecer en unos segundos, sin recargar la página.

## Subirlo a Netlify (una sola vez)

> Tiene una función de servidor (`netlify/functions/estado.mjs`) que guarda qué temas están habilitados.
> Por eso **no alcanza con arrastrar la carpeta** a Netlify Drop: hay que subirlo desde GitHub (recomendado) o con Netlify CLI.

### Opción A — GitHub (recomendada)
1. Creá un repositorio nuevo en GitHub (puede ser privado) y subí **todo el contenido** de esta carpeta (sin `node_modules`).
2. En Netlify: **Add new site → Import an existing project → GitHub** y elegí el repo.
   La configuración ya está en `netlify.toml`; no hace falta tocar nada. Tocá **Deploy**.
3. Cuando termine: **Site configuration → Environment variables → Add a variable**
   - Key: `DOCENTE_PASSWORD`
   - Value: la clave que quieras usar
4. **Deploys → Trigger deploy → Deploy site** (para que tome la variable).

### Opción B — Netlify CLI
```bash
npm install -g netlify-cli
cd electronica5
npm install
netlify login
netlify deploy --prod            # la primera vez crea el sitio
netlify env:set DOCENTE_PASSWORD "tu-clave"
netlify deploy --prod            # de nuevo, para tomar la variable
```

El guardado usa **Netlify Blobs**, que viene incluido y no requiere configuración.

## Cómo se usa

| Quién | Dónde | Qué ve |
|---|---|---|
| Alumno | `https://tu-sitio.netlify.app/` | Solo los temas habilitados. Soluciones solo si las habilitaste. |
| Docente | `https://tu-sitio.netlify.app/docente.html` | Panel con interruptores por tema. |

En el **panel docente** tenés, por tema:
- **Visible**: el alumno puede abrir el tema.
- **Soluciones**: muestra las resoluciones de los ejercicios (las pistas se ven siempre).
- **Foco hoy**: el alumno ve un aviso “Ahora estamos viendo…” con un botón para ir directo.
- Un **aviso** de texto libre (tarea, recordatorio) que aparece arriba de todo.

Cuando entrás con la clave y abrís el sitio, quedás en **modo docente**: ves todos los temas (los ocultos marcados), la pestaña **Guía docente** de cada tema (secuencia de clase, errores frecuentes, preguntas para hacer y un repaso para vos) y una barra flotante para habilitar el tema que estás mirando.
Si vas a compartir pantalla, tocá **Modo presentación**: se ocultan la guía y la barra.

Al principio solo está habilitado el tema 1.

## Probarlo en la compu antes de subir
- Abrí `index.html` con un servidor local (por ejemplo `python3 -m http.server`) → **modo vista previa**: muestra todo, incluida la guía docente.
- Para probar también el panel: `npm install` y `netlify dev`.

## Estructura
```
index.html            sitio del alumno / docente
docente.html          panel para habilitar temas
css/style.css         estilos (modo claro y oscuro)
js/core.js            helpers de simulación y dibujos de circuitos
js/app.js             navegación, permisos, ejercicios, quiz
js/temas/NN-*.js      un archivo por tema (teoría, simulaciones, ejercicios, quiz, guía)
netlify/functions/    función que guarda el estado
vendor/katex/         fórmulas matemáticas (incluido, funciona sin CDN)
```

Para cambiar un texto o un ejercicio, editá el archivo del tema en `js/temas/`. Para agregar un tema nuevo, copiá uno existente, cambiá `id` y `orden`, y sumá su `<script>` en `index.html` y `docente.html`.
