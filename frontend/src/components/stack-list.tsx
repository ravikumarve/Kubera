interface StackItem {
  label: string;
  value: string;
}

const stackData: StackItem[] = [
  { label: "Frontend Client", value: "Next.js 16 + Tailwind v4" },
  { label: "Backend Engine", value: "FastAPI + SQLAlchemy 2.0" },
  { label: "Payments", value: "Stripe Connect Express" },
  { label: "Background Jobs", value: "Celery + Redis 7" },
  { label: "Validation", value: "Pydantic v2 (Rust Core)" },
  { label: "Testing", value: "Playwright + pytest + Vitest" },
];

export function StackList() {
  return (
    <div className="border-t border-border-faint">
      {stackData.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between py-6 border-b border-border-faint"
        >
          <span className="text-[0.95rem] text-text-muted">{item.label}</span>
          <span className="font-mono text-xs uppercase tracking-wider text-text-main bg-bg-panel px-3 py-1.5 border border-border-light">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
