import { Router, type Response } from 'express';
import {
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from '../../src/shared/schemas.ts';
import {
  authenticateToken,
  signUserToken,
  type AuthenticatedRequest,
} from '../middleware/authMiddleware.ts';
import { createRateLimiter } from '../middleware/rateLimitMiddleware.ts';
import { validateBody } from '../middleware/validateMiddleware.ts';
import {
  createUserAccount,
  findUserById,
  updateUserProfile,
  verifyUserPassword,
} from '../store/repository.ts';

export const authRouter = Router();

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 40,
  label: 'authentication endpoints',
});

authRouter.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { email, password, fullName, role } = req.body;
      const user = await createUserAccount({
        email,
        password,
        fullName,
        role: role || 'Developer',
      });

      const token = signUserToken({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      });

      res.status(201).json({
        token,
        user,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unable to register account.';
      const status = message.includes('already exists') ? 409 : 500;
      res.status(status).json({ error: message });
    }
  }
);

authRouter.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const user = await verifyUserPassword(email, password);
      if (!user) {
        res.status(401).json({
          error: 'Invalid email address or password.',
        });
        return;
      }

      const token = signUserToken({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      });

      res.json({
        token,
        user,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Authentication failed.';
      res.status(500).json({ error: message });
    }
  }
);

authRouter.get(
  '/me',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated.' });
        return;
      }
      const profile = await findUserById(req.user.id);
      if (!profile) {
        res.status(404).json({ error: 'User profile not found.' });
        return;
      }
      res.json({ user: profile });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load profile.';
      res.status(500).json({ error: message });
    }
  }
);

authRouter.patch(
  '/profile',
  authenticateToken,
  validateBody(updateProfileSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated.' });
        return;
      }
      const updated = await updateUserProfile(req.user.id, req.body);
      const token = signUserToken({
        id: updated.id,
        email: updated.email,
        fullName: updated.fullName,
        role: updated.role,
      });
      res.json({ user: updated, token });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to update profile.';
      res.status(500).json({ error: message });
    }
  }
);
