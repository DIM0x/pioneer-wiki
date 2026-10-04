import "server-only";
import type { WikiServices } from "./contracts";
import { createMockServices } from "./mock";

const globalForServices = globalThis as typeof globalThis & { __pioneerServices?: WikiServices };

/*
 * Keep the selected service graph on globalThis during dev reloads so writes
 * and reads share one in-memory store.
 */
export function getServices(): WikiServices {
  const source = process.env.PIONEER_DATA_SOURCE ?? "mock";
  if (source !== "mock") throw new Error(`Unsupported PIONEER_DATA_SOURCE: ${source}`);
  if (!globalForServices.__pioneerServices) globalForServices.__pioneerServices = createMockServices();
  return globalForServices.__pioneerServices;
}

export type { WikiServices } from "./contracts";
