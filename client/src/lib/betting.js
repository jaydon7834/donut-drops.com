const multipliers = {
  k: 1_000,
  m: 1_000_000,
  b: 1_000_000_000
};

export function parseBetInput(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const normalized = String(value || "").trim().toLowerCase().replace(/,/g, "");
  const match = normalized.match(/^(\d+(?:\.\d+)?)([kmb])?$/);

  if (!match) {
    return Number(normalized) || 0;
  }

  const amount = Number(match[1]);
  const suffix = match[2];
  return Math.round(amount * (suffix ? multipliers[suffix] : 1));
}

export function formatBetInput(value) {
  if (!value) {
    return "0";
  }

  if (value >= 1_000_000_000) {
    return `${trimZeros((value / 1_000_000_000).toFixed(2))}b`;
  }

  if (value >= 1_000_000) {
    return `${trimZeros((value / 1_000_000).toFixed(2))}m`;
  }

  if (value >= 1_000) {
    return `${trimZeros((value / 1_000).toFixed(2))}k`;
  }

  return String(Math.round(value));
}

function trimZeros(value) {
  return value.replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
}
