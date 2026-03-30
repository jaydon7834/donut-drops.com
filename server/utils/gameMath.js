export const HOUSE_EDGE = 0.96;
const PLINKO_TARGET_RTP = 0.9;
const PLINKO_RISK_CONFIG = {
  low: {
    centerBase: 0.42,
    centerRowPenalty: 0.01,
    edgeBase: 4.6,
    edgeGrowth: 1.16,
    spreadPower: 1.7
  },
  medium: {
    centerBase: 0.14,
    centerRowPenalty: 0.008,
    edgeBase: 16,
    edgeGrowth: 1.34,
    spreadPower: 2.15
  },
  high: {
    centerBase: 0.02,
    centerRowPenalty: 0.0015,
    edgeBase: 80,
    edgeGrowth: 1.55,
    spreadPower: 3.1
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
  return PLINKO_RISK_CONFIG[normalizedRisk] ? normalizedRisk : "medium";
}

export function getPlinkoMultipliers(rows, risk = "medium") {
  const normalizedRisk = resolveRisk(risk);
  const config = PLINKO_RISK_CONFIG[normalizedRisk];
  const centerIndex = rows / 2;
  const centerValue = Math.max(0.03, config.centerBase - (rows - 8) * config.centerRowPenalty);
  const edgeTarget = config.edgeBase * Math.pow(config.edgeGrowth, rows - 8);
  const raw = Array.from({ length: rows + 1 }, (_, index) => {
    const distance = Math.abs(index - centerIndex);
    const normalizedDistance = centerIndex === 0 ? 0 : distance / centerIndex;
    const curvedDistance = Math.pow(normalizedDistance, config.spreadPower);
    return centerValue + (edgeTarget - centerValue) * curvedDistance;
  });
  const probabilities = Array.from({ length: rows + 1 }, (_, index) => combination(rows, index) / 2 ** rows);
  const rawRtp = raw.reduce((sum, multiplier, index) => sum + multiplier * probabilities[index], 0);
  const scale = PLINKO_TARGET_RTP / rawRtp;

  return raw.map((value) => roundTo(value * scale, 2));
}
