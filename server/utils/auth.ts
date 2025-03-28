import { createHash } from "crypto";
import jwt from "jsonwebtoken";
import { User } from "@shared/schema";

// Secret key for JWT signing
const JWT_SECRET = process.env.JWT_SECRET || "pledgenfetch_secret_key";
const JWT_EXPIRY = "24h";

/**
 * Generate a JWT token for a user
 */
export function generateJWT(user: User): string {
  const payload = {
    userId: user.id,
    username: user.username,
    email: user.email
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify a JWT token and return the decoded payload
 */
export async function verifyJWT(token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return reject(err);
      }
      resolve(decoded);
    });
  });
}

/**
 * Hash a password using SHA-256
 * Note: In a real-world application, use a proper password hashing library like bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  // This is a simplified implementation for demo purposes only
  // In production, use bcrypt or Argon2
  return createHash("sha256").update(password).digest("hex");
}

/**
 * Compare a plain text password with a hashed password
 */
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  // This is a simplified implementation for demo purposes only
  // In production, use bcrypt or Argon2
  const hashedInput = await hashPassword(password);
  return hashedInput === hashedPassword;
}
