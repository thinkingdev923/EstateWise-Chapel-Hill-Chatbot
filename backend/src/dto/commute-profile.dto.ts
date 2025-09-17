import { CommuteCombine } from "../types/commute-profile.type";
import { ICommuteDestination } from "../models/CommuteProfile.model";

export interface CommuteDestinationDto extends ICommuteDestination {}

export interface CreateCommuteProfileDto {
  name: string;
  destinations: CommuteDestinationDto[];
  maxMinutes?: number; // Global max minutes
  combine?: CommuteCombine; // Defaults to 'intersect'
}

export interface UpdateCommuteProfileDto {
  name?: string;
  destinations?: CommuteDestinationDto[];
  maxMinutes?: number;
  combine?: CommuteCombine;
}

export interface CommuteProfileResponseDto {
  _id: string;
  userId: string;
  name: string;
  destinations: CommuteDestinationDto[];
  maxMinutes?: number;
  combine: CommuteCombine;
  createdAt: string;
  updatedAt: string;
}

export interface ErrorResponseDto {
  error: string;
  details?: {
    field: string;
    message: string;
  }[];
}
