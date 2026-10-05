import "server-only";
import type { WikiServices } from "./contracts";
import { createMockServices } from "./mock";
import { createSupabaseServices } from "./supabase";
import { hasSupabaseEnv } from "@/lib/supabase/config";

const globalForServices = globalThis as typeof globalThis & { __pioneerServices?: WikiServices };

/*
 * Keep the selected service graph on globalThis during dev reloads so writes
 * and reads share one in-memory store.
 */
export function getServices(): WikiServices {
  const source = process.env.PIONEER_DATA_SOURCE ?? (hasSupabaseEnv() ? "supabase" : "mock");
  if (source !== "mock" && source !== "supabase") throw new Error(`Unsupported PIONEER_DATA_SOURCE: ${source}`);
  if (!globalForServices.__pioneerServices) {
    globalForServices.__pioneerServices = source === "supabase" ? createSupabaseServices() : createMockServices();
  }
  return globalForServices.__pioneerServices;
}

export type { WikiServices } from "./contracts";
