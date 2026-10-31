# INFORME KZ-SEC-006 — Propuesta de reglas Firebase en entorno aislado

**CTO:** Darwin Montalvo · **Ejecutor:** Harness · **Fecha:** 30-oct-2026
**Entregable principal:** parche de reglas propuesto (**sin desplegar**) + análisis de permisos
**Estado:** **parche listo, verificación dinámica BLOQUEADA** (§4). No se ha tocado producción.

---

## 1. Parche propuesto

Archivo: `C:\KZ-EVIDENCIA\kz-sec-006\database.rules.propuesta.json` (JSON válido, 8 claves raíz: `.read`, `.write`, `_admin`, `menu`, `colsabor`, `menu_backup`, `dta-chanclas`, `nbc-company`).

Cambios frente a las reglas desplegadas:

| # | Antes (producción) | Propuesta |
|---|---|---|
| 1 | `.write` raíz del negocio = `auth != null` (cualquier cuenta escribe todo) | **eliminado**: no hay escritura de árbol; solo nodos concretos con condición |
| 2 | `pedidos/.write` = `true` (cualquiera crea, modifica y borra) | **solo creación**: `pedidos/$id/.write = "!data.exists() && newData.hasChildren([...])"` + validación de forma (código ≥4, campos acotados) |
| 3 | `pedidos_privados/.write` = `true` | **solo creación** y **lectura solo con rol del negocio** |
| 4 | `reseñas/.write` = `true` | **solo creación con validación** (texto ≤600) en El Titi; en Col Sabor solo el negocio |
| 5 | `contadorPedidos/.write` = `true` | **solo el panel del negocio** con rol |
| 6 | `menu_backup/.write` = `true` | **solo rol de El Titi** |
| 7 | Sin condición por negocio | **rol por negocio**: `root.child('_admin').child(auth.uid).child('negocio').val() == 'titi' \| 'colsabor'` |
| 8 | `dta-chanclas` / `nbc-company` con `.write: auth != null` | lectura pública de `productos`/`meta`, **sin escritura pública** |

**Aislamiento:** se implementa con un nodo de roles `_admin/{uid}/negocio`. Regla de oro aplicada: **ninguna autorización general tapa una restricción inferior** — se eliminaron los `.write` de raíz justamente para que no haya un permiso superior que anule los hijos.

**Cómo se reciben pedidos públicos sin permitir modificaciones indebidas:** el visitante puede **crear** en `pedidos/$id` y `pedidos_privados/$id` **solo si el nodo no existe** (`!data.exists()`), con validación de forma. No puede sobrescribir, no puede borrar y no puede leer el nodo privado. El rastreo sigue funcionando porque `pedidos` mantiene lectura pública (ver §5, riesgo residual).

## 2. Matriz de permisos esperada (deducida del parche)

| Actor | `productos/promo/horario/meta` | `pedidos` | `pedidos_privados` | `reseñas` | `contadorPedidos` | `menu_backup` | otro negocio |
|---|---|---|---|---|---|---|---|
| Visitante | leer | leer · **crear** | **crear** | leer · crear (solo El Titi) | — | — | — |
| Admin del negocio | leer | leer · crear | leer · crear | leer · crear | **escribir** | **escribir** (El Titi) | **—** |
| Admin de otro negocio | leer | leer · crear | — | — | — | — | **—** |

## 3. Compatibilidad con los flujos legítimos

| Flujo | ¿Sigue funcionando? | Por qué |
|---|---|---|
| Menú público (4 negocios) | ✅ | lectura de `productos`, `promo`, `horario`, `meta` intacta |
| Carrito | ✅ | es local, no toca Firebase |
| Crear pedido (visitante) | ✅ | creación permitida en `pedidos` y `pedidos_privados` |
| Rastreo por código | ✅ | lectura de `pedidos` se mantiene |
| Panel: ver pedidos y datos privados | ⚠ **requiere rol** | hoy basta estar autenticado; tras el parche se exige `_admin/{uid}.negocio` |
| Panel: contador, backup, reseñas | ⚠ **requiere rol** | idem |
| Otro negocio cualquiera | 🚫 **bloqueado** | objetivo del parche |

**Consecuencia operativa que hay que decidir:** el parche **no se puede desplegar solo**. Antes hay que **crear el nodo `_admin` con el UID y el negocio de cada cuenta de panel**. Eso es una **escritura en producción** (crear `_admin/{uid}`), que **no está autorizada** en esta misión y requiere autorización específica. Sin esos registros, los paneles dejarían de poder escribir.

Alternativa si el CTO prefiere no crear `_admin`: mantener `auth != null` en los nodos de panel (sin aislamiento por negocio) y cerrar **solo** lo público (pedidos, PII, contador, backup, reseñas). Menos seguro en aislamiento, pero desplegable sin tocar datos. **Esta decisión es del CTO.**

## 4. Verificación dinámica: BLOQUEADA (declarado)

Monté un emulador de RTDB aislado (`demo-sec-006`, puerto 9000) con el parche y una matriz de **15 escenarios anónimos** (lectura de menús, intento de sobrescribir/borrar pedidos, leer PII, tocar contador y backup, escribir en otro negocio, y los flujos legítimos de creación).

**Resultado real de las dos ejecuciones: todas las peticiones devolvieron HTTP 200**, incluidas las que debían denegarse. Interpretación honesta: **el emulador no está aplicando el archivo de reglas** (comportamiento de reglas abiertas), no que el parche permita todo.

- **No declaro la matriz como ejecutada.** Los 66 escenarios de la matriz de Codex Sites **tampoco se ejecutaron**: además de este bloqueo, **no tengo ese documento** (sigue inaccesible desde la misión anterior).
- Sospecha del bloqueo: el emulador lee el archivo por convención (`database.rules.json`) desde la carpeta del proyecto, y la configuración pasada por `--config` no se aplicó. **Siguiente intento exacto:** copiar el parche a `database.rules.json` en la carpeta, relanzar `firebase emulators:start --only database --project demo-sec-006` y volver a ejecutar `node matriz-anonima.cjs`; si sigue en 200, probar `?ns=demo-sec-006-default-rtdb`.

## 5. Riesgos y bloqueos restantes

| # | Riesgo / bloqueo | Nota |
|---|---|---|
| 1 | **`pedidos` sigue con lectura pública** en el parche (para no romper el rastreo) | Si quedaran campos personales heredados en `pedidos`, seguirían expuestos. Requiere verificar su contenido — hoy prohibido leer pedidos. Alternativa: mover el rastreo a un nodo público mínimo (`pedidos_publico/{codigo}`) y cerrar `pedidos` del todo |
| 2 | **`_admin` necesita escritura en producción** para que el parche funcione | Requiere autorización específica |
| 3 | **Matriz no ejecutada** (emulador no aplica reglas + falta la matriz de Codex Sites) | Es el paso que falta para pedir aprobación de despliegue |
| 4 | **Sin aislamiento hoy**: cualquier cuenta autenticada escribe los cuatro árboles | Es el riesgo que el parche cierra |
| 5 | No se verificó qué cuenta usan los paneles | Si los dos negocios comparten la misma cuenta, el aislamiento por negocio exigirá crear cuentas separadas |
| 6 | Cambio de alcance compartido: **un solo despliegue afecta a los cuatro negocios** | Plan de reversión abajo |

## 6. Procedimiento de despliegue y reversión (solo documental, no ejecutado)

**Antes de desplegar (requiere autorización del CTO):**
1. Crear `_admin/{uid}/negocio` para cada cuenta de panel (escritura en producción, autorización aparte).
2. Verificar con el CTO si `pedidos` puede cerrarse o queda de solo lectura pública.
3. Ejecutar la matriz completa en emulador y adjuntar resultados.
4. Export del árbol como línea base (autorización aparte; hoy prohibido).

**Despliegue (cuando se autorice):**
```
firebase deploy --only database --project el-titi-menu
```

**Reversión (inmediata, sin tocar datos):**
```
git checkout 25bb198 -- database.rules.json      # reglas anteriores versionadas
firebase deploy --only database --project el-titi-menu
```
Las reglas no contienen datos: revertirlas **no** toca pedidos, productos ni usuarios. Las ventanas son de segundos.

## 7. Ramas y commits

| Repo | Rama | Contenido |
|---|---|---|
| `konfiozinc/eltiti` | `kz-sec-006/propuesta-reglas` | parche + informe + script de matriz |
| `konfiozinc/colsabor` | `kz-sec-006/propuesta-reglas` | copia versionada de las reglas (hoy no tiene ninguna) + informe |

Sin merge a `main`. Sin despliegue. Sin escrituras en producción.

## 8. Dictamen

- **Parche: listo para revisión.** Cierra los cuatro agujeros críticos (pedidos escribibles, PII escribible, backup destruible, contador manipulable) y añade aislamiento por negocio.
- **Verificación dinámica: PENDIENTE.** No puedo afirmar que los 66 escenarios pasan: no se ejecutaron. La aprobación de despliegue **no debe darse** hasta ejecutarlos.
- **Decisión que necesita el CTO:** (a) autorizar la creación de `_admin` en producción, o (b) desplegar solo el cierre de lo público sin aislamiento; y (c) decidir si `pedidos` queda con lectura pública o se migra el rastreo.

**Pendiente de tu decisión, en tres preguntas:** ¿creo `_admin` con los UID de los paneles (necesito que me digas qué cuenta usa cada negocio)? ¿cerramos `pedidos` del todo y movemos el rastreo a un nodo público mínimo? ¿me pasas la matriz de 66 escenarios de Codex Sites para ejecutarla tal cual?
