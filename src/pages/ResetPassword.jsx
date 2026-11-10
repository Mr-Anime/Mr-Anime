import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useDocumentMeta } from '../lib/meta.js';
import AuthShell from '../components/auth/AuthShell.jsx';
import { AuthInput } from '../components/auth/AuthField.jsx';
import Button from '../components/ui/Button.jsx';

export default function ResetPassword() {
  const { user, loading, updatePassword } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useDocumentMeta({ title: 'Set a new password', description: 'Choose a new password for your Mr.Anime account.' });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (form.password.length < 8) next.password = 'Use at least 8 characters.';
    if (form.password !== form.confirm) next.confirm = 'Passwords do not match.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await updatePassword(form.password);
      success('Password updated. You are signed in.');
      navigate('/', { replace: true });
    } catch (err) {
      toastError(err.message || 'Could not update your password.');
    } finally {
      setBusy(false);
    }
  };

  if (!loading && !user) return <Navigate to="/forgot-password" replace />;

  return (
    <AuthShell title="Set a new password" subtitle="Choose a strong password you haven't used before.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <AuthInput id="password" label="New password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} hint="At least 8 characters." />
        <AuthInput id="confirm" label="Confirm new password" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} />
        <Button type="submit" className="w-full" size="lg" loading={busy}>
          Update password
        </Button>
      </form>
    </AuthShell>
  );
}
