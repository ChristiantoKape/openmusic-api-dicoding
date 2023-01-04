const ClientError = require('./ClientError');

class AutenticationError extends ClientError {
  constructor(message) {
    super(message, 401);
    this.name = 'AutenticationError';
  }
}

module.exports = AutenticationError;
