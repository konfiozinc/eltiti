# KZ-UI-TEST-001 — Validación de controladores administrativos

Fecha de ejecución: 2026-10-31. Proyectos: Col Sabor y El Titi. Rama probada: `kz-sec-006/propuesta-reglas`.

## Resultado ejecutado

**18/18 PASS** con Node.js VM y dobles de Firebase Authentication / Realtime Database, sobre los scripts inline reales extraídos de `admin.html` y `pedidos.html` de ambos repositorios. No hubo acceso a producción ni credenciales reales.

Para cada negocio se ejecutaron nueve pruebas:

1. `admin.html` rechaza cuenta con rol de otro negocio.
2. `admin.html` rechaza cuenta inactiva.
3. `admin.html` acepta cuenta activa del negocio correspondiente.
4. Guardado rechaza precio cero.
5. Guardado rechaza precio no numérico (NaN).
6. Guardado con precio válido prepara la escritura de producto.
7. `pedidos.html` rechaza rol de otro negocio.
8. `pedidos.html` acepta rol activo propio.
9. Cambio de estado construye actualización conjunta del pedido y de su seguimiento público.

La matriz local se ejecutó con `node kz-ui-controller-tests.cjs`, utilizando únicamente usuarios y datos ficticios en memoria. Se verificó el código real de las ramas, no una transcripción manual de la lógica.

## Limitaciones: NO certificadas

- **No son pruebas de interfaz visual en navegador.** La instalación de Chromium de Playwright falló porque la descarga recibida estaba truncada; por tanto, no hay evidencia de clics, composición responsive, modales, teclado ni regresiones visuales de los paneles.
- El doble de Firebase valida las llamadas producidas por los controladores, no el comportamiento real del SDK ni el orden de eventos en red.
- No se probaron fallas de carga Cloudinary, cierre de sesión concurrente, restauración de sesión ni estados de error de los paneles reales en navegador.
- Las pruebas dinámicas independientes de reglas v5 siguen documentadas en `docs/INFORME-KZ-SEC-005-CERTIFICACION-V5.md` (38/38 PASS en emuladores).

## Dictamen

**GO parcial para lógica de controladores; NO-GO para certificación integral de interfaz.** Antes de producción deben ejecutarse pruebas con navegador real, SDK/Emulator y la matriz oficial pendiente. No merge, no despliegue, no escritura en Firebase real.
