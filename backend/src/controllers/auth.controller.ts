import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User.model";

const saltRounds = 10;

/**
 * Sign up a new user
 *
 * @param req - The request object
 * @param res - The response object
 */
export const signUp = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const existingUser: IUser | null = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET!,
    );
    res.cookie("token", token, { httpOnly: true });
    res
      .status(201)
      .json({ token, user: { username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
};

/**
 * Log in an existing user
 *
 * @param req - The request object
 * @param res - The response object
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user: IUser | null = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET!,
    );
    res.cookie("token", token, { httpOnly: true });
    res.json({ token, user: { username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: "Failed to login" });
  }
};

/**
 * Log out the user
 *
 * @param req - The request object
 * @param res - The response object
 */
export const logout = async (req: Request, res: Response) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
};

/**
 * Verify the user's email
 *
 * @param req - The request object
 * @param res - The response object
 */
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user: IUser | null = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "Email verified", email });
  } catch (error) {
    res.status(500).json({ error: "Failed to verify email" });
  }
};

/**
 * Reset the user's password
 *
 * @param req - The request object
 * @param res - The response object
 */
export const resetPasswordForEmail = async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;
    const user: IUser | null = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.password = await bcrypt.hash(newPassword, saltRounds);
    await user.save();
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to reset password" });
  }
};
