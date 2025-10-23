import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { loadRallyConfig } from "../config/rally.js";
import { getTicketingAdapter } from "../ticketing/index.js";

const rallyTokenSchema = z.object({
  code: z.string()
});

export function buildRallyAuthorizeUrl(state?: string) {
  const config = loadRallyConfig();
  const search = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: "openid full"
  });

  if (state) {
    search.append("state", state);
  }

  return `${config.authorizeUrl}?${search.toString()}`;
}

export async function startRallyOAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const state = request.query
    ? new URLSearchParams(request.query as Record<string, string>).get("state")
    : undefined;

  const authorizeUrl = buildRallyAuthorizeUrl(state ?? undefined);

  return reply.redirect(authorizeUrl);
}

export async function exchangeRallyCode(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const parseResult = rallyTokenSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.badRequest("Missing Rally authorization code.");
  }

  const { code } = parseResult.data;
  const adapter = getTicketingAdapter("rally");

  try {
    const tokens = await adapter.exchangeCode(code);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  } catch (error) {
    request.log.error({ err: error }, "Rally token exchange failed");
    return reply.internalServerError("Failed to exchange Rally code.");
  }
}

