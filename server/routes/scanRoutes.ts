import { Router, type Response } from 'express';
import { scanSchema } from '../../src/shared/schemas.ts';
import {
  authenticateToken,
  type AuthenticatedRequest,
} from '../middleware/authMiddleware.ts';
import { createRateLimiter } from '../middleware/rateLimitMiddleware.ts';
import { validateBody } from '../middleware/validateMiddleware.ts';
import { analyzePromptSecurity } from '../services/geminiService.ts';
import { inspectAndSanitizePii } from '../services/piiSanitizer.ts';
import {
  createAuditRecord,
  getOrganizationSettings,
} from '../store/repository.ts';

export const scanRouter = Router();

const scanLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 30,
  label: 'AI vulnerability scanner',
});

scanRouter.post(
  '/',
  authenticateToken,
  scanLimiter,
  validateBody(scanSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
      }

      const { targetModel, promptText, responseText, scanCategories } = req.body;
      const orgSettings = await getOrganizationSettings();

      const { sanitizedPrompt, sanitizedResponse, summary: piiSummary } =
        inspectAndSanitizePii(
          promptText,
          responseText || '',
          orgSettings.piiRedactionEnabled
        );

      const report = await analyzePromptSecurity({
        targetModel,
        promptText: sanitizedPrompt,
        responseText: sanitizedResponse,
        scanCategories,
        piiSummary,
      });

      // Store redacted prompt/response in audit trail when org PII redaction is enabled
      const storedPrompt = orgSettings.piiRedactionEnabled
        ? sanitizedPrompt
        : promptText;
      const storedResponse = orgSettings.piiRedactionEnabled
        ? sanitizedResponse
        : responseText || '';

      const auditRecord = await createAuditRecord({
        userId: req.user.id,
        userEmail: req.user.email,
        userName: req.user.fullName,
        targetModel,
        promptText: storedPrompt,
        responseText: storedResponse,
        scanCategories,
        report,
        piiSummary,
      });

      res.status(201).json({
        audit: auditRecord,
      });
    } catch (err: unknown) {
      const rawMessage =
        err instanceof Error ? err.message : 'AI security scan failed.';

      if (
        rawMessage.includes('PERMISSION_DENIED') ||
        rawMessage.includes('API_KEY_INVALID') ||
        rawMessage.includes('GEMINI_API_KEY')
      ) {
        res.status(502).json({
          error:
            'Gemini evaluation service credentials could not be verified. Please check the configured key in Settings > Secrets.',
        });
        return;
      }

      if (rawMessage.includes('RESOURCE_EXHAUSTED') || rawMessage.includes('429')) {
        res.status(429).json({
          error:
            'Upstream Gemini API quota reached. Please wait a moment or upgrade your billing tier in Settings > Secrets.',
        });
        return;
      }

      res.status(500).json({ error: rawMessage });
    }
  }
);
