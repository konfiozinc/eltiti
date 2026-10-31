# KZ-AUTH-014 · Los paneles ya no se cierran solos

**CTO:** Darwin Montalvo · **Prioridad:** P0 · **Fecha:** 2-nov-2026
**Estado:** causa reproducida, corregida, certificada y publicada en los cuatro paneles.

## 1. El fallo, reproducido antes de tocar nada

Los cuatro paneles viven en `konfiozinc.github.io`, así que **comparten almacenamiento**. Todos usaban la **app por defecto** de Firebase, es decir, una sola sesión por origen.

Con administradores ficticios en el emulador, el resultado de la reproducción fue peor de lo reportado:

1. Col Sabor entra en su panel de productos → sesión OK.
2. Col Sabor abre pedidos en otra pestaña → **reutiliza** la sesión (correcto).
3. El Titi entra en su panel, en otra pestaña del mismo origen.
4. → **Col Sabor pierde la sesión** (su `onAuthStateChanged` recibe el UID de El Titi, no reconoce el rol y ejecuta `signOut()`), **Col Sabor · pedidos muestra «no tiene permiso activo» y también pierde la sesión**, y además **El Titi se queda fuera**: la pestaña de Col Sabor reacciona al UID ajeno y cierra la sesión de todo el origen.

Es decir: no era solo interferencia entre negocios, era una **destrucción mutua de sesiones** que expulsaba a los cuatro paneles.

## 2. La corrección

| Cambio | Por qué |
|---|---|
| **Una app de Firebase por negocio** (`kz-panel-titi`, `kz-panel-colsabor`) | Cada app guarda su sesión bajo su propia clave, así dos negocios pueden estar dentro a la vez en el mismo origen. Los dos paneles del **mismo** negocio comparten app y, por tanto, la sesión. |
| **Rechazo de rol sin `signOut()`** | El panel queda bloqueado con el mensaje de siempre, pero no destruye la sesión: se puede entrar con otra cuenta sin perder lo escrito. |
| **Fallo de lectura de rol sin `signOut()`** | Antes, cualquier error de red expulsaba al administrador. |
| Botón «Cerrar la sesión de esta cuenta» al quedar bloqueado | El administrador puede salir cuando quiera; el cierre voluntario sigue funcionando. |

**No se eliminó ningún control de autorización**: la comprobación de rol sigue siendo estricta, las reglas v5b siguen igual y las escrituras siguen restringidas al administrador de cada negocio (verificado con 401 en el catálogo ajeno).

## 3. Certificación (emulador, 22/22)

| Punto del encargo | Resultado |
|---|---|
| 1. Col Sabor mantiene su sesión | PASS |
| 2. El Titi mantiene su sesión | PASS |
| 3. Los cuatro paneles abiertos a la vez | PASS · apps `kz-panel-colsabor` y `kz-panel-titi`, dos UIDs distintos y simultáneos |
| 4. Los paneles funcionan | PASS · marcó un producto como agotado y confirmó un importe ($25.000 → estado `CONFIRMADO`) en Firebase |
| 5. Recargar no cierra la sesión | PASS en ambos negocios |
| 6. El cierre voluntario funciona | PASS · y no afecta al otro negocio |
| 7. Usuario sin rol sigue rechazado | PASS · sin panel, con el mensaje de permiso, sesión no destruida y **401** en las reglas |
| 8. Un administrador no toca el otro negocio | PASS · 401 en el catálogo ajeno, 200 en el suyo |

## 4. Producción

**24/24** comprobaciones sobre los cuatro paneles y los dos menús:

- `eltiti/admin.html`, `eltiti/pedidos.html`, `colsabor/admin.html`, `colsabor/pedidos.html` → HTTP 200, código con app por negocio, rechazo sin `signOut`, formulario de acceso correcto y **cero errores de consola**.
- Menús públicos con su catálogo intacto: 16 y 29 productos.

**Datos sin tocar** — huellas SHA-256 antes y después, idénticas:

| Nodo | Registros | Estado |
|---|---|---|
| `menu/productos` | 16 | sin cambios |
| `colsabor/productos` | 29 | sin cambios |
| `menu/pedidos` | 3 | sin cambios |
| `colsabor/pedidos` | 10 | sin cambios |
| `_admin` | 4 | roles titi, colsabor, dta-chanclas, nbc-company · sin cambios |

Las pruebas de escritura se hicieron siempre contra el **emulador**; en producción no se creó, modificó ni borró nada.

## 5. Commits

| Repositorio | Commits |
|---|---|
| eltiti | `03cd14a` (aislamiento de sesión) · `cde0f6f` y `199207f` (icono) · este informe |
| colsabor | `47d5dab` (aislamiento de sesión) · `54aaee7` y `0d7d364` (icono) · este informe |

## 6. Reversión

`git revert` de los commits `03cd14a` (El Titi) y `47d5dab` (Col Sabor) devuelve el comportamiento anterior —no recomendado: reintroduce los cierres cruzados.
