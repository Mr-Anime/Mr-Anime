import SectionRow from '../SectionRow.jsx';

export default function Recommendations({ items = [] }) {
  const unique = [];
  const seen = new Set();
  for (const m of items) {
    if (!m || seen.has(m.id)) continue;
    seen.add(m.id);
    unique.push(m);
  }
  if (!unique.length) return null;
  return <SectionRow title="More like this" items={unique.slice(0, 14)} />;
}
