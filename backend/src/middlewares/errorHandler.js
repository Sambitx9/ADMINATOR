/**
 * Global Centralized Error Handling Middleware
 * Adheres strictly to the standard error envelope from API_SPECIFICATION.md
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || res.statusCode === 200 ? 500 : res.statusCode || 500;
  const errorCode = err.code || (statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR');

  console.error(`[Error] [${req.method} ${req.url}]:`, err);

  res.status(statusCode).json({
    success: false,
    statusCode,
    error: {
      code: errorCode,
      message: err.message || 'An unexpected internal server error occurred.',
      details: err.details || null
    },
    meta: {
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    }
  });
};
