const {
  CommuteProfileService,
} = require("../src/services/commuteProfile.service");
const { AppError } = require("../src/utils/AppError");

// Mock validation functions
jest.mock("../src/validations/commute-profile.validation", () => ({
  validateCreateCommuteProfile: jest.fn(),
  validateUpdateCommuteProfile: jest.fn(),
}));

jest.mock("../src/validations/default.validation", () => ({
  validateObjectId: jest.fn(),
}));

const {
  validateCreateCommuteProfile,
  validateUpdateCommuteProfile,
} = require("../src/validations/commute-profile.validation");
const { validateObjectId } = require("../src/validations/default.validation");

describe("CommuteProfileService", () => {
  let service;

  beforeEach(() => {
    service = new CommuteProfileService();
    jest.clearAllMocks();
  });

  describe("createProfile", () => {
    it("should throw validation error when data is invalid", async () => {
      // Arrange
      const userId = "507f1f77bcf86cd799439012";
      const invalidData = { name: "", destinations: [] };
      const validationErrors = [
        { field: "name", message: "Name cannot be empty" },
      ];
      validateCreateCommuteProfile.mockReturnValue({
        isValid: false,
        errors: validationErrors,
      });

      // Act & Assert
      await expect(service.createProfile(userId, invalidData)).rejects.toThrow(
        AppError,
      );
    });
  });

  describe("getProfilesByUserId", () => {
    it("should throw error for invalid user ID", async () => {
      // Arrange
      const userId = "invalid-id";
      validateObjectId.mockReturnValue(false);

      // Act & Assert
      await expect(service.getProfilesByUserId(userId)).rejects.toThrow(
        AppError,
      );
    });
  });

  describe("getProfileById", () => {
    it("should throw error for invalid profile ID", async () => {
      // Arrange
      const profileId = "invalid-id";
      const userId = "507f1f77bcf86cd799439012";
      validateObjectId.mockReturnValue(false);

      // Act & Assert
      await expect(service.getProfileById(profileId, userId)).rejects.toThrow(
        AppError,
      );
    });

    it("should throw error for invalid user ID", async () => {
      // Arrange
      const profileId = "507f1f77bcf86cd799439011";
      const userId = "invalid-id";
      validateObjectId.mockReturnValueOnce(true).mockReturnValueOnce(false);

      // Act & Assert
      await expect(service.getProfileById(profileId, userId)).rejects.toThrow(
        AppError,
      );
    });
  });

  describe("updateProfile", () => {
    it("should throw error for invalid validation", async () => {
      // Arrange
      const profileId = "507f1f77bcf86cd799439011";
      const userId = "507f1f77bcf86cd799439012";
      const invalidData = { name: "" };
      const validationErrors = [
        { field: "name", message: "Name cannot be empty" },
      ];
      validateUpdateCommuteProfile.mockReturnValue({
        isValid: false,
        errors: validationErrors,
      });

      // Act & Assert
      await expect(
        service.updateProfile(profileId, userId, invalidData),
      ).rejects.toThrow(AppError);
    });

    it("should throw error for invalid profile ID", async () => {
      // Arrange
      const profileId = "invalid-id";
      const userId = "507f1f77bcf86cd799439012";
      const validData = { name: "Updated Profile" };
      validateUpdateCommuteProfile.mockReturnValue({
        isValid: true,
        errors: [],
      });
      validateObjectId.mockReturnValue(false);

      // Act & Assert
      await expect(
        service.updateProfile(profileId, userId, validData),
      ).rejects.toThrow(AppError);
    });

    it("should throw error for invalid user ID", async () => {
      // Arrange
      const profileId = "507f1f77bcf86cd799439011";
      const userId = "invalid-id";
      const validData = { name: "Updated Profile" };
      validateUpdateCommuteProfile.mockReturnValue({
        isValid: true,
        errors: [],
      });
      validateObjectId.mockReturnValueOnce(true).mockReturnValueOnce(false);

      // Act & Assert
      await expect(
        service.updateProfile(profileId, userId, validData),
      ).rejects.toThrow(AppError);
    });
  });

  describe("deleteProfile", () => {
    it("should throw error for invalid profile ID", async () => {
      // Arrange
      const profileId = "invalid-id";
      const userId = "507f1f77bcf86cd799439012";
      validateObjectId.mockReturnValue(false);

      // Act & Assert
      await expect(service.deleteProfile(profileId, userId)).rejects.toThrow(
        AppError,
      );
    });

    it("should throw error for invalid user ID", async () => {
      // Arrange
      const profileId = "507f1f77bcf86cd799439011";
      const userId = "invalid-id";
      validateObjectId.mockReturnValueOnce(true).mockReturnValueOnce(false);

      // Act & Assert
      await expect(service.deleteProfile(profileId, userId)).rejects.toThrow(
        AppError,
      );
    });
  });
});
