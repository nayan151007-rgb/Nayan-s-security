import { Router, type Response } from 'express';
import {
  authenticateToken,
  type AuthenticatedRequest,
} from '../middleware/authMiddleware.ts';
import { getDashboardMetrics } from '../store/repository.ts';

export const dashboardRouter = Router();

dashboardRouter.use(authenticateToken);

dashboardRouter.get(
  '/metrics',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
      }

      const metrics = await getDashboardMetrics(req.user.id, req.user.role);
      res.json(metrics);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to compute dashboard metrics.';
      res.status(500).json({ error: message });
    }
  }
);
