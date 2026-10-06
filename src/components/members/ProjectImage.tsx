"use client";

import { useState } from "react";
import Image from "next/image";

export function ProjectImage({ src, title, domain }: { src?: string; title: string; domain: string }) {
  const [failed, setFailed] = useState<string>();
  return (
    <div className="relative aspect-[1200/630] overflow-hidden bg-paper-deep">
      {src && failed !== src ? (
        <Image
          src={src}
          alt={title}
          width={1200}
          height={630}
          unoptimized
          referrerPolicy="no-referrer"
          className="size-full object-contain transition-transform duration-300 motion-reduce:transition-none group-hover:scale-[1.015]"
          onError={() => setFailed(src)}
        />
      ) : (
        <div className="flex size-full flex-col justify-between p-6 sm:p-8" style={{ color: "var(--plate-ink)" }}>
          <span className="font-mono text-meta break-all">{domain}</span>
          <span className="font-display text-h2 leading-tight break-words">{title}</span>
          <span aria-hidden="true" className="self-end font-display text-h3">
            ↗
          </span>
        </div>
      )}
    </div>
  );
}
