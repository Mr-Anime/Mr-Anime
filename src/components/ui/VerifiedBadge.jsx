import { VERIFIED_BADGE_URL } from '../../lib/badges.js';

export default function VerifiedBadge({ size = 14, className = '' }) {
  return (
    <img
      src={VERIFIED_BADGE_URL}
      alt="Verified"
      title="Verified"
      width={size}
      height={size}
      loading="lazy"
      className={`inline-block shrink-0 align-middle ${className}`}
    />
  );
}
