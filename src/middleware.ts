import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  userId?: number;
}

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Authentication failed! Token not provided." });
  }

  try {
    const secret = process.env.JWT_SECRET || 'sup3rS3cr3t';
    const decoded:any = jwt.verify(token, secret);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: "Authentication failed! Invalid token." });
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({ message: "Authentication failed! Invalid token." });
  }
};
