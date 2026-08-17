"use client";

interface MiniChartProps {
  type: "line" | "bar";
  data: number[];
  labels?: string[];
  color?: string;
  height?: number;
  showGrid?: boolean;
  fillOpacity?: number;
}

export function MiniChart({
  type,
  data,
  labels,
  color = "var(--admin-primary)",
  height = 80,
  showGrid = false,
  fillOpacity = 0.15,
}: MiniChartProps) {
  if (!data.length) return null;

  const W = 300;
  const H = height;
  const PAD = { top: 8, right: 8, bottom: labels ? 20 : 8, left: 8 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const xStep = innerW / (data.length - 1 || 1);
  const yScale = (v: number) => innerH - ((v - min) / range) * innerH;

  if (type === "line") {
    const points = data.map((v, i) => ({
      x: PAD.left + i * xStep,
      y: PAD.top + yScale(v),
    }));

    const pathD = points
      .map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`))
      .join(" ");

    const fillD =
      `M ${points[0].x},${PAD.top + innerH} ` +
      points.map((p) => `L ${p.x},${p.y}`).join(" ") +
      ` L ${points[points.length - 1].x},${PAD.top + innerH} Z`;

    return (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        style={{ overflow: "visible" }}
      >
        {showGrid &&
          [0, 0.25, 0.5, 0.75, 1].map((t) => (
            <line
              key={t}
              x1={PAD.left}
              y1={PAD.top + t * innerH}
              x2={PAD.left + innerW}
              y2={PAD.top + t * innerH}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={1}
            />
          ))}

        <defs>
          <linearGradient id={`fill-${color.replace(/[^a-z]/gi, "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={fillOpacity * 2} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        <path d={fillD} fill={`url(#fill-${color.replace(/[^a-z]/gi, "")})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Dot at last point */}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={3}
          fill={color}
        />

        {labels && (
          <g>
            {labels
              .filter((_, i) => i % Math.ceil(labels.length / 6) === 0)
              .map((label, j) => {
                const realIdx = j * Math.ceil(labels.length / 6);
                const x = PAD.left + realIdx * xStep;
                return (
                  <text
                    key={label}
                    x={x}
                    y={H - 2}
                    fontSize={8}
                    textAnchor="middle"
                    fill="rgba(148,163,184,0.8)"
                  >
                    {label}
                  </text>
                );
              })}
          </g>
        )}
      </svg>
    );
  }

  // Bar chart
  const barCount = data.length;
  const gap = 3;
  const barW = (innerW - gap * (barCount - 1)) / barCount;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
      {data.map((v, i) => {
        const barH = Math.max(2, ((v - min) / range) * innerH);
        const x = PAD.left + i * (barW + gap);
        const y = PAD.top + innerH - barH;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={2}
              fill={color}
              opacity={0.8}
            />
            {labels?.[i] && (
              <text
                x={x + barW / 2}
                y={H - 2}
                fontSize={7}
                textAnchor="middle"
                fill="rgba(148,163,184,0.7)"
              >
                {labels[i]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
