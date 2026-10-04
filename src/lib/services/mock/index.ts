import { authors, sources, tags } from "@/mock/people";
import { assets } from "@/mock/assets";
import { createMockEntryRepository } from "./repository";
import { createMockCommunityRepository } from "./community";
import { createMockSearchAdapter } from "@/lib/search/adapter";
import type { WikiServices } from "@/lib/services/contracts";

export function createMockServices(): WikiServices {
  return {
    entries: createMockEntryRepository(),
    references: {
      listAuthors: async () => authors,
      listSources: async () => sources,
      listTags: async () => tags,
      getAsset: async (id) => assets.find((asset) => asset.id === id) ?? null,
    },
    search: createMockSearchAdapter(),
    auth: { getCurrentUser: async () => authors.find((author) => author.id === "a-qingkong") ?? null },
    community: createMockCommunityRepository(),
  };
}
