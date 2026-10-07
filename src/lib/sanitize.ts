import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "p",
  "br",
  "b",
  "i",
  "em",
  "strong",
  "u",
  "a",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "span",
  "blockquote",
  "code",
  "pre",
];

/** Sanitize HTML coming from AniList/TMDB before rendering it. */
export function sanitizeRichText(input: string | null | undefined): string {
  if (!input) return "";
  return sanitizeHtml(input, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "title", "rel", "target"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    disallowedTagsMode: "discard",
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer nofollow",
        target: "_blank",
      }),
    },
  });
}

/** Strip all HTML — used for meta descriptions and plain-text previews. */
export function stripHtml(input: string | null | undefined): string {
  if (!input) return "";
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}
