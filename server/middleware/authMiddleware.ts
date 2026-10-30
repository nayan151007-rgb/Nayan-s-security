import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { UserRole } from '../../src/shared/schemas.ts';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function getJwtSecret(): string {
  return (
    process.env.JWT_SECRET ||
    'sentinel_ai_security_privacy_trust_default_jwt_secret_2026'
  );
}

export function signUserToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
    getJwtSecret(),
    { expiresIn: '12h' }
  );
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Authentication required. Please log in to access this resource.',
    });
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    res.status(401).json({
      error: 'Missing bearer token in Authorization header.',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as {
      sub: string;
      email: string;
      fullName: string;
      role: UserRole;
    };

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      fullName: decoded.fullName,
      role: decoded.role,
    };
    next();
  } catch {
    res.status(401).json({
      error: 'Session expired or invalid token. Please sign in again.',
    });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Insufficient permissions. Required role: ${allowedRoles.join(' or ')}. Current role: ${req.user.role}.`,
      });
      return;
    }

    next();
  };
}
