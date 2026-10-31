# INFORME KZ-SEC-006 · Corrección y certificación (v2)

**CTO:** Darwin Montalvo · **Ejecutor:** Harness · **Fecha:** 30-oct-2026
**Resultado:** matriz anónima **15/15** con reglas v2 en emulador. **Sin desplegar.**

## 1. P0 — Los dos fallos: causa y corrección

**Causa real de los fallos anteriores:** no era la regla, era **mi prueba**. La matriz usaba identificadores fijos (`PED-9998`, `r2`) y esos nodos ya existían de la corrida anterior; con la regla de creación única, sobrescribir un nodo **que ya existe** se deniega correctamente (401). En la corrida v1 el nodo `PED-0001` de fixture no existía en el namespace correcto, así que la «sobrescritura» era en realidad una **creación** (200 legítimo).

**Correcciones aplicadas:**
1. Las reglas v2 (`database.rules.v2.json`) simplifican el permiso: **`.write` solo en el nodo concreto** (`pedidos/$pedido`, `pedidos_privados/$pedido`, `reseñas/$resena`) con la condición **`!data.exists()`** — sin `.write` en ancestros que puedan heredar autorización.
2. No hay autorización general que tape una restricción inferior: los `.write` de raíz siguen eliminados.
3. La matriz se corrigió con **identificadores únicos por corrida** (`PED-<sufijo>`, `R<sufijo>`), que es como debe probarse la creación.
4. Se añadió **control obligatorio** al principio de la matriz: si una escritura prohibida no devuelve 401, la matriz **no se ejecuta** (evita falsos aprobados por namespace equivocado).

## 2. Matriz ejecutada · 15/15 PASA

| Escenario (visitante sin sesión) | Esperado | Obtenido |
|---|---|---|
| Lee productos de El Titi | 200 | **200** ✔ |
| Lee productos de Col Sabor | 200 | **200** ✔ |
| Lee pedidos (rastreo) | 200 | **200** ✔ |
| **NO** lee pedidos privados | 401 | **401** ✔ |
| **NO** lee el respaldo | 401 | **401** ✔ |
| **NO sobrescribe un pedido existente** | 401 | **401** ✔ |
| **NO** borra un pedido existente | 401 | **401** ✔ |
| **NO** sobrescribe datos privados | 401 | **401** ✔ |
| **NO** toca el contador | 401 | **401** ✔ |
| **NO** toca el respaldo | 401 | **401** ✔ |
| **NO** escribe el árbol de otro negocio | 401 | **401** ✔ |
| **SÍ** crea un pedido nuevo | 200 | **200** ✔ |
| **SÍ** crea su registro privado | 200 | **200** ✔ |
| **SÍ** crea una reseña | 200 | **200** ✔ |
| **NO sobrescribe una reseña ajena** | 401 | **401** ✔ |

**Cómo cargar las reglas v2 en el emulador (reproducible):** `PUT /.settings/rules.json?ns=demo-sec-006-default-rtdb&access_token=owner` con el archivo v2 → 200 `{"status":"ok"}`, y la sonda de escritura prohibida devuelve 401 antes de la matriz.

## 3. P1 — Roles administrativos: pendiente (diseño listo)

Usuarios ficticios a crear en el emulador con token propio: `admin-titi`, `admin-colsabor`, `admin-dta`, `admin-nbc`, un usuario sin rol y un administrador de agencia. El claim/registro será `_admin/{uid}/negocio`. **No se creó nada en producción** (prohibido). Pruebas previstas por actor: puede escribir su negocio, no puede escribir otro, no puede escribir `menu_backup` ajeno, no puede leer `pedidos_privados` ajeno.
**Bloqueo:** el emulador de RTDB no emite tokens con claims por sí solo; hay que iniciar también el emulador de **Auth** y registrar los usuarios ficticios allí (trabajo de la siguiente corrida).

## 4. P2 — Diseño pedidos público/privado (preparado, sin migrar)

`pedidos/{id}` → solo `codigoConsulta`, `estado`, `fechaCreacion`, `total` (lo mínimo para rastrear). Todo lo demás (nombre, teléfono, dirección, notas, ítems) → `pedidos_privados/{id}` con lectura solo del negocio. Transición compatible: se **añade** el nodo público mínimo y el panel pasa a leer privados; los registros reales **no se mueven ni se borran**. Requiere: script idempotente de copia, ventana con respaldo y autorización de escritura en producción — **no autorizado aún**.

## 5. P3 — Matriz oficial de 66 escenarios: **bloqueada**

Sigo sin copia de `MATRIZ-PRUEBAS-FIREBASE.md`: los enlaces de Drive devuelven 401 y `/workspace/KZ-REDESIGN-001` no existe en este equipo. **No la sustituyo por la mía.** Cuando la tengas: pégala en el chat o cópiala a `C:\KZ-EVIDENCIA\kz-sec-006\` y la ejecuto sin alterar sus criterios.

## 6. P4 — Reversión que no reabra vulnerabilidades

`database.rules.reversion.json`: mantiene cerrados `pedidos` (creación única), `pedidos_privados`, `contadorPedidos`, `menu_backup` y el aislamiento por negocio; solo relaja el nodo que resulte imprescindible si un flujo legítimo se rompe. **Nunca** se restaura el archivo antiguo (es el vulnerable). Reversión de reglas = segundos y no toca datos.

## 7. Dictamen

# GO para la siguiente fase de pruebas (P1 y P3) · NO-GO para despliegue

- **Reglas v2: certificadas en emulador, 15/15.** Cierran los cuatro agujeros críticos de la auditoría y mantienen el flujo legítimo de pedidos.
- **NO-GO de despliegue** hasta: (a) ejecutar los 66 escenarios oficiales, (b) probar roles con usuarios ficticios (P1), (c) autorizar la creación de `_admin` en producción.
- **Riesgo residual declarado:** `pedidos` sigue con lectura pública hasta que se adopte el diseño P2.
