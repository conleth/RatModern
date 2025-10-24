export type UserRole =
  | "architect"
  | "developer"
  | "tester"
  | "business-analyst"
  | "data-scientist"
  | "executive";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  rallyRefreshToken?: string;
};
