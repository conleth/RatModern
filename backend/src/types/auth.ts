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
  rallyRefreshToken?: string;
};

