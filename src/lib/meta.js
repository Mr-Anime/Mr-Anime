import { useEffect } from 'react';

const SITE_NAME = 'Mr.Anime';
const DEFAULT_IMAGE = '/favicon.svg';

function upsertMeta(attr, key, content) {
  if (content == null) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertJsonLd(id, data) {
  let el = document.getElementById(id);
  if (!data) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/**
 * Per-page title, description and social tags.
 * SPA-rendered: covers browser tab, sharing previews and crawlers that run JS.
 */
export function useDocumentMeta({ title, description, image, type = 'website', jsonLd, canonicalPath }) {
  useEffect(() => {
    const fullTitle = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} — Watch Anime Online`;
    document.title = fullTitle;
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:type', type);
    upsertMeta('name', 'twitter:title', fullTitle);
    if (description) {
      upsertMeta('name', 'description', description);
      upsertMeta('property', 'og:description', description);
      upsertMeta('name', 'twitter:description', description);
    }
    const img = image?.startsWith('http') ? image : DEFAULT_IMAGE;
    upsertMeta('property', 'og:image', img);
    upsertMeta('name', 'twitter:image', img);
    upsertMeta('property', 'og:url', window.location.href);
    upsertLink('canonical', canonicalPath ? new URL(canonicalPath, window.location.origin).href : window.location.href);
    upsertJsonLd('page-jsonld', jsonLd || null);
  }, [title, description, image, type, canonicalPath, JSON.stringify(jsonLd)]);
}
