import DOMPurify from 'dompurify';

const ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'br', 'p', 'a'];
const ALLOWED_ATTR = ['href', 'target', 'rel', 'title'];

/** DOMPurify walker passes only these attribute names, and only for <a>. */
DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
  if (!ALLOWED_ATTR.includes(data.attrName)) {
    data.keepAttr = false;
  } else if (data.attrName === 'target' && data.attrValue !== '_blank') {
    data.keepAttr = false;
  }
});

DOMPurify.addHook('afterSanitizeElements', (node) => {
  if (node.nodeName === 'A') {
    const href = node.getAttribute('href') || '';
    if (!/^https?:\/\//i.test(href)) node.removeAttribute('href');
    node.setAttribute('rel', 'noopener noreferrer nofollow');
    node.setAttribute('target', '_blank');
  }
});

function sanitize(html) {
  if (!html) return '';
  return DOMPurify.sanitize(String(html), {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['style', 'script', 'iframe', 'img'],
  });
}

export function plainDescription(html) {
  return String(html || '').replace(/<[^>]*>/g, '').trim();
}

/** Sanitized AniList synopsis (their HTML includes <br> and <i>). */
export default function Synopsis({ html, className = '' }) {
  const safe = sanitize(html);
  if (!safe) return <p className={`text-sm text-zinc-500 ${className}`}>No synopsis available.</p>;
  return (
    <div
      className={`space-y-3 text-sm leading-relaxed text-zinc-300 [&_a]:text-brand [&_a:hover]:underline ${className}`}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
