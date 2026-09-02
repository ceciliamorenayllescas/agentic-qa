# Plan de pruebas — Navegación al detalle de producto

## Trazabilidad

- Feature: `product-details-navigation` (`config/product-details-navigation-feature.yaml`)
- Archivo solicitado: el nombre recibido fue `product-detail-navigation-feature.yaml`; el archivo disponible usa `details` en plural.
- SUT: SauceDemo, `TEST_BASE_URL`
- Enfoque: black-box; usuario estándar autenticado mediante variables de entorno
- Automatización: `product-details-navigation`, suite regression; candidato smoke
- Estado: listo para aprobación humana

## Alcance y riesgos

Se cubre el acceso al detalle desde nombre e imagen del producto, consistencia de nombre y precio, regreso al listado, disponibilidad del listado y uso en viewport móvil. Se excluyen agregar al carrito, checkout, sorting, logout y comparación entre productos.

Riesgos principales: navegación al detalle inaccesible (alto); mostrar un producto distinto al seleccionado (alto); pérdida de acceso al listado al regresar (medio); controles inutilizables en móvil (medio).

No hay reglas de negocio formales. Los resultados esperados se basan en la descripción de la funcionalidad y en estados visibles; cualquier regla no documentada se marcará como incertidumbre.

## Charter exploratorio

**Misión:** investigar la transición listado → detalle → listado, verificando que el producto seleccionado y sus datos principales se conserven y que la navegación sea recuperable.

**Heurísticas:** consistencia de estado, navegación por distintos controles, back/reload, enlaces con teclado, errores visibles y responsive web.

## Observaciones de exploración

1. La autenticación con `standard_user` llegó correctamente a `/inventory.html`.
2. El listado mostró 6 productos, con nombres, precios y controles visibles.
3. El nombre y la imagen de `Sauce Labs Backpack` aparecieron como enlaces visibles.
4. Activar el enlace del nombre y luego el de la imagen no cambió la URL, que permaneció en `/inventory.html`, ni mostró una pantalla de detalle.
5. Esto es una **observación reproducible / potencial defecto / needs investigation**. No se confirma como defecto porque no existe una regla formal que detalle la implementación esperada del enlace y el entorno público puede estar presentando un comportamiento transitorio.

**Evidencia:** `artifacts/product-detail-navigation-inventory.png`; snapshots MCP bajo `.playwright-mcp/`, incluyendo los generados durante esta exploración; URL observada después de ambas activaciones: `https://www.saucedemo.com/inventory.html`.

## Casos de prueba

### TC-01 — Acceder al detalle desde el nombre del producto

**Tipo/Prioridad:** positive/regression / High

**Precondiciones:** sesión autenticada; listado disponible.

1. Identificar un producto por su nombre visible.
2. Activar su nombre.
3. Verificar URL, encabezado, nombre y precio del detalle.

**Resultado esperado:** se abre el detalle del producto seleccionado y sus datos principales coinciden con los observados en el listado. Si no se navega, conservar el resultado como fallo reproducible del flujo.

### TC-02 — Acceder al detalle desde la imagen

**Tipo/Prioridad:** positive/regression / High

1. Seleccionar otro producto del listado.
2. Activar su imagen.
3. Verificar que el detalle corresponde al producto seleccionado.

**Resultado esperado:** la imagen conduce al detalle correcto y el nombre/precio son consistentes.

### TC-03 — Regresar al listado desde el detalle

**Tipo/Prioridad:** positive/error_handling / Medium

1. Abrir un detalle por cualquiera de los controles disponibles.
2. Usar el control visible para regresar al listado.
3. Verificar URL, encabezado y disponibilidad de los 6 productos.

**Resultado esperado:** se vuelve al listado sin perder la sesión ni la disponibilidad del conjunto de productos. Si no se alcanza el detalle, registrar el caso como no ejecutable por el bloqueo previo.

### TC-04 — Recuperación con atrás, adelante y recarga

**Tipo/Prioridad:** error_handling/regression / Medium

1. Navegar del listado al detalle.
2. Usar atrás, adelante y recarga en estados separados.
3. Observar URL, contenido visible y posibilidad de continuar navegando.

**Resultado esperado:** los estados son coherentes; no aparece una pantalla vacía, un producto diferente ni una salida no autenticada.

### TC-05 — Navegación en viewport móvil

**Tipo/Prioridad:** regression / Medium

1. Emular viewport de 390×844.
2. Abrir el detalle desde nombre e imagen.
3. Verificar contenido y regreso al listado.

**Resultado esperado:** los controles son visibles y utilizables, sin solapamientos ni scroll horizontal, conservando la consistencia del detalle.

## Criterios de clasificación

- **Observación:** comportamiento visible sin contradicción suficiente con un requisito.
- **Potential defect:** comportamiento reproducible que contradice la descripción de la funcionalidad.
- **Confirmed defect:** sólo con expectativa formal o evidencia adicional suficiente.
- **Needs investigation:** comportamiento bloqueado por incertidumbre, ambiente o cobertura incompleta.

## Automation Handoff

### Selector inventory

- Login precondition: `[data-test="username"]`, `[data-test="password"]`, `[data-test="login-button"]`.
- Inventory: `[data-test="inventory-list"]`, `[data-test="inventory-item"]`, `[data-test="inventory-item-name"]`, `[data-test="inventory-item-price"]`, product title links such as `[data-test="item-4-title-link"]`, product image links such as `[data-test="item-4-img-link"]`.
- Detail: `[data-test="inventory-item"]`, `[data-test="inventory-item-name"]`, `[data-test="inventory-item-price"]`, `[data-test="back-to-products"]` when exposed.
- URLs: `/inventory.html`, `/inventory-item.html?id=<id>` (to validate if reachable).

### POM/helper reuse map

- Reuse `cypress/support/authentication.js` and `cypress/pages/LoginPage.js` for authentication.
- Extend `cypress/pages/InventoryPage.js` with detail-entry methods and `cypress/pages/ProductDetailsPage.js` with detail assertions/navigation.
- Reuse `cypress/support/data.js` only for non-secret product expectations when needed.
- Related spec: `cypress/e2e/plp/product-listing.cy.js`; do not duplicate listing/sorting coverage. Add a dedicated spec under `cypress/e2e/product-details-navigation/` because product detail navigation is a separate functional area.

### Expected UI states

Authenticated inventory list; product detail with selected name and price; return-to-products control; restored inventory list; mobile equivalents; blocked navigation state observed during exploration.

## Approval gate

Reply exactly `approved` or `not approved`.

## Resultados de automatización

Se ejecutó `cypress/e2e/product-details-navigation/product-details-navigation.cy.js` con Cypress 15.2.0 en Electron headless.

- Casos ejecutados: 4
- Passed: 4
- Failed: 0
- Skipped: 0
- Video: `artifacts/cypress/videos/product-details-navigation.cy.js.mp4`

### Análisis de la observación exploratoria

La observación inicial de enlaces sin navegación no se reprodujo en Cypress: los accesos por nombre e imagen navegaron correctamente a detalle, conservaron nombre/precio y permitieron regresar al listado. Se reclasifica como **needs investigation / no reproducida**, no como defecto confirmado. La captura exploratoria queda como evidencia del estado observado en esa sesión y debe conservarse para comparar si vuelve a ocurrir.
