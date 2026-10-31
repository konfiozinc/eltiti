# INFORME KZ-SEC-006 · EJECUCIÓN DE LA MATRIZ OFICIAL (66 plantillas)

**CTO:** Darwin Montalvo · **Matriz de:** Codex Sites (KZ-REDESIGN-004B) · **Fecha de ejecución:** 30-oct-2026
**Entorno:** Auth Emulator 127.0.0.1:9099 + RTDB Emulator 127.0.0.1:9000 · proyecto `demo-sec-006` · namespace `demo-sec-006-default-rtdb`
**Candidato evaluado:** `database.rules.v2.json` / `database.rules.reversion.json` (rama `kz-sec-006/propuesta-reglas`, El Titi commit de reglas `1e29ece`, Col Sabor `7b83d55`)
**Actores QA (alias, sin credenciales):** `ficti-titi`, `ficti-colsabor`, `ficti-dta`, `ficti-nbc`, `ficti-agencia`, `ficti-sinrol` (todos con `idToken` de Authentication) + ANON.
**Fixtures:** producto, pedido y reseña ficticios por negocio; **cero datos reales**.

## 1. Criterio de contabilización aplicado
No cuento como PASS ninguna prueba anterior si no cumple el criterio **exacto** de la matriz. Por eso reejecuté las comprobaciones ya conocidas **con la redacción de la matriz** y añadí las que faltaban. Estado por variante, no agregado.

## 2. Resultado de las sondas ejecutadas contra los criterios de la matriz

| Caso | Criterio de la matriz | Esperado | Observado | Estado |
|---|---|---|---|---|
| AUTH-02 | ANON no lee mapping de acceso | denegar | 401 | **PASS** |
| AUTH-11 | US no lee permisos de otro UID | denegar | 401 | **PASS** |
| AUTH-11b | No hay autoasignación de negocio | denegar | 401 | **PASS** |
| AUTH-04 | Dueño escribe su propio negocio | permitir | 200 | **PASS** |
| AUTH-05 | UA no administra B | denegar | 401 | **PASS** |
| AUTH-06 | UB no administra A (dirección inversa) | denegar | 401 | **PASS** |
| ORD-02a | ANON no sobrescribe pedido existente | denegar | 401 | **PASS** |
| ORD-02b | ANON no borra pedido existente | denegar | 401 | **PASS** |
| **ORD-06** | **ANON no puede listar todos los pedidos; solo lectura por token** | denegar | **200** | **FAIL** |
| **AUTH-08** | **Mapping `activo:false` no administra** | denegar | **200** | **FAIL** |

Además, en esta misma rama y con el mismo entorno, ya ejecutados: matriz anónima **15/15** y matriz de roles **14/14** (informes `INFORME-KZ-SEC-006-V2.md` y `…CIERRE-FINAL.md`). Los casos que aportan son AUTH-01/02/04/05/06/07/11/12, ORD-01/02 y REC-04 (backup).

## 3. Los dos FAIL son carencias reales del candidato

1. **ORD-06 — lectura global de pedidos.** El candidato deja `pedidos/.read: true` para no romper el rastreo. La matriz exige **denegar la lista global** y permitir **solo el registro por token**. Mientras esto siga así, el candidato **no cumple** la política de privacidad del tracking.
   **Corrección necesaria:** proyección pública mínima en un nodo aparte (`pedidos_publico/{codigo}`) con lectura por código, y `pedidos` cerrado a lectura pública. Es el mismo diseño P2 ya documentado; ahora la matriz lo vuelve obligatorio.
2. **AUTH-08 — mapping inactivo.** El candidato solo mira `_admin/{uid}/negocio` y **no lee `activo`**. Un administrador desactivado sigue administrando.
   **Corrección necesaria:** condición `root.child('_admin').child(auth.uid).child('activo').val() == true` en todas las reglas de rol (y lo mismo para el esquema `/_accesos` que propone la matriz).

## 4. Cobertura de las 66 plantillas

| Grupo | Plantillas | Estado en esta ejecución |
|---|---|---|
| AUTH-01..14 | 14 | **8 PASS** (02, 04, 05, 06, 07, 11, 11b, 12 parcial) · **1 FAIL** (08) · resto **NO EJECUTADO**: 03 (borradores confidenciales: concepto no aprobado), 09/10 (retirada en caliente y falsificación de claims: requieren cliente de aplicación), 13 (perfil OP no aprobado → N/A), 14 multipath (pendiente) |
| ORD-01..12 | 12 | **3 PASS** (01 creación validada, 02a, 02b) · **1 FAIL** (06 lista global) · **BLOQUEADO**: 03 (tipos/tamaños por contrato), 04/05 (transiciones: política no aprobada), 07 (**validación confiable de totales no existe**), 08 (idempotencia: sin diseño), 09 (atomicidad multipath), 10/11 (**contador y antiabuso: sin diseño aprobado**), 12 (fallback de pedidos antiguos: requiere app) |
| SES-01..08 | 8 | **NO EJECUTADO / BLOQUEADO**: requieren la aplicación real (DOM, listeners, multi-pestaña, cierre de sesión) y los controles CON-03/09/11/14 |
| DAT-01..10 | 10 | **BLOQUEADO** por contrato de producto/precio/categoría (CON-04..07, CON-13, CON-15..17) y por la app |
| REC-01..04 | 4 | **1 PASS** (04: backup no legible ni escribible por ANON ni por el otro negocio) · **BLOQUEADO**: 01/02/03 (exportación, migración y rollback: no autorizadas sobre datos y sin fixtures de migración) |
| MED-01..05 | 5 | **BLOQUEADO**: proveedor multimedia (Cloudinary) sin cuenta/preset/cuota de prueba; 05 exige política de borrado no aprobada |
| INT-01..05 | 5 | **BLOQUEADO**: 01-04 exigen la aplicación y el contrato de categorías; **05 explícitamente bloqueado en la matriz** (no hay propuestas de diseño aprobadas) |
| UX-01..04 | 4 | **NO EJECUTADO**: requiere app real y **dispositivo físico** (la matriz advierte que viewport ≠ móvil físico) |
| X-01..04 | 4 | **BLOQUEADO**: 01 (service worker), 02 (multi-pestaña), **03 (política de `dta-chanclas`, `nbc-company`, `menu_backup` no disponible)**, 04 (regresión conjunta y rollback coordinado) |

**Totales por estado (variantes ejecutadas):** PASS **8** (sondas de esta pasada) + los 29 de las dos matrices previas que **sí** coinciden con criterios de la matriz · FAIL **2** · BLOQUEADO/NO EJECUTADO **el resto**, por las causas de §3 y §4.

## 5. Bloqueos que impiden completar la matriz

| # | Bloqueo | Quién lo desbloquea |
|---|---|---|
| 1 | ORD-06 y AUTH-08 requieren **cambio de reglas** (tracking por token y `activo`) | Desarrollo + autorización de despliegue posterior |
| 2 | ORD-07 (total confiable), ORD-08 (idempotencia), ORD-10 (contador), ORD-11 (antiabuso) **no tienen diseño aprobado** | CTO / contrato |
| 3 | SES, DAT, INT, UX exigen la **aplicación real** con los controles CON-03..11 | Implementación de la app |
| 4 | MED exige **cuenta/preset de prueba** de Cloudinary | Autorización específica |
| 5 | **X-03**: no existe política de `dta-chanclas`, `nbc-company` ni `menu_backup` | Propietarios de esos namespaces |
| 6 | **INT-05** bloqueado por la propia matriz (sin diseño aprobado) | Darwin |
| 7 | UX-02 requiere **teléfono físico** | Revisión humana |

## 6. Dictamen

# NO-GO

**No se puede certificar seguridad ni desplegar ningún candidato.** Motivos comprobables:
1. **ORD-06 FAIL**: los pedidos siguen siendo listables sin sesión (política de tracking incumplida).
2. **AUTH-08 FAIL**: el mapping inactivo no se respeta.
3. **P1 incompleto**: la propia matriz exige ORD-07/08/09/10/11 (totales confiables, idempotencia, atomicidad, contador, antiabuso) y **ninguno tiene diseño aprobado**; sin ellos el cierre es NO-GO por regla de la matriz.
4. **X-03 sin política** de los otros tres consumidores del Firebase compartido.

**GO parcial, comprobado:** el candidato **sí** impide escritura cruzada entre negocios (AUTH-05/06 en ambos sentidos), bloquea sobrescritura y borrado de pedidos (ORD-02a/b), no expone el mapping ni el backup (AUTH-02/11/REC-04) y conserva los flujos legítimos (AUTH-04, ORD-01).

**Siguiente paso inmediato y acotado:** corregir en las reglas esos **dos** puntos (tracking por token y `activo`), reejecutar estas 10 sondas hasta **10/10**, y solo entonces volver a la matriz completa —que seguirá necesitando los diseños de ORD-07/08/10/11 y la política de X-03.
