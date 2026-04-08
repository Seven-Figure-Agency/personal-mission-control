import fs from "fs";
import path from "path";

export interface EnergyTypeConfig {
  name: string;
  color: string; // Tailwind color key: red, blue, emerald, amber, violet, cyan, orange, pink
}

export interface Config {
  name: string;
  owner: string;
  organizations: string[];
  defaultOrganization: string;
  categories: string[];
  people: string[];
  energyTypes: EnergyTypeConfig[];
  meetingTypes: string[];
  quarters: string[];
}

const CONFIG_PATH = path.join(process.cwd(), "config.json");
const EXAMPLE_PATH = path.join(process.cwd(), "config.example.json");

let _config: Config | null = null;

export function getConfig(): Config {
  if (_config) return _config;

  if (!fs.existsSync(CONFIG_PATH)) {
    console.warn(
      "\n" +
      "=".repeat(60) + "\n" +
      "  config.json not found!\n" +
      "  Copy config.example.json to config.json and customize it.\n" +
      "  See BUILD_GUIDE.md for setup instructions.\n" +
      "=".repeat(60) + "\n"
    );
    if (fs.existsSync(EXAMPLE_PATH)) {
      _config = JSON.parse(fs.readFileSync(EXAMPLE_PATH, "utf-8"));
      return _config!;
    }
    throw new Error("Neither config.json nor config.example.json found.");
  }

  _config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
  return _config!;
}
