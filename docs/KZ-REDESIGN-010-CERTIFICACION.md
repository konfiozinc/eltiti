# KZ-REDESIGN-010 · CERTIFICACIÓN DE LOS MENÚS

**CTO:** Darwin Montalvo · **Fecha:** 30-oct-2026 · **Rama:** `kz-sec-006/propuesta-reglas`
**Resultado: 52/52 comprobaciones PASS** en navegador real (Chromium), servidor local propio.
**Publicación: NO ejecutada — ver dictamen.**

## 1. Fotos: fallo encontrado, corregido y re-verificado

| Intento | Resultado |
|---|---|
| Antes del arreglo | **29/29 y 14/14 daban 404**. La consola mostraba errores y lo que se veía era el logo de respaldo |
| Causa raíz | El campo `imagen` de `data/productos.json` **ya trae la ruta completa** (`assets/productos/archivo.webp`); el prototipo la prefijaba con `assets/productos/` |
| Corrección | Commit **`863f872`** (Col Sabor) y **`c9ac7e9`** (El Titi): se usa `p.imagen` tal cual |
| Re-verificación | **29/29 y 14/14 fotos reales** en escritorio (1440×900), tableta (768×1024) y celular (375×812). **Consola limpia, cero 404** |

## 2. Batería completa (52 comprobaciones, 0 fallos)

Por negocio y por tamaño:

| Comprobación | Col Sabor | El Titi |
|---|---|---|
| Catálogo completo | **29 tarjetas** | **14 tarjetas** |
| Categorías reales | Desayunos · Almuerzos · Jugos · Bebidas | Hamburguesas · Salchipapas · Chuzos · Adicionales |
| Precios renderizados en COP | `$ 2.500` | `$ 7.000` |
| **Fotografías reales cargadas** | **29/29** (los 3 tamaños) | **14/14** (los 3 tamaños) |
| Sin desborde horizontal | ✅ | ✅ |
| Botones táctiles ≥44 px | 44 px | 44 px |

Y en el resto de la interacción (celular): **detalle abre y Escape cierra** · **carrito suma y habilita el pedido** ($ 2.500) · **agotados deshabilitados** · **cero errores de consola**.

## 3. Qué está certificado y qué no

**Certificado (menús):** productos, precios, categorías, **fotografías**, carrito, detalle, estados (carga/error/agotado), responsive en los tres tamaños y accesibilidad táctil básica — con los datos y fotos reales de cada negocio.

**NO certificado (bloquea la publicación):**
1. **Paneles administrativos:** no ejecuté ninguna prueba sobre ellos. Además, el repositorio recibió cambios de otro agente mientras trabajaba (`839af46`/`1340c04` «mover el toast dentro del x-data», `790901a`/`eb785b4` «bump cache SW»), así que **mi copia está desactualizada** y hay que partir de esas versiones.
2. **Integración menú ↔ panel ↔ reglas:** no probada (carrito que crea pedido real en el emulador, panel que lo recibe y cambia estado).
3. **Reglas v5:** no preparadas; existe v4 certificada (15/15) que cubre aislamiento, permisos activos y transiciones.
4. **Cambio de administrador y limpieza de sesión:** sin probar.
5. **Capturas de paneles y comparativa ANTES/DESPUÉS:** pendientes (las capturas de menú sí están).

## 4. Dictamen

# NO-GO para publicar · GO para los menús
- Los **menús** están funcionalmente certificados en los tres tamaños con datos y fotos reales. Pueden enseñarse al CTO.
- **No se publica** porque la integración con los paneles no está probada y los paneles están en una versión distinta a la que audité. Publicar ahora subiría un menú nuevo sobre un panel sin verificar: precisamente el fallo que la orden prohíbe.
- Sin merge a `main`, sin despliegue y sin tocar datos reales.

## 5. Punto de continuación
1. `git pull` en ambos repos para traer los cambios del otro agente.
2. Probar el panel en emulador: login, rol activo, alta/edición de producto con precio, agotado, recepción de pedido y cambio de estado.
3. Probar la integración: pedido desde el menú → visible en panel → transición de estado → seguimiento por código público.
4. Capturas de paneles + comparativa antes/después.
5. Solo entonces: merge y publicación.
