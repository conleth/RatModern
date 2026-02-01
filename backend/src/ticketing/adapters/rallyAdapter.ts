import fetch from "node-fetch";

import { loadRallyConfig } from "../../config/rally.js";
import {
  AdapterFactory,
  LinkRallyPayload,
  CreateTicketPayload,
  CreateTicketResponse,
  TicketingAdapter,
  TicketingContext
} from "../ticketingAdapter.js";

type RallyTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
};

async function postForm(url: string, form: URLSearchParams) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: form
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Rally token request failed: ${response.status} ${text}`);
  }

  return (await response.json()) as RallyTokenResponse;
}

class RallyAdapter implements TicketingAdapter {
  public readonly name = "rally";

  async exchangeCode(code: string): Promise<{
    accessToken: string;
    refreshToken?: string;
  }> {
    const config = loadRallyConfig();
    const form = new URLSearchParams();
    form.append("grant_type", "authorization_code");
    form.append("code", code);
    form.append("redirect_uri", config.redirectUri);
    form.append("client_id", config.clientId);
    form.append("client_secret", config.clientSecret);

    const tokenResponse = await postForm(config.tokenUrl, form);

    return {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token
    };
  }

  async linkTask(
    payload: LinkRallyPayload,
    context: TicketingContext
  ): Promise<void> {
    const config = loadRallyConfig();
    const response = await fetch(
      `${config.apiBaseUrl}/hierarchicalrequirement/${payload.workItemId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${context.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          CustomFields: {
            OWASPTaskId__c: payload.taskId,
            ...payload.metadata
          }
        })
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to link Rally work item: ${text}`);
    }
  }

  async createTask(
    payload: CreateTicketPayload,
    context: TicketingContext
  ): Promise<CreateTicketResponse> {
    const config = loadRallyConfig();

    // Map ticket types to Rally artifact types
    const rallyTypeMap: Record<string, string> = {
      story: "hierarchicalrequirement",
      task: "task",
      defect: "defect",
      epic: "portfolioitem/feature"
    };

    const rallyType = rallyTypeMap[payload.ticketType] || "task";

    const response = await fetch(`${config.apiBaseUrl}/${rallyType}/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${context.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        Name: payload.title,
        Description: payload.description,
        Schedule: {
          _ref: "/release/default" // Default release; can be customized
        },
        CustomFields: {
          OWASPGenerated__c: true,
          UserRole__c: context.userRole,
          ...payload.metadata
        },
        RelatedItems: payload.relatedItems?.map((item) => ({ _ref: item })) ?? []
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to create Rally ticket: ${response.status} ${text}`);
    }

    const result = (await response.json()) as {
      CreateResult: {
        Object: {
          _ref: string;
          ObjectID: number;
        };
      };
    };

    const rallyUrl = `${config.apiBaseUrl}${result.CreateResult.Object._ref}`;
    const ticketId = result.CreateResult.Object._ref.split("/").pop() || "unknown";

    return {
      id: ticketId,
      url: rallyUrl,
      status: "created"
    };
  }

  async getWorkItem(
    workItemId: string,
    context: TicketingContext
  ): Promise<unknown> {
    const config = loadRallyConfig();
    const response = await fetch(
      `${config.apiBaseUrl}/artifact/${encodeURIComponent(workItemId)}`,
      {
        headers: {
          Authorization: `Bearer ${context.accessToken}`
        }
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to read Rally work item: ${text}`);
    }

    return response.json();
  }
}

export const createRallyAdapter: AdapterFactory = () => new RallyAdapter();

