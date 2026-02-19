export { validateTickFile } from "@tick/core";

export interface ValidationError {
  type: "error" | "warning";
  message: string;
  location?: string;
  fix?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}
