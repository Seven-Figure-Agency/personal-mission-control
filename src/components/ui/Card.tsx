export default function Card({
  title,
  action,
  children,
  className = "",
  noPadding = false,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}) {
  return (
    <div className={`bg-surface-1 rounded-xl border border-surface-3/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-3/40">
          <h3 className="text-xs font-heading font-bold text-text-secondary uppercase tracking-wide">{title}</h3>
          {action}
        </div>
      )}
      <div className={noPadding ? "" : "px-4 py-3"}>{children}</div>
    </div>
  );
}
