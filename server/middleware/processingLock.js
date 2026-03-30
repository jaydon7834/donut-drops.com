const activeRequests = new Set();

function lockKeyForRequest(req) {
  const identity = req.user?.id || req.ip || req.connection?.remoteAddress || "unknown";
  return `${identity}:${req.baseUrl}${req.path}`;
}

export function processingLock(req, res, next) {
  const key = lockKeyForRequest(req);

  if (activeRequests.has(key)) {
    return res.status(429).json({
      message: "Action already processing. Please wait a moment."
    });
  }

  activeRequests.add(key);

  function release() {
    activeRequests.delete(key);
    res.off("finish", release);
    res.off("close", release);
  }

  res.on("finish", release);
  res.on("close", release);
  return next();
}
