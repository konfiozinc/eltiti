# INFORME KZ-SEC-006 · Corrección de hallazgos y arquitectura de pedidos

**CTO:** Darwin Montalvo · **Fecha:** 30-oct-2026 · **Candidato:** `database.rules.v3.json`
**Entorno:** Auth 9099 + RTDB 9000 · `demo-sec-006` · namespace `demo-sec-006-default-rtdb` · datos ficticios

## 1. P0 — Correcciones aplicadas en las reglas

**ORD-06 (enumeración de pedidos):**
- `pedidos` y `pedidos_privados` **cambian de lectura pública a lectura solo del dueño del negocio con rol activo**.
- Nuevo nodo **`pedidos_publico/{codigo}`**: lectura pública **solo por el identificador impredecible** del pedido; contiene **únicamente** `estado`, `fecha` y `total`. Escritura **solo de creación** y con validación de esos tres campos.
- La información personal queda exclusivamente en `pedidos_privados`, cuya lectura exige rol activo del negocio.

**AUTH-08 (permiso inactivo):**
- Todas las autorizaciones administrativas pasan de `negocio == 'X'` a
  `auth != null && _admin[uid].activo == true && _admin[uid].negocio == 'X'`.
- Un mapping con `activo:false` deja de administrar de inmediato, **sin esperar a que caduque el token**.

## 2. Verificación: 18/18 PASS

### Las diez sondas originales — **10/10**
| Caso | Criterio | Observado |
|---|---|---|
| AUTH-02 | ANON no lee el mapping | 401 **PASS** |
| AUTH-11 | UA no lee permisos de otro UID | 401 **PASS** |
| AUTH-11b | No hay autoasignación | 401 **PASS** |
| AUTH-04 | Dueño escribe su negocio | 200 **PASS** |
| AUTH-05 | UA no administra B | 401 **PASS** |
| AUTH-06 | UB no administra A | 401 **PASS** |
| ORD-02a | ANON no sobrescribe pedido | 401 **PASS** |
| ORD-02b | ANON no borra pedido | 401 **PASS** |
| **ORD-06** | **ANON no lista pedidos** | **401 PASS** (antes 200) |
| **AUTH-08** | **Mapping inactivo no administra** | **401 PASS** (antes 200) |

### Sondas añadidas — **8/8**
| Caso | Criterio | Observado |
|---|---|---|
| ORD-06b | ANON **sí** lee el seguimiento individual por código | 200 **PASS** |
| ORD-06c | Ese registro no se puede sobrescribir | 401 **PASS** |
| ORD-06d | ANON **no** lee el pedido completo ni individualmente | 401 **PASS** |
| ORD-06e | ANON no lee datos privados | 401 **PASS** |
| AUTH-08b | Admin **activo** sí administra | 200 **PASS** |
| AUTH-09 | **Retirado** (mapping borrado, token válido) no administra | 401 **PASS** |
| AUTH-09b | Retirado no lee pedidos | 401 **PASS** |
| SINROL | Usuario sin rol no administra | 401 **PASS** |

**Conclusión P0: cumplido.** Ninguna persona sin sesión puede enumerar pedidos; el seguimiento funciona por código impredecible con datos mínimos; la PII sigue protegida; y el permiso inactivo o retirado corta el acceso con el token aún válido.

## 3. Arquitectura de pedidos — qué se puede y qué no con la infraestructura actual

| Caso | ¿Se resuelve hoy? | Cómo / qué falta |
|---|---|---|
| **ORD-07** validación confiable de precios | **NO con reglas** | Las reglas de RTDB **no pueden sumar precios del catálogo**. Opciones: (a) **Cloud Function** que recalcule el total contra `productos` y escriba el pedido validado (requiere despliegue de una función nueva → autorización); (b) guardar el pedido como **“cotización pendiente”** y que el panel confirme el total (solo datos y cliente, sin infra nueva); (c) aceptar el total del cliente **nunca** |
| **ORD-08** idempotencia | **SÍ, casi todo** | ID de pedido **generado por el cliente como UUID** + `!data.exists()` hace que un reintento **no duplique ni sobrescriba** (ya probado en ORD-02a). Falta recuperación en el cliente: ante `PERMISSION_DENIED`, leer `pedidos_publico/{codigo}` para confirmar el estado. Sin infra nueva |
| **ORD-09** atomicidad | **SÍ** | Un `update` **multipath** de RTDB es atómico; las reglas evalúan todas las rutas. Con pedidos + privados + público en **un solo update** se cumple el fallo atómico. Requisito: las tres rutas deben ser permitidas para el mismo actor — con el diseño actual el contador **no** lo es para ANON (ver ORD-10) |
| **ORD-10** numeración segura | **NO con reglas para ANON** | Incrementar un contador exige leer-modificar-escribir, que RTDB no permite a un anónimo sin abrir el riesgo. Opciones: (a) **UUID como número de pedido** (sin contador; recomendado, cero infra); (b) contador por Cloud Function; (c) contador por el panel al confirmar (numeración interna, no del cliente) |
| **ORD-11** protección contra abuso | **NO con reglas** | RTDB no hace rate limit. Opciones sin coste: **App Check** (nuevo servicio, gratis, pero es integración nueva) y límites por validación de tamaño; opciones con coste: Cloud Armor/Cloud Run. **Requiere autorización expresa** |
| **X-03** compatibilidad DTA Chanclas y NBC Company | **SÍ en reglas** | El candidato **ya deja esos dos namespaces en solo lectura pública** de `productos`/`meta` y sin escritura, que es lo que necesitan sus menús. **Falta la política de sus propietarios** (decisión, no infraestructura) y confirmar que no necesitan escritura |

**Resumen:** ORD-08, ORD-09 y X-03 son alcanzables **con la infraestructura actual** (solo cambios de cliente y de datos). **ORD-07, ORD-10 y ORD-11 requieren componentes adicionales** (una Cloud Function y/o App Check) o decisiones de producto (UUID como número de pedido, cotización pendiente). **No se ha activado ningún servicio facturable ni se ha desplegado nada.**

## 4. Dictamen

- **P0: cumplido y verificado** — 18/18, con las dos sondas que antes fallaban ahora en PASS.
- **El candidato v3 sí cumple** el criterio de seguridad central de la matriz: ningún negocio administra a otro, nadie enumera pedidos sin sesión, el seguimiento va por código impredecible con datos mínimos, y el permiso inactivo/retirado corta el acceso.
- **Sigue NO-GO para producción**, ahora solo por causas ajenas a estos dos hallazgos: ORD-07/10/11 requieren decisión tuya (función, App Check, o UUID/cotización) y X-03 requiere la política de los otros dos negocios.

Sin merge, sin despliegues, sin migraciones, sin usuarios ni pedidos reales.
