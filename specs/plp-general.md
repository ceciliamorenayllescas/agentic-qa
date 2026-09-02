# Plan de pruebas — Product Listing (PLP)

## Trazabilidad

- Feature: `plp-general` (`config/plp-feature.yaml`)
- SUT: SauceDemo, `TEST_BASE_URL` (observado: `https://www.saucedemo.com/`)
- Enfoque: black-box, usuario autenticado estándar mediante credenciales del entorno
- Área de automatización: `plp`; suites `regression`; evaluación `smoke`
- Semilla sugerida: `tests/seed.spec.ts`
- Estado: plan preliminar listo para aprobación humana

## Alcance

Se cubren acceso al listado, cantidad y presentación de productos, nombres,
precios, imágenes, acciones observables, selector de ordenamiento, consistencia
del listado, navegación y experiencia responsive.

Se excluyen login/logout, carrito, checkout, detalle de producto, agregar
productos al carrito y persistencia entre sesiones. La autenticación se usa
únicamente como precondición.

## Charter exploratorio

**Misión:** investigar la confiabilidad del listado de productos para un usuario
autenticado, enfocando la sesión en integridad visible de datos, ordenamiento,
acciones disponibles, navegación y comportamiento en viewport móvil.

**Riesgos principales:** productos omitidos o duplicados (alto), ordenamiento
incorrecto o no persistente durante la sesión (alto), precio/nombre/imagen
inconsistentes (alto), acción disponible en estado incorrecto (medio), layout o
controles inutilizables en móvil (medio), errores de navegación o recuperación
(medio).

**Heurísticas:** CRUD/state consistency, límites y valores equivalentes, repetición
de acciones, navegación atrás/adelante, contenido visible y accesibilidad.

## Observaciones de exploración

- El acceso autenticado redirige a `/inventory.html`, título `Swag Labs`, con
  encabezado `Products`.
- Se observaron seis productos, cada uno con nombre, descripción, precio,
  imagen con texto alternativo y una acción de carrito. En el estado explorado,
  algunos mostraban `Remove` y otros `Add to cart`; esto se registra como
  observación y queda fuera del alcance de modificación del carrito.
- El selector expone exactamente cuatro opciones: `Name (A to Z)`,
  `Name (Z to A)`, `Price (low to high)` y `Price (high to low)`.
- Las cuatro ordenaciones observadas produjeron secuencias coherentes con la
  etiqueta, incluyendo el empate de precio de los dos productos de `$15.99`.
- En viewport móvil de 390x844 el listado y selector continuaron visibles y el
  contenido se reordenó verticalmente; debe validarse usabilidad, no solo
  presencia.
- La exploración dejó artefactos MCP bajo `.playwright-mcp/` con snapshots y
  logs. Una llamada programática de inspección quedó colgada y fue detenida;
  se clasifica como incidencia de herramienta/entorno no atribuida al SUT.

## Supuestos y unknowns

- No hay reglas de negocio formales; los resultados esperados se basan en
  comportamiento observable y en las etiquetas de la UI.
- No se asume un número fijo de productos como regla de negocio; seis es el
  inventario observado durante esta sesión.
- No se conoce si la selección de ordenamiento debe sobrevivir a navegación,
  recarga o nueva sesión; se propone observarlo y reportar incertidumbre.
- No se confirma que el estado inicial del carrito observado sea limpio; los
  casos PLP no deben depender de su contenido.
- No se consideran enlaces de detalle ni redes sociales como parte funcional de
  esta feature, aunque sí se valida que el listado no navegue inesperadamente.

## Casos de prueba

### 1. Acceso y presentación del listado

**Tipo:** positive · **Prioridad:** High · **Riesgo:** alto

**Precondiciones:** sesión autenticada con usuario estándar del entorno; no
depender del contenido del carrito.

**Pasos:**

1. Navegar a `TEST_BASE_URL` e iniciar sesión usando las variables de entorno.
2. Observar la URL y el encabezado de la página.
3. Recorrer visualmente todos los elementos del listado.

**Resultados esperados:** se muestra el listado en `/inventory.html` con
`Products`; cada tarjeta visible presenta exactamente un nombre, descripción,
precio, imagen y acción observable; no hay tarjetas parcialmente cargadas,
duplicadas o sin contenido esencial.

### 2. Integridad de nombres, precios e imágenes

**Tipo:** validation · **Prioridad:** High · **Riesgo:** alto

**Pasos:**

1. Registrar nombre, precio y texto alternativo de cada producto visible.
2. Verificar que cada precio tenga formato monetario visible y valor no vacío.
3. Verificar que cada imagen cargue y su alternativa corresponda al nombre del
   producto.

**Resultados esperados:** los datos son legibles, no se mezclan entre tarjetas,
los precios tienen formato consistente y las imágenes son distinguibles y
accesibles. Cualquier discrepancia se registra como observación con evidencia,
no como defecto confirmado si no existe requisito explícito.

### 3. Ordenar por nombre ascendente y descendente

**Tipo:** positive · **Prioridad:** High · **Riesgo:** alto

**Pasos:**

1. Seleccionar `Name (A to Z)` y registrar la secuencia de nombres.
2. Seleccionar `Name (Z to A)` y registrar nuevamente la secuencia.
3. Comparar ambas secuencias con el orden lexicográfico visible.

**Resultados esperados:** el control refleja la opción seleccionada y las
tarjetas aparecen en el orden indicado; la secuencia descendente es la inversa
correspondiente de la ascendente, sin omisiones ni duplicados.

### 4. Ordenar por precio ascendente y descendente

**Tipo:** positive/boundary · **Prioridad:** High · **Riesgo:** alto

**Pasos:**

1. Seleccionar `Price (low to high)` y registrar todos los precios y nombres.
2. Verificar que el primer y último precio sean respectivamente el mínimo y
   máximo observados.
3. Seleccionar `Price (high to low)` y repetir la verificación.
4. Revisar el empate de productos con el mismo precio y documentar el criterio
   de desempate observado.

**Resultados esperados:** los precios son no decrecientes o no crecientes según
la opción, se conservan todos los productos y los empates no hacen desaparecer
tarjetas. El criterio de desempate se reporta como comportamiento observado,
porque no hay regla formal documentada.

### 5. Consistencia tras cambios repetidos de orden

**Tipo:** regression · **Prioridad:** Medium · **Riesgo:** alto

**Pasos:**

1. Alternar entre las cuatro opciones varias veces en un mismo listado.
2. Después de cada cambio, contar tarjetas y comparar el conjunto de nombres
   con el conjunto inicial.
3. Volver a `Name (A to Z)` y verificar que el listado sea estable.

**Resultados esperados:** cada cambio actualiza el orden sin perder ni duplicar
productos, la selección visible coincide con el estado y el listado vuelve a
su orden inicial esperado.

### 6. Acciones de producto y estado visual

**Tipo:** validation · **Prioridad:** Medium · **Riesgo:** medio

**Pasos:**

1. Verificar que cada tarjeta exponga una única acción claramente asociada al
   producto.
2. Verificar que el texto de la acción sea visible, distinguible y accionable.
3. Repetir la inspección después de aplicar cada ordenamiento.

**Resultados esperados:** no hay botones huérfanos, duplicados ni acciones
solapadas con otra tarjeta; las acciones siguen asociadas a su producto tras
ordenar. No se ejecuta agregar/quitar del carrito porque está fuera de alcance.

### 7. Navegación y recuperación dentro del listado

**Tipo:** negative/error_handling · **Prioridad:** Medium · **Riesgo:** medio

**Pasos:**

1. Aplicar un ordenamiento y usar recarga del navegador.
2. Observar si la página sigue siendo un listado utilizable y si el selector
   conserva un estado coherente.
3. Usar atrás/adelante del navegador cuando sea posible sin entrar en detalle,
   y observar URL, encabezado y tarjetas.

**Resultados esperados:** no aparece una página de error ni un estado vacío
inesperado; la URL y la pantalla corresponden al listado. Si la selección se
reinicia, se registra como comportamiento observado, no como defecto sin
requisito de persistencia.

### 8. Presentación responsive en móvil

**Tipo:** regression · **Prioridad:** Medium · **Riesgo:** medio

**Pasos:**

1. Emular viewport móvil de 390x844.
2. Verificar encabezado, selector, tarjetas, imágenes, precios y acciones.
3. Desplazarse hasta el final del listado y comprobar que no haya contenido
   inaccesible, solapamiento o scroll horizontal inesperado.
4. Cambiar el ordenamiento desde el viewport móvil.

**Resultados esperados:** los controles permanecen utilizables, las tarjetas se
presentan verticalmente sin solaparse y el ordenamiento funciona igual que en
desktop.

## Criterios de clasificación

- **Finding/observación:** comportamiento constatado sin requisito suficiente
  para afirmar incumplimiento.
- **Potential defect:** comportamiento reproducible que contradice una etiqueta,
  expectativa observable o requisito, con pasos, URL y evidencia.
- **No defecto:** comportamiento explicado por el alcance, ambiente o una
  incertidumbre documentada.

## Evidencia prevista

Guardar screenshots y traces relevantes bajo `artifacts/`, junto con URL,
mensaje visible, pasos de reproducción y resultado de Playwright. No incluir
credenciales en ningún artefacto.
