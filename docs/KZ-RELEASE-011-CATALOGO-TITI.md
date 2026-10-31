# KZ-RELEASE-011 · Catálogo definitivo de El Titi

**Fuente:** Firebase RTDB `el-titi-menu` → `menu/productos` (lectura directa, solo lectura).
**Decisión aplicada:** el catálogo de producción es la fuente principal (CTO).
**Fecha:** 2-nov-2026 · **Commit publicado:** `b3183dd` + `2cd5483` (favicon)

## 1. Conciliación de los 16 registros

Comparado contra `data/productos.json` (14 registros `seed-*`, plantilla), las 15 fotografías en `assets/productos/` y el estado real de cada imagen.

| # | Identificador original | Nombre | Categoría | Precio | Fotografía | Disponibilidad | Estado |
|---|---|---|---|---|---|---|---|
| 1 | `hb-x` | Hamburguesa Doble | Hamburguesas | $18.000 | Cloudinary 200 | disponible | **discrepante** |
| 2 | `hb-especial` | Hamburguesa Especial | Hamburguesas | $18.000 | local ✔ | disponible | confirmado |
| 3 | `hb-simple` | Hamburguesa Simple | Hamburguesas | $8.000 | local ✔ | disponible | confirmado |
| 4 | `hb-doble` | Hamburguesas | Hamburguesas | $10.000 | Cloudinary 200 | disponible | **discrepante** |
| 5 | `choripapa` | Choripapa | Salchipapas | $12.000 | Cloudinary 200 | disponible | confirmado |
| 6 | `sp-doble` | Salchipapa Doble | Salchipapas | $11.000 | local ✔ | disponible | confirmado |
| 7 | `sp-especial` | Salchipapa Especial | Salchipapas | $8.000 | local ✔ | disponible | confirmado |
| 8 | `sp-simple` | Salchipapa Simple | Salchipapas | $6.000 | Cloudinary 200 | disponible | confirmado |
| 9 | `sp-triple` | Salchipapa Triple | Salchipapas | $14.000 | local ✔ | disponible | confirmado |
| 10 | `sp-x` | Salchipapa X | Salchipapas | $17.000 | local ✔ | disponible | confirmado |
| 11 | `-P32oJslKTLLahoiqsfZ` | Salchipapa XXX | Salchipapas | $22.000 | Cloudinary 200 | disponible | **sospechoso** |
| 12 | `chuzo-cerdo` | Chuzo de Cerdo | Chuzos | $17.000 | Cloudinary 200 | disponible | confirmado |
| 13 | `chuzo-pollo` | Chuzo de Pollo | Chuzos | $15.000 | Cloudinary 200 | disponible | confirmado |
| 14 | `-P32q0rM6C9-J2FmpX-7` | Picada | Picadas | $35.000 | Cloudinary 200 | disponible | **sospechoso** |
| 15 | `butifarra` | Butifarra | Adicionales | $800 | Cloudinary 200 | disponible | confirmado |
| 16 | `-P32rCi0W-_ysRXAykNF` | Gaseosa Pool 1.5 lt | Adicionales | $4.000 | Cloudinary 200 | disponible | **sospechoso** |

**11 confirmados · 2 discrepantes · 3 sospechosos.** Ningún registro se modificó ni se borró en Firebase.

### Por qué cada uno está donde está

- **Precios = reales, no plantilla.** Los valores de producción (8.000 · 6.000 · 11.000 · 14.000 · 17.000) **no** siguen el patrón de plantilla del JSON local (7.000 · 5.000 · 7.000 · 10.000 · 15.000). Son carga real hecha desde el panel, no datos de ejemplo.
- **`hb-doble`** — el campo `nombre` trae «Hamburguesas», que es el nombre de la categoría, no del producto.
- **`hb-x`** — el campo `nombre` trae «Hamburguesa Doble», que duplica el concepto de `hb-doble`. La clave (`hb-x`) sugiere «Hamburguesa X».
- **`Salchipapa XXX`** — nombre con «XXX», clave autogenerada y el precio más alto de la categoría ($22.000), por encima de la Triple ($14.000) y de la X ($17.000).
- **`Picada`** — única con categoría «Picadas»; esa categoría no existía en el catálogo del sitio y el registro tiene clave autogenerada.
- **`Gaseosa Pool 1.5 lt`** — está en «Adicionales», no en «Bebidas»; «Pool» no es una marca verificable contra el catálogo del cliente.

## 2. Los cinco pendientes de decisión comercial (no publicados)

Ninguno se publica hasta que el CTO responda. Preguntas concretas:

1. **`hb-doble` ($10.000)** — ¿el nombre correcto es «Hamburguesa Doble»?
2. **`hb-x` ($18.000)** — ¿el nombre correcto es «Hamburguesa X»? ¿O es realmente «Hamburguesa Doble» y `hb-doble` es otra cosa?
3. **`Salchipapa XXX` ($22.000)** — ¿producto real (promoción/tamaño especial) o registro de prueba a retirar?
4. **`Picada` ($35.000)** — ¿producto real? Si sí, ¿qué categoría debe llevar en el menú?
5. **`Gaseosa Pool 1.5 lt` ($4.000)** — ¿marca y nombre comerciales correctos? ¿Categoría «Bebidas»?

Responder esas cinco preguntas y publicarlas lleva minutos: se edita el nombre en el panel, y basta quitar su id de `NEGOCIO.pendientesAprobacion` en `preview/menu.html`.

## 3. Integración técnica

- `preview/menu.html` ahora consume **primero Firebase** (`menu/productos.json`, lectura pública permitida por v5b) y, si no responde, la **copia verificada** `data/productos.produccion.json` (16 registros, ids originales). Nunca usa los `seed-*`.
- Las imágenes aceptan URL absoluta (Cloudinary) y ruta del repo; ya no se prefija `../` a las absolutas.
- El orden de categorías respeta `data/configuracion.json` y descarta las vacías (por eso «Picadas» no aparece mientras su único producto está retenido).
- `NEGOCIO.pendientesAprobacion` contiene los 5 ids retenidos: se excluyen **solo de la vista**, no se tocan en Firebase.

## 4. Pruebas ejecutadas

**Batería funcional aislada (emulador, reglas v5b, `?emulador=1`): 34/34 PASS** (`titi-menu-final.txt`)

| Bloque | Comprobación | Resultado |
|---|---|---|
| A | 11 productos visibles · 11 precios · 5 retenidos ausentes | 17 PASS |
| B | Precios coinciden con Firebase | 11/11 |
| C | Fotografías cargan | 11/11 |
| D | Categorías: Hamburguesas · Salchipapas · Chuzos · Adicionales | PASS |
| E | Disponibilidad: sin agotados, botones activos | PASS |
| F | Carrito 18.000 + 14.000 = **32.000** | PASS |
| G | Pedido registrado: nodo público sin PII, ítems con ids originales, `total: 0`, `COTIZACION_PENDIENTE`, datos privados separados | 5 PASS |
| H | Seguimiento legible sin sesión · pedido completo 401 | PASS |
| I | 0 peticiones fuera del emulador · sin errores de consola | PASS |

**URL pública verificada: 12/12 PASS** · `https://konfiozinc.github.io/eltiti/preview/menu.html`

- HTTP 200 · 11 productos con precios reales · 11/11 fotografías (Cloudinary y locales) · 4 categorías · 0 recursos propios en error · 0 errores de consola.
- Los 5 retenidos **no aparecen** públicamente (comprobado uno por uno).
- Col Sabor re-verificado en el mismo pase: 29 productos, 29/29 fotos, sin errores.
- Correcciones incluidas: favicon propio en ambos menús (antes `/favicon.ico` daba 404) y respaldo de imagen de El Titi apuntando a `no-image.webp` (apuntaba a `.png`, inexistente).

## 5. Reversión

- Ocultar o mostrar un producto: editar `NEGOCIO.pendientesAprobacion` en `preview/menu.html` (`main`).
- Volver al menú anterior de El Titi: revertir el merge `b3183dd` (el sitio antiguo `index.html` nunca se tocó y sigue sirviendo `data/productos.json` original).
