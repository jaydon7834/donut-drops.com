export const HOUSE_EDGE = 0.96;
const PLINKO_TEMPLATES = {
  low: {
    8: [4, 2, 1.4, 1.1, 0.9, 1.1, 1.4, 2, 4],
    12: [5.6, 2.8, 1.9, 1.3, 1.1, 1, 0.8, 1, 1.1, 1.3, 1.9, 2.8, 5.6],
    16: [9, 4.5, 2.4, 1.7, 1.3, 1.1, 1, 0.9, 0.7, 0.9, 1, 1.1, 1.3, 1.7, 2.4, 4.5, 9]
  },
  medium: {
    8: [8, 3, 1.5, 0.6, 0.4, 0.6, 1.5, 3, 8],
    12: [12, 8.28, 5.04, 2.67, 1.11, 0.29, 0.07, 0.29, 1.11, 2.67, 5.04, 8.28, 12],
    16: [24, 13, 6.2, 3.2, 1.8, 1, 0.5, 0.3, 0.2, 0.3, 0.5, 1, 1.8, 3.2, 6.2, 13, 24]
  },
  high: {
    8: [40, 8, 3, 0.5, 0.2, 0.5, 3, 8, 40],
    12: [33, 11, 4, 2, 1.2, 0.5, 0.2, 0.5, 1.2, 2, 4, 11, 33],
    16: [1000, 130, 26, 9, 4, 2, 0.5, 0.2, 0.08, 0.2, 0.5, 2, 4, 9, 26, 130, 1000]
  }
};

export function roundTo(value, digits = 2) {
  return Number(value.toFixed(digits));
}

export function applyHouseEdge(multiplier, digits = 4) {
  return roundTo(multiplier * HOUSE_EDGE, digits);
}

export function combination(n, k) {
  if (k > n) {
    return 0;
  }

  if (k === 0 || k === n) {
    return 1;
  }

  let result = 1;

  for (let i = 1; i <= k; i += 1) {
    result = (result * (n - (k - i))) / i;
  }

  return result;
}

export function calculateMinesMultiplier(mines, picks) {
  const fairMultiplier = combination(25, picks) / combination(25 - mines, picks);
  return applyHouseEdge(fairMultiplier, 4);
}

export function calculateDiceMultiplier(target, over) {
  const winChance = (over ? 100 - target : target) / 100;
  return applyHouseEdge(1 / winChance, 2);
}

export function calculateLimboResultFromHash(hash) {
  const int = parseInt(hash.substring(0, 13), 16);
  const max = 2 ** 52;

  if (int >= max - 1) {
    return 1;
  }

  const fairMultiplier = Math.floor((100 * max) / (max - int)) / 100;
  return Math.max(1, applyHouseEdge(fairMultiplier, 2));
}

export function calculateChickenMultiplier(step, surviveChance) {
  const fairMultiplier = Math.pow(1 / surviveChance, step);
  return Math.min(applyHouseEdge(fairMultiplier, 2), 100);
}

export function resolveRisk(risk) {
  const normalizedRisk = String(risk || "medium").trim().toLowerCase();
  return PLINKO_TEMPLATES[normalizedRisk] ? normalizedRisk : "medium";
}

function sampleInterpolated(values, position) {
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);

  if (lowerIndex === upperIndex) {
    return values[lowerIndex];
  }

  const ratio = position - lowerIndex;
  return values[lowerIndex] + (values[upperIndex] - values[lowerIndex]) * ratio;
}

function buildSymmetricFromHalf(edgeToCenter) {
  const mirrored = edgeToCenter.slice(0, -1).reverse();
  return [...edgeToCenter, ...mirrored];
}

function resampleTemplate(template, rows) {
  const half = template.slice(0, Math.floor(template.length / 2) + 1);
  const targetHalfLength = Math.floor((rows + 1) / 2) + 1;
  const nextHalf = Array.from({ length: targetHalfLength }, (_, index) => {
    const position = targetHalfLength === 1 ? 0 : (index / (targetHalfLength - 1)) * (half.length - 1);
    return sampleInterpolated(half, position);
  });

  return buildSymmetricFromHalf(nextHalf);
}

function interpolateTemplate(rows, risk) {
  const templates = PLINKO_TEMPLATES[risk];
  const keys = Object.keys(templates)
    .map(Number)
    .sort((a, b) => a - b);

  if (templates[rows]) {
    return templates[rows];
  }

  let lower = keys[0];
  let upper = keys[keys.length - 1];

  for (let index = 0; index < keys.length - 1; index += 1) {
    if (rows > keys[index] && rows < keys[index + 1]) {
      lower = keys[index];
      upper = keys[index + 1];
      break;
    }
  }

  const ratio = (rows - lower) / (upper - lower);
  const lowerTemplate = resampleTemplate(templates[lower], rows);
  const upperTemplate = resampleTemplate(templates[upper], rows);

  return lowerTemplate.map((value, index) =>
    roundTo(value + (upperTemplate[index] - value) * ratio, 2)
  );
}

export function getPlinkoMultipliers(rows, risk = "medium") {
  const normalizedRisk = resolveRisk(risk);
  return interpolateTemplate(rows, normalizedRisk);
}
