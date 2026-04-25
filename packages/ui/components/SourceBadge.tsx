interface SourceBadgeProps {
  source: string;
  url?: string;
  year?: number;
  imputed?: boolean;
}

export function SourceBadge({ source, url, year, imputed }: SourceBadgeProps) {
  const inner = (
    <span className="source-badge inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-stone-500">
      <span>{source}</span>
      {year !== undefined && <span className="font-mono">{year}</span>}
      {imputed && (
        <span
          className="text-[var(--color-warn)]"
          title="This value is imputed from neighboring data"
        >
          ·imputed
        </span>
      )}
    </span>
  );
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
      >
        {inner}
      </a>
    );
  }
  return inner;
}
