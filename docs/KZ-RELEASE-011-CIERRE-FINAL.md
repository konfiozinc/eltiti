# KZ-RELEASE-011 · Cierre final — dos menús publicados

**Fecha:** 2-nov-2026 · **Aprobación comercial:** Darwin Montalvo (CTO)
**Estado:** cerrado. Reglas v5b desplegadas, catálogo de El Titi aprobado y publicado, rediseños de ambos negocios servidos desde su dirección principal.

## 1. Cambios comerciales aprobados y aplicados

Aplicados en Firebase sobre `menu/productos`, **solo** los campos autorizados. Los otros 13 registros no se tocaron (precios verificados idénticos antes/después).

| id | Campo | Antes | Después | HTTP |
|---|---|---|---|---|
| `hb-doble` | `nombre` | «Hamburguesas» | **Hamburguesa de la Casa** ($10.000) | 200 |
| `hb-x` | `nombre` | «Hamburguesa Doble» | **Especial** ($18.000) | 200 |
| `-P32oJslKTLLahoiqsfZ` | — | Salchipapa XXX ($22.000) | aprobado sin cambios | — |
| `-P32q0rM6C9-J2FmpX-7` | — | Picada / categoría `Picadas` ($35.000) | aprobado, categoría habilitada | — |
| `-P32rCi0W-_ysRXAykNF` | `categoria` | Adicionales | **Bebidas** ($4.000) | 200 |

Verificaciones del cambio: **16 registros antes y después** (mismo conjunto de ids), **0 nombres duplicados**, identificadores originales conservados.

## 2. Catálogo definitivo de El Titi (16 productos)

| Categoría | Producto | Precio |
|---|---|---|
| Hamburguesas | Hamburguesa de la Casa · Especial · Hamburguesa Especial · Hamburguesa Simple | $10.000 · $18.000 · $18.000 · $8.000 |
| Salchipapas | Salchipapa XXX · Choripapa · Salchipapa Doble · Especial · Simple · Triple · X | $22.000 · $12.000 · $11.000 · $8.000 · $6.000 · $14.000 · $17.000 |
| Chuzos | Chuzo de Cerdo · Chuzo de Pollo | $17.000 · $15.000 |
| Picadas | Picada | $35.000 |
| Bebidas | Gaseosa Pool 1.5 lt | $4.000 |
| Adicionales | Butifarra | $800 |

Observación para el negocio (no es un error, es la aprobación tal cual): «Especial» (`hb-x`, $18.000) y «Hamburguesa Especial» (`hb-especial`, $18.000) conviven en la misma categoría con el mismo precio. Si el cliente quiere distinguirlas, basta renombrar una desde el panel.

## 3. Integración

- `preview/menu.html` e `index.html` son el mismo menú: la carpeta base se calcula según la ruta (`/` → `""`, `/preview/` → `"../"`), así el rediseño funciona en las dos direcciones.
- Catálogo: primero Firebase (`menu/productos`), respaldo `data/productos.produccion.json` (16 registros, ids originales). Cero `seed-*`.
- `NEGOCIO.pendientesAprobacion` quedó vacía: los cinco productos aprobados se publican.
- Los sitios anteriores se conservan accesibles como `index-v1.html` en cada repositorio.

## 4. Pruebas

**Batería de menú (emulador, reglas v5b): 20/20 PASS** — raíz y preview por separado:

- 16 productos · 16/16 nombres y precios aprobados · 6 categorías (Picadas y Bebidas incluidas) · 16/16 fotografías · sin agotados.
- Carrito: 10.000 + 35.000 + 4.000 = **$49.000**.
- Pedido: código de consulta, 3 ítems con **ids originales** (`hb-doble`, `-P32q0rM6C9-J2FmpX-7`, `-P32rCi0W-_ysRXAykNF`), `total: 0`, `COTIZACION_PENDIENTE`.
- Seguimiento público con solo `estado, fecha, total` · pedido completo y datos privados en 401.

**Producción pública: 29/29 PASS**

| Dirección | HTTP | Productos | Fotos | Carrito | Consola |
|---|---|---|---|---|---|
| `https://konfiozinc.github.io/eltiti/` | 200 | **16** | 16/16 | $28.000 | sin errores |
| `https://konfiozinc.github.io/eltiti/preview/menu.html` | 200 | 16 | 16/16 | $28.000 | sin errores |
| `https://konfiozinc.github.io/colsabor/` | 200 | **29** | 29/29 | $4.500 | sin errores |
| `https://konfiozinc.github.io/colsabor/preview/menu.html` | 200 | 29 | 29/29 | $4.500 | sin errores |

Respaldo `index-v1.html` accesible (200). No se creó ningún pedido real durante las pruebas: el flujo de registro se validó en el emulador aislado.

## 5. Datos intactos

- Pedidos de producción: `menu` **3** registros (el más reciente del 05-oct-2026) y `colsabor` **10** (31-oct-2026), sin cambios.
- Productos: los 13 no autorizados conservan nombre, precio, categoría e imagen.
- Reglas: v5b desplegadas desde `d2727e6fba30acc7`; los cuatro roles `_admin` siguen activos.

## 6. Commits de producción

| Repositorio | Commit | Contenido |
|---|---|---|
| colsabor | `cfc9e06` | reglas v5b + menú rediseñado |
| colsabor | `f51866d` | informe de producción |
| colsabor | `528970e` | favicon |
| colsabor | `2860c5c` | conciliación del catálogo de El Titi |
| colsabor | `111d3f4` | rediseño publicado en la dirección principal |
| colsabor | `b796a37` | icono de pestaña con ruta válida en raíz y preview |
| eltiti | `b3183dd` | menú con catálogo real (ids originales) |
| eltiti | `2cd5483` | favicon y respaldo de imagen `no-image.webp` |
| eltiti | `2319a5d` | conciliación de 16 registros |
| eltiti | `d60cb53` | **16 productos aprobados en la dirección principal** |
| eltiti | `16f2a59` | icono de pestaña con ruta válida en raíz y preview |

## 7. Reversión

1. **Un producto**: editarlo desde el panel (escribe en Firebase; el menú lo refleja en la siguiente carga).
2. **Ocultar temporalmente** uno: añadir su id a `NEGOCIO.pendientesAprobacion` en `preview/menu.html` y `index.html`.
3. **Volver al sitio anterior**: `git checkout <commit>~1 -- index.html` en el repo del negocio (el original está en `index-v1.html`).
4. **Reglas**: nunca restaurar las anteriores (vulnerables); usar `database.rules.v5b.json`.
