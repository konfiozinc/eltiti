# INFORME KZ-SEC-006 · Cierre de certificación (Auth + RTDB)

**CTO:** Darwin Montalvo · **Fecha:** 30-oct-2026 · **Entorno:** emuladores **Auth (9099) + Realtime Database (9000)**, proyecto `demo-sec-006`, namespace `demo-sec-006-default-rtdb`.

| Fase | Resultado |
|---|---|
| **P1 roles con tokens válidos** | **14/14 ✅ EJECUTADO** |
| **P2 reglas de recuperación** | **15/15 ✅ EJECUTADO** |
| P3 matriz oficial de 66 | **bloqueada** (documento no disponible) |
| P4 permisos corporativos | documentado, sin implementar |

## P1 · Roles con tokens reales de Authentication — 14/14

Emuladores levantados juntos (`--only auth,database`). Seis usuarios ficticios dados de alta en **Authentication** (`signUp` + `signInWithPassword` → `idToken`) y su rol en `_admin/{uid}/negocio`.

| Escenario | Esperado | Obtenido |
|---|---|---|
| Admin El Titi escribe **su** contador | 200 | **200** ✔ |
| Admin El Titi **no** escribe el contador de Col Sabor | 401 | **401** ✔ |
| Admin El Titi **no** escribe productos de Col Sabor | 401 | **401** ✔ |
| Admin El Titi **lee** pedidos privados de El Titi | 200 | **200** ✔ |
| Admin El Titi **no** lee privados de Col Sabor | 401 | **401** ✔ |
| Admin Col Sabor escribe **su** contador | 200 | **200** ✔ |
| Admin Col Sabor **no** escribe el de El Titi | 401 | **401** ✔ |
| Admin Col Sabor **no** toca `menu_backup` | 401 | **401** ✔ |
| Admin DTA **no** escribe (namespace solo lectura) | 401 | **401** ✔ |
| Admin NBC **no** escribe El Titi | 401 | **401** ✔ |
| **Admin de agencia no escribe ningún negocio** | 401 | **401** ✔ |
| Usuario **sin rol** no escribe nada | 401 | **401** ✔ |
| Usuario sin rol no lee pedidos privados | 401 | **401** ✔ |
| Visitante anónimo **sí** crea pedidos | 200 | **200** ✔ |

**Ningún negocio puede modificar datos de otro**, ni siquiera con un rol reconocido. La agencia tampoco. El visitante conserva su flujo.

## P2 · Reglas de recuperación — 15/15

`PUT /.settings/rules.json?ns=demo-sec-006-default-rtdb&access_token=owner` con `database.rules.reversion.json` → **200 `{"status":"ok"}`**; control previo: escritura prohibida → **401**.

Todas las denegaciones en **401** (sobrescribir pedido, borrar pedido, sobrescribir privados, leer privados, leer respaldo, tocar respaldo, tocar contador, escribir en otro negocio, sobrescribir reseña ajena) y los tres flujos legítimos en **200**. **La reversión no reabre ninguna vulnerabilidad.**

**Nota de método (incidencia resuelta):** en la primera pasada salieron 13/15 porque los fixtures de la prueba no se sembraron en la instancia nueva: con Auth habilitado, la escritura de siembra ya no acepta `auth=owner` y requiere `access_token=owner`. Corregido el arnés, 15/15. Queda documentado porque es justo el tipo de falso resultado que hay que evitar.

## P3 · Matriz oficial de 66: BLOQUEADA

`MATRIZ-PRUEBAS-FIREBASE.md` sigue sin estar disponible (enlaces de Drive **401**; `/workspace/KZ-REDESIGN-001` no existe en este equipo). **No la sustituyo ni altero sus criterios.** Solicitud formal a Codex Sites: entregar copia privada del documento (pegado en el chat o copiado a `C:\KZ-EVIDENCIA\kz-sec-006\`). En cuanto esté, se ejecuta tal cual.

## P4 · Permisos corporativos (documentados, no implementados)

**A. Supervisor (recomendado para iniciar):** `_admin/{uid} = { negocio:"agencia", supervision:true, negocios:["titi","colsabor"] }`. Reglas: solo **lectura** de los negocios listados (`pedidos_privados`, `meta`, `menu_backup`); **ninguna escritura** comercial. Riesgo bajo: no puede romper nada. Verificado por diseño contra la matriz P1: la agencia hoy no escribe ningún negocio (401), y esta alternativa solo añade lecturas.

**B. Corporativo con gestión acotada:** añade `gestion:["titi"]`. Reglas: escritura solo en los negocios listados, nunca en `menu_backup` ajeno, y toda escritura auditada por `auth.uid`. Riesgo medio: un alta mal hecha habilita escritura cruzada; exige control de altas y revisión periódica.

Ambas quedan documentadas; crear esos registros o desplegar las reglas que los leen requiere **decisión del CTO**.

## Dictamen

- **Reglas propuestas (v2): certificadas.** Matriz anónima **15/15** y roles **14/14**, con tokens reales de Authentication.
- **Criterio de aprobación cumplido:** ningún negocio modifica datos de otro; los visitantes no alteran pedidos existentes ni información privada; los flujos comerciales legítimos siguen funcionando.
- **Despliegue: sigue NO-GO** por dos motivos exclusivamente externos a las reglas: (a) **P3 sin ejecutar** (falta el documento de 66 escenarios), y (b) **`_admin` debe existir en producción** con el UID de cada cuenta de panel, lo que exige autorización de escritura o de creación de usuarios.
- **Riesgo residual declarado:** `pedidos` mantiene lectura pública hasta adoptar el esquema P2 público/privado.
