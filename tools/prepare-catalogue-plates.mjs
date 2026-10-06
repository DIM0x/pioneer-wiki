#!/usr/bin/env node
/**
 * Accessions the reviewed plates of the catalogue: node tools/prepare-catalogue-plates.mjs [package-dir]
 *
 * Reads the curation package's asset-manifest.json (default
 * handoff/museum-upgrade/) and takes only plates whose review has passed —
 * style, species identity and composition all "approved". Each is cut to
 * transparency the same way tools/prepare-plates.mjs cuts specimen plates
 * (divide by its own paper ground, then colour-to-alpha), so it prints straight
 * onto the page with no rectangle, and written to public/catalogue/<id>.webp.
 * public/catalogue/plates.json lists them with alt text, caption, credit and
 * licence; anything not listed shows as a plate in preparation on the site.
 *
 * Generation prompts and model names stay in the package: readers never see a
 * provenance label (rule frontendGenerationLabel: false).
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const PKG = process.argv[2] ?? "handoff/museum-upgrade";
const OUT = "public/catalogue";
const APPROVED = "approved";

const manifest = JSON.parse(readFileSync(join(PKG, "asset-manifest.json"), "utf8").replace(/^﻿/, ""));
const taxonomy = JSON.parse(readFileSync(join(PKG, "taxonomy-map.json"), "utf8").replace(/^﻿/, ""));
const families = new Map(taxonomy.families.map((f) => [f.id, f]));
const genera = new Map(taxonomy.categories.map((c) => [c.id, c]));
const articles = new Map(taxonomy.articles.map((a) => [a.slug, a]));

/** Alt text and caption from the catalogue itself — never from the prompt. */
function words(asset) {
  if (asset.rank === "family") {
    const f = families.get(asset.ownerId);
    return {
      alt: {
        zh: `${f.taxonNameZh}（${f.scientificName}）的栖息环境：${asset.subjects.join("、")}。`,
        en: `The family ${f.scientificName} in its habitats: ${asset.subjects.join(", ")}.`,
      },
      caption: { zh: `${f.taxonNameZh} ${f.scientificName}`, en: f.scientificName },
    };
  }
  if (asset.rank === "genus") {
    const c = genera.get(asset.ownerId);
    return {
      alt: {
        zh: `${c.scientificName} 属的栖息环境与形态：${asset.subjects.join("、")}。`,
        en: `The genus ${c.scientificName}, its habitat and forms: ${asset.subjects.join(", ")}.`,
      },
      caption: { zh: c.scientificName, en: c.scientificName },
    };
  }
  const a = articles.get(asset.ownerId);
  return {
    alt: { zh: `标本图：${a.species}。`, en: `Specimen plate: ${a.species}.` },
    caption: { zh: a.species, en: a.species },
  };
}

function groundColour(data, width, height, channels) {
  const samples = [[], [], []];
  const band = Math.max(4, Math.round(Math.min(width, height) * 0.02));
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      if (x > band && x < width - band && y > band && y < height - band) continue;
      const i = (y * width + x) * channels;
      for (let c = 0; c < 3; c++) samples[c].push(data[i + c]);
    }
  }
  return samples.map((s) => s.sort((a, b) => a - b)[Math.floor(s.length * 0.6)]);
}

const reviewed = manifest.assets.filter(
  (a) =>
    a.review &&
    [a.review.style, a.review.speciesIdentity, a.review.composition].every((v) => v === APPROVED) &&
    existsSync(join(PKG, a.outputPath)),
);

mkdirSync(OUT, { recursive: true });
const plates = [];
for (const asset of reviewed) {
  const img = sharp(join(PKG, asset.outputPath))
    .flatten({ background: "#ffffff" })
    .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true });
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const ground = groundColour(data, info.width, info.height, info.channels);
  if (ground.some((v) => v < 170)) {
    console.warn(`${asset.id}: skipped — its edge is not bare paper (ground rgb(${ground.join(",")}))`);
    continue;
  }
  const rgba = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0, o = 0; i < data.length; i += info.channels, o += 4) {
    const p = [0, 1, 2].map((c) => Math.min(1, data[i + c] / (ground[c] * 0.94)));
    const alpha = Math.max(1 - p[0], 1 - p[1], 1 - p[2]);
    for (let c = 0; c < 3; c++)
      rgba[o + c] = alpha > 0 ? Math.round(255 * Math.max(0, Math.min(1, (p[c] - (1 - alpha)) / alpha))) : 0;
    rgba[o + 3] = Math.round(alpha * 255);
  }
  await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
    .webp({ quality: 84, alphaQuality: 90 })
    .toFile(join(OUT, `${asset.id}.webp`));
  plates.push({
    id: asset.id,
    rank: asset.rank,
    ownerId: asset.ownerId,
    src: `/catalogue/${asset.id}.webp`,
    width: info.width,
    height: info.height,
    ...words(asset),
    credit: asset.credit,
    license: asset.license,
  });
  console.log(`${asset.id}: ${info.width}x${info.height}`);
}

// Withdraw plates that are no longer approved.
const keep = new Set(plates.map((p) => `${p.id}.webp`));
for (const file of readdirSync(OUT).filter((f) => f.endsWith(".webp") && !keep.has(f))) rmSync(join(OUT, file));

plates.sort((a, b) => a.id.localeCompare(b.id));
writeFileSync(join(OUT, "plates.json"), JSON.stringify(plates, null, 2) + "\n");
for (const cache of [".next/cache/images", ".next/dev/cache/images"]) rmSync(cache, { recursive: true, force: true });
console.log(`${plates.length} of ${manifest.assets.length} plates accessioned; the rest stay in preparation.`);
