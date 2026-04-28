export class CliError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "INVALID_INPUT"
      | "DOWNLOAD_FAILED"
      | "TRANSFORM_FAILED"
      | "INSTALL_FAILED",
    public readonly exitCode = 1
  ) {
    super(message);
    this.name = "CliError";
  }
}
