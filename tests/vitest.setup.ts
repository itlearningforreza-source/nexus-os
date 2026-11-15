import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js cookies
vi.mock("next/headers", () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

// Mock database
vi.mock("@/lib/db", () => ({
  getDb: vi.fn(() => ({
    prepare: vi.fn(() => ({
      get: vi.fn(),
      all: vi.fn(),
      run: vi.fn(),
    })),
    transaction: vi.fn((fn) => fn()),
  })),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  },
  createChildLogger: vi.fn(),
  logApiRequest: vi.fn(),
  logApiResponse: vi.fn(),
  logError: vi.fn(),
  logAuditEvent: vi.fn(),
  logSecurityEvent: vi.fn(),
  logPerformance: vi.fn(),
  logDatabaseQuery: vi.fn(),
}));

// Mock API utils
vi.mock("@/lib/api", () => ({
  logAudit: vi.fn(),
  isAdminRole: vi.fn((role) => ["owner", "admin"].includes(role)),
  handleApiError: vi.fn(),
  withErrorHandling: vi.fn((fn) => fn()),
}));

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Suppress console.error in tests unless explicitly testing errors
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (args[0]?.includes?.("Warning: ReactDOM.render is no longer supported")) return;
    originalError.apply(console, args);
  };
});

afterAll(() => {
  console.error = originalError;
});
