import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Content-Security-Policy: Restrict sources for scripts, styles, fonts, images, connections
  // Allow inline styles for Tailwind/React, but restrict scripts to self
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // 'unsafe-eval' needed for Recharts, 'unsafe-inline' for Next.js inline scripts
    "style-src 'self' 'unsafe-inline'", // Tailwind uses inline styles
    "img-src 'self' data: blob:", // Allow data URIs and blob images
    "font-src 'self' data:",
    "connect-src 'self'", // API calls to same origin
    "frame-ancestors 'none'", // Prevent clickjacking
    "form-action 'self'", // Forms only to same origin
    "base-uri 'self'",
    "object-src 'none'", // No plugins
  ].join("; ");
  
  response.headers.set("Content-Security-Policy", csp);
  
  // Permissions-Policy: Restrict browser features
  const permissionsPolicy = [
    "accelerometer=()",
    "camera=()",
    "geolocation=()",
    "gyroscope=()",
    "magnetometer=()",
    "microphone=()",
    "payment=()",
    "usb=()",
    "interest-cohort=()",
  ].join(", ");
  
  response.headers.set("Permissions-Policy", permissionsPolicy);
  
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
