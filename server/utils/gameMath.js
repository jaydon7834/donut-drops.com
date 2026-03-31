export const BASE_HOUSE_EDGE = 0.8;
const PLINKO_TEMPLATES = {
  low: {
    8: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    9: [5.6, 2, 1.6, 1, 0.7, 0.4, 0.7, 1, 1.6, 2, 5.6],
    10: [8.9, 3, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 3, 8.9],
    11: [8.4, 3, 1.9, 1.3, 1, 0.7, 0.7, 1, 1.3, 1.9, 3, 8.4],
    12: [8.4, 3, 1.9, 1.3, 1, 0.7, 0.4, 0.7, 1, 1.3, 1.9, 3, 8.4],
    13: [9, 4, 2, 1.4, 1.1, 0.8, 0.4, 0.4, 0.8, 1.1, 1.4, 2, 4, 9],
    14: [9, 4, 2.2, 1.4, 1.2, 1, 0.7, 0.4, 0.7, 1, 1.2, 1.4, 2.2, 4, 9],
    15: [10, 5, 2.5, 1.6, 1.3, 1.1, 0.8, 0.4, 0.8, 1.1, 1.3, 1.6, 2.5, 5, 10],
    16: [10, 5, 2.6, 1.7, 1.3, 1.1, 1, 0.7, 0.4, 0.7, 1, 1.1, 1.3, 1.7, 2.6, 5, 10]
  },
  medium: {
    8: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    9: [16, 5, 2, 1.1, 0.5, 0.3, 0.5, 1.1, 2, 5, 16],
    10: [20, 6, 2.6, 1.4, 0.6, 0.3, 0.6, 1.4, 2.6, 6, 20],
    11: [24, 8, 3.5, 1.7, 0.9, 0.4, 0.4, 0.9, 1.7, 3.5, 8, 24],
    12: [12, 8.28, 5.04, 2.67, 1.11, 0.29, 0.07, 0.29, 1.11, 2.67, 5.04, 8.28, 12],
    13: [16, 9, 5, 2.5, 1.3, 0.5, 0.09, 0.09, 0.5, 1.3, 2.5, 5, 9, 16],
    14: [24, 13, 6.5, 3.5, 1.8, 0.7, 0.2, 0.2, 0.7, 1.8, 3.5, 6.5, 13, 24],
    15: [30, 16, 7.6, 3.9, 2, 0.9, 0.3, 0.15, 0.3, 0.9, 2, 3.9, 7.6, 16, 30],
    16: [24, 13, 6.2, 3.2, 1.8, 1, 0.5, 0.3, 0.2, 0.3, 0.5, 1, 1.8, 3.2, 6.2, 13, 24]
  },
  high: {
    8: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
    9: [43, 7, 2, 0.6, 0.2, 0.1, 0.2, 0.6, 2, 7, 43],
    10: [76, 10, 3, 0.9, 0.3, 0.1, 0.3, 0.9, 3, 10, 76],
    11: [120, 14, 5.2, 1.4, 0.4, 0.15, 0.15, 0.4, 1.4, 5.2, 14, 120],
    12: [33, 11, 4, 2, 1.2, 0.5, 0.2, 0.5, 1.2, 2, 4, 11, 33],
    13: [63, 22, 6.5, 2.4, 1.1, 0.4, 0.12, 0.12, 0.4, 1.1, 2.4, 6.5, 22, 63],
    14: [120, 36, 10, 3.7, 1.3, 0.4, 0.13, 0.13, 0.4, 1.3, 3.7, 10, 36, 120],
    15: [300, 54, 15, 4.8, 1.6, 0.5, 0.14, 0.05, 0.14, 0.5, 1.6, 4.8, 15, 54, 300],
    16: [1000, 130, 26, 9, 4, 2, 0.5, 0.2, 0.08, 0.2, 0.5, 2, 4, 9, 26, 130, 1000]
  }
};

export function roundTo(value, digits = 2) {
  return Number(value.toFixed(digits));
}

export function getHouseEdgeFactor(bet = 1_000) {
  const normalizedBet = Number(bet) || 1_000;

  if (normalizedBet >= 100_000_000) {
    return 0.6;
  }

  if (normalizedBet >= 10_000_000) {
    return 0.65;
  }

  if (normalizedBet >= 1_000_000) {
    return 0.7;
  }

  if (normalizedBet >= 100_000) {
    return 0.75;
  }

  return BASE_HOUSE_EDGE;
}

export function applyHouseEdge(multiplier, digits = 4, bet = 1_000) {
  return roundTo(multiplier * getHouseEdgeFactor(bet), digits);
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

export function calculateMinesMultiplier(mines, picks, bet) {
  const fairMultiplier = combination(25, picks) / combination(25 - mines, picks);
  return applyHouseEdge(fairMultiplier, 4, bet);
}

export function calculateDiceMultiplier(target, over, bet) {
  const winChance = (over ? 100 - target : target) / 100;
  return applyHouseEdge(1 / winChance, 2, bet);
}

export function calculateLimboResultFromHash(hash, bet) {
  const int = parseInt(hash.substring(0, 13), 16);
  const max = 2 ** 52;

  if (int >= max - 1) {
    return 1;
  }

  const fairMultiplier = Math.floor((100 * max) / (max - int)) / 100;
  return Math.max(1, applyHouseEdge(fairMultiplier, 2, bet));
}

export function calculateChickenMultiplier(step, surviveChance, bet) {
  const fairMultiplier = Math.pow(1 / surviveChance, step);
  return Math.min(applyHouseEdge(fairMultiplier, 2, bet), 100);
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

  return resampleTemplate(templates[rows < lower ? lower : upper], rows);
}

export function getPlinkoMultipliers(rows, risk = "medium", bet = 1_000) {
  const normalizedRisk = resolveRisk(risk);
  return interpolateTemplate(rows, normalizedRisk).map((value) =>
    roundTo(value * getHouseEdgeFactor(bet), 2)
  );
}
