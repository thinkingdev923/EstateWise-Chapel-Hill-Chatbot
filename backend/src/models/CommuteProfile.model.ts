import mongoose, { Document, Schema } from "mongoose";
import { CommuteCombine, CommuteMode } from "../types/commute-profile.type";

/**
 * @swagger
 * components:
 *   schemas:
 *     CommuteDestination:
 *       type: object
 *       description: Represents a single destination in a commute profile.
 *       properties:
 *         label:
 *           type: string
 *           description: Human-readable label for the destination.
 *           example: "Work Office"
 *         lat:
 *           type: number
 *           description: Latitude coordinate of the destination.
 *           example: 35.9049
 *         lng:
 *           type: number
 *           description: Longitude coordinate of the destination.
 *           example: -79.0469
 *         mode:
 *           type: string
 *           enum: [drive, transit, bike, walk]
 *           description: Transportation mode for this destination.
 *           example: "drive"
 *         window:
 *           type: string
 *           pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
 *           description: Time window in HH:MM-HH:MM format.
 *           example: "08:00-17:00"
 *         maxMinutes:
 *           type: number
 *           minimum: 1
 *           maximum: 300
 *           description: Maximum commute time in minutes for this destination (optional).
 *           example: 30
 *       required:
 *         - label
 *         - lat
 *         - lng
 *         - mode
 *         - window
 *
 *     CommuteProfile:
 *       type: object
 *       description: Represents a user's commute profile with multiple destinations.
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the commute profile.
 *           example: 60d0fe4f5311236168a109ca
 *         userId:
 *           type: string
 *           description: The ID of the user who owns this profile.
 *           example: 60d0fe4f5311236168a109cb
 *         name:
 *           type: string
 *           description: Name of the commute profile.
 *           example: "Work Commute"
 *         destinations:
 *           type: array
 *           minItems: 1
 *           maxItems: 3
 *           description: List of destinations for this commute profile.
 *           items:
 *             $ref: '#/components/schemas/CommuteDestination'
 *         maxMinutes:
 *           type: number
 *           minimum: 1
 *           maximum: 300
 *           description: Global maximum commute time in minutes (optional).
 *           example: 45
 *         combine:
 *           type: string
 *           enum: [intersect, union]
 *           default: intersect
 *           description: How to combine time windows from multiple destinations.
 *           example: "intersect"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the profile was created.
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the profile was last updated.
 *       required:
 *         - userId
 *         - name
 *         - destinations
 *         - combine
 */

/**
 * Represents a single destination in a commute profile.
 */
export interface ICommuteDestination {
  label: string;
  lat: number;
  lng: number;
  mode: CommuteMode;
  window: string; // HH:MM-HH:MM format
  maxMinutes?: number; // Optional per-destination max minutes
}

/**
 * Represents a user's commute profile with multiple destinations.
 */
export interface ICommuteProfile extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  destinations: ICommuteDestination[];
  maxMinutes?: number; // Global max minutes
  combine: CommuteCombine; // How to combine time windows
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema for an individual commute destination.
 */
const CommuteDestinationSchema: Schema = new Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    mode: {
      type: String,
      required: true,
    },
    window: {
      type: String,
      required: true,
    },
    maxMinutes: {
      type: Number,
    },
  },
  { _id: false },
);

/**
 * Commute profile schema with user isolation and validation.
 */
const CommuteProfileSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    destinations: {
      type: [CommuteDestinationSchema],
      required: true,
    },
    maxMinutes: {
      type: Number,
    },
    combine: {
      type: String,
      default: "intersect",
    },
  },
  {
    timestamps: true,
    // Ensure user can only access their own profiles
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Compound index for efficient queries
CommuteProfileSchema.index({ userId: 1, updatedAt: -1 });

// Ensure user can only have unique profile names
CommuteProfileSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model<ICommuteProfile>(
  "CommuteProfile",
  CommuteProfileSchema,
);
