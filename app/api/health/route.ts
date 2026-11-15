import { NextResponse } from "next/server";

export function GET() {
  const heap = process.memoryUsage();
  return NextResponse.json({
    status: "ok",
    service: "nexus-os",
    uptime: process.uptime(),
    memory: {
      rss: heap.rss,
      heapUsed: heap.heapUsed,
      heapTotal: heap.heapTotal,
    },
    timestamp: new Date().toISOString(),
  });
}