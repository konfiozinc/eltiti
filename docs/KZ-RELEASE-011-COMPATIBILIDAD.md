# KZ-RELEASE-011 · Compatibilidad y preparación de publicación

**CTO:** Darwin Montalvo · **Ejecutor:** Harness · **Fecha:** 30-oct-2026
**Rama:** `kz-sec-006/propuesta-reglas` · El Titi `57ed6c4` · Col Sabor `a9ab2b5`
**Dictamen:** **GO técnico para el despliegue coordinado** (reglas v5 + menús). **NO-GO para publicar solo los menús.**

## 1. Compatibilidad de los cuatro negocios — **11/11 PASS** (ejecutado hoy)

| Consumidor | Rutas que usa | Permiso en v5 | Verificado |
|---|---|---|---|
| **El Titi** (`menu`) | `productos`, `promo`, `horario`, `meta` (público) · `pedidos`, `pedidos_privados` (admin) · `pedidos_publico/{codigo}` (público) | lectura pública del catálogo; pedidos solo admin activo del negocio | **200** lectura · escritura cruzada **401** |
| **Col Sabor** (`colsabor`) | idénticas | idénticas | **200** lectura · admin ajeno **401** |
| **DTA Chanclas** | `productos`, `meta` | **solo lectura pública**, sin escritura | lectura **200** · escritura anónima **401** |
| **NBC Company** | `productos`, `meta` | igual | lectura **200** · escritura anónima y con admin de El Titi **401** |
| **`menu_backup`** | copia del menú | lectura/escritura **solo admin activo de El Titi** | anónimo **401** · admin **200** · escritura anónima **401** |

## 2. Riesgos encontrados y correcciones

| # | Riesgo | Estado |
|---|---|---|
| 1 | **Publicar los menús sin desplegar v5** rompería el registro de pedidos: el esquema de tres nodos no existe en las reglas actuales | **Bloqueante**: el despliegue debe ser **coordinado** (reglas primero, menús después) |
| 2 | Las reglas desplegadas hoy son **vulnerables** (pedidos escribibles sin sesión, `menu_backup` escribible, sin aislamiento) | Se corrige con v5. **No se usan como reversión** |
| 3 | El nodo público `pedidos_publico` muestra `total` | Verificado que solo tras confirmación administrativa; nunca precio presentado como definitivo antes |
| 4 | Superficie compartida por cuatro negocios | v5 conserva las lecturas de DTA/NBC y cierra toda escritura ajena (probado) |
| 5 | Los menús rediseñados escriben PII | Va **solo** a `pedidos_privados`, con lectura restringida al negocio |

## 3. Roles administrativos necesarios

Documento por cuenta: `_admin/{uid} = { negocio: "<valor>", activo: true }`.

**Valor exacto que exige el panel** (`pedidos.html:298`: `cfg.ruta === 'menu' ? 'titi' : cfg.ruta`):
- **El Titi → `"titi"`** (namespace `menu`, rol `titi`: no confundirlos)
- **Col Sabor → `"colsabor"`**
- **DTA Chanclas / NBC Company →** sus menús son de solo lectura pública; **no necesitan rol** en esta versión.

Procedimiento (pendiente de autorización): inventariar en solo lectura las cuentas de Authentication del proyecto, y por cada administrador escribir su `_admin/{uid}` con el negocio correcto y `activo:true`. **Sin contraseñas ni tokens en documentación.** Una cuenta sin el registro —o con `activo:false`— **queda rechazada** (verificado).

## 4. Resultados de pruebas

| Batería | Resultado |
|---|---|
| Seguridad Firebase v5 | **38/38 · 38/38** |
| Menús (productos, precios, **fotos 29/29 y 14/14**, carrito, responsive) | **52/52** |
| Circuito backend de pedidos | **15/15** |
| **Circuito completo por interfaz (ambos negocios)** | **✅** pedido → login → confirmar importe (25.000) → `PREPARANDO` → seguimiento `{estado:PREPARANDO,total:25000}`; producción **0 peticiones** |
| Aislamiento con administrador ajeno | **401** |
| **Compatibilidad de los cuatro negocios** | **11/11** |

## 5. Procedimiento seguro de despliegue (secuencia obligatoria)

1. **Respaldo previo**: exportar las reglas actuales (`PUT`/lectura de `/.settings/rules.json`) a un archivo versionado fuera de la URL pública, y anotar el hash.
2. **Roles primero**: crear `_admin/{uid}` de los administradores reales (`titi`, `colsabor`, `activo:true`). Sin este paso, los paneles quedarán sin escritura.
3. **Desplegar reglas v5** (requiere autorización del CTO): `firebase deploy --only database --project el-titi-menu`.
4. **Comprobación inmediata** (2 min): `PUT` anónimo a `menu_backup` → **401**; lectura anónima de `menu/productos` → **200**; login del panel → entra.
5. **Publicar los menús** en GitHub Pages (merge a `main` de ambos repos).
6. **Comprobación post-despliegue**: un pedido real de prueba controlado, ver su recepción en el panel y el seguimiento por código.

## 6. Procedimiento de recuperación

- **Reversión de reglas**: se versiona `database.rules.reversion.json` (esquema seguro, **no** las reglas vulnerables). Revertir = desplegar ese archivo, segundos, **sin tocar datos**.
- **Reversión de menús**: `git revert` del merge en `main`; Pages republica el menú anterior. Los pedidos nuevos del esquema v5 quedarían huérfanos de UI pero **no se pierden** (siguen en RTDB).
- **Antes de cualquier reversión**: export del árbol como respaldo y anotar el hash de las reglas vigentes.

## 7. Commits y evidencias

| Repo | Commit | Contenido |
|---|---|---|
| El Titi | `57ed6c4` | circuitos completos con botones reales, scripts y capturas |
| Col Sabor | `a9ab2b5` | ídem |

Evidencias: `docs/pruebas/circuito-completo.mjs`, `docs/pruebas/resultado-circuito.txt`, `docs/evidencias/*.png` (paneles, pedido, seguimiento, menús en tres tamaños). Compatibilidad de los cuatro negocios: `compat4.txt` en la evidencia local.

## 8. Dictamen

# GO técnico condicionado

- **GO** para ejecutar el despliegue **coordinado** (respaldar reglas → crear `_admin` reales → desplegar v5 → verificar 401/200 → publicar menús → comprobar un pedido real).
- **NO-GO** para publicar los menús **solos**: sin v5 desplegada, el registro de pedidos no funciona y estaríamos publicando una regresión.
- **Pendiente de tu autorización expresa:** desplegar reglas v5 en producción, y crear los registros `_admin` de los administradores reales. Ambas cosas afectan a los cuatro negocios del proyecto compartido.

**Riesgo residual:** una vez desplegada v5, cualquier aplicación que escriba en `menu`/`colsabor` sin rol activo dejará de poder hacerlo —incluido cualquier panel antiguo en caché—. Por eso la secuencia es reglas → verificación → publicación, y por eso la reversión debe ser al archivo seguro, no a las reglas actuales.
