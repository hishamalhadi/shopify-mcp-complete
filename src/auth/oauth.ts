export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  domain: string;
}

export interface TokenResponse {
  access_token: string;
  scope: string;
  expires_in: number;
}

export interface TokenManager {
  getAccessToken(): Promise<string>;
  getScopes(): string[];
}

export function createTokenManager(config: OAuthConfig): TokenManager {
  let cachedToken: string | null = null;
  let tokenExpiry: number = 0;
  let scopes: string[] = [];

  // Refresh token 5 minutes before expiry
  const REFRESH_BUFFER_MS = 5 * 60 * 1000;

  async function fetchToken(): Promise<TokenResponse> {
    const endpoint = `https://${config.domain}/admin/oauth/access_token`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OAuth token request failed: ${response.status} ${text}`);
    }

    return response.json() as Promise<TokenResponse>;
  }

  async function getAccessToken(): Promise<string> {
    const now = Date.now();

    // Return cached token if still valid
    if (cachedToken && now < tokenExpiry - REFRESH_BUFFER_MS) {
      return cachedToken;
    }

    // Fetch new token
    console.error("Fetching new OAuth access token...");
    const tokenResponse = await fetchToken();

    cachedToken = tokenResponse.access_token;
    tokenExpiry = now + tokenResponse.expires_in * 1000;
    scopes = tokenResponse.scope.split(",").map((s) => s.trim());

    const expiresInHours = (tokenResponse.expires_in / 3600).toFixed(1);
    console.error(`Token acquired, expires in ${expiresInHours} hours`);
    console.error(`Scopes: ${scopes.join(", ")}`);

    return cachedToken;
  }

  function getScopes(): string[] {
    return scopes;
  }

  return {
    getAccessToken,
    getScopes,
  };
}
