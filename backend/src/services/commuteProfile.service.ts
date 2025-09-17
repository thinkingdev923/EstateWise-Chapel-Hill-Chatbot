import CommuteProfile, {
  ICommuteProfile,
} from "../models/CommuteProfile.model";
import {
  CreateCommuteProfileDto,
  UpdateCommuteProfileDto,
  CommuteProfileResponseDto,
} from "../dto/commute-profile.dto";
import {
  validateCreateCommuteProfile,
  validateUpdateCommuteProfile,
} from "../validations/commute-profile.validation";
import mongoose from "mongoose";
import { validateObjectId } from "../validations/default.validation";
import { AppError } from "../utils/AppError";

export class CommuteProfileService {
  /**
   * Create a new commute profile for a user
   */
  async createProfile(
    userId: string,
    data: CreateCommuteProfileDto,
  ): Promise<CommuteProfileResponseDto> {
    // Validate input data
    const validation = validateCreateCommuteProfile(data);
    if (!validation.isValid) {
      throw AppError.badRequest("Validation failed", validation.errors);
    }

    // Check if user already has a profile with the same name
    const existingProfile = await CommuteProfile.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      name: data.name,
    });

    if (existingProfile) {
      throw AppError.conflict("Profile with this name already exists");
    }

    // Create new profile
    const profile = new CommuteProfile({
      userId: new mongoose.Types.ObjectId(userId),
      name: data.name,
      destinations: data.destinations,
      maxMinutes: data.maxMinutes,
      combine: data.combine || "intersect",
    });

    const savedProfile = await profile.save();

    return {
      _id: savedProfile._id.toString(),
      userId: savedProfile.userId.toString(),
      name: savedProfile.name,
      destinations: savedProfile.destinations,
      maxMinutes: savedProfile.maxMinutes,
      combine: savedProfile.combine,
      createdAt: savedProfile.createdAt.toISOString(),
      updatedAt: savedProfile.updatedAt.toISOString(),
    };
  }

  /**
   * Get all commute profiles for a user
   */
  async getProfilesByUserId(
    userId: string,
  ): Promise<CommuteProfileResponseDto[]> {
    if (!validateObjectId(userId)) {
      throw AppError.badRequest("Invalid user ID format");
    }

    const profiles = await CommuteProfile.find({
      userId: new mongoose.Types.ObjectId(userId),
    }).sort({ updatedAt: -1 });

    return profiles.map((profile) => ({
      _id: profile._id.toString(),
      userId: profile.userId.toString(),
      name: profile.name,
      destinations: profile.destinations,
      maxMinutes: profile.maxMinutes,
      combine: profile.combine,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    }));
  }

  /**
   * Get a specific commute profile by ID
   */
  async getProfileById(
    profileId: string,
    userId: string,
  ): Promise<CommuteProfileResponseDto> {
    if (!validateObjectId(profileId)) {
      throw AppError.badRequest("Invalid profile ID format");
    }

    if (!validateObjectId(userId)) {
      throw AppError.badRequest("Invalid user ID format");
    }

    const profile = await CommuteProfile.findOne({
      _id: new mongoose.Types.ObjectId(profileId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!profile) {
      throw AppError.notFound("Profile not found");
    }

    return {
      _id: profile._id.toString(),
      userId: profile.userId.toString(),
      name: profile.name,
      destinations: profile.destinations,
      maxMinutes: profile.maxMinutes,
      combine: profile.combine,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }

  /**
   * Update a commute profile
   */
  async updateProfile(
    profileId: string,
    userId: string,
    data: UpdateCommuteProfileDto,
  ): Promise<CommuteProfileResponseDto> {
    // Validate input data
    const validation = validateUpdateCommuteProfile(data);
    if (!validation.isValid) {
      throw AppError.badRequest("Validation failed", validation.errors);
    }

    if (!validateObjectId(profileId)) {
      throw AppError.badRequest("Invalid profile ID format");
    }

    if (!validateObjectId(userId)) {
      throw AppError.badRequest("Invalid user ID format");
    }

    // Check if profile exists and belongs to user
    const existingProfile = await CommuteProfile.findOne({
      _id: new mongoose.Types.ObjectId(profileId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!existingProfile) {
      throw AppError.notFound("Profile not found");
    }

    // If updating name, check for conflicts
    if (data.name && data.name !== existingProfile.name) {
      const nameConflict = await CommuteProfile.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        name: data.name,
        _id: { $ne: new mongoose.Types.ObjectId(profileId) },
      });

      if (nameConflict) {
        throw AppError.conflict("Profile with this name already exists");
      }
    }

    // Update profile
    const updatedProfile = await CommuteProfile.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(profileId),
        userId: new mongoose.Types.ObjectId(userId),
      },
      data,
      { new: true, runValidators: true },
    );

    if (!updatedProfile) {
      throw AppError.notFound("Profile not found");
    }

    return {
      _id: updatedProfile._id.toString(),
      userId: updatedProfile.userId.toString(),
      name: updatedProfile.name,
      destinations: updatedProfile.destinations,
      maxMinutes: updatedProfile.maxMinutes,
      combine: updatedProfile.combine,
      createdAt: updatedProfile.createdAt.toISOString(),
      updatedAt: updatedProfile.updatedAt.toISOString(),
    };
  }

  /**
   * Delete a commute profile
   */
  async deleteProfile(profileId: string, userId: string): Promise<void> {
    if (!validateObjectId(profileId)) {
      throw AppError.badRequest("Invalid profile ID format");
    }

    if (!validateObjectId(userId)) {
      throw AppError.badRequest("Invalid user ID format");
    }

    const deletedProfile = await CommuteProfile.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(profileId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!deletedProfile) {
      throw AppError.notFound("Profile not found");
    }
  }
}
