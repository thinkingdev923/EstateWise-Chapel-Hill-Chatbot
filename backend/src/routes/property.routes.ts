import { Router } from "express";
import { searchProperties } from "../controllers/property.controller";

const router = Router();

/**
 * @swagger
 * /api/properties:
 *   get:
 *     summary: Search properties based on criteria
 *     tags: [Properties]
 *     parameters:
 *       - in: query
 *         name: budget
 *         schema:
 *           type: number
 *         required: false
 *         description: Maximum property price
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         required: false
 *         description: City or area to search in
 *       - in: query
 *         name: urban
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Filter for urban areas
 *     responses:
 *       200:
 *         description: List of properties matching the criteria
 */
router.get("/", searchProperties);

export default router;
