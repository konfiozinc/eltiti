# EL TITI — Comidas Rápidas (v1.0 Producción)

Menú digital para EL TITI Comidas Rápidas (Barrio Nueva Jerusalén, Bello,
Antioquia). Aplicación de una sola página (PWA), 100% estática,
desplegada en GitHub Pages, con Firebase Realtime Database como única
fuente de datos.

## Tecnología

- HTML5 / CSS3 / JavaScript Vanilla + Alpine.js
- Firebase Realtime Database (datos) + Firebase Authentication (panel admin)
- GitHub Pages (hosting estático)
- PWA (manifest.json + service-worker.js)

## Estructura del proyecto

```
/assets
  /logo        → logo-el-titi.png, no-image.webp (fallback de imágenes)
  /productos   → fotos de cada producto (.webp)
  /galeria     → fotos de la galería (.webp)
  /videos      → videos locales de "Nuestra Cocina" (.mp4)
  /icons       → íconos PWA (icon-192.png, icon-512.png, favicon.png)

/data
  productos.json       → snapshot de referencia del catálogo inicial (NO se usa en runtime)
  configuracion.json    → snapshot de referencia de horario/promo/categorías (NO se usa en runtime)

index.html
manifest.json
service-worker.js
README.md
```

> **Importante:** los archivos en `/data` son **solo de referencia / respaldo**.
> La aplicación nunca los carga ni los usa como fuente de datos —
> Firebase Realtime Database es la única fuente de verdad, tal como exige
> el criterio de "no duplicar información entre Firebase y arrays estáticos".

## Regla crítica — GitHub Pages es estático

La aplicación **no** intenta crear, escribir ni modificar archivos del
repositorio desde el navegador (ni en `/assets`, ni en ningún otro lugar).
Toda esa lógica fue eliminada. Para agregar o cambiar una imagen de
producto:

1. Sube el archivo `.webp` a `assets/productos/` por GitHub (web o git push).
2. En el panel admin, escribe la ruta exacta en el campo "Ruta" del
   producto (ej: `assets/productos/hamburguesa-clasica.webp`).
3. Firebase guarda esa ruta como texto — la imagen la sirve GitHub Pages.

## Imágenes — convención y fallback

- Todas las imágenes de producto deben existir físicamente en
  `assets/productos/` con el **nombre y extensión exactos** (sensible a
  mayúsculas/minúsculas).
- Si `p.imagen` está vacío o el archivo no existe/no carga, la app muestra
  automáticamente `assets/logo/no-image.webp` (nunca un ícono de imagen
  rota). Esto aplica al menú y a las vistas previas del panel admin.

## Galería

- Carga las imágenes de `assets/galeria/foto1.webp` … `foto5.webp`.
- Si una foto de la galería no existe o falla al cargar, esa diapositiva
  se oculta automáticamente (sin generar errores visibles).

## Videos — "Nuestra Cocina"

- Ubicación: `assets/videos/cocina.mp4`, `especialidades.mp4`, `promo.mp4`.
- Al cargar la página se verifica (HEAD request) que cada video exista.
- Si un video falta o falla, su tarjeta se oculta. Si los tres faltan, la
  sección completa "NUESTRA COCINA" se oculta. Nunca se muestra un
  reproductor vacío.

## Firebase Realtime Database — esquema

| Nodo               | Contenido                                  |
|---------------------|---------------------------------------------|
| `menu/productos`    | Catálogo de productos (id, nombre, categoria, precio, imagen, agotado) |
| `menu/promo`        | Texto de la promoción activa |
| `menu/horario`      | Horario de atención (`dias`, `inicio`, `fin`) |
| `menu/reseñas`      | Reseñas de clientes (estrellas, comentario, fecha) |
| `menu/meta`         | Metadatos internos (último guardado) |
| `menu_backup`       | Copias de seguridad automáticas antes de cambios destructivos |

> Nota: el campo de promoción se mantiene en `menu/promo` (nombre histórico
> ya usado en la base de datos en producción). Renombrarlo a `menu/promocion`
> rompería la lectura de la promoción actual sin un paso de migración —
> se mantiene por estabilidad, según el criterio de "no reinventar".

### Categorías (obligatorias, fijas)

1. Hamburguesas 🍔
2. Salchipapas 🍟
3. Chuzos 🌭
4. Bebidas 🥤
5. Adicionales ➕

### Estructura de un producto

```json
{
  "id": "uuid-generado",
  "nombre": "Hamburguesa Clásica",
  "categoria": "Hamburguesas",
  "precio": 12000,
  "imagen": "assets/productos/hamburguesa-clasica.webp",
  "agotado": false
}
```

## Panel admin

Acceso vía Firebase Authentication (correo + contraseña). Permite:

- Crear, editar y eliminar productos
- Activar/desactivar disponibilidad (agotado)
- Editar promoción y horario
- Ver estadísticas: total productos, total categorías, productos agotados,
  última sincronización con Firebase

## Carrito y WhatsApp

El carrito persiste durante la sesión (memoria de la app), permite agregar,
quitar y modificar cantidades, calcula el total y genera automáticamente
un mensaje de WhatsApp con cliente, productos, cantidades y total al botón
`+57 301 438 7942`.

## PWA / Offline

`service-worker.js` precachea el shell de la app (HTML, manifest), el
logo, los íconos, todas las imágenes de productos/galería y los videos
locales, permitiendo navegación básica sin conexión.

## Elementos flotantes

- Botón de WhatsApp: fijo, 24px del borde inferior.
- Botón de carrito: fijo, ~90px del borde inferior (por encima del botón
  de WhatsApp, sin solaparse).
- Ninguno de los dos cubre botones de "Agregar al carrito", formularios
  ni contenido del panel admin.

## Despliegue

1. Sube todo el contenido de este paquete a la raíz del repositorio
   `konfiozinc.github.io/eltiti/` (o el repo correspondiente).
2. Verifica que GitHub Pages esté activo sobre la rama `main` / carpeta raíz.
3. Abre `index.html` en el navegador — Firebase ya está configurado.
