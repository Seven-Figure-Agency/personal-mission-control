"use client";

export const inputClass =
  "w-full text-sm font-ui bg-surface-1 border border-surface-3/60 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-mc-accent/30 focus:border-mc-accent/30 outline-none text-text-primary placeholder:text-text-muted";

export const selectClass = inputClass;

export default function DrawerField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[10px] font-ui font-semibold text-text-tertiary uppercase tracking-wider mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
