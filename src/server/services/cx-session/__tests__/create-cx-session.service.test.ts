import { describe, it, expect, beforeEach } from "vitest";
import { CreateCxSessionService } from "../create-cx-session.service";

// Mock the database
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue([{ id: "test-session-id" }]),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
};

// Mock the database module
vi.mock("@/server/db", () => ({
  db: mockDb,
}));

// Mock crypto
vi.mock("crypto", () => ({
  randomUUID: vi.fn().mockReturnValue("test-uuid"),
}));

describe("CreateCxSessionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a session successfully", async () => {
    // Mock user validation
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValue([{ id: "test-user-id" }]),
        }),
      }),
    });

    // Mock session validation
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          orderBy: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });

    const service = new CreateCxSessionService({
      userId: "test-user-id",
      organizationId: "test-org-id",
    });

    const result = await service.call();

    expect(result.error).toBeNull();
    expect(result.session).toBeDefined();
    expect(mockDb.insert).toHaveBeenCalledTimes(2); // session and access log
  });

  it("should fail if user is not found", async () => {
    // Mock user validation to return empty array
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    const service = new CreateCxSessionService({
      userId: "non-existent-user-id",
      organizationId: "test-org-id",
    });

    const result = await service.call();

    expect(result.error).toBeDefined();
    expect(result.session).toBeNull();
  });
});
