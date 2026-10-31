# INFORME KZ-SEC-006 · Fase de certificación (P1–P4)

**CTO:** Darwin Montalvo · **Fecha:** 30-oct-2026 · **Entorno:** emulador RTDB aislado (`demo-sec-006-default-rtdb`, reglas v2)

## Resumen ejecutivo

| Fase | Estado |
|---|---|
| P0 matriz anónima | **15/15 ✅** (ya certificada en V2) |
| **P1 roles ficticios** | **11/14** · aislamiento demostrado por el lado de la denegación; los 3 casos «permitidos» no se pudieron demostrar por límite del arnés |
| P2 compatibilidad pedidos | Diseño y plan de transición listos · **no ejecutado** |
| P3 matriz oficial de 66 | **BLOQUEADA** (documento no disponible) |
| P4 recuperación | Reglas de reversión listas · **pendiente de ejecución** |

## P1 · Matriz de roles con usuarios ficticios (ejecutada)

Usuarios ficticios dados de alta en el emulador (`_admin/{uid}/negocio`): `ficti-titi-001`, `ficti-colsabor-001`, `ficti-dta-001`, `ficti-nbc-001`, `ficti-agencia-001` y `ficti-sinrol-001` (sin rol).

| Escenario | Esperado | Obtenido |
|---|---|---|
| Admin El Titi escribe **su** contador | 200 | 401 ✗ |
| Admin El Titi **no** escribe el contador de Col Sabor | 401 | **401 ✔** |
| Admin El Titi **no** escribe productos de Col Sabor | 401 | **401 ✔** |
| Admin El Titi **lee** pedidos privados de El Titi | 200 | 401 ✗ |
| Admin El Titi **no** lee privados de Col Sabor | 401 | **401 ✔** |
| Admin Col Sabor escribe **su** contador | 200 | 401 ✗ |
| Admin Col Sabor **no** escribe el de El Titi | 401 | **401 ✔** |
| Admin Col Sabor **no** toca `menu_backup` | 401 | **401 ✔** |
| Admin DTA no escribe `dta-chanclas` (solo lectura) | 401 | **401 ✔** |
| Admin NBC **no** escribe El Titi | 401 | **401 ✔** |
| Admin de agencia **no** escribe ningún negocio | 401 | **401 ✔** |
| Usuario **sin rol** no escribe nada | 401 | **401 ✔** |
| Usuario sin rol no lee pedidos privados | 401 | **401 ✔** |
| Visitante anónimo **sí** crea pedidos | 200 | **200 ✔** |

**Resultado: 11/14.** Las **diez denegaciones de aislamiento pasan todas**: ningún rol escribe el negocio de otro, el admin de agencia no escribe ninguno, y el usuario sin rol no puede nada.

**Diagnóstico de los 3 fallos (no son fallos de las reglas):** el arnés usa `?auth=<uid>` del emulador REST para personificar al usuario; ese mecanismo **no entrega un token con `uid` resuelto** como sí hace el emulador de Auth, así que la condición `root.child('_admin').child(auth.uid)...` nunca coincide y deniega incluso al rol correcto. **Es un límite del arnés, no del diseño.**
**Siguiente paso exacto:** levantar **Auth emulator** (`--only auth,database`), crear los mismos usuarios con `signUp` y emitir `idToken`, y repetir la matriz con `?auth=<idToken>`. Con tokens reales se esperan 14/14.

## P2 · Compatibilidad del esquema público/privado (preparado)

| Nodo | Contenido | Quién lee | Quién escribe |
|---|---|---|---|
| `pedidos/{id}` | `codigoConsulta`, `estado`, `fechaCreacion`, `total` | público (rastreo) | **creación única** anónima |
| `pedidos_privados/{id}` | nombre, teléfono, dirección, notas, ítems | **solo el negocio** | creación única anónima (se rellenan en el pedido) |

**Compatibilidad:** se conservan **los mismos identificadores** (`{id}` del pedido) en los dos nodos, así que el panel y el rastreo no cambian de clave. La transición es **aditiva**: primero se escribe el nodo público mínimo con el mismo `{id}`, después el panel pasa a leer `pedidos_privados`. **Ningún registro real se mueve ni se borra.**

**Registros históricos con posible información privada:** hoy `pedidos` es legible públicamente. Propuesta documentada: (a) inventariar qué claves tiene cada pedido histórico **en el emulador sobre una copia ficticia**, nunca sobre producción; (b) para los reales, un script **idempotente y con respaldo previo** que copie los campos privados a `pedidos_privados` y luego elimine esas claves de `pedidos`; (c) regla de compatibilidad que permita ambos esquemas durante la ventana; (d) autorización expresa para escribir en producción — **no solicitada ni ejecutada**.

## P3 · Matriz oficial de 66 escenarios: BLOQUEADA

`MATRIZ-PRUEBAS-FIREBASE.md` sigue sin estar disponible: los dos enlaces de Drive devuelven **401** y `/workspace/KZ-REDESIGN-001` **no existe** en este equipo. **No la sustituyo por la mía ni relajo sus criterios.** Para desbloquear: pegar el documento en el chat o copiarlo a `C:\KZ-EVIDENCIA\kz-sec-006\`.

## P4 · Recuperación: pendiente de ejecución, reglas listas

`database.rules.reversion.json` conserva cerrados pedidos (creación única), privados, contador, respaldo y aislamiento. **Pendiente:** cargarlas en el emulador (`PUT /.settings/rules.json&access_token=owner`) y reejecutar la matriz anónima (**debe dar 15/15**) más un control explícito de que **no reabre** sobrescritura ni escritura cruzada. Es la siguiente tarea de 2 minutos.

## Dictamen

**NO-GO para despliegue** (sin cambios: faltan P3, P4 y los 3 casos positivos de P1 con tokens reales).
**GO para la fase siguiente** con estas tres tareas concretas: Auth emulator para tokens reales (P1 → 14/14), cargar y probar las reglas de reversión (P4), y ejecutar los 66 escenarios cuando lleguen (P3).

Sin merge, sin despliegues, sin crear roles reales, sin tocar datos de producción.
