import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

import { useAuth, AuthenticatedUser } from "../lib/auth";
import { fetchMockSession, getEnvMockUser } from "../lib/api";

type LoadStatus = "idle" | "loading" | "success" | "error";

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname ?? "/dashboard";

  const [status, setStatus] = useState<LoadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [envUser, setEnvUser] = useState<AuthenticatedUser | null>(null);

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, from, navigate]);

  useEffect(() => {
    if (user || status === "loading" || status === "success") {
      return;
    }

    const envUserFallback = getEnvMockUser();
    if (envUserFallback) {
      setEnvUser(envUserFallback);
      setStatus("success");
      login(envUserFallback);
      return;
    }

    const loadSession = async () => {
      try {
        setStatus("loading");
        const { user: sessionUser } = await fetchMockSession();
        setEnvUser(sessionUser);
        setStatus("success");
        login(sessionUser);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unexpected error loading mock session."
        );
        setStatus("error");
      }
    };

    void loadSession();
  }, [user, status, login]);

  const retry = () => {
    setErrorMessage(null);
    setStatus("idle");
  };

  const renderBody = () => {
    switch (status) {
      case "loading":
        return <p className="text-sm text-muted-foreground">Loading environment session…</p>;
      case "success":
        return envUser ? (
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              Logged in as <span className="font-medium">{envUser.name}</span> (
              {envUser.email}) with the <span className="font-medium">{envUser.role}</span> role.
            </p>
            <p className="text-xs text-muted-foreground">
              Update `MOCK_USER_*` variables in your environment to change this profile.
            </p>
          </div>
        ) : null;
      case "error":
        return (
          <div className="space-y-4">
            <div className="space-y-2 text-sm">
              <p className="font-medium text-destructive">Unable to load mock session.</p>
              <p className="text-muted-foreground">{errorMessage}</p>
              <p className="text-muted-foreground">
                Ensure `MOCK_USER_*` variables are set in the backend or `VITE_MOCK_USER_*`
                variables are provided to the frontend, or that the backend is running locally.
              </p>
            </div>
            <Button onClick={retry}>Retry</Button>
          </div>
        );
      case "idle":
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl">OWASP RAT Modern</CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            Local development login uses environment-provided credentials.
          </p>
        </CardHeader>
        <CardContent>{renderBody()}</CardContent>
      </Card>
    </div>
  );
}
