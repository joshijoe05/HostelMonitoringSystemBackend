class ApiError extends Error {
    constructor(statusCode, message, errors, statck) {
        super(message);
        this.code = statusCode;
        this.data = null;
        this.message = message;
        this.errors = errors;
        this.success = false;
        if (statck) {
            this.stack = statck;
        }
        else {
            this.stack = Error.captureStackTrace(this, this.constructor);
        }
    }
}

module.exports = ApiError;