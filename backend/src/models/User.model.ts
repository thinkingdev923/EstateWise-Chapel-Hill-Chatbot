import mongoose, { Document, Schema } from "mongoose";

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       description: Represents a user in the system.
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier of the user.
 *           example: 60d0fe4f5311236168a109ca
 *         username:
 *           type: string
 *           description: The username of the user.
 *           example: johndoe
 *         email:
 *           type: string
 *           format: email
 *           description: The email address of the user.
 *           example: johndoe@example.com
 *         password:
 *           type: string
 *           description: The hashed password of the user.
 *           example: "$2a$10$EixZaYVK1fsbw1ZfbX3OXe"
 *       required:
 *         - username
 *         - email
 *         - password
 */

/**
 * This is the user interface.
 * It contains the fields needed for the user model.
 */
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
}

/**
 * This is the user schema.
 * It contains the fields needed for the user model.
 */
const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
});

export default mongoose.model<IUser>("User", UserSchema);
