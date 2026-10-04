import { cn } from "@/lib/utils";

type SurfaceTag = "div" | "section" | "article" | "aside" | "nav" | "header" | "li";

interface PaperSurfaceProps extends React.HTMLAttributes<HTMLElement> {
  as?: SurfaceTag;
  /** sheet = archive page laid on paper; well = recessed panel. */
  variant?: "sheet" | "well";
}

/** The two surfaces content may sit on. Styling lives in styles/paper.css. */
export function PaperSurface({ as: Tag = "div", variant = "sheet", className, ...rest }: PaperSurfaceProps) {
  return <Tag className={cn(variant === "sheet" ? "pw-sheet" : "pw-well", className)} {...rest} />;
}
