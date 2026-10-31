# KZ-REDESIGN-004C · PREPARACIÓN (informe de primera entrega)

**CTO:** Darwin Montalvo · **Fecha:** 30-oct-2026 · **Fase:** preparación (sin prototipos todavía)
**Estado:** listo para implementar en cuanto se resuelvan tres bloqueos (§7).

---

## 1. Repositorios, ramas y commits base

| Dato | Col Sabor | El Titi |
|---|---|---|
| Repo | `konfiozinc/colsabor` (SSH) | `konfiozinc/eltiti` (SSH) |
| Ruta local | `8-MENUS-DIGITALES/Colsabor` | `8-MENUS-DIGITALES/Eltiti` |
| Rama principal | `main` @ **`ab348cf`** | `main` @ **`a3ab0a6`** |
| Árbol | limpio | **`README.md` modificado sin commit** ⚠ |
| **Rama de trabajo** | **`kz-redesign-004c/preparacion`** (desde `ab348cf`) | **`kz-redesign-004c/preparacion`** (desde `a3ab0a6`) |
| Bundle de preservación | `C:\KZ-EVIDENCIA\kz-dev-003\Colsabor-main-2026-10-30.bundle` | `…\Eltiti-main-2026-10-30.bundle` |

Ambas ramas se suben a GitHub. **`main` no se toca** en ningún repositorio.

## 2. Informes de Codex y Codex Sites: NO ENCONTRADOS

Búsqueda por nombre y por contenido en todo el workspace (excluyendo `node_modules`, `.git`, `repos-externos`): los únicos documentos con «codex» son auditorías de **KZ Motion** (otro proyecto). **No hay informes de Codex ni de Codex Sites para Col Sabor ni para El Titi.**

Consecuencia: las prioridades administrativas del §2 de la misión («según las prioridades aprobadas») **no tienen documento fuente**. Trabajaré con el diagnóstico propio que sigue, y necesito que me confirmes si esos informes existen fuera del workspace (correo, Drive, otro equipo).

## 3. Estructura compartida y componentes comunes

Los dos repos tienen **la misma arquitectura**, nombre por nombre:

```
admin.html · admin-config.js · .pages.yml · .githooks/pre-commit · .gitignore
assets/audio/alerta-pedido.mp3 · assets/galeria/ · assets/icons/ · assets/logo/ · assets/og-*.jpg · assets/productos/
```

Coinciden también en el patrón: HTML + JS vanilla/Alpine, datos en `data/productos.json`, imágenes locales optimizadas y **alertas de pedido por audio** en el panel.

**Implicación de ingeniería:** son negocios distintos con código clonado. Cada corrección se aplica **dos veces** y puede divergir. Mi criterio en esta misión: **no extraer una librería común** (sería una refactorización no autorizada); sí mantener los cambios **paralelos y con el mismo nombre de commit**, y documentar el par en cada entrega.

## 4. Dependencias de Firebase (el riesgo principal)

| Elemento | Col Sabor | El Titi |
|---|---|---|
| Proyecto | **`el-titi-menu`** | **`el-titi-menu`** (el mismo) |
| `databaseURL` | `el-titi-menu-default-rtdb.firebaseio.com` | idéntico |
| Config | `firebase-config.json` | `admin-config.js` (con nota «proyecto compartido») |
| Reglas RTDB | **no hay archivo en el repo** | `database.rules.json` (1,3 KB) |
| Auth | mismo `authDomain` | mismo |

Riesgos: un solo RTDB para dos clientes, separados **solo por namespace**; las reglas viven **únicamente en El Titi** (Col Sabor no tiene copia versionada); un cambio de reglas afecta a los dos; y una regla que abra `menu`/`pedidos` sin acotar por namespace expone datos del otro negocio. El commit base de los dos ya movió la PII de pedidos a un nodo privado: **hay que verificar que la migración quedó completa** antes de tocar nada.

## 5. Entornos de prueba con datos ficticios (plan)

1. **Emulador RTDB + Auth** con proyecto `demo-*` (nunca `el-titi-menu`) y `firebase.test.json` **nuevo**, sin tocar la config de producción.
2. **Semilla versionada** por negocio: `menu` con los productos reales del repo (sin inventar precios ni imágenes), `pedidos` de ejemplo con datos ficticios y un **tercer namespace «vecino»** para la prueba de aislamiento.
3. Pruebas de navegador con Chromium (Playwright ya disponible en el equipo) en **375×667 y 1440×900**.
4. Nada de lo que se pruebe escribe en producción.

## 6. Pruebas previstas (criterios de aceptación)

| Prueba | Criterio |
|---|---|
| Aislamiento entre negocios | Un admin de un negocio **no** lee ni escribe el namespace del otro |
| Menú público | Se lee sin sesión; nada más |
| PII de pedidos | Sin sesión, ningún nodo devuelve nombre, teléfono ni dirección |
| Rastreo | Devuelve estado sin datos personales |
| Carrito y pedidos | Crear pedido de prueba en emulador, con y sin sesión, sin datos reales |
| Regresión | Mismos productos, precios, fotos e identificadores que `main` |
| Móvil | Sin desbordes, botones ≥44 px, navegación usable |
| Panel | Acceso con rol, auditoría de la acción |

## 7. Bloqueos declarados

| # | Bloqueo | Qué necesito |
|---|---|---|
| 1 | **Informes de Codex / Codex Sites ausentes** | Confirmar si existen y dónde; sin ellos no hay «prioridades aprobadas» del §2 de la misión |
| 2 | **`README.md` de El Titi modificado** sin commit | ¿Descartar (`git restore`) o commitear? No lo toco para no perder tu trabajo |
| 3 | **Lectura del RTDB compartido** para la línea base | Autorización de **solo lectura** sobre `el-titi-menu`; sin ella la auditoría de datos y PII queda coja |
| 4 | Especificaciones consolidadas para los prototipos visuales | En esta fase solo preparo; los prototipos arrancan con tus especificaciones |

## 8. Estrategia de recuperación

- **Código:** `main` intacta en `ab348cf` / `a3ab0a6`; bundles en `C:\KZ-EVIDENCIA\kz-dev-003` (`git bundle verify` correcto). Revertir = volver a `main` o borrar la rama de trabajo.
- **Reglas de Firebase:** no se despliegan en esta misión → riesgo eliminado por no actuar.
- **Datos:** no se tocan; las pruebas escriben solo en el emulador.
- **Publicación:** los rediseños no se publican sin aprobación del CTO.

## 9. Lo que haré en la siguiente fase (para tu aprobación)

1. **Seguridad primero:** auditoría del árbol compartido, verificación de la PII migrada, reglas RTDB **por namespace** preparadas y probadas en emulador, y copia versionada de las reglas en el repo de Col Sabor.
2. **Paridad de panel:** mismas correcciones administrativas en los dos negocios, commits paralelos.
3. **Prototipos visuales** por negocio, sin sustituir el código existente: se parte del HTML actual y se mantienen **productos, precios, fotografías e identificadores**.

No haré reconstrucción completa: el código actual funciona y está en producción; cualquier reescritura necesitaría justificación y tu aprobación expresa.
