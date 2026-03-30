export const HOUSE_EDGE = 0.96;
const PLINKO_TARGET_RTP = 0.9;
const PLINKO_RISK_ANCHORS = {
  low: {
    8: { center: 0.7, edge: 4.2, power: 1.45 },
    12: { center: 0.55, edge: 6.2, power: 1.65 },
    16: { center: 0.42, edge: 9.8, power: 1.9 }
  },
  medium: {
    8: { center: 0.24, edge: 10, power: 1.9 },
    12: { center: 0.11, edge: 20, power: 2.25 },
    16: { center: 0.05, edge: 42, power: 2.55 }
  },
  high: {
    8: { center: 0.08, edge: 40, power: 2.6 },
    12: { center: 0.025, edge: 200, power: 3.15 },
    16: { center: 0.008, edge: 1000, power: 3.7 }
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
  return PLINKO_RISK_ANCHORS[normalizedRisk] ? normalizedRisk : "medium";
}

function interpolateAnchor(rows, risk) {
  const anchors = PLINKO_RISK_ANCHORS[risk];
  const keys = Object.keys(anchors)
    .map(Number)
    .sort((a, b) => a - b);

  if (anchors[rows]) {
    return anchors[rows];
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
  const lowerAnchor = anchors[lower];
  const upperAnchor = anchors[upper];

  return {
    center: lowerAnchor.center + (upperAnchor.center - lowerAnchor.center) * ratio,
    edge: lowerAnchor.edge + (upperAnchor.edge - lowerAnchor.edge) * ratio,
    power: lowerAnchor.power + (upperAnchor.power - lowerAnchor.power) * ratio
  };
}

export function getPlinkoMultipliers(rows, risk = "medium") {
  const normalizedRisk = resolveRisk(risk);
  const config = interpolateAnchor(rows, normalizedRisk);
  const centerIndex = rows / 2;
  const raw = Array.from({ length: rows + 1 }, (_, index) => {
    const distance = Math.abs(index - centerIndex);
    const normalizedDistance = centerIndex === 0 ? 0 : distance / centerIndex;
    const curvedDistance = Math.pow(normalizedDistance, config.power);
    return config.center + (config.edge - config.center) * curvedDistance;
  });
  const probabilities = Array.from({ length: rows + 1 }, (_, index) => combination(rows, index) / 2 ** rows);
  const rawRtp = raw.reduce((sum, multiplier, index) => sum + multiplier * probabilities[index], 0);
  const scale = PLINKO_TARGET_RTP / rawRtp;

  return raw.map((value) => roundTo(value * scale, 2));
}
