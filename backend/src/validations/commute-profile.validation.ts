/**
 * Validation utilities for CommuteProfile DTOs using Zod
 */

import { z } from "zod";
import { CommuteMode, CommuteCombine } from "../types/commute-profile.type";
import {
  ValidationError,
  ValidationResult,
  convertZodErrors,
  validateObjectId,
} from "./default.validation";

// Time window validation regex
const timeWindowRegex =
  /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

// Custom time window validation
const timeWindowSchema = z.string().refine(
  (val) => {
    if (!timeWindowRegex.test(val)) return false;

    // Parse and validate time logic
    const [startTime, endTime] = val.split("-");
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    return startMinutes < endMinutes; // Start time must be before end time
  },
  {
    message:
      "Window must be in HH:MM-HH:MM format with start time before end time",
  },
);

// Commute destination schema
const CommuteDestinationSchema = z.object({
  label: z
    .string()
    .min(1, "Label cannot be empty")
    .max(100, "Label cannot exceed 100 characters")
    .trim(),
  lat: z
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  lng: z
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
  mode: z.enum(["drive", "transit", "bike", "walk"], {
    message: "Mode must be one of: drive, transit, bike, walk",
  }),
  window: timeWindowSchema,
  maxMinutes: z
    .number()
    .min(1, "Max minutes must be at least 1")
    .max(300, "Max minutes cannot exceed 300")
    .optional(),
});

// Create commute profile schema
const CreateCommuteProfileSchema = z.object({
  name: z
    .string()
    .min(1, "Name cannot be empty")
    .max(100, "Name cannot exceed 100 characters")
    .trim(),
  destinations: z
    .array(CommuteDestinationSchema)
    .min(1, "At least one destination is required")
    .max(3, "Maximum 3 destinations allowed"),
  maxMinutes: z
    .number()
    .min(1, "Max minutes must be at least 1")
    .max(300, "Max minutes cannot exceed 300")
    .optional(),
  combine: z.enum(["intersect", "union"]).default("intersect").optional(),
});

// Update commute profile schema
const UpdateCommuteProfileSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name cannot be empty")
      .max(100, "Name cannot exceed 100 characters")
      .trim()
      .optional(),
    destinations: z
      .array(CommuteDestinationSchema)
      .min(1, "At least one destination is required")
      .max(3, "Maximum 3 destinations allowed")
      .optional(),
    maxMinutes: z
      .number()
      .min(1, "Max minutes must be at least 1")
      .max(300, "Max minutes cannot exceed 300")
      .optional(),
    combine: z.enum(["intersect", "union"]).optional(),
  })
  .refine(
    (data) => {
      // At least one field must be provided for update
      return (
        data.name !== undefined ||
        data.destinations !== undefined ||
        data.maxMinutes !== undefined ||
        data.combine !== undefined
      );
    },
    {
      message: "At least one field must be provided for update",
    },
  );

/**
 * Validates a create commute profile request using Zod
 */
export const validateCreateCommuteProfile = (data: any): ValidationResult => {
  try {
    CreateCommuteProfileSchema.parse(data);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: convertZodErrors(error),
      };
    }
    return {
      isValid: false,
      errors: [{ field: "body", message: "Invalid request data" }],
    };
  }
};

/**
 * Validates an update commute profile request using Zod
 */
export const validateUpdateCommuteProfile = (data: any): ValidationResult => {
  try {
    UpdateCommuteProfileSchema.parse(data);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: convertZodErrors(error),
      };
    }
    return {
      isValid: false,
      errors: [{ field: "body", message: "Invalid request data" }],
    };
  }
};
