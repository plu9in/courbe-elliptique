import { useState, useRef, useEffect, type ReactNode } from "react";

interface Props {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
  badge?: ReactNode;
}

export function CollapsibleCard({ title, defaultOpen = true, children, badge }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">(defaultOpen ? "auto" : 0);

  useEffect(() => {
    if (!contentRef.current) return;
    if (open) {
      const h = contentRef.current.scrollHeight;
      setHeight(h);
      const timer = setTimeout(() => setHeight("auto"), 200);
      return () => clearTimeout(timer);
    } else {
      setHeight(contentRef.current.scrollHeight);
      requestAnimationFrame(() => setHeight(0));
    }
  }, [open]);

  return (
    <div className="card collapsible-card" data-open={open}>
      <button
        className="collapsible-header"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <span className="card-title" style={{ marginBottom: 0 }}>{title}</span>
        {badge && <span className="collapsible-badge">{badge}</span>}
        <span className="collapsible-chevron" data-open={open}>
          &#x25BC;
        </span>
      </button>
      <div
        ref={contentRef}
        className="collapsible-body"
        style={{
          height: typeof height === "number" ? `${height}px` : "auto",
          overflow: open && height === "auto" ? "visible" : "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}
