import { describe, expect, it, vi } from "vitest";
import { createGracefulShutdown } from "../../src/server";
import type { Server } from "node:http";
import type { ApiRuntime } from "../../src/composition";

describe("graceful shutdown contract", () => {
  it("API graceful shutdown flips readiness and closes cleanly", async () => {
    let readinessShuttingDown = false;
    const mockRuntime: ApiRuntime = {
      app: {} as any,
      setShuttingDown: (val: boolean) => {
        readinessShuttingDown = val;
      },
      close: vi.fn().mockResolvedValue(undefined),
    };

    const mockServer = {
      on: vi.fn(),
      close: vi.fn().mockImplementation((cb: (err?: Error) => void) => {
        cb();
      }),
    } as unknown as Server;

    const exitFn = vi.fn();
    const shutdown = createGracefulShutdown({
      server: mockServer,
      runtime: mockRuntime,
      timeoutMs: 1000,
      onExit: exitFn,
    });

    const exitCode = await shutdown("SIGTERM");

    expect(readinessShuttingDown).toBe(true);
    expect(mockServer.close).toHaveBeenCalled();
    expect(mockRuntime.close).toHaveBeenCalled();
    expect(exitCode).toBe(0);
    expect(exitFn).toHaveBeenCalledWith(0);
  });

  it("API shutdown triggers non-zero exit on hard deadline timeout", async () => {
    let readinessShuttingDown = false;
    const mockRuntime: ApiRuntime = {
      app: {} as any,
      setShuttingDown: (val: boolean) => {
        readinessShuttingDown = val;
      },
      close: vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 500)),
      ),
    };

    // Hanging server.close
    const mockServer = {
      on: vi.fn(),
      close: vi.fn().mockImplementation(() => {
        // never calls callback
      }),
    } as unknown as Server;

    const exitFn = vi.fn();
    const shutdown = createGracefulShutdown({
      server: mockServer,
      runtime: mockRuntime,
      timeoutMs: 50, // short timeout
      onExit: exitFn,
    });

    const exitCode = await shutdown("SIGINT");

    expect(readinessShuttingDown).toBe(true);
    expect(exitCode).toBe(1);
    expect(exitFn).toHaveBeenCalledWith(1);
  });
});
