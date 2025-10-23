export type RallyConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizeUrl: string;
  tokenUrl: string;
  apiBaseUrl: string;
};

export function loadRallyConfig(): RallyConfig {
  const {
    RALLY_CLIENT_ID,
    RALLY_CLIENT_SECRET,
    RALLY_REDIRECT_URI,
    RALLY_AUTHORIZE_URL,
    RALLY_TOKEN_URL,
    RALLY_API_BASE_URL
  } = process.env;

  if (!RALLY_CLIENT_ID || !RALLY_CLIENT_SECRET) {
    throw new Error("Rally OAuth client credentials are not configured.");
  }

  return {
    clientId: RALLY_CLIENT_ID,
    clientSecret: RALLY_CLIENT_SECRET,
    redirectUri: RALLY_REDIRECT_URI ?? "http://localhost:4000/oauth/rally/callback",
    authorizeUrl:
      RALLY_AUTHORIZE_URL ??
      "https://rally1.rallydev.com/login/oauth2/auth",
    tokenUrl:
      RALLY_TOKEN_URL ??
      "https://rally1.rallydev.com/login/oauth2/token",
    apiBaseUrl: RALLY_API_BASE_URL ?? "https://rally1.rallydev.com/slm/webservice/v2.0"
  };
}

