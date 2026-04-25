import type { CSSProperties } from "react";

/**
 * Unmapped Kairos mark — extracted from the Direction 01 logo system.
 *
 * The mark is a dot-grid frame with a coral "discovered path" climbing
 * bottom-left → upper-right. Two coral waypoints anchor the path.
 * `currentColor` controls the frame + dots, the path is always coral.
 */
export function UnmappedMark({
  size = 32,
  className,
  style,
  title = "Unmapped Kairos",
}: {
  size?: number;
  className?: string;
  style?: CSSProperties;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label={title}
      className={className}
      style={style}
    >
      {/* frame */}
      <rect
        x="0.5"
        y="0.5"
        width="47"
        height="47"
        rx="6"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.18"
        strokeWidth="1"
      />
      {/* dot grid 4×4 */}
      <g fill="currentColor" fillOpacity="0.18">
        {[11, 20, 29, 38].flatMap((cy) =>
          [11, 20, 29, 38].map((cx) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.6" />
          )),
        )}
      </g>
      {/* the discovered path: bottom-left → upper-right, climbing */}
      <path
        d="M 11 38 L 20 29 L 29 20 L 38 11"
        fill="none"
        stroke="#d96552"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* emphasized waypoints */}
      <circle cx="11" cy="38" r="2.6" fill="#d96552" />
      <circle cx="38" cy="11" r="2.6" fill="#d96552" />
      <circle cx="20" cy="29" r="2.0" fill="currentColor" />
      <circle cx="29" cy="20" r="2.0" fill="currentColor" />
    </svg>
  );
}

/**
 * Horizontal lockup: mark + wordmark "unmapped Kairos".
 * - "un" in coral
 * - "mapped" inheriting the surrounding text color (teal-900 on light, white on dark)
 * - "Kairos" inheriting, set off with a thin separator dot
 */
export function Logo({
  size = 28,
  className,
  style,
  wordSize = 22,
}: {
  size?: number;
  className?: string;
  style?: CSSProperties;
  wordSize?: number;
}) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        ...style,
      }}
    >
      <UnmappedMark size={size} />
      <span
        className="display"
        style={{
          fontSize: wordSize,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          display: "inline-flex",
          alignItems: "baseline",
          gap: "0.4em",
          whiteSpace: "nowrap",
        }}
      >
        <span>
          <span style={{ color: "var(--color-coral)" }}>un</span>
          <span>mapped</span>
        </span>
        <span aria-hidden="true" style={{ opacity: 0.5, fontWeight: 400 }}>
          ·
        </span>
        <span>Kairos</span>
      </span>
    </span>
  );
}
