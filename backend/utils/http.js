export function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

export function sendData(res, data, status = 200) {
  res.status(status).json({ data });
}

export function sendError(res, status, message, details) {
  res.status(status).json({
    error: "request_error",
    message,
    ...(details ? { details } : {}),
  });
}

export function requireParams(req, keys) {
  for (const key of keys) {
    if (!req.params[key]) {
      const error = new Error(`Missing route parameter: ${key}`);
      error.status = 400;
      throw error;
    }
  }
}
