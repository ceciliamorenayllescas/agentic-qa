const fs = require('fs');
const path = require('path');

function slugify(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
}

function escapeMarkdown(value) {
  return String(value || '').replace(/\r?\n/g, ' ').trim();
}

function evidenceLink(filePath, projectRoot) {
  if (!filePath) return 'Ver video/Ver imagen';
  return `[Ver evidencia](${path.relative(projectRoot, filePath).replace(/\\/g, '/')})`;
}

function createFailureReports(results, projectRoot) {
  const failedTests = (results.tests || []).filter((test) => test.state === 'failed');
  if (!failedTests.length) return [];

  const outputDirectory = path.join(projectRoot, 'artifacts', 'reports', 'test-reports');
  fs.mkdirSync(outputDirectory, { recursive: true });

  return failedTests.map((test, index) => {
    const attempt = test.attempts && test.attempts.length
      ? test.attempts[test.attempts.length - 1] : {};
    const title = test.title && test.title.length ? test.title[test.title.length - 1] : 'Caso sin titulo';
    const moduleName = test.title && test.title.length > 1 ? test.title[0] : 'General';
    const error = escapeMarkdown(attempt.error && (attempt.error.message || attempt.error));
    const screenshot = attempt.screenshots && attempt.screenshots.length
      ? attempt.screenshots[attempt.screenshots.length - 1].path : null;
    const evidence = [screenshot, results.video].filter(Boolean)
      .map((filePath) => evidenceLink(filePath, projectRoot));
    const fileName = `${slugify(path.basename(results.spec.relative, path.extname(results.spec.relative)))}-${String(index + 1).padStart(2, '0')}-${slugify(title)}.md`;
    const report = [
      `**${moduleName} - ${title}**`, '',
      `Descripcion: El caso automatizado "${title}" no pudo completar la validacion prevista en la funcionalidad ${moduleName}.`, '',
      `Comportamiento actual: La ejecucion finalizo con el error: ${error || '[Mensaje de error no disponible]'}.`, '',
      'Comportamiento esperado: La funcionalidad debe completar el flujo y cumplir las aserciones definidas en el caso de prueba.', '',
      'Datos de prueba:',
      '  - Usuario utilizado: [Completar sin exponer credenciales]',
      `  - Ambiente: ${process.env.TEST_BASE_URL || '[Completar]'}`,
      '  - Version app: [Completar]',
      `  - Ejemplos detectados: Caso de prueba "${title}"`, '',
      `Evidencia: ${evidence.length ? evidence.join(' | ') : 'Ver video/Ver imagen'}`, '',
      '## Datos tecnicos de ejecucion', '',
      `- Spec: ${results.spec.relative}`,
      `- Estado: ${test.state}`,
      '- Clasificacion inicial: UNKNOWN (requiere analisis; un fallo automatizado no confirma por si solo un defecto de aplicacion)', '',
    ].join('\n');
    const outputPath = path.join(outputDirectory, fileName);
    fs.writeFileSync(outputPath, report, 'utf8');
    return outputPath;
  });
}

module.exports = { createFailureReports };
