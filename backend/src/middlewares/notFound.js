/**
 * 404 Not Found Middleware
 */
export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The requested endpoint '${req.method} ${req.originalUrl}' does not exist on this server.`
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  });
};
