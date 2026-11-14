import { useCallback, useState } from 'react';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { adminDeleteOverride, adminListOverrides, adminSaveOverride, adminStats } from '../lib/admin.js';
import { useDocumentMeta } from '../lib/meta.js';
import Container from '../components/ui/Container.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import StatsCards from '../components/admin/StatsCards.jsx';
import OverrideTable from '../components/admin/OverrideTable.jsx';
import OverrideForm from '../components/admin/OverrideForm.jsx';
import SmtpForm from '../components/admin/SmtpForm.jsx';
import UserBadges from '../components/admin/UserBadges.jsx';

export default function Admin() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const stats = useApi(useCallback(() => adminStats(), []));
  const overrides = useApi(useCallback(() => adminListOverrides(), []));

  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  useDocumentMeta({ title: 'Admin panel' });

  const rows = overrides.data || [];

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setFormOpen(true);
  };

  const save = async (payload) => {
    setSaving(true);
    try {
      await adminSaveOverride(payload, user.id);
      success('Override saved.');
      setFormOpen(false);
      overrides.retry();
      stats.retry();
    } catch (err) {
      toastError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    setBusyId(row.anilistId);
    try {
      await adminDeleteOverride(row.anilistId);
      success(`Override for #${row.anilistId} deleted.`);
      overrides.retry();
      stats.retry();
    } catch (err) {
      toastError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Container className="py-8 md:py-12">
      <PageHeader title="Admin panel" description="Site statistics and per-title stream availability.">
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => { stats.retry(); overrides.retry(); }}>
            <Icon name="refresh" size={15} />
            Refresh
          </Button>
        </div>
      </PageHeader>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">Overview</h2>
        {stats.error ? (
          <p className="rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm text-zinc-300">
            {stats.error.message}
          </p>
        ) : (
          <StatsCards stats={stats.loading ? null : stats.data} />
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Availability overrides</h2>
            <p className="mt-0.5 text-xs text-zinc-500">Force SUB/DUB availability or cap episode counts for a specific AniList ID.</p>
          </div>
          {!formOpen && (
            <Button size="sm" onClick={openNew}>
              <Icon name="plus" size={15} />
              Add override
            </Button>
          )}
        </div>

        {formOpen && (
          <div className="mb-4">
            <OverrideForm initial={editing} saving={saving} onSave={save} onCancel={() => setFormOpen(false)} />
          </div>
        )}

        <OverrideTable
          rows={rows}
          loading={overrides.loading}
          error={overrides.error}
          onRetry={overrides.retry}
          onEdit={openEdit}
          onDelete={remove}
          busyId={busyId}
        />
      </section>

      <section className="mt-12">
        <div className="mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">User badges & roles</h2>
          <p className="mt-0.5 text-xs text-zinc-500">Verify users or give them the moderator role. Badges appear next to names in comments.</p>
        </div>
        <UserBadges />
      </section>

      <section className="mt-12">
        <div className="mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Password reset email (SMTP)</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Supabase Auth uses this SMTP server for forgot-password, confirmation and magic-link emails. Changes apply immediately.
          </p>
        </div>
        <SmtpForm />
      </section>

      <p className="mt-8 text-xs text-zinc-500">
        Stats, overrides and badges load directly from Supabase with your signed-in session. SMTP still uses the server API.
        Admin access is granted by the <code className="text-zinc-300">role</code> column on your profile row.
      </p>
    </Container>
  );
}
