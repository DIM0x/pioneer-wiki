import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Chronicle, Lang, Member } from "@/lib/model/types";
import { CHRONICLE_KINDS, CHRONICLE_RESOURCE_KINDS } from "@/lib/model/vocab";
import { getLang, getT } from "@/lib/i18n/server";
import { getServices } from "@/lib/services";
import { formatDate } from "@/lib/format";
import { chronicleHref, chronicleListHref, readChronicleView, type ChronicleView } from "@/lib/chronicles/query";
import { addressOf, openableUrl, registerNumber, tallyText } from "@/lib/chronicles/present";
import { RunningHead } from "@/components/book/RunningHead";
import { Vignette } from "@/components/book/Vignette";
import { Bookplate } from "@/components/members/Bookplate";
import { Markdown } from "@/components/markdown/Markdown";
import { ReadingControls } from "@/components/reading/ReadingControls";
import { ChronicleBackLink } from "@/components/chronicles/ChronicleLinks";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/chronicles/[id]">): Promise<Metadata> {
  const [{ id }, lang] = await Promise.all([params, getLang()]);
  const found = await getServices().chronicles.getChronicle(id);
  return found ? { title: `${found.title[lang]} · 纪行 Chronicles` } : {};
}

/**
 * One record of the archive. The facts come first (date, kind, number, who
 * took part, what materials there are) and say plainly when the record is a
 * sample; then the account at reading width beside the materials and the
 * people, then the records either side in the full register. The annals file
 * no plates: a record is its facts, its account and its materials. The way back returns to the list the
 * reader came from, words and filters included.
 */
export default async function ChroniclePage({ params, searchParams }: PageProps<"/chronicles/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { chronicles, community } = getServices();
  const [found, members, adjacent] = await Promise.all([
    chronicles.getChronicle(id),
    community.listMembers(),
    chronicles.adjacentChronicles(id),
  ]);
  if (!found) notFound();

  const { lang, t } = await getT();
  const zh = lang === "zh";
  const other: Lang = zh ? "en" : "zh";
  const kind = CHRONICLE_KINDS[found.kind];
  const view = readChronicleView(query);
  const list = chronicleListHref(view, { page: view.page });

  const byId = new Map(members.map((member) => [member.id, member]));
  const hosts = found.hostIds.map((hostId) => byId.get(hostId)).filter((member) => member !== undefined);
  const missing = found.hostIds.length - hosts.length;
  const sections = [
    found.body ? { id: "chronicle-account", label: t("chronicles.account") } : null,
    found.resources.length
      ? { id: "chronicle-resources", label: t("chronicles.resources"), count: found.resources.length }
      : null,
    hosts.length ? { id: "chronicle-people", label: t("chronicles.people"), count: hosts.length } : null,
  ].filter((section) => section !== null);

  const label = "font-mono text-[0.6875rem] tracking-[0.14em] text-ink-3 uppercase";
  const heading = "mb-5 border-b border-part/40 pb-2 font-display text-h3 text-ink";
  const facts = [
    { term: t("chronicles.date"), value: <time dateTime={found.date}>{formatDate(found.date, lang)}</time> },
    { term: t("chronicles.colKind"), value: kind.label[lang] },
    {
      term: t("chronicles.number"),
      value: <span className="font-mono text-small">{registerNumber(found.number)}</span>,
    },
    {
      term: t("chronicles.colPeople"),
      value: hosts.length ? (
        <a href="#chronicle-people" className="pw-link">
          {hosts
            .slice(0, 2)
            .map((member) => member.name[lang])
            .join(zh ? "、" : ", ")}
          {hosts.length > 2 ? (zh ? ` 等 ${hosts.length} 人` : ` +${hosts.length - 2} more`) : ""}
        </a>
      ) : (
        "—"
      ),
    },
    {
      term: t("chronicles.colMaterials"),
      value: found.resources.length ? (
        <a href="#chronicle-resources" className="pw-link">
          {tallyText(found.resources, lang)}
        </a>
      ) : (
        "—"
      ),
    },
  ];

  const resources = found.resources.length ? (
    <section id="chronicle-resources" aria-labelledby="chronicle-resources-title" className="scroll-mt-24">
      <h2 id="chronicle-resources-title" className={heading}>
        {t("chronicles.resources")}
      </h2>
      <ul className="flex flex-col">
        {found.resources.map((resource, i) => {
          const href = openableUrl(resource.url);
          return (
            <li key={`${resource.kind}-${i}`} className="border-b border-rule py-3.5 first:pt-0">
              <p className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-part-ink uppercase">
                  {CHRONICLE_RESOURCE_KINDS[resource.kind][lang]}
                </span>
                {resource.detail ? (
                  <span className="font-mono text-[0.6875rem] text-ink-3">{resource.detail}</span>
                ) : null}
              </p>
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block font-display text-lead leading-snug text-ink no-underline"
                >
                  <span className="pw-link">{resource.label[lang]}</span>{" "}
                  <span aria-hidden="true" className="pw-nudge text-part-ink">
                    ↗
                  </span>
                  <span className="sr-only"> ({t("chronicles.external")})</span>
                </a>
              ) : (
                <p className="mt-1 font-display text-lead leading-snug text-ink-2">{resource.label[lang]}</p>
              )}
              {resource.note ? (
                <p className="mt-1 text-small leading-relaxed text-ink-3">{resource.note[lang]}</p>
              ) : null}
              {href ? (
                <p title={href} className="mt-1 line-clamp-2 font-mono text-[0.6875rem] break-all text-ink-3">
                  {addressOf(href)}
                </p>
              ) : (
                <p className="mt-1 text-small text-brick-ink">{t("chronicles.badUrl")}</p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  ) : null;

  const people =
    hosts.length || missing ? (
      <section id="chronicle-people" aria-labelledby="chronicle-people-title" className="scroll-mt-24">
        <h2 id="chronicle-people-title" className={heading}>
          {t("chronicles.people")}
        </h2>
        <ul className="flex flex-col gap-3">
          {hosts.map((member) => (
            <Person key={member.id} member={member} lang={lang} />
          ))}
        </ul>
        {missing ? <p className="mt-3 text-small text-ink-3">{t("chronicles.missingPeople")}</p> : null}
      </section>
    ) : null;

  return (
    <article data-reading-page={found.body ? "" : undefined} data-part="chronicles" className="flex flex-col">
      <RunningHead
        left={
          <ChronicleBackLink href={list} record={chronicleHref(found.id, view)} className="no-underline hover:text-ink">
            ← {t("chronicles.back")}
          </ChronicleBackLink>
        }
        right={`${registerNumber(found.number)} · ${formatDate(found.date, lang)}`}
      />

      {found.body ? <ReadingControls /> : null}
      <header
        data-reading-header
        className="mt-(--space-block) grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto]"
      >
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-meta tracking-[0.16em] text-part-ink uppercase">
            <span>{kind.label[lang]}</span>
            <span aria-hidden="true" className="text-ink-3">
              ·
            </span>
            <time dateTime={found.date} className="text-ink-3">
              {formatDate(found.date, lang)}
            </time>
            {found.sample ? <span className="pw-stamp normal-case">{t("chronicles.sample")}</span> : null}
          </p>
          <h1 className="mt-3 font-display text-[clamp(2rem,4vw,3.25rem)] leading-tight tracking-[-0.02em] text-balance">
            {found.title[lang]}
          </h1>
          {found.title[other] && found.title[other] !== found.title[lang] ? (
            <p lang={zh ? "en" : "zh-CN"} className="mt-1 font-display text-h4 text-ink-3">
              {found.title[other]}
            </p>
          ) : null}
          <p className="mt-4 max-w-[44em] text-lead leading-relaxed text-ink-2">{found.summary[lang]}</p>
        </div>
        <Vignette name={kind.emblem} className="-mt-4 hidden w-32 self-start sm:block" sizes="128px" />
      </header>

      {found.sample ? (
        <p className="mt-6 max-w-[52em] border-l-2 border-part py-1 pl-4 text-small leading-relaxed text-ink-2">
          {zh
            ? "这是一则示例记录：内容、参与成员与资料地址都是占位的，不是本会的真实会史。"
            : "This is a sample record: its account, members and addresses are placeholders, not the society's real history."}
        </p>
      ) : null}

      <dl
        data-reading-extra
        className="mt-8 grid grid-cols-2 rounded-lg border border-rule bg-paper-sheet/60 px-5 sm:grid-cols-3 lg:grid-cols-5 lg:px-0"
      >
        {facts.map((fact) => (
          <div
            key={fact.term}
            className="min-w-0 border-b border-rule py-3.5 pr-3 last:border-b-0 lg:border-b-0 lg:px-5 lg:not-first:border-l"
          >
            <dt className={label}>{fact.term}</dt>
            <dd className="mt-1 text-small text-ink">{fact.value}</dd>
          </div>
        ))}
      </dl>

      {sections.length > 1 ? (
        <nav
          data-reading-extra
          aria-label={t("chronicles.sections")}
          className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-small"
        >
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="pw-link inline-flex min-h-9 items-center gap-1.5 text-part-ink"
            >
              {section.label}
              {"count" in section ? <span className="font-mono text-meta text-ink-3">{section.count}</span> : null}
            </a>
          ))}
        </nav>
      ) : null}

      <div
        className={cn(
          "mt-(--space-block) grid gap-x-16 gap-y-12",
          found.body ? "lg:grid-cols-[minmax(0,1fr)_20rem]" : "lg:grid-cols-2",
        )}
      >
        {found.body ? (
          <>
            <section
              data-reading-body
              id="chronicle-account"
              aria-labelledby="chronicle-account-title"
              className="min-w-0 scroll-mt-24"
            >
              <h2 id="chronicle-account-title" className={heading}>
                {t("chronicles.account")}
              </h2>
              <div className="max-w-(--measure)">
                <Markdown lang={lang}>{found.body}</Markdown>
              </div>
            </section>
            {resources || people ? (
              <aside data-reading-extra className="flex min-w-0 flex-col gap-12">
                {resources}
                {people}
              </aside>
            ) : null}
          </>
        ) : (
          <>
            {resources}
            {people}
          </>
        )}
      </div>

      <nav
        data-reading-extra
        aria-label={t("chronicles.neighbours")}
        className="mt-(--space-section) grid gap-4 border-t-2 border-part pt-5 sm:grid-cols-2"
      >
        <Neighbour record={adjacent.older} view={view} lang={lang} label={`← ${t("chronicles.older")}`} />
        <Neighbour record={adjacent.newer} view={view} lang={lang} label={`${t("chronicles.newer")} →`} end />
      </nav>
    </article>
  );
}

function Person({ member, lang }: { member: Member; lang: Lang }) {
  return (
    <li>
      <Link href={`/members/${member.handle}`} className="group flex items-center gap-3 no-underline">
        <Bookplate
          plate={member.plate}
          name={member.name}
          lang={lang}
          mini
          className="w-8 shrink-0 shadow-sheet transition-transform duration-(--dur-quick) group-hover:-rotate-6"
        />
        <span className="min-w-0">
          <span className="block font-display text-lead leading-tight text-ink">
            <span className="pw-link">{member.name[lang]}</span>
          </span>
          <span className="block font-mono text-[0.6875rem] text-ink-3">@{member.handle}</span>
        </span>
      </Link>
    </li>
  );
}

/** A neighbouring record in the full register; the list the reader came from travels with it. */
function Neighbour({
  record,
  view,
  lang,
  label,
  end,
}: {
  record: Chronicle | null;
  view: ChronicleView;
  lang: Lang;
  label: string;
  end?: boolean;
}) {
  if (!record) return <span aria-hidden="true" />;
  return (
    <Link
      href={chronicleHref(record.id, view)}
      className={cn("group flex min-w-0 flex-col gap-1 no-underline", end && "sm:items-end sm:text-right")}
    >
      <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-part-ink uppercase">{label}</span>
      <span className="font-display text-lead leading-snug text-ink">
        <span className="pw-link">{record.title[lang]}</span>
      </span>
      <span className="font-mono text-[0.6875rem] text-ink-3">
        {registerNumber(record.number)} · {formatDate(record.date, lang)}
      </span>
    </Link>
  );
}
