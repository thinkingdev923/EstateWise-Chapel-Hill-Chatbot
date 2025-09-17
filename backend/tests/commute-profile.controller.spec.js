const {
  createCommuteProfile,
  getCommuteProfiles,
  getCommuteProfileById,
  updateCommuteProfile,
  deleteCommuteProfile,
} = require("../src/controllers/commute-profile.controller");
const {
  CommuteProfileService,
} = require("../src/services/commuteProfile.service");

// Mock the service
jest.mock("../src/services/commuteProfile.service");
const MockedCommuteProfileService = CommuteProfileService;

describe("CommuteProfileController", () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      user: { id: "507f1f77bcf86cd799439012" },
      body: {},
      params: { id: "507f1f77bcf86cd799439011" },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("createCommuteProfile", () => {
    it("should create profile successfully", async () => {
      // Arrange
      const profileData = {
        name: "Test Profile",
        destinations: [
          {
            label: "Office",
            lat: 35.9042,
            lng: -79.0469,
            mode: "drive",
            window: "08:00-09:00",
          },
        ],
      };
      mockReq.body = profileData;

      const expectedResponse = {
        _id: "507f1f77bcf86cd799439011",
        userId: "507f1f77bcf86cd799439012",
        name: "Test Profile",
        destinations: profileData.destinations,
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
      };

      MockedCommuteProfileService.prototype.createProfile = jest
        .fn()
        .mockResolvedValue(expectedResponse);

      // Act
      await createCommuteProfile(mockReq, mockRes);

      // Assert
      expect(
        MockedCommuteProfileService.prototype.createProfile,
      ).toHaveBeenCalledWith(mockReq.user.id, profileData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse);
    });
  });

  describe("getCommuteProfiles", () => {
    it("should return all profiles for user", async () => {
      // Arrange
      const expectedProfiles = [
        {
          _id: "507f1f77bcf86cd799439011",
          userId: "507f1f77bcf86cd799439012",
          name: "Profile 1",
          destinations: [],
        },
        {
          _id: "507f1f77bcf86cd799439012",
          userId: "507f1f77bcf86cd799439012",
          name: "Profile 2",
          destinations: [],
        },
      ];

      MockedCommuteProfileService.prototype.getProfilesByUserId = jest
        .fn()
        .mockResolvedValue(expectedProfiles);

      // Act
      await getCommuteProfiles(mockReq, mockRes);

      // Assert
      expect(
        MockedCommuteProfileService.prototype.getProfilesByUserId,
      ).toHaveBeenCalledWith(mockReq.user.id);
      expect(mockRes.json).toHaveBeenCalledWith(expectedProfiles);
    });
  });

  describe("getCommuteProfileById", () => {
    it("should return specific profile by ID", async () => {
      // Arrange
      const expectedProfile = {
        _id: "507f1f77bcf86cd799439011",
        userId: "507f1f77bcf86cd799439012",
        name: "Test Profile",
        destinations: [],
      };

      MockedCommuteProfileService.prototype.getProfileById = jest
        .fn()
        .mockResolvedValue(expectedProfile);

      // Act
      await getCommuteProfileById(mockReq, mockRes);

      // Assert
      expect(
        MockedCommuteProfileService.prototype.getProfileById,
      ).toHaveBeenCalledWith(mockReq.params.id, mockReq.user.id);
      expect(mockRes.json).toHaveBeenCalledWith(expectedProfile);
    });
  });

  describe("updateCommuteProfile", () => {
    it("should update profile successfully", async () => {
      // Arrange
      const updateData = { name: "Updated Profile", maxMinutes: 60 };
      mockReq.body = updateData;

      const expectedResponse = {
        _id: "507f1f77bcf86cd799439011",
        userId: "507f1f77bcf86cd799439012",
        name: "Updated Profile",
        maxMinutes: 60,
        destinations: [],
      };

      MockedCommuteProfileService.prototype.updateProfile = jest
        .fn()
        .mockResolvedValue(expectedResponse);

      // Act
      await updateCommuteProfile(mockReq, mockRes);

      // Assert
      expect(
        MockedCommuteProfileService.prototype.updateProfile,
      ).toHaveBeenCalledWith(mockReq.params.id, mockReq.user.id, updateData);
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse);
    });
  });

  describe("deleteCommuteProfile", () => {
    it("should delete profile successfully", async () => {
      // Arrange
      MockedCommuteProfileService.prototype.deleteProfile = jest
        .fn()
        .mockResolvedValue();

      // Act
      await deleteCommuteProfile(mockReq, mockRes);

      // Assert
      expect(
        MockedCommuteProfileService.prototype.deleteProfile,
      ).toHaveBeenCalledWith(mockReq.params.id, mockReq.user.id);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Commute profile deleted successfully",
      });
    });
  });
});
