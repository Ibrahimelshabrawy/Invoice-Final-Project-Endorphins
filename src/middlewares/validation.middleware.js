export const Validation = (schema) => {
  return (req, res, next) => {
    const validationErrors = [];

    for (const key of Object.keys(schema)) {
      if (!schema[key]) continue;

      const result = schema[key].safeParse(req[key]);
      if (!result.success) {
        for (const issue of result.error.issues) {
          validationErrors.push({
            key,
            path: issue.path[0],
            message: issue.message,
          });
        }
      }
    }

    if (validationErrors.length > 0) {
      const error = new Error('Validation Error');
      error.cause = 400;
      error.errors = validationErrors;
      return next(error);
    }

    next();
  };
};

export default Validation;
