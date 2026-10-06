import type { Category, DomainId } from "@/lib/model/types";

/**
 * Where each of the ten phyla went when the catalogue became family → genus
 * (curation package, legacy-domain-map.json). A phylum that moved whole into one
 * genus points at that genus; one that was split points at the family overview.
 * Old /domains/<phylum> links answer with a 308 to the target.
 */
export const LEGACY_DOMAINS: Record<DomainId, { kind: "family" | "category"; id: string }> = {
  algorithms: { kind: "family", id: "computing-foundations" },
  theory: { kind: "category", id: "computing-theory" },
  languages: { kind: "family", id: "software-development" },
  systems: { kind: "category", id: "operating-systems" },
  architecture: { kind: "category", id: "computer-architecture" },
  networking: { kind: "category", id: "networks-protocols" },
  distributed: { kind: "category", id: "distributed-systems" },
  databases: { kind: "category", id: "databases" },
  ml: { kind: "family", id: "ai" },
  security: { kind: "family", id: "security-reliability" },
};

/**
 * The genus an older client means when it files a new entry by phylum: the
 * phylum's own genus, or the first active genus of the family it was split into.
 */
export function genusForLegacyDomain(domain: DomainId, categories: Category[]): string | undefined {
  const target = LEGACY_DOMAINS[domain];
  if (!target) return undefined;
  if (target.kind === "category") return target.id;
  return categories
    .filter((c) => c.familyId === target.id && c.status === "active")
    .sort((a, b) => a.sortOrder - b.sortOrder)[0]?.id;
}
