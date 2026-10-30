import { Router, type Response } from 'express';
import { orgSettingsSchema } from '../../src/shared/schemas.ts';
import {
  authenticateToken,
  requireRole,
  type AuthenticatedRequest,
} from '../middleware/authMiddleware.ts';
import { validateBody } from '../middleware/validateMiddleware.ts';
import {
  getOrganizationSettings,
  updateOrganizationSettings,
} from '../store/repository.ts';

export const settingsRouter = Router();

settingsRouter.use(authenticateToken);

settingsRouter.get(
  '/organization',
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const settings = await getOrganizationSettings();
      const geminiConfigured = Boolean(
        process.env.GEMINI_API_KEY &&
          process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
      );

      res.json({
        settings,
        securityPosture: {
          serverSideProxyActive: true,
          geminiEvaluationReady: geminiConfigured,
          jwtSessionHours: 12,
          bcryptCostFactor: 12,
          scanRateLimitPer15m: 30,
          rlsTenantIsolation: true,
        },
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to retrieve organization settings.';
      res.status(500).json({ error: message });
    }
  }
);

settingsRouter.patch(
  '/organization',
  requireRole('Admin'),
  validateBody(orgSettingsSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
      }

      const updated = await updateOrganizationSettings(
        req.body,
        req.user.fullName
      );
      res.json({ settings: updated });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to update organization settings.';
      res.status(500).json({ error: message });
    }
  }
);
