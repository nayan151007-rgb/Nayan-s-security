# AI Security, Privacy & Trust

Enterprise AI governance, risk, and compliance (GRC) platform for auditing LLM prompts and responses, scanning for adversarial vulnerabilities and PII exposure via `@google/genai`, and tracking regulatory controls across **EU AI Act**, **NIST AI RMF 1.0**, and **ISO/IEC 42001:2023**.

## Key Capabilities

- **JWT Authentication & RBAC**: Role-scoped sessions (`Admin`, `Security Auditor`, `Developer`) with 12-round `bcrypt` password hashing and row-level tenant isolation (`Developer` accounts view personal scans; `Admin` and `Security Auditor` roles inspect organization-wide telemetry and update compliance controls).
- **Server-Proxied Gemini Vulnerability Scanner**: Evaluates prompts and optional model completions via `@google/genai` exclusively on the backend (`POST /api/v1/scan`) with sliding-window rate limiting, pre-inference deterministic PII/secret tokenization, and Zod-verified structured `AIAuditReport` outputs.
- **Interactive Analytics Dashboard**: Real-time calculation of total scans, mean trust score, high/critical flag counts, 7-day rolling trust trajectory, vulnerability domain distribution, and compliance readiness.
- **Compliance Framework Matrix**: 18 mapped regulatory controls across EU AI Act, NIST AI RMF, and ISO/IEC 42001 with inline status updates, auditor evidence notes, and JSON/CSV export.
