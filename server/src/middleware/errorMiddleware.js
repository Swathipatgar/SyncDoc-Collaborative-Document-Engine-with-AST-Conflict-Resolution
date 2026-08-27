const notFound = (req, res, next) => {
  const error = new Error("Resource not found");
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.type === "entity.too.large" ? 413 : (res.statusCode === 200 ? 500 : res.statusCode);
  if (statusCode >= 500) console.error("Request failed:", err.name, err.message);

  res.status(statusCode).json({
    message: statusCode >= 500 ? "Server error" : (err.message || "Request failed"),
  });
};

module.exports = { notFound, errorHandler };
