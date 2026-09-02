# Plan de pruebas — Checkout

## Trazabilidad

- Feature: `checkout-general` (`config/checkout-feature.yaml`)
- SUT: SauceDemo, `TEST_BASE_URL` (observado: `https://www.saucedemo.com/`)
- Enfoque: black-box; usuario estándar autenticado mediante variables del entorno
- Área de automatización: `checkout`; suites `regression`; evaluación `smoke`
- Estado: plan listo para aprobación humana

## Alcance

Se cubre el flujo desde el carrito hasta la confirmación de compra, selección de
uno o varios productos, consistencia de nombres/precios/cantidades, formulario
de información personal, carrito vacío y comportamiento responsive.

Se excluyen login/logout, detalle de producto y persistencia del carrito entre
sesiones. La autenticación es únicamente una precondición.

## Charter exploratorio

**Misión:** investigar la confiabilidad del checkout enfocando la sesión en
transiciones de estado, integridad del carrito, validaciones del formulario,
recuperación ante errores y uso en móvil.

**Riesgos:** transición carrito→checkout bloqueada (crítico), pedido confirmado
con productos/precios incorrectos (alto), confirmación sin datos obligatorios
(alto), checkout de carrito vacío (alto), pérdida o duplicación de productos
(alto), layout inutilizable en móvil (medio).

**Heurísticas:** state consistency, límites y valores vacíos, repetición de
acciones, navegación atrás/adelante, validación visible y accesibilidad.

## Observaciones de exploración

- La sesión estándar llegó a `/inventory.html` y el carrito mostró `2` con
  `Sauce Labs Bike Light` y `Sauce Labs Backpack`, cada uno con cantidad `1`.
- En `/cart.html`, el botón visible `Checkout` tenía `data-test="checkout"`,
  pero dos intentos de activarlo no produjeron navegación ni mensaje visible.
- En `/checkout-step-one.html`, el formulario expuso `First Name`, `Last Name`
  y `Zip/Postal Code`. Con formulario vacío, `Continue` mantuvo la URL y no se
  observó `[data-test="error"]`; con datos `Ada`, `Lovelace`, `10001` tampoco
  avanzó. Esto es un `potential_defect` por confirmar, no un defecto confirmado.
- No se observó un control UI para modificar la cantidad de una línea; la
  cantidad visible por producto fue `1`. La exigencia de distintas cantidades
  queda como incertidumbre y candidata a investigación, sin inventar una regla.
- Evidencia de exploración: snapshots y log MCP bajo `.playwright-mcp/`, en
  particular `page-2026-09-02T03-06-11-006Z.yml` y `page-2026-09-02T03-05-58-308Z.yml`.

## Supuestos y unknowns

- No existen reglas de negocio formales; los resultados esperados se basan en
  requisitos de la feature y estados observables.
- No se asume cantidad fija de productos ni un criterio de desempate no visible.
- Debe determinarse durante la ejecución si el carrito permite cantidades
  mayores que uno y cómo se refleja el total.
- El estado inicial del carrito debe limpiarse por UI dentro de cada caso; no se
  debe depender del estado compartido de otra prueba.

## Casos de prueba

### 1. Completar checkout con un producto

**Tipo:** positive/regression · **Prioridad:** Critical

**Precondiciones:** sesión autenticada; carrito limpio.

**Pasos:**

1. Agregar un único producto desde el inventario y abrir el carrito.
2. Verificar nombre, precio y cantidad `1`.
3. Seleccionar `Checkout`.
4. Completar nombre, apellido y código postal válidos.
5. Seleccionar `Continue`, revisar el resumen y seleccionar `Finish`.

**Resultado esperado:** se llega al resumen conservando el producto y sus
datos; el total es coherente con el precio observado; `Finish` muestra una
confirmación visible de orden completada.

### 2. Checkout con múltiples productos y consistencia

**Tipo:** positive/validation · **Prioridad:** High

**Precondiciones:** sesión autenticada; carrito limpio.

**Pasos:**

1. Agregar al menos tres productos distintos.
2. Comparar el conjunto y orden de nombres/precios entre inventario y carrito.
3. Completar checkout con datos válidos y comparar nuevamente el resumen.
4. Finalizar la compra.

**Resultado esperado:** no hay omisiones, duplicados ni mezclas de precio;
las cantidades y el total permanecen coherentes en cada transición.

### 3. Validar campos obligatorios vacíos

**Tipo:** negative/validation · **Prioridad:** High

**Precondiciones:** carrito con un producto; pantalla de información de checkout.

**Pasos:**

1. Dejar los tres campos vacíos y seleccionar `Continue`.
2. Repetir dejando vacío cada campo individualmente.
3. Observar URL, foco, mensaje visible y contenido ingresado.

**Resultado esperado:** el avance se bloquea y se informa claramente el primer
campo requerido; no se pierde el carrito ni se llega al resumen.

### 4. Validar datos nulos, espacios y caracteres especiales

**Tipo:** negative/boundary/validation · **Prioridad:** Medium

**Pasos:**

1. Probar valores compuestos sólo por espacios en cada campo requerido.
2. Probar nombres con guion, apóstrofe y caracteres Unicode válidos.
3. Probar código postal alfanumérico, muy corto y muy largo.
4. Intentar continuar y registrar mensajes y estado.

**Resultado esperado:** se aceptan o rechazan valores de forma consistente con
la validación observable; cualquier regla no documentada se reporta como
comportamiento observado/uncertainty, no como defecto confirmado.

### 5. Checkout sin productos

**Tipo:** negative/error_handling · **Prioridad:** High

**Precondiciones:** carrito vacío obtenido mediante acciones de UI.

**Pasos:**

1. Abrir el carrito vacío.
2. Observar si `Checkout` está disponible y activarlo si lo está.
3. Intentar completar el flujo sólo si la aplicación lo permite.

**Resultado esperado:** la aplicación evita una orden sin productos o muestra
un estado/mensaje coherente; no debe confirmarse una compra vacía.

### 6. Cantidades y límites de unidades

**Tipo:** boundary/validation · **Prioridad:** Medium

**Pasos:**

1. Investigar el control observable para aumentar una cantidad.
2. Probar cantidad mínima, repetición de incremento y eventual máximo
observable, si existe.
3. Verificar carrito, resumen y total para cada estado.

**Resultado esperado:** sólo se permiten cantidades expuestas por la UI y el
total coincide con precio × cantidad. Si no existe control de cantidad, registrar
la limitación y no simular una interfaz inexistente.

### 7. Navegación y recuperación del checkout

**Tipo:** error_handling/regression · **Prioridad:** Medium

**Pasos:**

1. Desde cada paso, usar `Cancel`, atrás y adelante del navegador cuando sea
posible.
2. Recargar antes de continuar y observar la conservación del estado.
3. Reintentar la transición bloqueada una vez recuperado el estado.

**Resultado esperado:** no se confirma una orden accidentalmente; la URL,
productos y formulario quedan en estados coherentes o se informa una salida
segura y observable.

### 8. Checkout en viewport móvil

**Tipo:** regression · **Prioridad:** Medium

**Pasos:**

1. Emular Chromium móvil de 390x844.
2. Ejecutar un checkout de un producto.
3. Verificar campos, botones, resumen, mensajes y confirmación sin scroll
horizontal ni solapamientos.

**Resultado esperado:** el flujo es utilizable y conserva las mismas reglas y
datos observables que en desktop.

## Criterios de clasificación

- **Finding/observación:** comportamiento constatado sin requisito suficiente.
- **Potential defect:** comportamiento reproducible que contradice una
  expectativa explícita/observable y tiene pasos y evidencia.
- **No defecto:** comportamiento explicado por alcance, ambiente o incertidumbre.

## Automation Handoff

### Selector inventory

- Login precondición: `getByPlaceholder('Username')`,
  `getByPlaceholder('Password')`, `getByRole('button', { name: 'Login' })`.
- Inventario: `getByRole('button', { name: 'Add to cart' })`, botones `Remove`,
  y contenedores `[data-test="inventory-item"]`.
- Cart: `getByRole('button', { name: 'Checkout' })`,
  `getByRole('button', { name: 'Continue Shopping' })`,
  `[data-test="inventory-item-name"]`, `[data-test="inventory-item-price"]`.
- Checkout: `getByPlaceholder('First Name')`, `getByPlaceholder('Last Name')`,
  `getByPlaceholder('Zip/Postal Code')`, botones `Continue`, `Cancel`, `Finish`,
  `[data-test="error"]`, `[data-test="complete-header"]`.
- Navegación: URLs observadas `/inventory.html`, `/cart.html`,
  `/checkout-step-one.html` y confirmación `/checkout-complete.html` (por validar).

### POM/helper reuse map

- Reusar `helpers/authentication.ts` para login sin credenciales hardcodeadas.
- Reusar `pages/CartPage.ts` para limpiar, obtener snapshots y comenzar checkout.
- Reusar y extender `pages/CheckoutPage.ts` para información, mensajes,
  resumen y confirmación; mantener locators encapsulados allí.
- Reusar `helpers/test-data.ts` para datos válidos; agregar variantes sólo si
  un caso aprobado las necesita.

### Related existing specs

- `specs/plp-general.md`: usar inventario y selección de productos como
  precondición; no duplicar casos de ordenamiento del PLP.
- `tests/seed.spec.ts`: semilla sugerida por el plan existente, si continúa
  disponible.

### Expected UI states

1. Inventario autenticado con carrito limpio o productos elegidos.
2. Carrito con cero, uno o varios ítems, cantidades visibles.
3. Formulario de información vacío, parcialmente válido o válido.
4. Resumen con ítems, cantidades, precios, subtotal, impuestos y total visibles
   si la aplicación los expone.
5. Confirmación de orden completada.

## Evidencia prevista

Conservar screenshots/traces de fallos bajo `artifacts/`, junto con URL,
mensaje visible, pasos y resultado de Playwright. No incluir credenciales.
