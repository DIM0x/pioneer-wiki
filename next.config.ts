import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * The Docker image sets NEXT_STANDALONE=true so the build emits
   * `.next/standalone`, the self-contained server the Dockerfile ships.
   * Left unset elsewhere, because `next start` — the documented local
   * production flow — does not support standalone output.
   */
  output: process.env.NEXT_STANDALONE === "true" ? "standalone" : undefined,
};

export default nextConfig;
