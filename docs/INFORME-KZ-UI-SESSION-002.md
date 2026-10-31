# KZ-UI-SESSION-002 — Integración y limpieza de sesión de paneles

Estado: **correcciones implementadas y pruebas locales 22/22 PASS**. **NO-GO para producción**.

## Alcance realizado

En los archivos `admin.html` y `pedidos.html` de **El Titi** y **Col Sabor**:

1. Registro de suscripciones activas de Firebase Realtime Database, con `off('value', callback)` al cambiar de usuario o cerrar sesión.
2. Limpieza inmediata de usuario y datos en memoria al cerrar sesión; en pedidos se limpian pedidos, registros privados, registros públicos, identificadores vistos y nuevos.
3. Secuencia de autenticación (`_secuenciaAuth`) que descarta respuestas de verificación de roles que lleguen después de otro cambio de sesión.
4. Inicio de la escucha de datos solo después de confirmar que la cuenta pertenece al negocio y tiene `activo: true`.

## Pruebas ejecutadas

`node kz-ui-controller-tests.cjs` sobre clones locales actualizados de ambas ramas; simulación de controladores con Node VM y Firebase simulado:

| Negocio | Casos | Resultado |
| --- | ---: | --- |
| El Titi | 11 | 11 PASS |
| Col Sabor | 11 | 11 PASS |
| **Total** | **22** | **22 PASS** |

Los casos abarcan roles ajenos/inactivos, rol activo, precio cero/NaN/válido, bloqueo de pedidos ajenos, actualización de seguimiento y desconexión de las tres suscripciones del catálogo y las dos de pedidos cuando se cierra la sesión.

## Límites y condiciones

- Estos resultados validan la lógica de los controladores bajo simulación, **no constituyen pruebas de interfaz visual en navegador real**.
- Quedan pendientes pruebas end-to-end con Auth + RTDB en emuladores y dispositivo/navegador, incluyendo sesión expirada, reconexión, cambio de usuario, errores de red, carga de fotos y flujo completo de pedidos.
- No se hizo merge a `main`, no se publicó el rediseño ni se modificaron reglas, pedidos, usuarios o datos en Firebase de producción.
- Las reglas de producción antiguas siguen siendo un riesgo hasta la migración y autorización expresa del CTO.

**Dictamen:** GO para seguir integración y QA; **NO-GO para producción**.
