import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";

export function GET() {
  const config = getConfig();
  return NextResponse.json({
    name: config.name,
    owner: config.owner,
    organizations: config.organizations,
    defaultOrganization: config.defaultOrganization,
    categories: config.categories,
    people: config.people,
    energyTypes: config.energyTypes,
    meetingTypes: config.meetingTypes,
    quarters: config.quarters,
  });
}
