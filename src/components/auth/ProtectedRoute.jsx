import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Container from '../ui/Container.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';
import { EmptyState } from '../ui/StateView.jsx';
import Button from '../ui/Button.jsx';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Container className="py-10 md:py-14">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="mt-4 h-4 w-80" />
        <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {Array.from({ length: 12 }, (_, i) => (
            <Skeleton key={i} className="aspect-[2/3] w-full rounded-xl" />
          ))}
        </div>
      </Container>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <Container className="py-10 md:py-14">
        <EmptyState
          icon="shield"
          title="Admin access required"
          description="Your account does not have permission to view this page."
          action={<Button to="/" variant="secondary">Back to home</Button>}
        />
      </Container>
    );
  }

  return children;
}
