import { InstalledModel } from './types';

export type DetectedLanguage = 'en' | 'es' | 'fr' | 'ar' | 'unknown';

export type ResolvedModelSelection = {
  detectedLanguage: DetectedLanguage;
  modelId?: string;
  usedFallbackModel: boolean;
};

const ES_ACCENTS_PATTERN = /[áéíóúüñ¡¿]/;
const FR_ACCENTS_PATTERN = /[àâæçéèêëîïôœùûüÿ]/;
const ARABIC_SCRIPT_PATTERN = /[\u0600-\u06FF]/;

const EN_STOPWORDS = new Set([
  'the',
  'and',
  'is',
  'are',
  'of',
  'to',
  'in',
  'that',
  'for',
  'with',
  'this',
  'you',
  'it',
  'on',
  'as',
  'be',
  'at',
  'or',
  'from',
  'by',
]);

const ES_STOPWORDS = new Set([
  'el',
  'la',
  'los',
  'las',
  'de',
  'del',
  'y',
  'en',
  'que',
  'por',
  'para',
  'con',
  'una',
  'un',
  'es',
  'como',
  'se',
  'al',
  'lo',
  'más',
]);

const FR_STOPWORDS = new Set([
  'le',
  'la',
  'les',
  'de',
  'des',
  'du',
  'et',
  'en',
  'que',
  'pour',
  'avec',
  'une',
  'un',
  'est',
  'dans',
  'sur',
  'plus',
  'au',
  'aux',
  'ce',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-zA-Z\u00C0-\u017F\u0600-\u06FF]+/g)
    .filter((token) => token.length > 1);
}

function scoreStopwords(tokens: string[], vocabulary: Set<string>): number {
  let score = 0;
  for (const token of tokens) {
    if (vocabulary.has(token)) {
      score += 1;
    }
  }
  return score;
}

export function detectLanguage(text: string): DetectedLanguage {
  const trimmed = text.trim();
  if (!trimmed) {
    return 'unknown';
  }

  if (ARABIC_SCRIPT_PATTERN.test(trimmed)) {
    return 'ar';
  }

  const tokens = tokenize(trimmed);
  if (tokens.length === 0) {
    return 'unknown';
  }

  const enScore = scoreStopwords(tokens, EN_STOPWORDS);
  const esScore = scoreStopwords(tokens, ES_STOPWORDS) + (ES_ACCENTS_PATTERN.test(trimmed) ? 2 : 0);
  const frScore = scoreStopwords(tokens, FR_STOPWORDS) + (FR_ACCENTS_PATTERN.test(trimmed) ? 2 : 0);

  const maxScore = Math.max(enScore, esScore, frScore);
  if (maxScore <= 0) {
    return 'unknown';
  }

  if (esScore === maxScore && esScore > enScore && esScore >= frScore) {
    return 'es';
  }

  if (frScore === maxScore && frScore > enScore && frScore > esScore) {
    return 'fr';
  }

  return 'en';
}

function toLanguageBase(tag: string): string {
  return tag.toLowerCase().split(/[-_]/)[0] ?? '';
}

function qualityWeight(model: InstalledModel): number {
  const descriptor = `${model.modelId} ${model.displayName}`.toLowerCase();
  if (descriptor.includes('high')) {
    return 3;
  }
  if (descriptor.includes('medium')) {
    return 2;
  }
  if (descriptor.includes('low')) {
    return 1;
  }
  return 2;
}

function chooseBestModel(candidates: InstalledModel[]): InstalledModel | undefined {
  if (candidates.length === 0) {
    return undefined;
  }

  const sorted = [...candidates].sort((left, right) => {
    const qualityDelta = qualityWeight(right) - qualityWeight(left);
    if (qualityDelta !== 0) {
      return qualityDelta;
    }

    return right.installedAt.localeCompare(left.installedAt);
  });

  return sorted[0];
}

export function resolveModelForText(params: {
  text: string;
  installedModels: InstalledModel[];
  preferredModelId?: string;
}): ResolvedModelSelection {
  const detectedLanguage = detectLanguage(params.text);
  const preferredModel = params.preferredModelId
    ? params.installedModels.find((model) => model.modelId === params.preferredModelId)
    : undefined;

  if (params.installedModels.length === 0) {
    return {
      detectedLanguage,
      modelId: undefined,
      usedFallbackModel: false,
    };
  }

  if (detectedLanguage === 'unknown') {
    return {
      detectedLanguage,
      modelId: preferredModel?.modelId ?? chooseBestModel(params.installedModels)?.modelId,
      usedFallbackModel: true,
    };
  }

  const matchingLanguage = params.installedModels.filter(
    (model) => toLanguageBase(model.language) === detectedLanguage
  );

  if (preferredModel && matchingLanguage.some((model) => model.modelId === preferredModel.modelId)) {
    return {
      detectedLanguage,
      modelId: preferredModel.modelId,
      usedFallbackModel: false,
    };
  }

  const bestMatch = chooseBestModel(matchingLanguage);
  if (bestMatch) {
    return {
      detectedLanguage,
      modelId: bestMatch.modelId,
      usedFallbackModel: false,
    };
  }

  return {
    detectedLanguage,
    modelId: preferredModel?.modelId ?? chooseBestModel(params.installedModels)?.modelId,
    usedFallbackModel: true,
  };
}
