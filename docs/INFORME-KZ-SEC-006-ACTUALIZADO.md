# INFORME KZ-SEC-006 (actualización) — Matriz ejecutada en emulador

**CTO:** Darwin Montalvo · **Ejecutor:** Harness · **Fecha:** 30-oct-2026
**Cambio respecto al informe anterior:** el bloqueo del emulador **está resuelto** y la matriz **se ejecutó**.

## 1. Causa del bloqueo (resuelto)
El emulador estaba configurado para el namespace **`demo-sec-006-default-rtdb`**; mis peticiones iban a otro namespace, donde el emulador sirve una instancia **sin reglas** y todo responde 200. Con el namespace correcto, las escrituras prohibidas devuelven **401** y el diagnóstico lo confirma. **Las reglas propuestas sí se aplican.**

Prueba de control (debe ser 401 para considerar válida cualquier ejecución): `PUT menu_backup/...` anónimo → **401 Permission denied** ✔

## 2. Matriz ejecutada: 15 escenarios anónimos · PASA 13 · FALLA 2

| Escenario (visitante sin sesión) | Esperado | Obtenido |
|---|---|---|
| Lee productos del menú (El Titi) | 200 | **200** ✔ |
| Lee productos de Col Sabor | 200 | **200** ✔ |
| Lee pedidos (rastreo) | 200 | **200** ✔ |
| **NO** lee pedidos privados | 401 | **401** ✔ |
| **NO** lee el respaldo | 401 | **401** ✔ |
| **NO sobrescribe un pedido existente** | 401 | **200** ✗ |
| **NO** borra un pedido existente | 401 | **401** ✔ |
| **NO** sobrescribe datos privados | 401 | **401** ✔ |
| **NO** toca el contador | 401 | **401** ✔ |
| **NO** toca el respaldo | 401 | **401** ✔ |
| **NO** escribe el árbol de otro negocio | 401 | **401** ✔ |
| **SÍ** crea un pedido nuevo (flujo legítimo) | 200 | **200** ✔ |
| **SÍ** crea su registro privado | 200 | **200** ✔ |
| **SÍ** crea una reseña | 200 | **200** ✔ |
| **NO sobrescribe una reseña ajena** | 401 | **200** ✗ |

## 3. Hallazgos de los dos fallos (no se maquillan)

1. **Sobrescritura de un pedido existente permitida (200).** La regla `pedidos/$pedido/.write = "!data.exists() && ..."` debía denegarla, y sin embargo pasó, mientras el **DELETE del mismo nodo sí fue denegado (401)**. Es contradictorio y apunta a que la condición `!data.exists()` no se está evaluando en la escritura de ese nodo como esperaba (posible evaluación de ancestros o de la ruta con hijo). **Hay que aislarlo antes de desplegar:** es exactamente el agujero que el parche pretendía cerrar.
2. **Sobrescritura de una reseña ajena permitida (200)** con la misma construcción (`!data.exists()`), mismo patrón de fallo.

**Conclusión técnica:** el diseño de «solo creación» **no debe darse por bueno** hasta corregir y volver a ejecutar. Candidato de corrección: mover la condición al hijo concreto y añadir `.validate` con `data.exists() == false` en el nodo, o usar la forma `$pedido: { ".write": "!root.child('menu/pedidos').child($pedido).exists()" }`.

## 4. Estado de los demás puntos de la coordinación

| Punto | Estado |
|---|---|
| **1. `_admin` solo con usuarios ficticios** | Pendiente de implementar en la matriz (usuarios ficticios con token y claim). Sin registros en producción, como se ordenó. |
| **2. Diseño objetivo pedidos privados + info pública mínima** | Adoptado. Transición propuesta: `pedidos` → solo lo mínimo público (código, estado, fecha) y el resto a `pedidos_privados`; **sin mover ni borrar registros reales**. Requiere script de migración (no autorizado aún) y ventana con respaldo. |
| **3. Emulador** | **Resuelto** y documentado el namespace correcto (`demo-sec-006-default-rtdb`). Toda ejecución futura incluye el control 401 obligatorio. |
| **4. Matriz de 66 escenarios de Codex Sites** | **No ejecutada: sigo sin copia accesible** (Drive 401, `/workspace/KZ-REDESIGN-001` inexistente). La matriz propia de 15 escenarios sí se ejecutó, con 2 fallos abiertos. |
| **5. Reversión que no restablezca lo vulnerable** | Propuesta: en lugar de revertir al archivo antiguo (que es el vulnerable), **revertir a un archivo intermedio** que mantiene cerrados pedidos privados, contador, respaldo y escrituras entre negocios, y solo relaja lo mínimo si algo legítimo se rompe. Se versiona como `database.rules.reversion.json`. |

## 5. Riesgos residuales
1. **Los dos fallos de sobrescritura**: con el parche actual, un pedido o una reseña existente **puede sobrescribirse** anónimamente. **El parche no está listo para desplegar.**
2. `pedidos` mantiene lectura pública (necesaria para el rastreo) hasta que se adopte el diseño del punto 2.
3. Sin ejecutar los 66 escenarios oficiales ni las pruebas autenticadas (roles correctos/incorrectos), la certificación está **incompleta**.
4. Sigue sin verificarse qué cuenta usa cada negocio (sin acceso a usuarios).

## 6. Dictamen
- **Emulador: resuelto y reproducible.** Cualquier matriz futura debe empezar con el control `401` en escritura prohibida.
- **Parche: NO listo.** 13/15 con 2 fallos reales de sobrescritura; se corrige y se repite.
- **Certificación: incompleta** por falta de los 66 escenarios oficiales y de las pruebas con roles.
- **Despliegue: NO autorizable.** Se necesita: corregir y reejecutar la matriz, ejecutar los 66 escenarios, y una decisión sobre `_admin` y sobre el diseño pedidos público/privado.
