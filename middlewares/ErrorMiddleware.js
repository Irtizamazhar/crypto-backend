const errorHandler = (err, req, res, next) => {
  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      message: 'Validation failed', // General validation failure message
      errors: err.errors.map((error) => {
        let errorMessage = error.message;

        // Specific handling for empty fields
        if (error.message.includes('isEmpty')) {
          errorMessage = `${error.path} cannot be empty`; // Custom message for empty fields
        }

        // Specific handling for invalid numeric values in name fields
        if (error.path === 'full_name') {
          if (/\d/.test(error.value)) {  // Check if the value contains a number
            errorMessage = `${error.path} cannot contain numbers`; // Custom message for numbers in names
          }
        }

        return {
          field: error.path,  // Field that caused the validation error
          message: errorMessage,  // Detailed error message
        };
      }),
    });
  }

  // Catch-all for other errors
  res.status(500).json({
    message: 'Internal server error',
    error: err.message,
  });
};

module.exports = errorHandler;
