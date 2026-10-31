# KZ-REDESIGN-004D · INFORME DE CONTINUIDAD

**CTO:** Darwin Montalvo · **Coordinación:** ChatGPT · **Ejecución:** Harness · **Fecha:** 30-oct-2026
**Fase:** preparación avanzada (implementación visual **bloqueada** por falta de especificaciones, §1)

---

## 1. Informes de auditoría: BLOQUEO DECLARADO

| Intento | Resultado |
|---|---|
| `C:\workspace\KZ-REDESIGN-001` | **no existe** |
| `C:\Users\usuario29\workspace\KZ-REDESIGN-001` | **no existe** |
| `…\KONFIO_ZINC\KZ-REDESIGN-001` y `…\9-AGENTES-IA\KZ-REDESIGN-001` | **no existen** |
| Búsqueda por nombre y contenido en todo el workspace | sin resultados de KZ-REDESIGN-001/002 ni de Codex/Codex Sites para estos negocios |
| Drive `1ZZVmJXJplujcWjWFT7WRagvn5X2hebLM` | **HTTP 401** (sin acceso) |
| Drive `1Yl_rmhZf51mf_fkPimqZWC85BAHJXleC` | **HTTP 401** (sin acceso) |

El agente **no tiene credenciales de Google Drive** ni un `/workspace/KZ-REDESIGN-001` montado en este equipo. **No sustituyo las especificaciones por suposiciones**: la implementación de los prototipos visuales queda detenida hasta recibir los documentos, en un formato accesible (por ejemplo, copiados a `C:\KZ-EVIDENCIA\kz-redesign-001\` o pegados en el chat).

## 2. README.md de El Titi: diff presentado, sin tocar

**Estado:** modificado, sin commit, **sin descartar ni sobrescribir** (como se pidió).

```diff
@@ /data
-  productos.json → snapshot de referencia del catálogo inicial (NO se usa en runtime)
+  productos.json → contenido base del catálogo: `scripts.js` (cargarContenidoBase) lo carga
+                   al arrancar y luego Firebase lo sobrescribe en vivo
```

**¿Es ajeno a mi misión?** Es una **corrección de documentación**, de una línea, en la sección `/data` del README. No es mío (no lo hice yo) y no lo commiteo.

**¿Es correcto?** Lo verifiqué contra el código:

| Comprobación | Evidencia |
|---|---|
| Existe `cargarContenidoBase()` | `Eltiti/scripts.js:386` ✔ |
| Lee `data/productos.json` al arrancar | `Eltiti/scripts.js:400` (`fetch('data/productos.json')`) y lo invoca en `:419` ✔ |
| Colsabor hace lo mismo | `Colsabor/scripts.js:230` y `:246` ✔ |

Conclusión: el texto nuevo **describe el comportamiento real** y el viejo estaba desactualizado. Es una mejora objetiva, pero **requiere tu decisión** antes de tocar el archivo.

**Hallazgo técnico que se desprende (importante para el rediseño):** `data/productos.json` **sí se carga en tiempo de ejecución** como contenido base y luego Firebase lo sobrescribe. Eso fija cómo hay que probar la regresión: el baseline de productos y precios es el JSON del repo **más** lo que sirva el emulador, nunca una suposición.

## 3. Firebase: trabajo permitido (emulador) y límites acatados

- Prepararé **pruebas de aislamiento en emulador con datos ficticios** (proyecto `demo-*`, namespace «vecino» para la prueba de que un negocio no accede al otro).
- **No** inspecciono reglas ni configuración efectiva de producción: queda pendiente de autorización específica del CTO.
- **No** consulto ni exporto datos personales reales. **No** despliego reglas. **No** modifico datos de producción.

## 4. Trabajo preparado (arquitectura, componentes, pruebas)

**Arquitectura de ambos rediseños (sin escribir código todavía, hasta tener especificaciones):**

| Capa | Col Sabor | El Titi | Nota |
|---|---|---|---|
| Presentación | `index.html` + `scripts.js` (objeto global con métodos) | idem | se **evoluciona**, no se reescribe |
| Datos | `data/productos.json` (base) → RTDB `menu` (vivo) | idem | el JSON es baseline de regresión |
| Panel | `admin.html` + `admin-config.js` | idem | sesiones y permisos |
| Pedidos | nodo privado con PII (commit base) | idem | rastreo sin datos personales |
| Estáticos | `assets/` optimizado local | idem | **no se toca** (fotos y logos se conservan) |

**Componentes reutilizables *dentro de cada proyecto*** (sin librería compartida, para no refactorizar sin autorización): tarjeta de producto, carrusel de galería, hoja de carrito, modal de checkout, estado de pedido y alertas del panel. Se implementarán como funciones/métodos del propio `scripts.js` de cada repo, con el **mismo nombre en los dos** para poder comparar.

**Pruebas automatizadas previstas** (Playwright ya instalado; emulador local):

1. **Validación de productos y precios:** cada producto del JSON tiene `id`, `nombre`, `precio > 0`, categoría válida e imagen existente en `assets/`; los totales del carrito cuadran con los precios del JSON.
2. **Sesiones:** login/logout del panel, sesión persistente, cierre que invalida el acceso a `admin.html`.
3. **Permisos con usuarios ficticios:** `super` del negocio A no lee ni escribe el namespace del negocio B; usuario sin rol no entra al panel.
4. **Aislamiento del menú público:** lectura sin sesión solo de `menu`; ningún nodo devuelve PII.
5. **Pedidos y carrito:** crear pedido en emulador, rastreo sin datos personales, sin tocar pedidos reales.
6. **Regresión visual y de contenido:** productos, precios, fotos e identificadores idénticos a `main`; móvil 375×667 sin desbordes y botones ≥44 px.

**Estrategia de recuperación:** `main` intacta (`ab348cf` / `a3ab0a6`) + bundles en `C:\KZ-EVIDENCIA\kz-dev-003`; revertir = volver a `main` o borrar la rama; reglas no desplegadas; datos reales sin tocar.

## 5. Ramas de desarrollo autorizadas

| Repo | Rama | Commit |
|---|---|---|
| `konfiozinc/colsabor` | `kz-redesign-004c/preparacion` (subida) | `e3387fb` |
| `konfiozinc/eltiti` | `kz-redesign-004c/preparacion` (subida) | `25bb198` |

`main` no se toca en ninguno de los dos. Este informe se commitea en la misma rama de cada repo.

## 6. Bloqueos restantes

| # | Bloqueo | Desbloquea |
|---|---|---|
| 1 | **Especificaciones visuales inaccesibles** (Drive 401 y `/workspace/KZ-REDESIGN-001` inexistente) | Tú: copiar los documentos al equipo o pegarlos en el chat |
| 2 | **README.md de El Titi**: esperando decisión | Tú: commitear o descartar |
| 3 | **Inspección de reglas efectivas de producción** | Autorización específica del CTO |
| 4 | **Prioridades administrativas** («según las prioridades aprobadas» del §2 de 004C) | Los documentos de Codex Sites |

## 7. Lo que puedo hacer ahora sin esos bloqueos

- Pruebas **1** (validación de productos y precios contra el JSON real) y **2-3** (sesiones y permisos con usuarios ficticios en emulador) — no dependen de las especificaciones visuales.
- Semilla ficticia y `firebase.test.json` por repo.
- Estructura de los componentes del panel (no visual) y su prueba.

**Lo que no haré:** implementar diseños sin especificaciones, tocar `main`, desplegar, o escribir en datos reales.
