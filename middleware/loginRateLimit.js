const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attempts = new Map();

function loginRateLimit(req, res, next) {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  let entry = attempts.get(key);

  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    attempts.set(key, entry);
  }

  // Opportunistically remove expired entries to keep memory bounded.
  for (const [ip, value] of attempts) {
    if (now >= value.resetAt) attempts.delete(ip);
  }

  entry.count += 1;
  res.set('RateLimit-Limit', String(MAX_ATTEMPTS));
  res.set('RateLimit-Remaining', String(Math.max(0, MAX_ATTEMPTS - entry.count)));
  res.set('RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

  if (entry.count > MAX_ATTEMPTS) {
    return res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again in 15 minutes.'
    });
  }

  next();
}

module.exports = { loginRateLimit };
