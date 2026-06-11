// 404 for any route that nothing else matched.
export const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Central error handler. Any controller that calls next(err)
// (or throws inside an async wrapper) lands here, so controllers
// never need their own res.status(500) boilerplate.
export const errorHandler = (err, req, res, next) => {
  // MongoDB duplicate key (e.g. email or username already registered)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'value';
    return res.status(409).json({ message: `That ${field} is already taken` });
  }

  // Mongoose schema validation error
  if (err.name === 'ValidationError') {
    const first = Object.values(err.errors)[0];
    return res.status(400).json({ message: first.message });
  }

  // Malformed ObjectId in a URL param
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id format' });
  }

  console.error(err); // log unexpected errors for debugging
  res.status(err.statusCode || 500).json({
    message: err.message || 'Something went wrong on the server',
  });
};
