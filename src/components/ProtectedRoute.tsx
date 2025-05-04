
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Redirect to auth page if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Render children if authenticated
  return <Outlet />;
}

export function AuthRoute() {
  const { user, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Redirect to home page if already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  // Render children if not authenticated
  return <Outlet />;
}
