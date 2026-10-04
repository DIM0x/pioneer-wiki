import { getT } from "@/lib/i18n/server";
import { ArchiveState } from "@/components/states/ArchiveState";
import { Vignette } from "@/components/book/Vignette";

export default async function Loading() {
  const { t } = await getT();
  return (
    <div className="mt-(--space-section) max-w-xl">
      <ArchiveState kind="loading" title={t("state.loading")} art={<Vignette name="radiolarian" />} />
    </div>
  );
}
