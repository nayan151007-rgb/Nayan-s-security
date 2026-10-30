import { Router, type Response } from 'express';
import {
  authenticateToken,
  type AuthenticatedRequest,
} from '../middleware/authMiddleware.ts';
import {
  deleteAuditById,
  getAuditById,
  listAllAuthorizedAuditsForExport,
  listAudits,
} from '../store/repository.ts';

export const auditRouter = Router();

auditRouter.use(authenticateToken);

auditRouter.get(
  '/',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
      }

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 8;
      const riskLevel =
        typeof req.query.riskLevel === 'string' ? req.query.riskLevel : 'ALL';
      const category =
        typeof req.query.category === 'string' ? req.query.category : 'ALL';
      const search =
        typeof req.query.search === 'string' ? req.query.search : '';

      const result = await listAudits({
        requesterId: req.user.id,
        requesterRole: req.user.role,
        page,
        limit,
        riskLevel,
        category,
        search,
      });

      res.json(result);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to retrieve audit history.';
      res.status(500).json({ error: message });
    }
  }
);

auditRouter.get(
  '/export',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
      }

      const riskLevel =
        typeof req.query.riskLevel === 'string' ? req.query.riskLevel : 'ALL';
      const category =
        typeof req.query.category === 'string' ? req.query.category : 'ALL';
      const search =
        typeof req.query.search === 'string' ? req.query.search : '';

      const items = await listAllAuthorizedAuditsForExport({
        requesterId: req.user.id,
        requesterRole: req.user.role,
        riskLevel,
        category,
        search,
      });

      res.json({ items });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to export audits.';
      res.status(500).json({ error: message });
    }
  }
);

auditRouter.get(
  '/:id',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
      }

      const auditId = String(req.params.id);
      const record = await getAuditById(auditId, req.user.id, req.user.role);
      if (!record) {
        res.status(404).json({
          error: 'Audit record not found or outside your access scope.',
        });
        return;
      }

      res.json({ audit: record });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to retrieve audit report.';
      res.status(500).json({ error: message });
    }
  }
);

auditRouter.delete(
  '/:id',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
      }

      const auditId = String(req.params.id);
      const deleted = await deleteAuditById(auditId, req.user.id, req.user.role);
      if (!deleted) {
        res.status(404).json({
          error: 'Audit record not found or insufficient permission to delete.',
        });
        return;
      }

      res.json({ success: true });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete audit record.';
      res.status(500).json({ error: message });
    }
  }
);
