# Guía del cliente — EL TITI Comidas Rápidas

Esta guía te enseña a editar tu menú digital **sin tocar código**, usando **Pages CMS**.

## ¿Cómo edito mi menú?

1. Entra a **https://app.pagescms.org** y conéctalo a tu repositorio de GitHub (`konfiozinc/eltiti`).
2. Verás dos secciones:
   - **Productos**: la lista de hamburguesas, salchipapas, chuzos y adicionales.
   - **Configuración**: promoción, horario, categorías y datos de contacto.

3. Edita, guarda y en **1–2 minutos** el cambio aparece en tu menú:
   **https://konfiozinc.github.io/eltiti/**

> 💡 Si no ves el cambio, recarga la página con **Ctrl + F5** (o cierra y abre la app).

---

## Productos — qué significa cada campo

| Campo | Qué poner |
|-------|-----------|
| **Nombre** | El nombre del producto. Ej: `Hamburguesa (Doble)` |
| **Categoría** | Una de: Hamburguesas, Salchipapas, Chuzos, Bebidas, Adicionales |
| **Precio** | El precio en pesos. Ej: `10000` |
| **Imagen** | La foto del producto (está en `assets/productos/`). |
| **Etiquetas** | Emojis de aviso que aparecen sobre la foto: `🌱` vegetariano, `🌶️` picante, `⏱️` rápido, `🔥` popular, `🏷️` recomendado. |
| **Agotado** | Actívalo para ocultar el producto del menú (sale "AGOTADO"). |

## Configuración — qué significa cada campo

| Campo | Qué poner |
|-------|-----------|
| **Promoción / aviso** | El texto del banner. Ej: `🔥 PROMO DEL FIN DE SEMANA: 2x1 en Hamburguesas` |
| **Días** | Los días que abres: `0`=Domingo, `1`=Lunes … `6`=Sábado. Ej: `5,6,0` = viernes, sábado y domingo. |
| **Hora de apertura / cierre** | En formato 24h. Ej: abre `18`, cierra `2` = 6 PM a 2 AM (cierre pasada la medianoche). |
| **Categorías visibles** | El orden de las secciones del menú. |
| **Teléfono** | Solo números. Ej: `3014387942` |
| **WhatsApp** | Con código de país: `57` + número. Ej: `573014387942` |
| **Ubicación / barrio** | Texto corto. Ej: `Barrio Nueva Jerusalén, Bello` |

---

## Preguntas frecuentes

**¿Puedo subir fotos nuevas?**
Sí. En Pages CMS, en el campo "Imagen", usa **Subir/Upload** y la foto queda en `assets/productos/`.

**¿Cómo marco un producto como agotado por hoy?**
Abre **Productos**, busca el producto y activa **Agotado**. Guarda. En 1–2 minutos desaparece del menú (o sale tachado).

**¿Se puede editar desde el celular?**
Sí, Pages CMS funciona en el navegador del celular. Es la forma más rápida de cambiar precios o marcar agotados.

**¿Necesito pedirle esto a un programador?**
No. Todo lo que está en esta guía lo haces tú mismo desde Pages CMS.

---

*Dudas o cambios que no aparezcan aquí: escríbele a KONFÍO ZINC.*
