export const HOUSE_EDGE = 0.96;

export const PLINKO_RISK_TABLES = {
  low: [2, 1.5, 1.2, 1.1, 1.05, 1.02, 1, 1.02, 1.05, 1.1, 1.2, 1.5, 2],
  medium: [5, 3, 2, 1.5, 1.2, 0.8, 0.5, 0.8, 1.2, 1.5, 2, 3, 5],
  high: [33, 11, 4, 2, 1.2, 0.5, 0.2, 0.5, 1.2, 2, 4, 11, 33]
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
  return PLINKO_RISK_TABLES[normalizedRisk] ? normalizedRisk : "medium";
}

function interpolateValue(source, position) {
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);

  if (lowerIndex === upperIndex) {
    return source[lowerIndex];
  }

  const weight = position - lowerIndex;
  return source[lowerIndex] * (1 - weight) + source[upperIndex] * weight;
}

export function getPlinkoMultipliers(rows, risk = "medium") {
  const source = PLINKO_RISK_TABLES[resolveRisk(risk)].map((value) =>
    applyHouseEdge(value, 2)
  );
  const bucketCount = rows + 1;

  if (bucketCount === source.length) {
    return source;
  }

  return Array.from({ length: bucketCount }, (_, index) => {
    const position = (index / (bucketCount - 1)) * (source.length - 1);
    return roundTo(interpolateValue(source, position), 2);
  });
}
