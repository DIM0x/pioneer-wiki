import "server-only";
import type { WikiServices } from "./contracts";
import { createMockServices } from "./mock";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createSupabaseAuthAdapter } from "./supabase-auth";

const globalForServices = globalThis as typeof globalThis & { __pioneerServices?: WikiServices };

/*
 * Keep the selected service graph on globalThis during dev reloads so writes
 * and reads share one in-memory store.
 */
export function getServices(): WikiServices {
  const source = process.env.PIONEER_DATA_SOURCE ?? (hasSupabaseEnv() ? "supabase" : "mock");
  if (source !== "mock" && source !== "supabase") throw new Error(`Unsupported PIONEER_DATA_SOURCE: ${source}`);
  if (!globalForServices.__pioneerServices) {
    const services = createMockServices();
    if (source === "supabase") services.auth = createSupabaseAuthAdapter();
    globalForServices.__pioneerServices = services;
  }
  return globalForServices.__pioneerServices;
}

export type { WikiServices } from "./contracts";
