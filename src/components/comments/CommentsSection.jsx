import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { setUserBanned } from '../../lib/admin.js';
import { addComment, deleteComment, listComments, setCommentStatus } from '../../lib/comments.js';
import { formatTimeAgo } from '../../lib/format.js';
import Button from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';
import VerifiedBadge from '../ui/VerifiedBadge.jsx';

const MAX_LENGTH = 2000;

export default function CommentsSection({ anilistId, episode = null }) {
  const { user, isAdmin, isModerator, isDemoMode } = useAuth();
  const { success, error: toastError } = useToast();
  const location = useLocation();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setComments(await listComments(anilistId, { episode }));
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, [anilistId, episode]);

  useEffect(() => {
    load();
  }, [load]);

  const post = async (e) => {
    e.preventDefault();
    if (!user) return;
    setPosting(true);
    try {
      await addComment({ userId: user.id, anilistId, episode, body });
      setBody('');
      success('Comment posted.');
      await load();
    } catch (err) {
      toastError(err.message);
    } finally {
      setPosting(false);
    }
  };

  const moderate = async (comment) => {
    const next = comment.status === 'hidden' ? 'visible' : 'hidden';
    setBusyId(comment.id);
    try {
      await setCommentStatus(comment.id, next);
      success(next === 'hidden' ? 'Comment hidden.' : 'Comment restored.');
      await load();
    } catch (err) {
      toastError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const toggleBan = async (comment) => {
    if (!comment.banned && !window.confirm(`Ban ${comment.username} from commenting?`)) return;
    setBusyId(comment.id);
    try {
      await setUserBanned(comment.userId, !comment.banned);
      success(comment.banned ? `${comment.username} can comment again.` : `${comment.username} is banned from commenting.`);
      await load();
    } catch (err) {
      toastError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (comment) => {
    if (!window.confirm('Delete this comment?')) return;
    setBusyId(comment.id);
    try {
      await deleteComment(comment.id);
      success('Comment deleted.');
      await load();
    } catch (err) {
      toastError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const title = episode == null ? 'Comments' : `Episode ${episode} comments`;

  return (
    <section id="comments" aria-labelledby="comments-heading">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="comments-heading" className="text-lg font-bold text-white sm:text-xl">{title}</h2>
        {!loading && !loadError && (
          <span className="text-xs text-zinc-500">
            {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </span>
        )}
      </div>

      {isDemoMode ? (
        <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-400">
          Comments need account configuration on this deployment.
        </p>
      ) : user?.banned ? (
        <p className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-200">
          Your account is banned from commenting. Contact an administrator if you think this is a mistake.
        </p>
      ) : user ? (
        <form onSubmit={post} className="rounded-2xl border border-white/5 bg-surface-2/60 p-4">
          <label htmlFor="comment-body" className="sr-only">Write a comment</label>
          <textarea
            id="comment-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={MAX_LENGTH}
            rows={3}
            placeholder={`Share your thoughts about ${episode == null ? 'this anime' : `episode ${episode}`}…`}
            className="w-full resize-y rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-brand/60 focus:outline-none"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className={`text-xs ${body.length > MAX_LENGTH - 100 ? 'text-amber-300' : 'text-zinc-500'}`}>
              {body.trim().length}/{MAX_LENGTH}
            </span>
            <Button type="submit" size="sm" loading={posting} disabled={!body.trim()}>Post comment</Button>
          </div>
        </form>
      ) : (
        <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-400">
          <Link to="/login" state={{ from: location.pathname + location.search }} className="text-brand hover:underline">Sign in</Link>{' '}
          to join the discussion.
        </p>
      )}

      <div className="mt-5 space-y-4">
        {loading ? (
          <>
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </>
        ) : loadError ? (
          <div className="rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm text-zinc-300">
            {loadError}
            <button type="button" onClick={load} className="ml-2 text-brand hover:underline">Retry</button>
          </div>
        ) : comments.length === 0 ? (
          <p className="rounded-xl border border-white/5 bg-surface-2/40 px-4 py-6 text-center text-sm text-zinc-500">
            No comments yet. Be the first to post.
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              canDelete={isModerator || comment.userId === user?.id}
              canModerate={isModerator}
              isAdmin={isAdmin}
              currentUserId={user?.id}
              busy={busyId === comment.id}
              onToggleHidden={() => moderate(comment)}
              onToggleBan={() => toggleBan(comment)}
              onDelete={() => remove(comment)}
            />
          ))
        )}
      </div>
    </section>
  );
}

function CommentItem({ comment, canDelete, canModerate, isAdmin, currentUserId, busy, onToggleHidden, onToggleBan, onDelete }) {
  const hidden = comment.status === 'hidden';
  const canBanAuthor =
    canModerate &&
    comment.userId !== currentUserId &&
    comment.role !== 'admin' &&
    (comment.role !== 'moderator' || isAdmin);

  return (
    <article className={`rounded-2xl border px-4 py-3 ${hidden ? 'border-amber-400/20 bg-amber-400/5' : 'border-white/5 bg-surface-2/40'}`}>
      <div className="flex items-start gap-3">
        <CommentAvatar role={comment.role} avatarUrl={comment.avatarUrl} username={comment.username} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span className="inline-flex items-center gap-1 font-semibold text-zinc-200">
              {comment.username}
              {comment.role === 'admin' && <RoleBadge tone="admin">Admin</RoleBadge>}
              {comment.role === 'moderator' && <RoleBadge tone="moderator">Moderator</RoleBadge>}
              {comment.verified && <VerifiedBadge size={14} />}
              {comment.banned && <RoleBadge tone="banned">Banned</RoleBadge>}
            </span>
            <span className="text-zinc-600">·</span>
            <time dateTime={comment.createdAt} className="text-zinc-500">
              {formatTimeAgo(Math.floor(new Date(comment.createdAt).getTime() / 1000))}
            </time>
            {hidden && <span className="rounded-full bg-amber-400/15 px-2 py-0.5 font-medium text-amber-300">Hidden</span>}
          </div>
          <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-300">{comment.body}</p>
          {(canModerate || canDelete) && (
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
              {canModerate && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={onToggleHidden}
                  className="inline-flex items-center gap-1 text-zinc-400 hover:text-white disabled:opacity-50"
                >
                  <Icon name={hidden ? 'eye' : 'eyeOff'} size={13} />
                  {hidden ? 'Restore' : 'Hide'}
                </button>
              )}
              {canBanAuthor && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={onToggleBan}
                  className={`inline-flex items-center gap-1 disabled:opacity-50 ${
                    comment.banned ? 'text-zinc-400 hover:text-emerald-300' : 'text-zinc-400 hover:text-red-400'
                  }`}
                >
                  <Icon name={comment.banned ? 'checkCircle' : 'ban'} size={13} />
                  {comment.banned ? 'Unban' : 'Ban'}
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={onDelete}
                  className="inline-flex items-center gap-1 text-zinc-400 hover:text-red-400 disabled:opacity-50"
                >
                  <Icon name="trash" size={13} />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function CommentAvatar({ role, avatarUrl, username }) {
  const [failed, setFailed] = useState(false);
  const admin = role === 'admin';
  const initial = (username || '?').charAt(0).toUpperCase();

  return (
    <span
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
        admin ? 'bg-gradient-to-br from-amber-300 via-brand to-accent p-[2px] shadow-[0_0_14px_rgba(236,72,153,0.45)]' : ''
      }`}
      title={admin ? 'Admin' : undefined}
    >
      <span
        className={`grid h-full w-full place-items-center overflow-hidden rounded-full text-sm font-bold text-white ${
          admin ? 'bg-surface-2' : 'bg-gradient-to-br from-brand to-accent'
        }`}
      >
        {avatarUrl && !failed ? (
          <img
            src={avatarUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          initial
        )}
      </span>
    </span>
  );
}

function RoleBadge({ tone, children }) {
  const tones = {
    admin: 'bg-brand/15 text-brand',
    moderator: 'bg-sky-400/15 text-sky-300',
    banned: 'bg-red-500/15 text-red-300',
  };
  return (
    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  );
}
