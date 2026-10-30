import axios, { AxiosError } from 'axios';
import type {
  AuditRecord,
  ComplianceControl,
  ComplianceStatus,
  DashboardMetrics,
  OrganizationSettings,
  TargetModel,
  TrustCategory,
  UserProfile,
  UserRole,
} from '../shared/schemas';

const TOKEN_STORAGE_KEY = 'sentinel_grc_jwt_token';

export function getStoredToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota errors in restricted frames
  }
}

export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes('/auth/login') &&
      !error.config?.url?.includes('/auth/register')
    ) {
      setStoredToken(null);
      window.dispatchEvent(new CustomEvent('sentinel:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export function extractApiError(err: unknown, fallback = 'Request failed'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { error?: string; details?: Array<{ field: string; message: string }> }
      | undefined;
    if (data?.details && data.details.length > 0) {
      return data.details.map((d) => d.message).join(' ');
    }
    if (data?.error) {
      return data.error;
    }
    if (err.message) {
      return err.message;
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}

export const authApi = {
  async login(payload: { email: string; password: string }) {
    const { data } = await apiClient.post<{ token: string; user: UserProfile }>(
      '/auth/login',
      payload
    );
    return data;
  },

  async register(payload: {
    email: string;
    password: string;
    fullName: string;
    role: UserRole;
  }) {
    const { data } = await apiClient.post<{ token: string; user: UserProfile }>(
      '/auth/register',
      payload
    );
    return data;
  },

  async me() {
    const { data } = await apiClient.get<{ user: UserProfile }>('/auth/me');
    return data.user;
  },

  async updateProfile(payload: {
    fullName: string;
    department?: string;
    jobTitle?: string;
  }) {
    const { data } = await apiClient.patch<{ user: UserProfile; token: string }>(
      '/auth/profile',
      payload
    );
    return data;
  },
};

export const scanApi = {
  async runScan(payload: {
    targetModel: TargetModel;
    promptText: string;
    responseText?: string;
    scanCategories: TrustCategory[];
  }) {
    const { data } = await apiClient.post<{ audit: AuditRecord }>('/scan', payload);
    return data.audit;
  },
};

export interface PaginatedAuditsResponse {
  items: AuditRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  isolationScope: 'organization' | 'personal';
}

export const auditsApi = {
  async list(params: {
    page?: number;
    limit?: number;
    riskLevel?: string;
    category?: string;
    search?: string;
  }) {
    const { data } = await apiClient.get<PaginatedAuditsResponse>('/audits', {
      params,
    });
    return data;
  },

  async exportAll(params: {
    riskLevel?: string;
    category?: string;
    search?: string;
  }) {
    const { data } = await apiClient.get<{ items: AuditRecord[] }>(
      '/audits/export',
      { params }
    );
    return data.items;
  },

  async getById(id: string) {
    const { data } = await apiClient.get<{ audit: AuditRecord }>(`/audits/${id}`);
    return data.audit;
  },

  async remove(id: string) {
    await apiClient.delete(`/audits/${id}`);
  },
};

export const complianceApi = {
  async list(framework = 'ALL') {
    const { data } = await apiClient.get<{
      controls: ComplianceControl[];
      summaries: DashboardMetrics['frameworkSummaries'];
    }>('/compliance', {
      params: { framework },
    });
    return data;
  },

  async updateControl(
    id: string,
    payload: { status: ComplianceStatus; notes?: string }
  ) {
    const { data } = await apiClient.patch<{
      control: ComplianceControl;
      summaries: DashboardMetrics['frameworkSummaries'];
    }>(`/compliance/${id}`, payload);
    return data;
  },
};

export const dashboardApi = {
  async getMetrics() {
    const { data } = await apiClient.get<DashboardMetrics>('/dashboard/metrics');
    return data;
  },
};

export interface SecurityPostureInfo {
  serverSideProxyActive: boolean;
  geminiEvaluationReady: boolean;
  jwtSessionHours: number;
  bcryptCostFactor: number;
  scanRateLimitPer15m: number;
  rlsTenantIsolation: boolean;
}

export const settingsApi = {
  async getOrganization() {
    const { data } = await apiClient.get<{
      settings: OrganizationSettings;
      securityPosture: SecurityPostureInfo;
    }>('/settings/organization');
    return data;
  },

  async updateOrganization(payload: {
    organizationName: string;
    minTrustScoreThreshold: number;
    piiRedactionEnabled: boolean;
    blockCriticalPrompts: boolean;
    auditRetentionDays: number;
  }) {
    const { data } = await apiClient.patch<{ settings: OrganizationSettings }>(
      '/settings/organization',
      payload
    );
    return data.settings;
  },
};
