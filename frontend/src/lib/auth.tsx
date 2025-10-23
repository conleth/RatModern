import { PropsWithChildren, createContext, useContext, useMemo, useState } from "react";

export type UserRole =
  | "architect"
  | "developer"
  | "tester"
  | "business-analyst"
  | "executive";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type AuthContextValue = {
  user: AuthenticatedUser | null;
  rallyAccessToken: string | null;
  login: (
    data: AuthenticatedUser,
    options?: {
      rallyAccessToken?: string;
    }
  ) => void;
  logout: () => void;
  setRallyAccessToken: (token: string | null) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [rallyAccessToken, setRallyAccessTokenState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem("rallyAccessToken");
  });

  const setRallyAccessToken = (token: string | null) => {
    setRallyAccessTokenState(token);
    if (typeof window !== "undefined") {
      if (token) {
        window.sessionStorage.setItem("rallyAccessToken", token);
      } else {
        window.sessionStorage.removeItem("rallyAccessToken");
      }
    }
  };

  const value = useMemo(
    () => ({
      user,
      rallyAccessToken,
      setRallyAccessToken,
      login: (
        data: AuthenticatedUser,
        options?: { rallyAccessToken?: string }
      ) => {
        setUser(data);
        if (options?.rallyAccessToken) {
          setRallyAccessToken(options.rallyAccessToken);
        }
      },
      logout: () => {
        setUser(null);
        setRallyAccessToken(null);
      }
    }),
    [user, rallyAccessToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
