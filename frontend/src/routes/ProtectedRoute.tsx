import { type ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../lib/auth";

type ProtectedRouteProps = {
  children: ReactElement;
};

function Guard({ children }: ProtectedRouteProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  return <Guard>{children}</Guard>;
}
