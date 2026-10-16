// Zero-dependency bar chart — a pure server component rendering static
// inline SVG. No charting or date library exists anywhere in this app
// today; adding one for a handful of admin-only bar charts would be a
// disproportionate new dependency ("prefer the smallest useful
// implementation").
export type BarDatum = { label: string; value: number; suffix?: string };

export function BarChart({ data, width = 640, barHeight = 28, gap = 10 }: { data: BarDatum[]; width?: number; barHeight?: number; gap?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const labelWidth = 160;
  const trackWidth = width - labelWidth - 90;
  const height = data.length * (barHeight + gap) + gap;

  if (data.length === 0) {
    return <p className="text-sm text-ink/60">No data to chart.</p>;
  }

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Bar chart">
      {data.map((d, i) => {
        const y = gap + i * (barHeight + gap);
        const barWidth = max > 0 ? (d.value / max) * trackWidth : 0;
        return (
          <g key={d.label}>
            <text x={0} y={y + barHeight / 2 + 4} fontSize={12} fill="#57534e">
              {d.label.length > 22 ? `${d.label.slice(0, 21)}…` : d.label}
            </text>
            <rect x={labelWidth} y={y} width={trackWidth} height={barHeight} fill="#f1e9df" rx={4} />
            <rect x={labelWidth} y={y} width={barWidth} height={barHeight} fill="#8a6d52" rx={4} />
            <text x={labelWidth + trackWidth + 8} y={y + barHeight / 2 + 4} fontSize={12} fill="#1c1917">
              {d.value.toLocaleString()}
              {d.suffix ?? ""}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
