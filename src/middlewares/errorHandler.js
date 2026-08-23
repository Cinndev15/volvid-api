export const errorHandler = (err, req, res, next) => {
  console.error('Unhandled API Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  const statusCode = err.status || 500;
  
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Ocurrió un error interno en el servidor.',
    // Only include stack trace if not in production environment (e.g. development)
    error: process.env.NODE_ENV === 'production' ? {} : { details: err.message }
  });
};
