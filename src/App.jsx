import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';
import RouteError from './pages/RouteError.jsx';
import NotFound from './pages/NotFound.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import Placeholder from './pages/Placeholder.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

const Home = lazy(() => import('./pages/Home.jsx'));

function PageFallback() {
  return (
    <div className="mx-auto grid max-w-7xl place-items-center px-4 py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-label="Loading" />
    </div>
  );
}

const ph = (title, module, description) => (
  <Placeholder title={title} module={module} description={description} />
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <RouteError />,
    hydrateFallbackElement: <PageFallback />,
    children: [
      { index: true, element: <Suspense fallback={<PageFallback />}><Home /></Suspense> },
      { path: 'browse', element: ph('Browse', 'Module 3 (discovery pages)') },
      { path: 'genre/:name', element: ph('Genre', 'Module 3 (discovery pages)') },
      { path: 'search', element: ph('Search', 'Module 3 (discovery pages)') },
      { path: 'schedule', element: ph('Airing Schedule', 'Module 3 (discovery pages)') },
      { path: 'anime/:anilistId', element: ph('Anime details', 'Module 3 (details page)') },
      { path: 'watch/:anilistId/:episode', element: ph('Watch', 'Module 5 (player)') },
      { path: 'login', element: ph('Log in', 'Module 4 (auth)') },
      { path: 'signup', element: ph('Sign up', 'Module 4 (auth)') },
      { path: 'forgot-password', element: ph('Reset password', 'Module 4 (auth)') },
      { path: 'reset-password', element: ph('Set a new password', 'Module 4 (auth)') },
      { path: 'watchlist', element: ph('My Watchlist', 'Module 6 (library)') },
      { path: 'history', element: ph('Continue Watching', 'Module 6 (library)') },
      { path: 'profile', element: ph('Profile & Settings', 'Module 6 (library)') },
      { path: 'admin', element: ph('Admin Panel', 'Module 7 (admin)') },
      { path: 'about', element: ph('About Mr.Anime', 'Module 8 (static pages)') },
      { path: 'dmca', element: ph('DMCA & Contact', 'Module 8 (static pages)') },
      { path: 'terms', element: ph('Terms of Service', 'Module 8 (static pages)') },
      { path: 'privacy', element: ph('Privacy Policy', 'Module 8 (static pages)') },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
