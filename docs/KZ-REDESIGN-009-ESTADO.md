# KZ-REDESIGN-009 · ESTADO DE CONTINUIDAD (sesión 1)

**Misión:** implementación completa de los dos menús y sus paneles. **Este documento registra el punto exacto de continuación** conforme a la instrucción de continuidad.

## Lo hecho en esta sesión
- Inspección de los paneles con líneas exactas (`admin.html` 451 líneas, `pedidos.html` 429 en ambos repos): todas las escrituras son `.update()` parcial en `meta`, `productos/{id}` y `pedidos/{id}/estado` → **compatibles con reglas v4**, sin `.set()` destructivo y sin escritura cruzada (`cfg.ruta`).
- Retirado el riesgo de `.set()` anotado en KZ-007 (era falso).
- Lectura de la estructura real de datos de ambos menús:
  - **Col Sabor:** `data/productos.json` = `{ productos: [...] }`, 8,9 KB; `index.html` 560 líneas; `scripts.js` 765.
  - **El Titi:** `data/productos.json` = `{ productos: [...] }`, 3,9 KB; `index.html` 712 líneas; `scripts.js` 931.

## Lo que NO se hizo (y no se presenta como hecho)
- **Ningún prototipo visual construido.**
- **Ninguna corrección aplicada al código de los paneles.**
- **Ninguna prueba funcional ni responsive ejecutada** sobre menús o paneles.

Motivo: presupuesto de ejecución agotado. Conforme a la instrucción, se guarda el estado y se continúa en la siguiente sesión con **el mismo identificador KZ-REDESIGN-009**.

## Punto exacto de continuación (para retomar sin preguntas)
1. **Leer la forma exacta de cada objeto de `productos`** (`ConvertFrom-Json` mostró la clave contenedora `productos`; falta listar claves internas, categorías y conteo, que es lo primero a ejecutar).
2. **Prototipo Col Sabor:** nuevo `preview/colsabor.html` + `preview/colsabor.css` que consumen **el mismo** `data/productos.json` y `assets/productos/`; hero con foto real, categorías, tarjetas, detalle, carrito, WhatsApp, responsive y estados carga/error/agotado. **Sin tocar `index.html` ni `scripts.js`.**
3. **Prototipo El Titi:** ídem en `preview/eltiti.html` + `preview/eltiti.css`.
4. **Paneles:** aplicar sobre `admin.html`/`pedidos.html` — rol activo `_admin/{uid}`, mensajes de éxito solo tras el ack, limpieza de sesión al `signOut`, validación de precio (>0, entero, NaN), manejo de error de subida de fotos.
5. **Pruebas:** emulador Auth+RTDB con reglas v4, usuarios ficticios, pedidos ficticios; responsive 375/768/1440; conservación de IDs, precios e imágenes comparando contra `data/productos.json`.

## Restricciones vigentes
Sin merge a `main`, sin publicar, sin desplegar reglas, sin escribir datos de producción, sin usuarios reales, sin migrar pedidos, sin tocar precios ni productos comerciales.

## Ramas
`kz-sec-006/propuesta-reglas` en ambos repos · El Titi `10532f3` → este commit · Col Sabor `6fdc7e3` → este commit.
