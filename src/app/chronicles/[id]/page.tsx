import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CHRONICLE_KINDS, CHRONICLE_RESOURCE_KINDS } from "@/lib/model/vocab";
import { getLang, getT } from "@/lib/i18n/server";
import { getServices } from "@/lib/services";
import { formatDate } from "@/lib/format";
import { RunningHead } from "@/components/book/RunningHead";
import { Vignette } from "@/components/book/Vignette";
import { Bookplate } from "@/components/members/Bookplate";
import { Markdown } from "@/components/markdown/Markdown";
import { ReadingControls } from "@/components/reading/ReadingControls";

export async function generateMetadata({ params }: PageProps<"/chronicles/[id]">): Promise<Metadata> {
  const [{ id }, lang] = await Promise.all([params, getLang()]);
  const found = await getServices().chronicles.getChronicle(id);
  return found ? { title: `${found.title[lang]} · 纪行 Chronicles` } : {};
}

/**
 * One day of the annals: the register number and date as the folio, the kind
 * and who was present, the recordings and handouts (each at its own address,
 * never copied here), the plates filed with the record, and the account itself
 * in whichever languages it was written in.
 */
export default async function ChroniclePage({ params }: PageProps<"/chronicles/[id]">) {
  const { id } = await params;
  const { chronicles, references, community } = getServices();
  const [found, all, members] = await Promise.all([
    chronicles.getChronicle(id),
    chronicles.listChronicles(),
    community.listMembers(),
  ]);
  if (!found) notFound();

  const { lang, t } = await getT();
  const zh = lang === "zh";
  const meta = CHRONICLE_KINDS[found.kind];
  const byId = new Map(members.map((member) => [member.id, member]));
  const hosts = found.hostIds.map((hostId) => byId.get(hostId)).filter((member) => member !== undefined);
  const plates = (
    await Promise.all(
      found.gallery.map(async (item) => {
        const asset = await references.getAsset(item.assetId);
        return asset ? { asset, caption: item.caption } : null;
      }),
    )
  ).filter((plate) => plate !== null);

  // The register runs newest first, so the record after this one is older.
  const at = all.findIndex((record) => record.id === found.id);
  const older = at >= 0 ? all[at + 1] : undefined;
  const newer = at > 0 ? all[at - 1] : undefined;

  return (
    <article data-reading-page={found.body ? "" : undefined} data-part="chronicles" className="flex flex-col">
      <RunningHead
        left={
          <Link href="/chronicles" transitionTypes={["nav-back"]} className="no-underline hover:text-ink">
            ← {t("chronicles.back")}
          </Link>
        }
        right={`No. ${String(found.number).padStart(3, "0")} · ${formatDate(found.date, lang)}`}
      />

      {found.body ? <ReadingControls /> : null}
      <header
        data-reading-header
        className="pw-ink-over mt-(--space-block) grid gap-6 border-2 border-part p-6 sm:grid-cols-[1fr_auto] sm:p-8"
      >
        <div>
          <p className="flex flex-wrap items-center gap-x-3 font-mono text-meta tracking-[0.16em] text-part-ink uppercase">
            <span>{meta.label[lang]}</span>
            <time dateTime={found.date} className="text-ink-3">
              {formatDate(found.date, lang)}
            </time>
            {found.sample ? <span className="pw-stamp normal-case">{zh ? "示例" : "sample"}</span> : null}
          </p>
          <h1 className="mt-3 font-display text-[clamp(2rem,4vw,3.25rem)] leading-tight tracking-[-0.02em] text-balance">
            {found.title[lang]}
          </h1>
          {found.title[zh ? "en" : "zh"] !== found.title[lang] ? (
            <p lang={zh ? "en" : "zh-CN"} className="mt-1 font-display text-h4 text-ink-3">
              {found.title[zh ? "en" : "zh"]}
            </p>
          ) : null}
          <p className="mt-4 max-w-[44em] text-body leading-relaxed text-ink-2">{found.summary[lang]}</p>
          {hosts.length ? (
            <p className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-small text-ink-3">
              <span className="font-mono text-meta tracking-[0.14em] uppercase">{t("chronicles.host")}</span>
              {hosts.map((member) => (
                <Link
                  key={member.id}
                  href={`/members/${member.handle}`}
                  className="group flex items-center gap-2 no-underline"
                >
                  <Bookplate
                    plate={member.plate}
                    name={member.name}
                    lang={lang}
                    mini
                    className="w-7 shadow-sheet transition-transform duration-(--dur-quick) group-hover:-rotate-6"
                  />
                  <span className="font-display text-lead text-ink">
                    <span className="pw-link">{member.name[lang]}</span>
                  </span>
                </Link>
              ))}
            </p>
          ) : null}
        </div>
        <Vignette name={meta.emblem} className="hidden w-28 sm:block" sizes="112px" />
      </header>

      {found.resources.length ? (
        <section aria-labelledby="chronicle-resources" className="mt-(--space-section)">
          <h2 id="chronicle-resources" className="mb-6 font-display text-h2 text-ink">
            {t("chronicles.resources")}
          </h2>
          <ul className="mx-auto flex w-full max-w-4xl flex-col">
            {found.resources.map((resource, i) => (
              <li
                key={`${resource.kind}-${i}`}
                className="grid grid-cols-[4.5rem_1fr] items-baseline gap-4 border-b border-rule py-4"
              >
                <span className="font-mono text-meta tracking-[0.12em] text-part-ink uppercase">
                  {CHRONICLE_RESOURCE_KINDS[resource.kind][lang]}
                </span>
                <span className="min-w-0">
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="pw-link font-display text-lead text-ink"
                  >
                    {resource.label[lang]} <span className="pw-nudge">↗</span>
                  </a>
                  {resource.detail ? (
                    <span className="ml-3 font-mono text-meta text-ink-3">{resource.detail}</span>
                  ) : null}
                  {resource.note ? (
                    <span className="mt-1 block text-small leading-relaxed text-ink-3">{resource.note[lang]}</span>
                  ) : null}
                  <span className="mt-1 block truncate font-mono text-[0.6875rem] text-ink-3">
                    {resource.url.replace(/^https?:\/\//, "")}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {plates.length ? (
        <section data-reading-extra aria-labelledby="chronicle-gallery" className="mt-(--space-section)">
          <h2 id="chronicle-gallery" className="mb-8 font-display text-h2 text-ink">
            {t("chronicles.gallery")}
          </h2>
          <ol className="grid gap-10 sm:grid-cols-2">
            {plates.map(({ asset, caption }, i) => (
              <li key={asset.id} data-reveal="ink" style={{ "--i": i % 2 } as React.CSSProperties} className="pw-lift">
                <figure>
                  <span className="pw-print block">
                    <Image
                      src={asset.src}
                      width={asset.width}
                      height={asset.height}
                      alt={asset.alt[lang]}
                      sizes="(min-width: 640px) 45vw, 90vw"
                      className="h-auto w-full"
                    />
                  </span>
                  <figcaption className="mt-3 text-small leading-relaxed text-ink-3">
                    {(caption ?? asset.caption)?.[lang]}
                    <span className="mt-1 block font-mono text-[0.6875rem] tracking-[0.1em] uppercase">
                      {asset.credit} · {asset.license}
                    </span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {found.body ? (
        <section aria-labelledby="chronicle-account" className="mx-auto mt-(--space-section) w-full max-w-(--measure)">
          <h2 id="chronicle-account" className="mb-6 font-display text-h2 text-ink">
            {zh ? "纪事" : "The account"}
          </h2>
          <Markdown lang={lang}>{found.body}</Markdown>
        </section>
      ) : null}

      <nav
        aria-label={t("book.pageNav")}
        className="pw-ink-over mt-(--space-section) flex flex-wrap items-baseline justify-between gap-4 pt-6 text-small"
      >
        {older ? (
          <Link href={`/chronicles/${older.id}`} className="pw-link max-w-[45%] text-part-ink">
            ← {t("chronicles.prev")} · {older.title[lang]}
          </Link>
        ) : (
          <span />
        )}
        {newer ? (
          <Link href={`/chronicles/${newer.id}`} className="pw-link max-w-[45%] text-right text-part-ink">
            {t("chronicles.next")} · {newer.title[lang]} →
          </Link>
        ) : null}
      </nav>
    </article>
  );
}
