/** Spoiler parsing for comments: [spoiler]...[/spoiler] → blurred reveal. */

export type SpoilerSegment = { text: string; spoiler: boolean };

const SPOILER_RE = /\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi;

/** Split plain text into visible + spoiler segments. */
export function parseSpoilers(input: string): SpoilerSegment[] {
  const segments: SpoilerSegment[] = [];
  let last = 0;
  for (const match of input.matchAll(SPOILER_RE)) {
    const start = match.index ?? 0;
    if (start > last) {
      segments.push({ text: input.slice(last, start), spoiler: false });
    }
    if (match[1]) segments.push({ text: match[1], spoiler: true });
    last = start + match[0].length;
  }
  if (last < input.length) {
    segments.push({ text: input.slice(last), spoiler: false });
  }
  return segments.length > 0 ? segments : [{ text: input, spoiler: false }];
}
