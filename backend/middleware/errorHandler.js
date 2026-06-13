// Centralized Error Handling Middleware
const errorHandler = (err, req, res, next) => {
  console.error('[Error]:', err.message || err);

  // If the error has a status code, use it; otherwise default to 500
  const statusCode = err.statusCode || 500;
  
  // Custom message or default
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: {
      message: message,
      status: statusCode
    }
  });
};

module.exports = errorHandler;
