import { useDocumentMeta } from '../lib/meta.js';
import Icon from '../components/ui/Icon.jsx';
import Button from '../components/ui/Button.jsx';

export default function NotFound() {
  useDocumentMeta({ title: 'Page not found', description: 'The page you are looking for does not exist.' });
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-3xl bg-brand/10 text-brand">
        <Icon name="search" size={38} />
      </div>
      <p className="mt-6 text-sm font-semibold tracking-widest text-brand">404</p>
      <h1 className="mt-1 text-3xl font-extrabold text-white">Page not found</h1>
      <p className="mt-2 text-sm text-zinc-400">
        This page slipped into another world. Check the URL or head back to the anime.
      </p>
      <div className="mt-7 flex gap-3">
        <Button to="/" size="md">
          <Icon name="home" size={16} />
          Go home
        </Button>
        <Button to="/browse" variant="secondary" size="md">
          Browse anime
        </Button>
      </div>
    </div>
  );
}
