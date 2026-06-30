async function withRetry(fn, opts) {
  const retries = (opts && opts.retries) || 3;
  const baseDelayMs = (opts && opts.baseDelayMs) || 500;
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = err && err.response && err.response.status;
      const retryable = status === 429 || status >= 500;
      if (!retryable || attempt === retries) break;
      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

module.exports = { withRetry };
