# INFORME KZ-SEC-006 · Cierre de certificación

**CTO:** Darwin Montalvo · **Fecha:** 30-oct-2026 · **Entorno:** emulador RTDB aislado (`demo-sec-006-default-rtdb`)

| Fase | Estado |
|---|---|
| P0 matriz anónima (reglas v2) | **15/15 ✅** |
| **P1 roles con tokens de Authentication** | **pendiente** (requiere levantar Auth; pasos exactos abajo) |
| **P2 reglas de recuperación** | **15/15 ✅ EJECUTADO** |
| P3 matriz oficial de 66 | **bloqueada** (documento no disponible) |
| P4 permisos corporativos | **documentado** (dos alternativas, sin implementar) |

## P2 · Reglas de recuperación: EJECUTADO, 15/15

Cargadas `database.rules.reversion.json` en el emulador en caliente:
`PUT /.settings/rules.json?ns=demo-sec-006-default-rtdb&access_token=owner` → **HTTP 200 `{"status":"ok"}`**
Control obligatorio previo: `PUT` anónimo a `menu_backup` → **401** (reglas activas).

| Escenario | Esperado | Obtenido |
|---|---|---|
| Lee productos El Titi / Col Sabor | 200 / 200 | **200 / 200** ✔ |
| Lee pedidos para rastreo | 200 | **200** ✔ |
| **NO** lee pedidos privados | 401 | **401** ✔ |
| **NO** lee el respaldo | 401 | **401** ✔ |
| **NO sobrescribe un pedido existente** | 401 | **401** ✔ |
| **NO** borra un pedido existente | 401 | **401** ✔ |
| **NO** sobrescribe datos privados | 401 | **401** ✔ |
| **NO** toca el contador | 401 | **401** ✔ |
| **NO** toca el respaldo | 401 | **401** ✔ |
| **NO** escribe el árbol de otro negocio | 401 | **401** ✔ |
| Crea pedido / registro privado / reseña | 200 ×3 | **200 ×3** ✔ |
| **NO sobrescribe una reseña ajena** | 401 | **401** ✔ |

**Conclusión:** la reversión **no reabre ninguna vulnerabilidad**: mantiene bloqueadas sobrescritura y eliminación de pedidos, escritura sobre datos privados, contador, respaldo, escrituras cruzadas entre negocios y sobrescritura de reseñas, y conserva los tres flujos legítimos.

## P1 · Roles: pendiente, con procedimiento exacto

Ya está hecho el alta de los **6 usuarios ficticios** (`_admin/{uid}/negocio`: los 4 negocios, agencia y sin rol) y la matriz de 14 escenarios. Resultado: **11/14**, con **las 10 denegaciones de aislamiento correctas** y solo los 3 casos «permitidos» fallando porque `?auth=<uid>` del emulador REST **no emite un token con `uid` resuelto**.

Para cerrarlo (próxima corrida, ~10 min):
1. `firebase emulators:start --only auth,database --project demo-sec-006 --config …`
2. `signUp` de los 6 usuarios en Auth: `POST http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=<ficticia>`
3. `signInWithPassword` → `idToken`
4. Repetir `matriz-roles.cjs` usando `?auth=<idToken>` en lugar de `?auth=<uid>`
5. **No certificaré 14/14 hasta verlo ejecutado.**

## P3 · Matriz oficial de 66: bloqueada
`MATRIZ-PRUEBAS-FIREBASE.md` no está disponible (Drive 401; `/workspace/KZ-REDESIGN-001` inexistente en este equipo). **No la sustituyo ni modifico sus criterios.** Pégala en el chat o cópiala a `C:\KZ-EVIDENCIA\kz-sec-006\`.

## P4 · Permisos corporativos de la agencia: dos alternativas (sin implementar)

**A. Administrador de supervisión (recomendada para empezar).**
`_admin/{uid} = { negocio: "agencia", supervision: true, negocios: ["titi","colsabor"] }`.
Reglas: solo **lectura** de los negocios listados (`pedidos_privados/.read`, `meta/.read`, `menu_backup/.read`); **ninguna escritura** en nodos comerciales. Riesgo bajo; permite auditar y acompañar sin poder romper nada.

**B. Administrador corporativo con gestión acotada.**
Añade `gestion: ["titi"]` (lista explícita). Reglas: escritura permitida **solo** en los negocios de esa lista y **nunca** en `menu_backup` del otro negocio; toda escritura queda auditada con `auth.uid`. Riesgo medio: si se concede mal, hay escritura cruzada; exige control de altas y revisión periódica.

**Ambas quedan documentadas, no implementadas**: crear estos registros o desplegar las reglas que los leen requiere decisión del CTO.

## Dictamen

- **P0 y P2: certificados con resultados reproducibles (15/15 cada uno).**
- **P1: 11/14** — aislamiento demostrado en las denegaciones; los 3 casos positivos exigen tokens de Authentication.
- **P3: bloqueado** por falta del documento.
- **Despliegue: NO-GO** hasta cerrar P1 con tokens reales y ejecutar los 66 escenarios oficiales.

Sin merge, sin despliegues, sin escrituras en producción, sin usuarios ni roles reales, sin migraciones.
