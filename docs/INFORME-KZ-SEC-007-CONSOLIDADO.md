# INFORME CONSOLIDADO KZ-SEC-007 · Continuación y cierre integral

**CTO:** Darwin Montalvo · **Ejecutor:** Harness · **Fecha:** 30-oct-2026
**Base:** El Titi `3fdd736` · Col Sabor `4c99e3e` · **Rama:** `kz-sec-006/propuesta-reglas`
**Sin merge, sin despliegues, sin tocar Firebase de producción ni datos reales.**

## 1. Cambios desarrollados y commits

| Artefacto | Contenido |
|---|---|
| **`database.rules.v4.json`** | Candidata completa: pedidos sin enumeración pública, `pedidos_publico/{codigo}` mínimo, `activo` obligatorio, y **transiciones administrativas** validadas |
| `docs/v4.cjs` | Batería de 15 pruebas: 9 de transición + 6 de regresión |
| `docs/sondas-v3.cjs` | 18 sondas de autorización (10 originales + 8 nuevas) |
| `docs/fase1-arquitectura-pedidos.cjs` | Pruebas de UUID, idempotencia, multipath atómico |
| Informes | `INFORME-KZ-SEC-006-{V2,V3,MATRIZ-EJECUTADA,CIERRE-FINAL}.md` + este |

**Commits de esta continuación:** el de este informe en ambos repos (ver `git log -1` en cada uno). Historia acumulada de la misión: `d9dcb40`/`b767607` (v3) → `3fdd736`/`4c99e3e` (Fase 1) → **este** (v4).

## 2. Resultados reales de pruebas

### v4 — 15/15 PASS
**Transiciones administrativas (9/9):** admin activo confirma importe (200) · admin activo cambia estado a PREPARANDO (200) · estado inventado denegado (401) · **admin de otro negocio no cambia estado** (401) · ANON no cambia estado (401) · **ANON no fija el total** (401) · **admin no reemplaza el pedido completo, solo hijos** (401) · sin rol no cambia estado (401) · **admin INACTIVO no cambia estado** (401).

**Regresión (6/6):** alta multipath atómica anónima (200) · reintento con el mismo UUID denegado (401) · multipath con ruta denegada falla completo (401) · código público no da el pedido completo (401) · ANON no lista pedidos (401) · mapping inactivo no administra (401).

### Acumulado de la misión
| Batería | Resultado |
|---|---|
| Sondas de autorización (10 originales + 8 nuevas) | **18/18** |
| Arquitectura de pedidos Fase 1 | **6/7** → **la 7ª (transiciones) resuelta en v4** |
| v4 completa | **15/15** |
| Matriz oficial: criterios ejecutables | **10/10** + 8 añadidos |
| Reglas de reversión | **15/15** (no reabren vulnerabilidades) |

**Fallos pendientes:** ninguno abierto en lo ejecutado. Lo que falta no son fallos técnicos sino **cobertura bloqueada** (§4 y §6).

## 3. Estado de seguridad de Firebase

- **Candidata v4 lista y probada; NO desplegada.** Producción sigue con las reglas antiguas (las que la auditoría marcó como vulnerables).
- **Controles de abuso:** documentados. Las reglas de RTDB **no hacen rate limit**; se proponen por capas: (a) validaciones de tamaño/forma ya incluidas, (b) **App Check** como disuasión de clientes no legítimos —**evaluado, sin activar, y declarado NO sustituto** de un control de solicitudes—, (c) límite real de frecuencia en servidor (Cloud Function) cuando exista.
- **DTA Chanclas y NBC Company:** el candidato **no modifica sus permisos**: los deja en lectura pública de `productos` y `meta`, y sin escritura. **Sus políticas siguen desconocidas → bloqueo de despliegue** hasta que sus propietarios las fijen. No se ha tocado nada de esos negocios.

## 4. Estado de los paneles administrativos

**No implementado.** Los informes de Codex Sites siguen inaccesibles (Drive 401) y **no audité el código de los paneles en esta fase** por falta de presupuesto de ejecución. Por tanto **no puedo afirmar** qué requisitos del contrato CON-03..11 se cumplen hoy. Lo que sí está listo para cuando se implemente: las reglas que imponen autorización por negocio, permisos activos, separación de pedidos privados y validación de transiciones.

## 5. Avance visual de los rediseños

**No iniciado.** No he podido inspeccionar las dos referencias (`ecnlatamacademy…/midelivery/` y `nanitos.com.co`) ni tengo las especificaciones de Codex. **No invento diseño ni atribuyo funciones a referencias que no he comprobado.** Los prototipos se harán sobre el código actual conservando productos, precios, fotografías e identidad.

## 6. Bloqueos que requieren decisión del CTO

| # | Bloqueo | Decisión necesaria |
|---|---|---|
| 1 | **Política de DTA Chanclas y NBC Company** | Fijar si mantienen solo lectura y quién administra sus datos |
| 2 | **ORD-07 precio confiable** | Elegir: cotización pendiente confirmada por el panel (**recomendado**) o Cloud Function de recálculo |
| 3 | **ORD-10 numeración** | UUID como número de pedido (**recomendado**) o contador por función |
| 4 | **ORD-11 abuso** | Autorizar App Check (sin coste) y/o el límite en servidor |
| 5 | **Especificaciones de Codex Sites** | Entregarlas en soporte accesible para habilitar paneles y rediseños |
| 6 | **Despliegue de v4** | Autorización expresa (requiere además §1 y crear `_admin` real) |
| 7 | **Referencias visuales** | Acceso o capturas autorizadas para el trabajo visual |

## 7. Dictamen por componente

| Componente | Dictamen | Motivo |
|---|---|---|
| **Reglas de seguridad (v4)** | **GO técnico** — listo para revisión y despliegue autorizado | 15/15 + 18/18 + 15/15 de reversión; aislamiento de los 4 negocios probado; sin enumeración de pedidos; permisos activos |
| **Arquitectura de pedidos** | **GO técnico** | UUID, código público impredecible, idempotencia, multipath atómico, cotización pendiente y transiciones administrativas validadas |
| **Despliegue a producción** | **NO-GO** | Falta la política de DTA/NBC y la creación de `_admin` real (autorización) |
| **Paneles administrativos** | **NO-GO (no evaluado)** | Sin especificaciones de Codex y sin auditoría de código en esta fase |
| **Rediseños visuales** | **NO-GO (no iniciado)** | Sin especificaciones ni acceso a referencias; no se inventa diseño |
| **Riesgo residual principal** | Vigente | `pedidos_publico` expone `total`; hasta que exista confirmación administrativa, la interfaz debe rotularlo **«pendiente»** y nunca como precio confirmado |
