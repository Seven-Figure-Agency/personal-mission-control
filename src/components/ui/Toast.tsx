"use client";

import { useEffect } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

const config = {
  success: { icon: CheckCircle, style: "bg-emerald-50 border-emerald-200/60 text-emerald-700" },
  error: { icon: AlertCircle, style: "bg-red-50 border-red-200/60 text-red-700" },
  info: { icon: Info, style: "bg-blue-50 border-blue-200/60 text-blue-700" },
  saved: { icon: CheckCircle, style: "bg-surface-1 border-surface-3/60 text-text-secondary" },
};

export default function Toast({
  message,
  type = "success",
  onClose,
}: {
  message: string;
  type?: "success" | "error" | "info" | "saved";
  onClose: () => void;
}) {
  useEffect(() => {
    const ms = type === "saved" ? 1500 : 3000;
    const timer = setTimeout(onClose, ms);
    return () => clearTimeout(timer);
  }, [onClose, type]);

  const { icon: Icon, style } = config[type];

  return (
    <div className={`fixed bottom-5 right-5 z-[60] flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border shadow-lg font-ui text-[13px] animate-fade-up ${style}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{message}</span>
      <button onClick={onClose} className="ml-1 opacity-40 hover:opacity-70">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
