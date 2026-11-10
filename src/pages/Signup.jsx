import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useDocumentMeta } from '../lib/meta.js';
import AuthShell, { AuthLink } from '../components/auth/AuthShell.jsx';
import { AuthInput } from '../components/auth/AuthField.jsx';
import Button from '../components/ui/Button.jsx';
import { isSupabaseConfigured } from '../lib/supabase/client.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export default function Signup() {
  const { user, signUp } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useDocumentMeta({ title: 'Sign up', description: 'Create a free Mr.Anime account to build your watchlist and history.' });

  if (user) return <Navigate to="/" replace />;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!USERNAME_RE.test(form.username.trim())) next.username = '3–20 letters, numbers or underscores.';
    if (!EMAIL_RE.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (form.password.length < 8) next.password = 'Use at least 8 characters.';
    if (form.password !== form.confirm) next.confirm = 'Passwords do not match.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const data = await signUp(form.email.trim(), form.password, form.username.trim());
      if (data?.session) {
        success('Account created. Welcome!');
        navigate('/', { replace: true });
      } else {
        success('Check your inbox to confirm your email and finish signing up.');
        navigate('/login', { replace: true });
      }
    } catch (err) {
      toastError(err.message || 'Could not create your account.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Track what you watch and pick up right where you left off."
      footer={
        <>
          Already have an account? <AuthLink to="/login">Sign in</AuthLink>
        </>
      }
    >
      {!isSupabaseConfigured && (
        <p className="mb-5 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3.5 py-2.5 text-xs text-amber-200">
          Accounts are not configured on this build.
        </p>
      )}
      <form onSubmit={submit} className="space-y-4" noValidate>
        <AuthInput id="username" label="Username" autoComplete="username" value={form.username} onChange={set('username')} error={errors.username} placeholder="sakura" />
        <AuthInput id="email" label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} placeholder="you@example.com" />
        <AuthInput id="password" label="Password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} hint="At least 8 characters." />
        <AuthInput id="confirm" label="Confirm password" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} />
        <Button type="submit" className="w-full" size="lg" loading={busy} disabled={!isSupabaseConfigured}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
