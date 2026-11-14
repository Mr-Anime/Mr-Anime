import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../ui/Button.jsx';

const inputClass =
  'h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-zinc-500 focus:border-brand/60 focus:outline-none';

const EMPTY = { host: '', port: '587', user: '', pass: '', senderEmail: '', senderName: 'Mr.Anime' };

export default function SmtpForm() {
  const { success, error: toastError } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api
      .adminSmtp()
      .then((res) => {
        if (!active) return;
        const s = res?.data;
        setConfigured(Boolean(s?.configured));
        setForm({
          host: s?.host || '',
          port: String(s?.port || 587),
          user: s?.user || '',
          pass: '',
          senderEmail: s?.senderEmail || '',
          senderName: s?.senderName || 'Mr.Anime',
        });
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const port = Number(form.port);
    if (!form.host.trim()) return setError('SMTP host is required.');
    if (!Number.isInteger(port) || port < 1 || port > 65535) return setError('Port must be a whole number between 1 and 65535.');
    if (!form.user.trim()) return setError('SMTP username is required.');
    if (!configured && !form.pass) return setError('SMTP password is required the first time.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.senderEmail.trim())) return setError('Enter a valid sender email address.');

    setError('');
    setSaving(true);
    try {
      await api.saveAdminSmtp({
        host: form.host.trim(),
        port,
        user: form.user.trim(),
        pass: form.pass,
        senderEmail: form.senderEmail.trim(),
        senderName: form.senderName.trim() || 'Mr.Anime',
      });
      setConfigured(true);
      setForm((f) => ({ ...f, pass: '' }));
      success('SMTP settings saved. Password reset emails now use this server.');
    } catch (err) {
      toastError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="rounded-xl border border-white/10 bg-surface-3/50 px-4 py-3 text-sm text-zinc-400">Loading SMTP settings…</p>;
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-white/10 bg-surface-3/50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${configured ? 'bg-emerald-400/15 text-emerald-300' : 'bg-amber-400/15 text-amber-300'}`}>
          {configured ? 'Configured' : 'Not configured'}
        </span>
        <span className="text-xs text-zinc-500">Applies to password reset, email confirmation and magic-link emails.</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-400">SMTP host</span>
          <input className={inputClass} value={form.host} onChange={set('host')} placeholder="smtp.resend.com" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-400">Port</span>
          <input className={inputClass} inputMode="numeric" value={form.port} onChange={set('port')} placeholder="587" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-400">Username</span>
          <input className={inputClass} value={form.user} onChange={set('user')} placeholder="resend" autoComplete="off" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-400">Password</span>
          <input
            className={inputClass}
            type="password"
            value={form.pass}
            onChange={set('pass')}
            placeholder={configured ? 'Leave blank to keep current' : 'SMTP password'}
            autoComplete="new-password"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-400">From email</span>
          <input className={inputClass} type="email" value={form.senderEmail} onChange={set('senderEmail')} placeholder="noreply@mranime.cyou" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-400">From name</span>
          <input className={inputClass} value={form.senderName} onChange={set('senderName')} placeholder="Mr.Anime" />
        </label>
      </div>

      {error && <p className="mt-3 text-xs text-brand" role="alert">{error}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="submit" loading={saving}>Save SMTP settings</Button>
        <span className="text-xs text-zinc-500">The saved password is never sent back to the browser.</span>
      </div>
    </form>
  );
}
