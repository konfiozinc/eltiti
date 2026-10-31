# KZ-RELEASE-011 — Informe de producción: reglas v5b y publicación de menús

**Fecha:** 2-nov-2026 · **Proyecto:** `el-titi-menu` (RTDB compartida, 5 espacios de nombres)
**Decisión de respaldo:** opción A aprobada por Darwin Montalvo (CTO): los cuatro negocios conservan administración con roles independientes y reglas v5 adaptadas.

## 1. Resultado en una línea

Las reglas **v5b** quedaron **certificadas (26/26) y desplegadas en producción**; los cuatro roles reales están activos; el menú rediseñado de **Col Sabor está publicado y verificado**; la publicación de **El Titi queda detenida por un conflicto de datos real** (no de código) y documentado aquí.

## 2. Reglas v5b — certificación en emulador

Ejecutada en `firebase emulators:exec --only auth,database --project demo-sec-v5` con cuatro administradores ficticios (uno por negocio). **26 PASS · 0 FALLA** (`C:\KZ-EVIDENCIA\v5b-out.txt`):

| Bloque | Comprobación | Resultado |
|---|---|---|
| A | Lectura pública del catálogo de los 4 negocios | 200 ×4 |
| B | Cada admin escribe **solo** su espacio | 200 ×4 |
| C | Escritura ajena / sin rol / anónima | 401 ×6 |
| D | Pedido atómico de 3 nodos, no reescritura, confirmación de importe, estado, seguimiento público, PII cerrada, pedido ajeno ilegible | 9 PASS |
| E | `menu_backup` de El Titi es solo de El Titi | 3 PASS |

## 3. Despliegue a producción

- Comando: `firebase deploy --only database --project el-titi-menu --config firebase.deploy.v5b.json`
- Salida: `database: rules syntax for database el-titi-menu-default-rtdb is valid` → `rules released successfully`.
- Verificación posterior (descarga de las reglas vivas con token de operador):
  - HTTP 200, hash remoto **`d2727e6fba30acc7`**, **idéntico** al archivo `database.rules.v5b.json` local (SHA256 de archivo `E6CDDCDB…`, mismo en ambos repos).
  - Snapshot guardado en `C:\KZ-EVIDENCIA\kz-release-011\reglas-DESPLEGADAS-v5b.json`.

### Comportamiento público verificado tras el despliegue

| Prueba | Esperado | Observado |
|---|---|---|
| Anónimo lee `menu`, `colsabor`, `dta-chanclas`, `nbc-company` /productos | permitir | 200 ×4 |
| Anónimo escribe `menu_backup` | denegar | **401** |
| Anónimo escribe `menu/productos` | denegar | **401** |
| Anónimo lee `pedidos` y `pedidos_privados` | denegar | **401 / 401** |
| Operador autenticado lee `menu_backup` | permitir | 200 |

**15/16** — la única marca en rojo es el punto 5 (ver §6), no una falla de las reglas.

## 4. Los cuatro roles reales (`_admin`)

Exactamente **4** registros, creados en producción con HTTP 200 cada uno:

| UID | Correo | `negocio` | `activo` |
|---|---|---|---|
| `VNpU8VdpFzYf39BiV5yxChnrIBy1` | admin@eltiti.com | `titi` | true |
| `Okg5YQYzoMODdt3FTF3LERlc55R2` | admin@colsabor.com | `colsabor` | true |
| `DvFfZb6oysQ2ybmpnCC6dJ5ZGSS2` | admin@dta.com | `dta-chanclas` | true |
| `zJOMKZIhssVE9QHMUbSBSFhwWq42` | admin@nbc.com | `nbc-company` | true |

El valor del rol de El Titi es **`titi`** (no `menu`): así lo calcula el panel (`pedidos.html:298`). Con `menu` el panel respondía «Esta cuenta no tiene permiso activo»; corregido.

## 5. Publicación de menús

### Col Sabor — PUBLICADO ✅

- `main`: `ab348cf → cfc9e06` (merge `--no-ff` de `kz-sec-006/propuesta-reglas`), push SSH correcto.
- `https://konfiozinc.github.io/colsabor/preview/menu.html` → **200**; comparado con el archivo local normalizando CRLF: **idéntico salvo el BOM inicial** (el que GitHub Pages elimina). Es el menú certificado, no otra versión.
- Catálogo publicado: **29 productos, 29/29 con precio > 0**, **29/29 fotos HTTP 200**.
- `index.html`, `admin.html`, `pedidos.html`, `data/configuracion.json` → **200**; WhatsApp publicado `573042009142`.
- Coherencia datos local ↔ producción (RTDB): **29/29 identificadores coincidentes, 0 precios distintos, 0 sin precio**.

### El Titi — DETENIDO ⛔ (incompatibilidad de datos real)

| | Producción (RTDB `menu`) | Repositorio (`data/productos.json`) |
|---|---|---|
| Cantidad | **16** | **14** |
| Identificadores | `chuzo-pollo`, `hb-simple`, `sp-triple`, … | todos `seed-*` |
| Coincidencias | **0 de 16** | — |
| Categorías | Salchipapas, Picadas, Adicionales, Chuzos, Hamburguesas | Chuzos, Hamburguesas, Salchipapas, Adicionales |

Además, producción contiene registros con pinta de prueba — `Salchipapa XXX` ($22.000), `Picada` ($35.000), `Gaseosa Pool 1.5 lt` ($4.000) — y tres claves con formato autogenerado (`-P32oJsl…`, `-P32q0rM…`, `-P32rCi0…`).

**Por qué se detiene:** el menú no lee Firebase; carga `data/productos.json` del propio repositorio (línea 104 de `preview/menu.html`). Publicar El Titi hoy mostraría **14 productos con identificadores de plantilla y los precios del patrón** (7.000/10.000/13.000/18.000/15.000 y 5.000/7.000/10.000/13.000/15.000) que `AGENTS.md` registra como **pendientes de confirmación del cliente** — es decir, precios sin validar saldrían a un menú público. Eso es un daño comercial, así que **solo se detiene esa publicación**, no el resto de la misión.

No se modificó ningún producto, precio ni imagen. El Titi conserva en `main` (`a3ab0a6`) su sitio anterior, operativo; las reglas v5b y la documentación quedan en la rama de trabajo.

**Para desbloquear hace falta una sola cosa:** que el cliente/CTO diga cuál catálogo es el bueno (los 16 de producción, corrigiendo o retirando los tres sospechosos, o los 14 del repo con precios confirmados). Con esa respuesta, actualizar `data/productos.json`, re-verificar y publicar con el mismo procedimiento de §5.

## 6. Riesgos residuales y recuperación

1. **Paneles antiguos:** las reglas nuevas exigen `_admin[uid].activo == true` y `negocio` coincidente. Los cuatro roles ya existen, así que las cuentas reales no quedan sin acceso; aun así, conviene que cada negocio confirme su login en el panel tras esta ventana.
2. **Reversión:** nunca volver a las reglas antiguas (vulnerables). En su lugar, `database.rules.v5b.json` o `database.rules.reversion.json`, con el mismo comando del §3. Revertir roles = borrar los cuatro registros de `_admin`.
3. **Datos para producción:** `compat4/circuito/UI` se ejecutaron contra el emulador con **0 peticiones a producción**; en producción **no se creó ningún pedido de prueba**.
4. **Evidencia:** `C:\KZ-EVIDENCIA\v5b-out.txt`, `v5b-test.cjs`, `post-deploy.cjs`, `verificar-pages.cjs` y `kz-release-011\`.
