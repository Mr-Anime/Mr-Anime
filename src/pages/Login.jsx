import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useDocumentMeta } from '../lib/meta.js';
import AuthShell, { AuthLink } from '../components/auth/AuthShell.jsx';
import { AuthInput } from '../components/auth/AuthField.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import { isSupabaseConfigured } from '../lib/supabase/client.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function GoogleButton({ onFailure }) {
  const { signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  if (!isSupabaseConfigured) return null;
  return (
    <>
      <Button
        variant="outline"
        className="w-full"
        loading={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await signInWithGoogle();
          } catch (err) {
            onFailure(err.message || 'Google sign-in failed.');
            setBusy(false);
          }
        }}
      >
        <Icon name="google" size={18} fill />
        Continue with Google
      </Button>
      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-zinc-600">
        <span className="h-px flex-1 bg-white/10" />
        or
        <span className="h-px flex-1 bg-white/10" />
      </div>
    </>
  );
}

export default function Login() {
  const { user, signIn } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useDocumentMeta({ title: 'Log in', description: 'Sign in to track your watchlist and continue watching on Mr.Anime.' });

  const from = location.state?.from || '/';

  if (user) return <Navigate to={from} replace />;
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!EMAIL_RE.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (!form.password) next.password = 'Enter your password.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await signIn(form.email.trim(), form.password);
      success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toastError(err.message || 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to sync your watchlist across devices."
      footer={
        <>
          New to Mr.Anime? <AuthLink to="/signup">Create an account</AuthLink>
        </>
      }
    >
      {!isSupabaseConfigured && (
        <p className="mb-5 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3.5 py-2.5 text-xs text-amber-200">
          Accounts are not configured on this build. Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to enable sign-in.
        </p>
      )}
      <GoogleButton onFailure={toastError} />
      <form onSubmit={submit} className="space-y-4" noValidate>
        <AuthInput id="email" label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} placeholder="you@example.com" />
        <AuthInput id="password" label="Password" type="password" autoComplete="current-password" value={form.password} onChange={set('password')} error={errors.password} placeholder="••••••••" />
        <div className="text-right">
          <AuthLink to="/forgot-password">Forgot password?</AuthLink>
        </div>
        <Button type="submit" className="w-full" size="lg" loading={busy} disabled={!isSupabaseConfigured}>
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
