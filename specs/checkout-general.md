# Plan de pruebas: Checkout general con `error_user`

## Identificación y alcance

- **Feature:** `checkout-general` desde `config/checkout-error-user.yaml`.
- **SUT:** SauceDemo, `https://www.saucedemo.com/`; pruebas web externas black-box.
- **Objetivo:** validar checkout con `error_user` y, cuando el entorno lo permita, `problem_user`.
- **Cobertura:** carrito vacío, un producto y múltiples productos; consistencia de nombres, precios y cantidades; datos personales; cálculo; navegación, errores y móvil.
- **Excluido:** login/logout como funcionalidad, detalles de producto y persistencia entre sesiones. El login solo es precondición técnica.
- **Estado:** listo para aprobación humana; no se generó ni ejecutó Cypress.

## Supuestos, datos y riesgos

1. Cada escenario comienza en estado fresco e independiente: sesión nueva, carrito vacío y formulario limpio.
2. La URL se obtiene de `TEST_BASE_URL` y las credenciales de variables de entorno; no se guardan secretos en este plan.
3. No hay reglas de negocio formales en `knowledge/`; distinguir comportamiento observado, expectativa explícita, supuesto e incertidumbre.
4. Si el usuario de error no alcanza una etapa, registrar el bloqueo y evidencia; no clasificarlo automáticamente como defecto.
5. Riesgos prioritarios: navegación de carrito/checkout no disponible; pérdida, duplicación o sustitución de productos; cantidades/precios/totales incorrectos; confirmación sin datos o productos; validación silenciosa; recuperación y usabilidad móvil.

## Charter exploratorio

**Misión:** determinar si `error_user` puede recorrer y recuperar el checkout conservando estado, productos, precios, cantidades y validaciones.

**Duración:** 45–60 minutos por entorno. **Heurísticas:** consistencia de estado, usuario de error, límites, repetición, reload/back/forward, feedback visible, URL, foco, cálculos y comparación de roles. **Oráculo:** solo interfaz, accesibilidad, URL, mensajes, consola y comparación observable; no inventar reglas.

## Flujos principales

1. Autenticar → seleccionar productos → carrito → información → resumen → finalización.
2. Enviar formulario vacío/parcial → observar bloqueo, mensaje, foco y conservación → corregir.
3. Quitar todos los productos → inspeccionar contador y Checkout → impedir confirmación inválida.
4. Cancelar, volver, avanzar y recargar en cada etapa alcanzable → comprobar recuperación.
5. Repetir el camino mínimo con `problem_user` y comparar diferencias observables.

## Escenarios independientes

### TC-01 — Completar checkout con un único producto

**Tipo/Prioridad:** positivo, regresión/humo, crítica. **Inicio:** sesión fresca autenticada; carrito vacío.

1. Agregar exactamente un producto y verificar contador `1`.
2. Abrir carrito; verificar nombre, precio y cantidad `1`.
3. Seleccionar `Checkout`; completar `First Name`, `Last Name` y `Zip/Postal Code` válidos.
4. Seleccionar `Continue`; comparar el resumen con el carrito.
5. Verificar subtotal/total visibles y coherencia con el precio; seleccionar `Finish`.

**Esperado:** transiciones correctas, datos conservados y confirmación visible. **Falla:** bloqueo inexplicado, datos alterados, cálculo incoherente o confirmación ausente/indebida.

### TC-02 — Checkout con múltiples productos y cantidades

**Tipo/Prioridad:** positivo/consistencia, alta. **Inicio:** sesión fresca y carrito vacío.

1. Agregar al menos tres productos distintos y registrar nombre/precio.
2. Comparar entradas del inventario con el carrito y cantidad inicial `1`.
3. Repetir agregar un producto si la UI lo permite; observar si cambia cantidad o contador.
4. Completar datos válidos y avanzar al resumen.
5. Comparar conjunto, precios y cantidades entre inventario, carrito y resumen; comprobar subtotal = suma precio × cantidad y coherencia del total.

**Esperado:** sin omisiones, duplicados, sustituciones ni cálculos incoherentes.

### TC-03 — Formulario completamente vacío

**Tipo/Prioridad:** negativo/validación, alta. **Inicio:** un producto y checkout de información visible.

1. Dejar vacíos los tres campos y seleccionar `Continue`.
2. Registrar mensaje visible, foco, estado de campos, URL, carrito y consola.

**Esperado:** avance bloqueado, mensaje claro del campo obligatorio y carrito conservado. **Falla:** llega a resumen/confirmación, no hay feedback utilizable o se pierde el estado.

### TC-04 — Cada campo requerido vacío

**Tipo/Prioridad:** negativo/validación, alta. **Inicio:** repetir desde estado fresco por iteración.

1. Dejar vacío únicamente `First Name`; completar los otros dos y continuar.
2. Repetir dejando vacío únicamente `Last Name` y luego únicamente `Zip/Postal Code`.
3. Registrar texto exacto, foco, valores retenidos y URL en cada iteración.

**Esperado:** cada campo vacío bloquea el avance y es identificado correctamente; valores válidos permanecen.

### TC-05 — Nulos, espacios y caracteres especiales

**Tipo/Prioridad:** negativo/borde/validación, media. **Inicio:** formulario fresco con un producto.

1. Probar vacío real, `null` representado por ausencia de valor, espacios solos y espacios al inicio/final.
2. Probar nombres con guion, apóstrofe, Unicode y caracteres no alfabéticos razonables.
3. Probar código postal alfanumérico, de un carácter, largo y con espacios.
4. Observar aceptación, rechazo, normalización y mensajes, sin asumir reglas no documentadas.

**Esperado:** comportamiento estable y feedback explícito cuando corresponda; registrar incertidumbres como observaciones.

### TC-06 — Límites de longitud y entradas extensas

**Tipo/Prioridad:** borde/error handling, media. **Inicio:** formulario fresco.

1. Introducir un carácter, una longitud mínima aparente y una cadena mucho mayor de lo normal en cada campo.
2. Continuar y observar límite, truncado, rechazo o aceptación.
3. Recargar sin finalizar y comprobar layout, URL y carrito.

**Esperado:** no hay crash, desbordamiento, corrupción ni truncado silencioso; si existe límite, el usuario recibe feedback.

### TC-07 — Carrito vacío y acciones repetidas

**Tipo/Prioridad:** negativo/estado, alta. **Inicio:** sesión fresca y carrito vacío.

1. Observar contador, lista y disponibilidad de `Checkout` sin agregar productos.
2. En una variante, agregar y quitar un producto; repetir una vez cada acción.
3. Abrir carrito vacío y, si Checkout está habilitado, intentar avanzar sin finalizar.

**Esperado:** contador/lista/botones coinciden; no se confirma una orden vacía ni aparecen productos fantasma.

### TC-08 — Cancelar, navegación y recarga

**Tipo/Prioridad:** recuperación/regresión, media-alta. **Inicio:** repetir desde cada etapa alcanzable.

1. Usar `Continue Shopping` desde carrito y `Cancel` desde información.
2. Usar back/forward y reload en carrito, información y resumen.
3. Después de cada acción comparar URL, contador, productos, formulario, resumen y ausencia de confirmación accidental.

**Esperado:** recuperación coherente, sin pérdida ni duplicación inesperada; persistencia tras reload se documenta como observada, no como regla.

### TC-09 — Diferencia observable entre usuarios de error

**Tipo/Prioridad:** rol/error handling, alta. **Inicio:** estado fresco por usuario.

1. Ejecutar el camino mínimo con `error_user` y `problem_user` usando credenciales del entorno.
2. Registrar llegada a Products, contador inicial, controles habilitados, URLs y mensajes.
3. Repetir una vez cada diferencia y clasificarla como intencional, ambiental o potencial defecto.

**Esperado:** diferencias consistentes y reproducibles, sin atribución no sustentada.

### TC-10 — Checkout en viewport móvil

**Tipo/Prioridad:** responsive/regresión, media. **Inicio:** sesión fresca, viewport aproximado `390x844`.

1. Repetir el camino mínimo alcanzable.
2. Verificar controles, campos, errores, resumen y confirmación.
3. Comprobar ausencia de scroll horizontal, solapamiento y texto esencial cortado.

**Esperado:** controles y feedback utilizables en todas las etapas alcanzables.

## Hallazgos y evidencia

### H-01 — Controles de carrito no responden con `error_user`

**Clasificación:** hallazgo reproducible; potencial defecto o comportamiento especial, no confirmado por ausencia de regla formal. En una sesión que alcanzó `/inventory.html`, el badge mostró `2` y el carrito contenía `Sauce Labs Backpack` y `Sauce Labs Bike Light`. `Remove`, `Add to cart`, el enlace del carrito y `Checkout` no cambiaron el estado o URL observables. **Impacto:** bloquea el camino crítico y puede producir UI incoherente. **Reproducción:** autenticar con credenciales de entorno, observar `/inventory.html`, activar esos controles y comparar URL, badge, botones y snapshot. **Evidencia:** snapshots Playwright del 2026-09-02 bajo `.playwright-mcp/page-*.yml`; la URL permaneció `https://www.saucedemo.com/inventory.html` tras abrir carrito.

### H-02 — 404 observable en rutas directas

**Clasificación:** observación de entorno/comportamiento, requiere confirmación. Navegar directamente a `/cart.html` y `/checkout-step-one.html` mostró UI, pero la consola reportó `Failed to load resource: the server responded with a status of 404 ()` para ambas rutas; el botón Checkout no navegó. **Evidencia:** mensajes de consola y snapshots Playwright de la sesión.

### H-03 — Envío vacío sin mensaje accesible observado

**Clasificación:** observación de validación, no confirmada. Tras `Continue` con los tres campos vacíos en `/checkout-step-one.html`, la URL no cambió y el snapshot no coincidió con `error`, `required` o `Error`. Repetir con usuario base antes de elevar defecto; puede ser limitación del rol o sesión.

## Criterios de salida

Cada escenario debe ejecutarse o quedar bloqueado con causa y evidencia; los bloqueos de rol deben separarse de defectos; no debe haber credenciales en artefactos; y los casos estables deben quedar trazables a regresión/humo. Antes de generar automatización se requiere la respuesta exacta `approved` o `aprobado` según el orquestador.

## Automation Handoff

### Selector inventory

- Precondition login: `[data-test="username"]`, `[data-test="password"]`, `[data-test="login-button"]`.
- Inventory/cart: `[data-test="inventory-item"]`, `[data-test="inventory-item-name"]`, `[data-test="inventory-item-price"]`, `[data-test="item-quantity"]`, `[data-test="shopping-cart-link"]`, `[data-test="shopping-cart-badge"]`, `[data-test="checkout"]`; prefer accessible `Add to cart` and `Remove` buttons.
- Checkout information: `[placeholder="First Name"]`, `[placeholder="Last Name"]`, `[placeholder="Zip/Postal Code"]`, `[data-test="continue"]`, `[data-test="cancel"]`, `[data-test="error"]`.
- Summary/completion: `[data-test="inventory-item"]`, `[data-test="inventory-item-name"]`, `[data-test="inventory-item-price"]`, `[data-test="item-quantity"]`, `[data-test="subtotal-label"]`, `[data-test="total-label"]`, `[data-test="finish"]`, `[data-test="complete-header"]`.
- URLs: `/inventory.html`, `/cart.html`, `/checkout-step-one.html`, `/checkout-step-two.html`, `/checkout-complete.html`.
- Literal UI text: `Products`, `Your Cart`, `Checkout`, `Checkout: Your Information`, `First Name`, `Last Name`, `Zip/Postal Code`, `Continue`, `Cancel`, `Finish`, `Continue Shopping`.

### POM/helper reuse map

- Reuse `cypress/support/authentication.js` for environment-provided `error_user` credentials; never hardcode secrets.
- Reuse and extend `cypress/pages/InventoryPage.js`, `cypress/pages/CartPage.js`, and `cypress/pages/CheckoutPage.js`; keep raw locators in page objects.
- Reuse `cypress/support/data.js` for valid and boundary customer data.
- Extend `cypress/e2e/checkout/checkout-error-user.cy.js` for role-specific behavior and `cypress/e2e/checkout/checkout.cy.js` for generic coverage; do not duplicate existing cases.
- Existing helpers cover cart entries, checkout fields, summary entries, subtotal, total, validation text, Cancel, Continue, and Finish.

### Related existing specs

- `specs/checkout-general.md` — this plan and the single contract after approval.
- `specs/login-general.md` — precondition and credential-handling context only.
- `specs/plp-general.md` — inventory/product-selection context.
- `cypress/e2e/checkout/checkout.cy.js` — generic checkout regression.
- `cypress/e2e/checkout/checkout-error-user.cy.js` — existing error-user cases to extend.

### Expected UI states

- Fresh login page before setup; authenticated Products page after successful setup.
- Empty cart with no stale badge; single-item and multi-item carts with consistent quantities/prices.
- Checkout information with empty, partial, valid, whitespace, special-character, and boundary data.
- Summary with the same item set, quantities, prices, subtotal, and total as the cart.
- Completion page with visible confirmation after valid checkout.
- Blocked transition with visible validation feedback for missing data.
- Non-responsive or blocked controls are expected only as observed error-user states and must be asserted with URL/state evidence, not assumed universal.
- Mobile approximately `390x844` with usable controls and no horizontal overflow.
