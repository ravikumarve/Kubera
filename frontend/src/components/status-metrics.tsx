interface StatusMetric {
  value: string;
  label: string;
}

const metrics: StatusMetric[] = [
  { value: "OAS", label: "OpenAPI 3.1 Docs" },
  { value: "ACID", label: "PostgreSQL 16" },
];

export function StatusMetrics() {
  return (
    <div className="grid grid-cols-2 gap-px border border-border-faint bg-border-faint">
      {metrics.map((metric) => (
        <div key={metric.value} className="bg-bg-surface py-12 px-8 text-center">
          <p className="font-display text-[3rem] font-bold leading-none mb-2">
            {metric.value}
          </p>
          <p className="font-mono text-xs uppercase tracking-wider text-text-muted">
            {metric.label}
          </p>
        </div>
      ))}
    </div>
  );
}
