import Container from '../components/ui/Container.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { EmptyState } from '../components/ui/StateView.jsx';

/** Temporary route target while the page is built in a later module. */
export default function Placeholder({ title, module, description }) {
  return (
    <Container className="py-10 md:py-14">
      <PageHeader title={title} description={description || `This page is wired into the router and will be completed in ${module}.`} />
      <EmptyState title="Coming soon" description={`Planned in ${module}.`} />
    </Container>
  );
}
