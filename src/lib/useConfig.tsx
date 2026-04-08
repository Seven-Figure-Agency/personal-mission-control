"use client";

import { useState, useEffect, createContext, useContext } from "react";

export interface ClientConfig {
  name: string;
  owner: string;
  organizations: string[];
  defaultOrganization: string;
  categories: string[];
  people: string[];
  energyTypes: { name: string; color: string }[];
  meetingTypes: string[];
  quarters: string[];
}

const ConfigContext = createContext<ClientConfig | null>(null);

export function ConfigProvider({ children, initial }: { children: React.ReactNode; initial?: ClientConfig }) {
  const [config, setConfig] = useState<ClientConfig | null>(initial || null);

  useEffect(() => {
    if (!config) {
      fetch("/api/config")
        .then((r) => r.json())
        .then(setConfig)
        .catch(() => {});
    }
  }, [config]);

  if (!config) return null;
  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
}

export function useConfig(): ClientConfig {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig must be used within ConfigProvider");
  return ctx;
}
