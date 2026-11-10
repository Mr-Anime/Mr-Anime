import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useDocumentMeta } from '../lib/meta.js';
import AuthShell, { AuthLink } from '../components/auth/AuthShell.jsx';
import { AuthInput } from '../components/auth/AuthField.jsx';
import Button from '../components/ui/Button.jsx';
import { EmptyState } from '../components/ui/StateView.jsx';
import { isSupabaseConfigured } from '../lib/supabase/client.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const { error: toastError } = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useDocumentMeta({ title: 'Reset password', description: 'Request a password reset link for your Mr.Anime account.' });

  const submit = async (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) return setError('Enter a valid email address.');
    setError('');
    setBusy(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err) {
      toastError(err.message || 'Could not send the reset email.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a link to choose a new password."
      footer={
        <>
          Remembered it? <AuthLink to="/login">Back to sign in</AuthLink>
        </>
      }
    >
      {sent ? (
        <EmptyState icon="mail" title="Check your inbox" description={`If an account exists for ${email}, a reset link is on its way.`} />
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <AuthInput id="email" label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} placeholder="you@example.com" />
          <Button type="submit" className="w-full" size="lg" loading={busy} disabled={!isSupabaseConfigured}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
