import { Router, type Response } from 'express';
import { complianceUpdateSchema } from '../../src/shared/schemas.ts';
import {
  authenticateToken,
  requireRole,
  type AuthenticatedRequest,
} from '../middleware/authMiddleware.ts';
import { validateBody } from '../middleware/validateMiddleware.ts';
import {
  listComplianceControls,
  updateComplianceControl,
} from '../store/repository.ts';

export const complianceRouter = Router();

complianceRouter.use(authenticateToken);

complianceRouter.get(
  '/',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const framework =
        typeof req.query.framework === 'string' ? req.query.framework : 'ALL';
      const result = await listComplianceControls(framework);
      res.json(result);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to retrieve compliance controls.';
      res.status(500).json({ error: message });
    }
  }
);

complianceRouter.patch(
  '/:id',
  requireRole('Admin', 'Security Auditor'),
  validateBody(complianceUpdateSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
      }

      const controlId = String(req.params.id);
      const updated = await updateComplianceControl(
        controlId,
        req.body,
        req.user.fullName
      );

      if (!updated) {
        res.status(404).json({ error: 'Compliance control not found.' });
        return;
      }

      const { summaries } = await listComplianceControls('ALL');
      res.json({ control: updated, summaries });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to update compliance control.';
      res.status(500).json({ error: message });
    }
  }
);
