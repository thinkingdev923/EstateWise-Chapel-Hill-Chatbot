/**
 * Default validation interfaces and utilities
 */

import { z } from "zod";

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// MongoDB ObjectId schema
export const ObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format");

/**
 * Converts Zod errors to our ValidationError format
 */
export const convertZodErrors = (zodError: z.ZodError): ValidationError[] => {
  return zodError.issues.map((error: z.ZodIssue) => ({
    field: error.path.join("."),
    message: error.message,
  }));
};

/**
 * Validates MongoDB ObjectId format using Zod
 */
export const validateObjectId = (id: string): boolean => {
  try {
    ObjectIdSchema.parse(id);
    return true;
  } catch {
    return false;
  }
};
