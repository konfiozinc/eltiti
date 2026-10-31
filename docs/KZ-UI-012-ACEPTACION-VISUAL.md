# KZ-UI-012 · Corrección visual de los dos menús

**CTO:** Darwin Montalvo · **Fecha:** 2-nov-2026
**Estado:** rediseño responsive implementado, verificado y publicado en las dos direcciones principales.

## 1. Qué se corrigió

| Punto del encargo | Antes | Ahora |
|---|---|---|
| Contenedor principal | ~1120 px con padding irregular y catálogo estrecho en escritorio | `max-width:1280px`, centrado, padding 18/26 px |
| Categorías | Barra oscura suelta, no alineada con el catálogo | Barra **sticky** dentro del mismo contenedor: alineada al píxel con la rejilla; scroll horizontal solo cuando no caben (<960 px) |
| Productos | Foto pequeña, texto justo, botones de 44 px justos | Foto **4:3** a todo el ancho de la tarjeta, nombre 15–17 px, precio 900 de peso, botón Agregar 44 px, tarjetas de igual altura por fila |
| Carrito | Barra inferior fija que tapaba contenido; botones fuera del contenedor | **Escritorio ≥900 px:** panel lateral derecho de 420 px con velo. **Móvil:** hoja inferior con `88dvh`, scroll propio y `env(safe-area-inset-bottom)` |
| Portada | Solo un título | Hero con foto gastronómica de fondo, logo, lema, chips (horario, ubicación, nº de productos) y dos CTAs |
| Identidad | Paletas planas | El Titi: negro `#0E0E10` + rojo `#E11D2E` + amarillo `#FFC300`. Col Sabor: crema `#FDF7EF` + café `#3B2A1E` + naranja `#C2551A` |

Referencias de distribución estudiadas (Ñañitos: contenedor ~1200 px, barra superior de contacto; Doña Naty: acento naranja cálido, presentación de platos). **No se copió marca, logotipo ni contenido.**

## 2. Medidas reales por tamaño

| Viewport | Contenedor | Columnas | Tarjeta | Foto |
|---|---|---|---|---|
| 375×812 | 375 px | 2 | 181 px | 134 px |
| 768×1024 | 768 px | 2 | 375 px | 280 px |
| 1440×900 | **1280 px** | 4 | 304 px | 226 px |
| 1920×1080 | **1280 px** | 4 | 304 px | 226 px |

Idénticas en ambos negocios. Filtros exactamente alineados con la rejilla en los cuatro tamaños (izquierda 0 / 0 / 80 / 320).

## 3. Pruebas

| Batería | Resultado |
|---|---|
| Distribución (2 menús × 4 tamaños + carrito 375/1440) | **104/104** |
| Tipografía, contraste WCAG y recortes | **88/88** |
| Flujo funcional (pedido completo en emulador) | **22/22** |
| Producción en las dos URLs (4 tamaños + carrito) | **70/70** |

Comprobado en cada tamaño: 0 px de scroll horizontal, 0 tarjetas fuera del viewport, todos los botones ≥44 px, filas con alturas iguales, sin texto recortado, precio y botón sin solaparse, contraste ≥4.5 en nombre, precio y filtro activo, panel del carrito y su botón «Pedir» siempre dentro de la pantalla.

**Capturas:** `C:\KZ-EVIDENCIA\kz-ui-012\` — `Eltiti-{375x812,768x1024,1440x900,1920x1080}.png`, `Colsabor-…`, más `Eltiti-carrito-375.png`, `Colsabor-carrito-375.png` y las versiones `PROD-*.png` tomadas de las URLs públicas.

## 4. Conservación funcional

Nada se perdió: 16 productos en El Titi y 29 en Col Sabor con sus precios, identificadores originales, categorías, fotografías, carrito, registro de pedidos, seguimiento por código y separación de datos privados. Reglas Firebase y datos comerciales **sin cambios**. El contrato con la base sigue igual (multipath `PATCH` a `pedidos` / `pedidos_privados` / `pedidos_publico`, estado inicial `COTIZACION_PENDIENTE`, `total: 0`).

## 5. Dos defectos reales encontrados y corregidos

1. **Carrito compartido entre negocios.** Los dos menús viven en `konfiozinc.github.io`, así que usaban la misma clave `ks-carrito` en `localStorage`: lo añadido en Col Sabor aparecía (o rompía) en El Titi. Ahora la clave es `ks-carrito-<namespace>`.
2. **Petición perdida de `/favicon.ico`.** El icono se inyectaba por JS y el navegador alcanzaba a pedir el favicon por defecto del dominio → 404 en consola. Ahora el `<head>` lleva un marcador vacío y el JS lo sustituye por el logo del negocio: 0 errores de consola en los cuatro tamaños.

## 6. Pendiente de decisión comercial (no se tocó nada)

En **Firebase**, Col Sabor tiene **21 de 29 productos marcados como agotados** (Arepas de huevo, Empanadas, Sancocho de gallina, Mojarra roja, Jugos…). El catálogo del repositorio —el que el cliente ve publicado hasta hoy— no tiene ninguno agotado.

Como esta misión es de corrección visual, Col Sabor **mantiene su catálogo del repositorio como fuente principal** (comportamiento publicado, sin cambios de disponibilidad) y Firebase queda para los pedidos y como respaldo. Si el CTO confirma que esos 21 agotados son reales, se cambia la fuente a Firebase y el menú los mostrará con su sello «Agotado»; si son una prueba del panel, hay que limpiarlos allí.

## 7. Commits

| Repositorio | Commit | Contenido |
|---|---|---|
| eltiti | `04dc40a` | rediseño visual responsive |
| eltiti | `7ef7c12` | marcador de favicon |
| eltiti | `8ca21eb` | carrito por negocio |
| eltiti | `…` | este informe |
| colsabor | `caaa2d2` | rediseño visual responsive |
| colsabor | `eab08a7` | marcador de favicon |
| colsabor | `4b40afa` | carrito por negocio |
| colsabor | `e548c0f` | catálogo publicado como fuente principal |
| colsabor | `…` | este informe |

## 8. Reversión

Restaurar el menú anterior de un negocio: `git revert <commit>` sobre `index.html` y `preview/menu.html`, o `git checkout <commit>~1 -- index.html preview/menu.html`. El sitio previo al rediseño sigue disponible como `index-v1.html` en cada repositorio.
