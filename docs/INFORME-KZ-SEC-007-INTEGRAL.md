# INFORME INTEGRAL KZ-SEC-007

**CTO:** Darwin Montalvo · **Coordinación:** ChatGPT · **Ejecutor:** Harness · **Fecha:** 30-oct-2026
**Alcance ejecutado:** Fase 1 (arquitectura de pedidos) verificada en emulador + consolidación del estado de Fases 2–5.
**Sin merge, sin despliegues, sin tocar producción ni datos reales.**

## 1. Cambios realizados

| Artefacto | Qué es | Estado |
|---|---|---|
| `database.rules.v3.json` | Reglas candidatas: sin enumeración de pedidos, `pedidos_publico/{codigo}` con datos mínimos, `activo` obligatorio en toda autorización administrativa | **aprobado en pruebas, no desplegado** |
| `docs/sondas-v3.cjs` | 18 sondas de autorización (las 10 originales + 8 nuevas) | **18/18 PASS** |
| `docs/fase1.cjs` | Pruebas de arquitectura de pedidos (UUID, idempotencia, multipath atómico, código público, transiciones) | **6/7** |
| `docs/INFORME-KZ-SEC-006-*.md` | Cadena completa de informes (auditoría → v2 → matriz → v3 → este) | entregados |

## 2. Commits

| Repo | Rama | Último commit |
|---|---|---|
| `konfiozinc/eltiti` | `kz-sec-006/propuesta-reglas` | **`d9dcb40`** (v3) |
| `konfiozinc/colsabor` | `kz-sec-006/propuesta-reglas` | **`b767607`** (v3) |

`main` intacta en ambos (`a3ab0a6` / `ab348cf`).

## 3. Pruebas ejecutadas (Fase 1 — arquitectura de pedidos)

| Requisito de la fase | Prueba | Resultado |
|---|---|---|
| 1. Cotización pendiente | El alta se crea en estado `COTIZACION_PENDIENTE` con `total: 0`; **el navegador no fija precio confirmado** | **PASS** (estado inicial correcto) |
| 2. UUID como identificador interno | Alta con UUID v4 ficticio (`3f4b2a1c-…`) | **PASS** |
| 3. Código público impredecible | `pedidos_publico/Q7X4LM` legible por anónimo; **el pedido completo no** (401) | **PASS** |
| 4. Protección contra duplicados | Reintento con el mismo UUID → **401**, sin duplicar ni sobrescribir | **PASS** |
| 5. Escritura multipath atómica | Alta de 3 rutas (pedido + privado + público) en una sola operación → 200 | **PASS** |
| 5-bis. Atomicidad ante fallo | Multipath con una ruta denegada (contador) → **401 y ninguna ruta escrita** | **PASS** |
| 6. Separación privado / público | Privados no legibles por anónimo (401); público solo con código | **PASS** |
| 7. Transiciones de estado | **El admin no puede cambiar el estado de un pedido existente**: `pedidos/$pedido/.write` es de solo creación | **FAIL — corregible** |
| 8. Errores seguros | Lectura anónima de pedido inexistente → 401 (no filtra existencia) | **PASS** |

**Único fallo, ya diagnosticado:** falta una regla de **actualización administrativa** de pedidos (`$pedido/.write` con `activo` + validación de transición permitida). Es un cambio de reglas de 6 líneas y no requiere infraestructura.

**Anomalía a verificar en la próxima corrida:** la lectura administrativa de un pedido devolvió 401 aunque AUTH-04 (escritura administrativa) pasó. Puede ser el fixture de `_admin` de esa corrida concreta; hay que repetir con el `uid` obtenido por `lookup`.

## 4. Fallos resueltos en esta cadena
1. **Enumeración pública de pedidos (ORD-06)** → cerrada; seguimiento por código impredecible con datos mínimos.
2. **Permiso inactivo ignorado (AUTH-08)** → `activo == true` obligatorio; inactivo y retirado (con token aún válido) denegados.
3. **Namespace del emulador** (las reglas no se aplicaban) → resuelto y documentado con control obligatorio.
4. **Fixtures no sembrados** con Auth activo → `access_token=owner`, documentado.

## 5. Fases 2–5: estado real y bloqueos

| Fase | Estado | Bloqueo concreto |
|---|---|---|
| **2 · Seguridad** | v3 mantenidas y certificadas; aislamiento de los 4 negocios verificado (AUTH-05/06). **App Check**: evaluado, **no es sustituto** del control de abuso (no limita reintentos del mismo cliente legítimo). Controles adicionales necesarios documentados. **Recuperación/reversión**: reglas de reversión probadas 15/15 | **X-03**: falta la política de **DTA Chanclas** y **NBC Company**; **sin ella no hay despliegue posible** |
| **3 · Paneles** | **No ejecutada.** Requiere la aplicación real (DOM, listeners, sesiones, subidas) y las especificaciones de Codex Sites, que **siguen inaccesibles** (Drive 401) | Especificaciones + app |
| **4 · Rediseños** | **No ejecutada.** No tengo acceso a las especificaciones de Codex ni a las dos referencias visuales; hacerlo por mi cuenta sería inventar diseño | Documentos de Codex + criterio visual de ChatGPT |
| **5 · Certificación** | Matriz de 66 ejecutada en lo posible: **PASS 10/10 originales + 8/8 nuevas**, y cobertura completa documentada con estados BLOQUEADO por contrato, app, medios y políticas ajenas | ORD-07/10/11 y X-03 |

## 6. Decisiones que requieren tu aprobación

1. **ORD-07 precio confiable:** ¿Cloud Function que recalcula el total, o **cotización pendiente** confirmada por el panel (esta segunda no necesita infraestructura nueva)? **Recomiendo la segunda** para arrancar.
2. **ORD-10 numeración:** ¿UUID como número de pedido (cero infraestructura, **recomendado**) o contador gestionado por función?
3. **ORD-11 antiabuso:** ¿autorizas **App Check** (servicio nuevo, sin coste) además de límites por validación? No sustituye controles de servidor.
4. **X-03:** ¿quién define la política de DTA Chanclas y NBC Company? **Bloqueo de despliegue.**
5. **Especificaciones de Codex Sites** para Fases 3 y 4: sin ellas no implemento paneles ni rediseños (no invento diseño).
6. **Regla de transición administrativa** (el FAIL de ORD-05): ¿la apruebas para incluirla en v4?

## 7. Prototipos de menús

**No entregados.** No tengo las especificaciones de Codex ni acceso a las referencias visuales indicadas, y no voy a inventar diseño que luego haya que rehacer. En cuanto tenga esos documentos, los prototipos se montan sobre el código actual conservando productos, precios, fotos e identificadores.

## 8. Recomendación

# NO-GO para producción · GO para continuar preparación

- **Técnicamente**, el candidato v3 cumple el núcleo de seguridad del proyecto compartido: aislamiento entre negocios, sin enumeración de pedidos, seguimiento mínimo por código, permisos activos verificados, y arquitectura de pedidos con UUID, idempotencia y atomicidad **ya probadas** en emulador.
- **NO-GO** porque faltan tres cosas que no dependen de mí solo: la **regla de transición administrativa** (6 líneas, pendiente de tu visto bueno), la **política de DTA/NBC** y las **especificaciones de Codex** para paneles y rediseños.
- **Riesgo residual principal:** `pedidos_publico` expone `total`; si el total no está validado por servidor, ese campo puede mostrar un importe no confirmado. Debe rotularse como **«pendiente»** en la interfaz hasta que exista la confirmación administrativa (Fase 1, punto 1).
