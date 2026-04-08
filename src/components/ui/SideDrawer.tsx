"use client";

import { useEffect, useCallback } from "react";
import { X } from "lucide-react";

export default function SideDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  children,
  footer,
  width = "md",
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: "sm" | "md" | "lg" | "xl";
}) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const widthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  }[width];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div className={`relative w-full ${widthClass} bg-surface-1 shadow-2xl flex flex-col animate-slide-in border-l border-surface-3/40`}>
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-3.5 border-b border-surface-3/40">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-heading font-bold text-text-primary truncate">{title}</h2>
              {badge}
            </div>
            {subtitle && <p className="text-xs text-text-tertiary font-ui mt-0.5 truncate">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1 rounded-lg hover:bg-surface-2 text-text-tertiary hover:text-text-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {/* Footer */}
        {footer && (
          <div className="px-5 py-3 border-t border-surface-3/40 bg-surface-2/30">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
