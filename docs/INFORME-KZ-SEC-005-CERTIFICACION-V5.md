# KZ-SEC-005 — Certificación dinámica de reglas v5 (candidata)

Fecha: 2026-10-31. Repositorios: `konfiozinc/eltiti`, `konfiozinc/colsabor`. Rama: `kz-sec-006/propuesta-reglas`.

## Resultado ejecutado

**38 de 38 sondas PASS** con Firebase Authentication Emulator + Realtime Database Emulator, proyecto exclusivamente ficticio `demo-sec-v5`, namespace `demo-sec-v5-default-rtdb`. Firebase Tools 13.34.0, Java 17, pruebas REST con tokens `idToken` reales del emulador y actores ficticios El Titi, Col Sabor e inactivo. Se ejecutó `node matriz-v5.cjs` mediante `firebase emulators:exec --only auth,database`.

Cobertura: lectura pública de productos, denegación de enumerar pedidos y seguimiento, lectura de seguimiento por código, privacidad de pedidos, acceso propio activo, denegación entre negocios y rol inactivo, apertura/cierre de tienda, mensaje de cierre, estado y fecha del pedido, total confirmado, estados legados, rechazo de estados inventados y precios negativos, actualización pública administrativa, creación anónima en tres rutas mediante multipath, reintentos bloqueados, prevención de sobrescrituras/borrados y reversión atómica ante una escritura cruzada denegada.

Pruebas: `docs/kz-sec-v5-matriz-38.cjs` — recrea usuarios y datos ficticios en emulador. Regla ensayada: `database.rules.v5.candidata.json` (copiada a `database.rules.json` exclusivamente en el entorno temporal de prueba).

## Límites — NO son PASS

- No se ejecutaron los 66 escenarios completos de la matriz oficial de Codex Sites. Las 38 sondas cubren una selección de contratos, no todas las plantillas.
- No se ejecutó un navegador real ni se probó la interfaz de `admin.html` / `pedidos.html` extremo a extremo.
- No se verificaron los consumidores DTA Chanclas / NBC Company ni se ensayaron migraciones de pedidos reales.
- No se probaron despliegue, latencia, disponibilidad de Cloudinary, App Check ni antiabuso por tasas.
- La prueba de estados legados comprueba aceptación de la regla; el contrato comercial y la migración requieren revisión separada.

## Dictamen

**GO de reglas v5 para revisión técnica adicional. NO-GO de producción.** No hubo merge, despliegue de reglas, escritura a Firebase real, creación de usuarios reales ni migración de pedidos.
