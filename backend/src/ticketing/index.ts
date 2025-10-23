import { AdapterFactory, TicketingAdapter } from "./ticketingAdapter.js";
import { createRallyAdapter } from "./adapters/rallyAdapter.js";

type AdapterRegistry = Record<string, AdapterFactory>;

const registry: AdapterRegistry = {
  rally: createRallyAdapter
};

export function getTicketingAdapter(name = "rally"): TicketingAdapter {
  const factory = registry[name];

  if (!factory) {
    throw new Error(`Ticketing adapter '${name}' is not registered.`);
  }

  return factory();
}

export function registerTicketingAdapter(
  name: string,
  factory: AdapterFactory
) {
  registry[name] = factory;
}

