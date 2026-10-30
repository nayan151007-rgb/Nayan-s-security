import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { extractApiError } from '../services/api';
import {
  loginSchema,
  registerSchema,
  USER_ROLES,
  type UserRole,
} from '../shared/schemas';

const DEMO_ACCOUNTS: Array<{
  label: string;
  role: UserRole;
  email: string;
  password: string;
}> = [
  {
    label: 'Admin Account',
    role: 'Admin',
    email: 'admin@sentinel-grc.io',
    password: 'AdminPass123!',
  },
  {
    label: 'Security Auditor',
    role: 'Security Auditor',
    email: 'auditor@sentinel-grc.io',
    password: 'AuditPass123!',
  },
  {
    label: 'Developer Account',
    role: 'Developer',
    email: 'dev@sentinel-grc.io',
    password: 'DevPass1234!',
  },
];

export function LoginPage() {
  const { login, register } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('admin@sentinel-grc.io');
  const [password, setPassword] = useState('AdminPass123!');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('Developer');
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);

    if (mode === 'login') {
      const parsed = loginSchema.safeParse({ email, password });
      if (!parsed.success) {
        setFieldError(parsed.error.issues[0]?.message || 'Check credentials.');
        return;
      }

      setSubmitting(true);
      try {
        const loggedUser = await login(parsed.data.email, parsed.data.password);
        notify({
          variant: 'success',
          title: `Signed in as ${loggedUser.fullName}`,
          description: `Active RBAC tier: ${loggedUser.role}`,
        });
        navigate('/dashboard');
      } catch (err) {
        const msg = extractApiError(err, 'Invalid email or password.');
        setFieldError(msg);
        notify({ variant: 'error', title: 'Sign-in failed', description: msg });
      } finally {
        setSubmitting(false);
      }
    } else {
      const parsed = registerSchema.safeParse({
        email,
        password,
        fullName,
        role,
      });
      if (!parsed.success) {
        setFieldError(
          parsed.error.issues[0]?.message || 'Check registration fields.'
        );
        return;
      }

      setSubmitting(true);
      try {
        const created = await register({
          email: parsed.data.email,
          password: parsed.data.password,
          fullName: parsed.data.fullName,
          role: parsed.data.role,
        });
        notify({
          variant: 'success',
          title: 'Workspace account provisioned',
          description: `Welcome ${created.fullName} (${created.role}).`,
        });
        navigate('/dashboard');
      } catch (err) {
        const msg = extractApiError(err, 'Registration failed.');
        setFieldError(msg);
        notify({
          variant: 'error',
          title: 'Registration failed',
          description: msg,
        });
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleQuickDemoLogin = async (demo: (typeof DEMO_ACCOUNTS)[number]) => {
    setFieldError(null);
    setMode('login');
    setEmail(demo.email);
    setPassword(demo.password);
    setSubmitting(true);
    try {
      const loggedUser = await login(demo.email, demo.password);
      notify({
        variant: 'success',
        title: `Signed in as ${loggedUser.fullName}`,
        description: `Role: ${loggedUser.role}`,
      });
      navigate('/dashboard');
    } catch (err) {
      const msg = extractApiError(err, 'Demo login failed.');
      setFieldError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={
        mode === 'login'
          ? 'Sign in to AI Security Console'
          : 'Provision Workspace Account'
      }
      subtitle={
        mode === 'login'
          ? 'Authenticate with your corporate credentials to inspect AI telemetry and compliance controls.'
          : 'Create a role-scoped account protected by bcrypt hashing and JWT authorization.'
      }
    >
      {/* Mode Switcher */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg mb-6">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setFieldError(null);
          }}
          className={`py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
            mode === 'login'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('register');
            setEmail('');
            setPassword('');
            setFieldError(null);
          }}
          className={`py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
            mode === 'register'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Create Account
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div>
            <label
              htmlFor="auth-fullname"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Full Name
            </label>
            <input
              id="auth-fullname"
              type="text"
              autoComplete="name"
              value={fullName}
              disabled={submitting}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Dr. Jordan Mercer"
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="auth-email"
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            Corporate Email Address
          </label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            disabled={submitting}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div>
          <label
            htmlFor="auth-password"
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            Password
          </label>
          <input
            id="auth-password"
            type="password"
            autoComplete={
              mode === 'login' ? 'current-password' : 'new-password'
            }
            value={password}
            disabled={submitting}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={
              mode === 'register' ? 'Minimum 8 characters' : 'Enter password'
            }
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {mode === 'register' && (
          <div>
            <label
              htmlFor="auth-role"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              RBAC Access Role
            </label>
            <select
              id="auth-role"
              value={role}
              disabled={submitting}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {USER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r === 'Admin'
                    ? 'Admin (Full Org Telemetry & Policy Control)'
                    : r === 'Security Auditor'
                      ? 'Security Auditor (Org Audits & Compliance Editing)'
                      : 'Developer (Row-Level Isolated Prompt Scanning)'}
                </option>
              ))}
            </select>
          </div>
        )}

        {fieldError && (
          <p role="alert" className="text-xs font-medium text-red-600">
            {fieldError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>
                {mode === 'login' ? 'Sign In to Console' : 'Create Account'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Quick RBAC Evaluation Switcher */}
      <div className="mt-6 pt-6 border-t border-slate-200">
        <div className="text-xs font-semibold text-slate-700 mb-2.5">
          Instant RBAC Verification Accounts
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {DEMO_ACCOUNTS.map((demo) => (
            <button
              key={demo.role}
              type="button"
              disabled={submitting}
              onClick={() => handleQuickDemoLogin(demo)}
              className="px-2.5 py-2 text-left border border-slate-200 hover:border-slate-400 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <div className="text-xs font-semibold text-slate-900 truncate">
                {demo.role}
              </div>
              <div className="text-[11px] text-slate-500 truncate mt-0.5">
                {demo.email.split('@')[0]}
              </div>
            </button>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}
