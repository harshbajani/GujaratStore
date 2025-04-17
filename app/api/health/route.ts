// app/api/health/route.js

import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // You can add any additional checks here if needed
  const healthData = { status: "ok", timestamp: new Date().toISOString() };
  return new Response(JSON.stringify(healthData), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}
