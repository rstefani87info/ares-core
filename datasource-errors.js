export class ValidationError extends Error {
  constructor(message, params) {
    super(message);
    this.name = "ValidationError";
    this.parameters = params;
  }
}

