import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';
import RouteError from './pages/RouteError.jsx';
import NotFound from './pages/NotFound.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';

const Home = lazy(() => import('./pages/Home.jsx'));
const Browse = lazy(() => import('./pages/Browse.jsx'));
const Genre = lazy(() => import('./pages/Genre.jsx'));
const Search = lazy(() => import('./pages/Search.jsx'));
const Schedule = lazy(() => import('./pages/Schedule.jsx'));
const AnimeDetails = lazy(() => import('./pages/AnimeDetails.jsx'));
const Watch = lazy(() => import('./pages/Watch.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Signup = lazy(() => import('./pages/Signup.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));
const Watchlist = lazy(() => import('./pages/Watchlist.jsx'));
const History = lazy(() => import('./pages/History.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const Dmca = lazy(() => import('./pages/Dmca.jsx'));
const Terms = lazy(() => import('./pages/Terms.jsx'));
const Privacy = lazy(() => import('./pages/Privacy.jsx'));
const Docs = lazy(() => import('./pages/Docs.jsx'));

function PageFallback() {
  return (
    <div className="mx-auto grid max-w-7xl place-items-center px-4 py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-label="Loading" />
    </div>
  );
}

const page = (Component) => (
  <Suspense fallback={<PageFallback />}>
    <Component />
  </Suspense>
);

const protectedPage = (Component, requireAdmin = false) => (
  <ProtectedRoute requireAdmin={requireAdmin}>{page(Component)}</ProtectedRoute>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <RouteError />,
    hydrateFallbackElement: <PageFallback />,
    children: [
      { index: true, element: page(Home) },
      { path: 'browse', element: page(Browse) },
      { path: 'genre/:name', element: page(Genre) },
      { path: 'search', element: page(Search) },
      { path: 'schedule', element: page(Schedule) },
      { path: 'anime/:anilistId', element: page(AnimeDetails) },
      { path: 'watch/:anilistId/:episode', element: page(Watch) },
      { path: 'login', element: page(Login) },
      { path: 'signup', element: page(Signup) },
      { path: 'forgot-password', element: page(ForgotPassword) },
      { path: 'reset-password', element: page(ResetPassword) },
      { path: 'watchlist', element: protectedPage(Watchlist) },
      { path: 'history', element: protectedPage(History) },
      { path: 'profile', element: protectedPage(Profile) },
      { path: 'admin', element: protectedPage(Admin, true) },
      { path: 'about', element: page(About) },
      { path: 'dmca', element: page(Dmca) },
      { path: 'terms', element: page(Terms) },
      { path: 'privacy', element: page(Privacy) },
      { path: 'docs', element: page(Docs) },
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
