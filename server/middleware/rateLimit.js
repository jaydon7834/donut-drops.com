const buckets = new Map();

function pruneBucket(bucket, windowMs, now) {
  bucket.hits = bucket.hits.filter((timestamp) => now - timestamp < windowMs);
}

export function createRateLimiter({ windowMs, maxHits, keyPrefix = "global" }) {
  return function rateLimitMiddleware(req, res, next) {
    const now = Date.now();
    const requestKey = req.user?.id || req.ip || req.connection?.remoteAddress || "unknown";
    const key = `${keyPrefix}:${requestKey}`;
    const bucket = buckets.get(key) || { hits: [] };

    pruneBucket(bucket, windowMs, now);

    if (bucket.hits.length >= maxHits) {
      return res.status(429).json({
        message: "Too many requests. Please slow down."
      });
    }

    bucket.hits.push(now);
    buckets.set(key, bucket);
    return next();
  };
}
