import Container from '../ui/Container.jsx';
import PageHeader from '../ui/PageHeader.jsx';

export default function Prose({ children, className = '' }) {
  return (
    <div
      className={`max-w-3xl space-y-4 text-sm leading-relaxed text-zinc-300 [&_a]:text-brand [&_a:hover]:underline [&_h2]:pt-4 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-white [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-white ${className}`}
    >
      {children}
    </div>
  );
}

export function LegalPage({ title, description, updated, children }) {
  return (
    <Container className="py-10 md:py-14">
      <PageHeader title={title} description={description} />
      {updated && <p className="mb-6 text-xs text-zinc-500">Last updated: {updated}</p>}
      <Prose>{children}</Prose>
    </Container>
  );
}
