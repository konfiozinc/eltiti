# KZ-SYNC-013 · Menús sincronizados con sus paneles

**CTO:** Darwin Montalvo · **Fecha:** 2-nov-2026
**Estado:** publicado. Los dos menús leen Firebase en vivo; cerrar y abrir no hace falta para ver cambios.

## 1. Cómo funciona ahora

**Firebase Realtime Database es la única fuente de datos comerciales.** El menú no guarda copia propia del catálogo ni la presenta como buena si no puede leerla.

| Pieza | Implementación |
|---|---|
| Lectura | `GET /<namespace>/productos.json` en cada carga |
| Actualización en vivo | `EventSource` sobre la misma ruta (REST Streaming): un `put` del panel redibuja el menú en menos de 1 s |
| Respaldo si el canal cae | Sondeo cada 15 s (1,2 s en pruebas) |
| Sin conexión | No muestra productos, avisa que no puede verificar la disponibilidad y **bloquea los pedidos** |
| Antes de pedir | Relee el catálogo y comprueba existencia, disponibilidad y precio actual de cada ítem |
| Aislamiento | El Titi sólo lee `menu`, Col Sabor sólo lee `colsabor` |

Los identificadores originales se conservan en la vista y viajan igual al pedido (`hb-x`, `col-empanadas`…).

## 2. Comportamiento verificado (emulador)

**20/20** comprobaciones con administradores reales del emulador (`_admin` con rol por negocio):

| Prueba del encargo | Resultado |
|---|---|
| 1. Cambio de precio | $8.000 → **$9.500** en pantalla sin recargar |
| 2. Marcar agotado | Tarjeta con sello **AGOTADO** y botón deshabilitado |
| 3. Volver a habilitar | Vuelve a comprarse (verificado añadiendo al carrito) |
| 4. Producto nuevo | Aparece solo, sin tocar `index.html` ni desplegar |
| 5. Producto eliminado | Desaparece del menú (y del carrito) |
| 6. Cambio de fotografía | `img.src` actualizado al archivo nuevo |
| 7. Administrador de otro negocio | **401** al escribir en el catálogo ajeno; 200 en el propio |
| 8. Pedido con producto agotado | Carrito marca la línea, botón bloqueado, **0 pedidos registrados** |

Extra: con Firebase inaccesible (petición abortada), el menú queda en 0 productos, muestra el aviso de verificación y el botón de pedido permanece deshabilitado.

## 3. Pruebas de regresión

| Batería | Resultado |
|---|---|
| Sincronización (emulador, 2 negocios) | **20/20** |
| Flujo funcional de pedido (emulador, 375 px) | **22/22** |
| Distribución visual (4 tamaños × 2 menús) | **104/104** |
| Tipografía y contraste WCAG | **88/88** |
| Producción escritorio (1440) | **18/18** |
| Producción móvil (375) | **10/10** |

En producción se confirmó que el canal en vivo está realmente abierto: la petición sale con `Accept: text/event-stream` y responde 200 en ambos negocios.

## 4. Estado real del catálogo tras conectar

- **El Titi:** 16 productos, **0 agotados**, 16 comprables. Precios y fotos idénticos a Firebase.
- **Col Sabor:** 29 productos, **21 marcados como agotados** en Firebase y **8 comprables**.

Lo segundo no es un defecto del menú: es el estado que hay en la base. Al pasar Firebase a ser la fuente oficial, el menú público lo refleja tal cual — cada producto agotado aparece con su sello y no se puede añadir. Si alguno de esos 21 está disponible en realidad, se reactiva desde el panel (`agotado: false`) y el menú lo muestra comprable **en segundos, sin desplegar nada**. No se modificó ningún dato comercial.

## 5. Seguridad

- Lectura del catálogo: pública (necesaria para el menú), sin cambios de reglas.
- Escritura: sólo administradores del negocio correspondiente, con `_admin[uid].negocio` + `activo` (reglas v5b ya desplegadas).
- Pedidos: creación anónima con UUID y código de consulta; lectura del pedido completo restringida; PII en nodo separado (verificado 401 en todos los casos).

## 6. Commits

| Repositorio | Commit | Contenido |
|---|---|---|
| eltiti | `307f7f3` | menú conectado a Firebase con actualización en vivo y bloqueo de pedidos no verificables |
| colsabor | `e777567` | ídem + copia de evidencia `data/productos.produccion.json` |
| eltiti / colsabor | (este informe) | documentación |

## 7. Reversión

El comportamiento anterior (catálogo fijo del repositorio) se recupera con `git revert 307f7f3` (El Titi) o `git revert e777567` (Col Sabor). Las reglas de Firebase no se tocaron.
