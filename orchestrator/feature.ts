import { basename } from 'node:path';

/**
 * Returns the stable artifact key for a feature file.
 *
 * The replacement of backslashes is intentional: feature paths can be
 * supplied from a different platform (for example in a shared CI command).
 * `feature.yaml` is retained as the legacy Add To Cart input name.
 */
export function getFeatureName(featurePath: string): string {
  const normalizedPath = featurePath.replace(/\\/g, '/');
  const fileName = basename(normalizedPath);
  const withoutExtension = fileName.replace(/\.(ya?ml)$/i, '');
  const withoutFeatureSuffix = withoutExtension.replace(/-feature$/i, '');

  if (withoutFeatureSuffix.toLowerCase() === 'feature') {
    return 'add-product-to-cart';
  }

  if (!withoutFeatureSuffix) {
    throw new Error(`Cannot derive a feature name from path: ${featurePath}`);
  }

  return withoutFeatureSuffix;
}

export function featureArtifactPath(
  featureName: string,
  suffix: string,
): string {
  return `${featureName}${suffix}`;
}

