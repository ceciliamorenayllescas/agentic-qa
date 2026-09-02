# Agentic QA

Proof of concept de un sistema de QA black-box para aplicaciones web. El
proyecto usa Codex como interfaz de IA y Playwright como tecnología de
exploración y automatización. El primer sistema bajo prueba es SauceDemo.

## Objetivo

El flujo parte de una definición de feature y produce un plan revisable,
tests Cypress mantenibles y una suite ejecutable sin IA. El proceso prioriza
riesgo, casos felices, escenarios negativos, límites, validaciones, estados,
errores, evidencia y reproducibilidad.

## Arquitectura

```text
config/<feature>.yaml
        |
        v
Codex + agentic QA orchestrator
        |
        v
playwright_test_planner  -- explora el SUT y crea specs/<feature>.md
        |
        v
aprobación humana: approved / not approved
        |
        v
test cases dentro del plan aprobado
        |
        v
exploración + Automation Handoff
        |
        v
playwright_test_generator -- crea o extiende cypress/e2e/<feature>/*.cy.js
        |
        v
Cypress -- ejecución sin IA
        |
        v
playwright_test_healer -- corrige fallos cuando sea necesario
```

Los agentes oficiales de Playwright se encuentran en `.codex/agents/`:

- `playwright_test_planner.toml`
- `playwright_test_generator.toml`
- `playwright_test_healer.toml`

Las reglas generales del orquestador están en [CODEX_ORCHESTRATOR.md](CODEX_ORCHESTRATOR.md) y [AGENTS.md](AGENTS.md).

## Requisitos

- Node.js 20 o superior.
- Codex CLI autenticado.
- Playwright y sus navegadores instalados.
- Credenciales de prueba configuradas mediante variables de entorno.

Instalación inicial:

```powershell
npm install
npx playwright install
```

Variables habituales para SauceDemo:

```powershell
$env:TEST_BASE_URL = "https://www.saucedemo.com/"
$env:TEST_STANDARD_USER_USERNAME = "standard_user"
$env:TEST_STANDARD_USER_PASSWORD = "<password-seguro>"
```

También puede utilizarse un archivo `.env` local. Nunca se deben commitear
credenciales, tokens ni contraseñas.

## Ejecutar un flujo con Codex

Desde la raíz del proyecto:

```powershell
codex
```

Luego solicitar:

```text
Ejecutá el flujo QA para config/plp-feature.yaml
```

El orquestador debe leer el feature, el conocimiento del producto y los skills
relevantes. Después activa al planner para explorar SauceDemo y guardar el
plan, por ejemplo:

```text
specs/plp-general.md
```

El proceso se pausa para aprobación humana. Solo `approved` permite continuar.
Con `not approved`, el plan debe corregirse y volver a solicitar aprobación.

## Test Plan y Knowledge

El planner debe utilizar el contenido pertinente de `knowledge/`, incluyendo:

- `product.md`: descripción y comportamiento conocido del producto.
- `business-rules.md`: reglas de negocio disponibles.
- `roles.md`: usuarios, roles y permisos.
- `environments.md`: ambientes y configuración.
- `known-issues.md`: problemas conocidos y limitaciones.
- `glossary.md`: terminología del proyecto.

Cada plan debe documentar, cuando corresponda, una sección `Knowledge Used`
con los archivos consultados. El conocimiento contextualiza el análisis, pero
no permite inventar reglas que no estén documentadas u observadas.

## Automation Handoff

Al finalizar la exploración, el planner debe agregar al plan aprobado una
sección `Automation Handoff` con:

- Inventario de selectores estables y observables.
- Componente, estado y propósito de cada selector.
- POM existente a reutilizar y métodos disponibles.
- Métodos nuevos mínimos que haga falta agregar.
- Helpers existentes que deben reutilizarse.
- Specs relacionadas que deben extenderse.
- Datos de prueba y dependencias de sesión.

El generator usa este handoff para evitar una segunda exploración con Playwright
MCP. Durante Automation debe revisar primero `cypress/pages/`, `cypress/support/` y
`cypress/e2e/<feature>/`.

## POM, helpers y specs

Los Page Objects encapsulan locators y acciones de UI. Los helpers contienen
lógica genérica reutilizable. Los specs expresan intención funcional,
precondiciones y assertions, no detalles de implementación.

Antes de crear archivos nuevos, el generator debe:

1. Buscar un POM existente para la funcionalidad.
2. Buscar helpers reutilizables.
3. Buscar specs de la misma área funcional.
4. Extender lo existente cuando corresponda.
5. Crear una nueva pieza solo si la funcionalidad es realmente nueva.

La estructura esperada es:

```text
 cypress/pages/                # Page Objects por página
 cypress/support/              # commands, setup y helpers compartidos
cypress/e2e/<feature>/*.cy.js # suite Cypress por feature
cypress/pages/*.js            # page objects por página
cypress/support/*.js          # commands, setup y helpers compartidos
cypress/fixtures/             # datos de fixture
specs/<feature>.md             # plan y test cases aprobados
cypress/support/               # page objects y helpers Cypress
```

## Ejecutar tests sin Codex

Los tests generados quedan disponibles para regresión sin IA:

```powershell
npm test
npm run test:all
npm run test:regression
```

Una feature específica:

```powershell
npx cypress run --spec cypress/e2e/plp/**/*.cy.js
```

Modo visible:

```powershell
npx cypress open
```

Proyecto mobile:

```powershell
Mobile web se valida con `cy.viewport()` dentro de los escenarios Cypress.
```

## Healer

Ante un fallo, el healer debe revisar primero si el problema está en:

- Locator o selector.
- Sincronización o timing.
- Fixture o precondición.
- Datos de prueba.
- Ambiente o autenticación.
- Expectativa incorrecta del test.

Debe preservar la intención de la assertion y la evidencia de Playwright. Un
fallo no se clasifica automáticamente como defecto de producto.

## Evidencia y artefactos

Cypress puede generar screenshots y videos en `artifacts/`.
Estos archivos son generados y no deben contener secretos. La evidencia debe
referenciar URL, test, pasos, resultado y contexto suficiente para reproducir
el hallazgo.

## Regenerar agentes

Cuando se actualice Playwright, regenerar las definiciones oficiales:

```powershell
npm run qa:agents:init
```

El comando usa `--loop=codex` para mantener Codex como interfaz principal.

## Alcance y restricciones

- Testing web black-box únicamente.
- No se accede al código interno, base de datos ni APIs privadas del SUT.
- Native mobile testing está fuera de alcance; mobile web usa emulación de Playwright.
- No se crean tickets externos automáticamente.
- No se agregan agentes autónomos, bases de datos o servicios externos sin necesidad demostrada.
