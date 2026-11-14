import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useDocumentMeta } from '../lib/meta.js';
import { updateProfile } from '../lib/library.js';
import Container from '../components/ui/Container.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import { AuthInput } from '../components/auth/AuthField.jsx';
import VerifiedBadge from '../components/ui/VerifiedBadge.jsx';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

function safeImageUrl(url) {
  if (!url) return '';
  const clean = DOMPurify.sanitize(url, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return /^https?:\/\//i.test(clean.trim()) ? clean.trim() : '';
}

export default function Profile() {
  const { user, isDemoMode, refreshProfile, updatePassword, signOut } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState(user?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const signOutTimer = useRef(null);
  useEffect(() => () => clearTimeout(signOutTimer.current), []);

  useEffect(() => {
    setUsername(user?.username || '');
    setAvatarUrl(user?.avatar_url || '');
  }, [user?.id]);

  useDocumentMeta({ title: 'Profile & settings', description: 'Manage your Mr.Anime account.' });

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!USERNAME_RE.test(username.trim())) return setProfileError('3–20 letters, numbers or underscores.');
    if (avatarUrl && !safeImageUrl(avatarUrl)) return setProfileError('Avatar must be a valid http(s) image URL.');
    setProfileError('');
    setSavingProfile(true);
    try {
      await updateProfile(user.id, { username: username.trim(), avatar_url: safeImageUrl(avatarUrl) });
      await refreshProfile();
      success('Profile updated.');
    } catch (err) {
      toastError(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (password.length < 8) return setPasswordError('Use at least 8 characters.');
    if (password !== confirm) return setPasswordError('Passwords do not match.');
    setPasswordError('');
    setSavingPassword(true);
    try {
      await updatePassword(password);
      setPassword('');
      setConfirm('');
      success('Password updated.');
    } catch (err) {
      toastError(err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const doSignOut = async () => {
    if (!confirmingSignOut) {
      setConfirmingSignOut(true);
      signOutTimer.current = setTimeout(() => setConfirmingSignOut(false), 4000);
      return;
    }
    clearTimeout(signOutTimer.current);
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch (err) {
      toastError(err.message);
    }
  };

  const initial = (user?.username || user?.email || 'U').charAt(0).toUpperCase();
  const avatar = safeImageUrl(avatarUrl);

  return (
    <Container className="max-w-3xl py-8 md:py-12">
      <PageHeader title="Profile & settings" description="Manage how you appear and how you sign in." />

      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-white/5 bg-surface-2/60 p-4">
        <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-brand to-accent text-xl font-bold text-white">
          {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initial}
        </span>
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 truncate text-base font-semibold text-white">
            {user?.username || 'Anime fan'}
            {user?.verified && <VerifiedBadge size={16} />}
          </p>
          <p className="truncate text-sm text-zinc-500">{user?.email}</p>
          {user?.role === 'admin' && <span className="mt-1 inline-block rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">Admin</span>}
        </div>
        {user?.role === 'admin' && (
          <Button to="/admin" size="sm" variant="secondary" className="ml-auto">
            <Icon name="grid" size={15} />
            Admin
          </Button>
        )}
      </div>

      {isDemoMode && (
        <p className="mb-6 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3.5 py-2.5 text-xs text-amber-200">
          You're browsing in demo mode. Connect Supabase to save profile changes.
        </p>
      )}

      <section className="mb-6 rounded-2xl border border-white/5 bg-surface-2/60 p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">Profile</h2>
        <form onSubmit={saveProfile} className="space-y-4" noValidate>
          <AuthInput id="username" label="Username" value={username} onChange={(e) => setUsername(e.target.value)} error={profileError.includes('letters') ? profileError : ''} />
          <AuthInput id="avatar" label="Avatar image URL" type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} error={profileError.includes('Avatar') ? profileError : ''} placeholder="https://…" hint="Leave empty to use your initial." />
          <AuthInput id="email" label="Email" value={user?.email || ''} disabled readOnly hint="Email changes are handled by your provider." />
          <Button type="submit" loading={savingProfile} disabled={isDemoMode}>Save profile</Button>
        </form>
      </section>

      <section className="mb-6 rounded-2xl border border-white/5 bg-surface-2/60 p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">Change password</h2>
        <form onSubmit={savePassword} className="space-y-4" noValidate>
          <AuthInput id="new-password" label="New password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} error={passwordError} />
          <AuthInput id="confirm-password" label="Confirm new password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <Button type="submit" loading={savingPassword} disabled={isDemoMode}>Update password</Button>
        </form>
      </section>

      <section className="rounded-2xl border border-white/5 bg-surface-2/60 p-5">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">Session</h2>
        <p className="mb-4 text-sm text-zinc-400">Sign out of Mr.Anime on this device.</p>
        <Button variant={confirmingSignOut ? 'danger' : 'secondary'} onClick={doSignOut}>
          <Icon name="logout" size={16} />
          {confirmingSignOut ? 'Click again to confirm' : 'Sign out'}
        </Button>
      </section>

      <p className="mt-8 text-xs text-zinc-500">
        Read our <Link to="/terms" className="text-zinc-300 hover:text-brand">Terms</Link> and <Link to="/privacy" className="text-zinc-300 hover:text-brand">Privacy Policy</Link>.
      </p>
    </Container>
  );
}
