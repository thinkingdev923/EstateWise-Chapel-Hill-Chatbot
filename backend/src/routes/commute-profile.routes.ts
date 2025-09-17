import { Router } from "express";
import {
  createCommuteProfile,
  getCommuteProfiles,
  getCommuteProfileById,
  updateCommuteProfile,
  deleteCommuteProfile,
} from "../controllers/commute-profile.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * /api/commute-profiles:
 *   post:
 *     summary: Create a new commute profile
 *     tags: [Commute Profiles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - destinations
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the commute profile
 *                 example: "Work Commute"
 *               destinations:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 3
 *                 description: List of destinations
 *                 items:
 *                   type: object
 *                   required:
 *                     - label
 *                     - lat
 *                     - lng
 *                     - mode
 *                     - window
 *                   properties:
 *                     label:
 *                       type: string
 *                       description: Human-readable label for the destination
 *                       example: "Work Office"
 *                     lat:
 *                       type: number
 *                       description: Latitude coordinate
 *                       example: 35.9049
 *                     lng:
 *                       type: number
 *                       description: Longitude coordinate
 *                       example: -79.0469
 *                     mode:
 *                       type: string
 *                       enum: [drive, transit, bike, walk]
 *                       description: Transportation mode
 *                       example: "drive"
 *                     window:
 *                       type: string
 *                       pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
 *                       description: Time window in HH:MM-HH:MM format
 *                       example: "08:00-17:00"
 *                     maxMinutes:
 *                       type: number
 *                       minimum: 1
 *                       maximum: 300
 *                       description: Maximum commute time in minutes for this destination
 *                       example: 30
 *               maxMinutes:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 300
 *                 description: Global maximum commute time in minutes
 *                 example: 45
 *               combine:
 *                 type: string
 *                 enum: [intersect, union]
 *                 default: intersect
 *                 description: How to combine time windows from multiple destinations
 *                 example: "intersect"
 *     responses:
 *       201:
 *         description: Commute profile created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: Unique identifier for the commute profile
 *                 userId:
 *                   type: string
 *                   description: The ID of the user who owns this profile
 *                 name:
 *                   type: string
 *                   description: Name of the commute profile
 *                 destinations:
 *                   type: array
 *                   items:
 *                     type: object
 *                 maxMinutes:
 *                   type: number
 *                   description: Global maximum commute time in minutes
 *                 combine:
 *                   type: string
 *                   enum: [intersect, union]
 *                   description: How to combine time windows
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: Timestamp when the profile was created
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   description: Timestamp when the profile was last updated
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Validation failed"
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                       message:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       409:
 *         description: Profile with this name already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Profile with this name already exists"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to create commute profile"
 */
router.post("/", authMiddleware, createCommuteProfile);

/**
 * @swagger
 * /api/commute-profiles:
 *   get:
 *     summary: Get all commute profiles for the authenticated user
 *     tags: [Commute Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of commute profiles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: Unique identifier for the commute profile
 *                   userId:
 *                     type: string
 *                     description: The ID of the user who owns this profile
 *                   name:
 *                     type: string
 *                     description: Name of the commute profile
 *                   destinations:
 *                     type: array
 *                     items:
 *                       type: object
 *                   maxMinutes:
 *                     type: number
 *                     description: Global maximum commute time in minutes
 *                   combine:
 *                     type: string
 *                     enum: [intersect, union]
 *                     description: How to combine time windows
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     description: Timestamp when the profile was created
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     description: Timestamp when the profile was last updated
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch commute profiles"
 */
router.get("/", authMiddleware, getCommuteProfiles);

/**
 * @swagger
 * /api/commute-profiles/{id}:
 *   get:
 *     summary: Get a specific commute profile by ID
 *     tags: [Commute Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Commute profile ID
 *         example: "60d0fe4f5311236168a109ca"
 *     responses:
 *       200:
 *         description: Commute profile details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: Unique identifier for the commute profile
 *                 userId:
 *                   type: string
 *                   description: The ID of the user who owns this profile
 *                 name:
 *                   type: string
 *                   description: Name of the commute profile
 *                 destinations:
 *                   type: array
 *                   items:
 *                     type: object
 *                 maxMinutes:
 *                   type: number
 *                   description: Global maximum commute time in minutes
 *                 combine:
 *                   type: string
 *                   enum: [intersect, union]
 *                   description: How to combine time windows
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: Timestamp when the profile was created
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   description: Timestamp when the profile was last updated
 *       400:
 *         description: Invalid profile ID format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid profile ID format"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       404:
 *         description: Profile not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Profile not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch commute profile"
 */
router.get("/:id", authMiddleware, getCommuteProfileById);

/**
 * @swagger
 * /api/commute-profiles/{id}:
 *   put:
 *     summary: Update a commute profile
 *     tags: [Commute Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Commute profile ID
 *         example: "60d0fe4f5311236168a109ca"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the commute profile
 *                 example: "Updated Work Commute"
 *               destinations:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 3
 *                 description: List of destinations
 *                 items:
 *                   type: object
 *                   required:
 *                     - label
 *                     - lat
 *                     - lng
 *                     - mode
 *                     - window
 *                   properties:
 *                     label:
 *                       type: string
 *                       description: Human-readable label for the destination
 *                       example: "Work Office"
 *                     lat:
 *                       type: number
 *                       description: Latitude coordinate
 *                       example: 35.9049
 *                     lng:
 *                       type: number
 *                       description: Longitude coordinate
 *                       example: -79.0469
 *                     mode:
 *                       type: string
 *                       enum: [drive, transit, bike, walk]
 *                       description: Transportation mode
 *                       example: "drive"
 *                     window:
 *                       type: string
 *                       pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
 *                       description: Time window in HH:MM-HH:MM format
 *                       example: "08:00-17:00"
 *                     maxMinutes:
 *                       type: number
 *                       minimum: 1
 *                       maximum: 300
 *                       description: Maximum commute time in minutes for this destination
 *                       example: 30
 *               maxMinutes:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 300
 *                 description: Global maximum commute time in minutes
 *                 example: 45
 *               combine:
 *                 type: string
 *                 enum: [intersect, union]
 *                 description: How to combine time windows from multiple destinations
 *                 example: "intersect"
 *     responses:
 *       200:
 *         description: Commute profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: Unique identifier for the commute profile
 *                 userId:
 *                   type: string
 *                   description: The ID of the user who owns this profile
 *                 name:
 *                   type: string
 *                   description: Name of the commute profile
 *                 destinations:
 *                   type: array
 *                   items:
 *                     type: object
 *                 maxMinutes:
 *                   type: number
 *                   description: Global maximum commute time in minutes
 *                 combine:
 *                   type: string
 *                   enum: [intersect, union]
 *                   description: How to combine time windows
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: Timestamp when the profile was created
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   description: Timestamp when the profile was last updated
 *       400:
 *         description: Validation error or invalid profile ID format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Validation failed"
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                       message:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       404:
 *         description: Profile not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Profile not found"
 *       409:
 *         description: Profile with this name already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Profile with this name already exists"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to update commute profile"
 */
router.put("/:id", authMiddleware, updateCommuteProfile);

/**
 * @swagger
 * /api/commute-profiles/{id}:
 *   delete:
 *     summary: Delete a commute profile
 *     tags: [Commute Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Commute profile ID
 *         example: "60d0fe4f5311236168a109ca"
 *     responses:
 *       200:
 *         description: Commute profile deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Commute profile deleted successfully"
 *       400:
 *         description: Invalid profile ID format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid profile ID format"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       404:
 *         description: Profile not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Profile not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to delete commute profile"
 */
router.delete("/:id", authMiddleware, deleteCommuteProfile);

export default router;
