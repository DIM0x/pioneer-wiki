"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { BookOpen, Maximize, Minimize, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { LanguageToggle } from "@/components/shell/LanguageToggle";
import { useReading } from "./ReadingProvider";

function subscribeFullscreen(callback: () => void) {
  document.addEventListener("fullscreenchange", callback);
  return () => document.removeEventListener("fullscreenchange", callback);
}

export function ReadingControls() {
  const { lang } = useI18n();
  const zh = lang === "zh";
  const { textOnly, setTextOnly } = useReading();
  const button = useRef<HTMLButtonElement>(null);
  const [fullscreenFailed, setFullscreenFailed] = useState(false);
  const fullscreen = useSyncExternalStore(
    subscribeFullscreen,
    () => Boolean(document.fullscreenElement),
    () => false,
  );
  const fullscreenAvailable = useSyncExternalStore(
    subscribeFullscreen,
    () => Boolean(document.fullscreenEnabled),
    () => false,
  );

  useEffect(() => {
    if (!textOnly) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || event.isComposing) return;
      // Let dialogs and menus consume their own Escape first.
      if (document.querySelector('[role="dialog"], [role="menu"], [role="listbox"]')) return;
      event.preventDefault();
      setTextOnly(false);
      button.current?.focus({ preventScroll: true });
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [textOnly, setTextOnly]);

  async function toggleFullscreen() {
    setFullscreenFailed(false);
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        const root = document.documentElement;
        root.setAttribute("data-reading-fullscreen", "");
        await root.requestFullscreen();
      }
    } catch {
      setFullscreenFailed(true);
    }
  }

  return (
    <div className="pw-reading-controls" role="group" aria-label={zh ? "阅读模式" : "Reading mode"}>
      {textOnly ? (
        <span className="pw-reading-label">
          <BookOpen size={16} aria-hidden="true" />
          {zh ? "纯文字阅读" : "Text reading"}
        </span>
      ) : null}
      <div className="pw-reading-actions">
        {textOnly ? <LanguageToggle /> : null}
        {textOnly && fullscreenAvailable ? (
          <button
            type="button"
            className="pw-reading-action"
            aria-label={fullscreen ? (zh ? "退出全屏" : "Exit fullscreen") : zh ? "全屏阅读" : "Read fullscreen"}
            title={fullscreen ? (zh ? "退出全屏" : "Exit fullscreen") : zh ? "全屏阅读" : "Read fullscreen"}
            aria-pressed={fullscreen}
            onClick={() => void toggleFullscreen()}
          >
            {fullscreen ? <Minimize size={16} aria-hidden="true" /> : <Maximize size={16} aria-hidden="true" />}
          </button>
        ) : null}
        <button
          ref={button}
          type="button"
          className="pw-reading-action"
          aria-pressed={textOnly}
          title={
            textOnly
              ? zh
                ? "退出纯文字阅读（Esc）"
                : "Exit text reading (Esc)"
              : zh
                ? "隐藏图版、标签和插图，专注正文"
                : "Hide plates, labels and illustrations to focus on the text"
          }
          onClick={() => setTextOnly(!textOnly)}
        >
          {textOnly ? <X size={16} aria-hidden="true" /> : <BookOpen size={16} aria-hidden="true" />}
          {textOnly ? (zh ? "退出阅读" : "Exit reading") : zh ? "纯文字阅读" : "Text reading"}
          {textOnly ? (
            <kbd className="pw-reading-escape" aria-hidden="true">
              Esc
            </kbd>
          ) : null}
        </button>
      </div>
      {fullscreenFailed ? (
        <span className="pw-reading-notice" role="status">
          {zh ? "浏览器暂不支持全屏，可继续纯文字阅读。" : "Fullscreen is unavailable. You can keep reading here."}
        </span>
      ) : null}
    </div>
  );
}
