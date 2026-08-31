import "express";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: {
        id: string;
        email: string;
      };
      auth?: {
        userId: string;
        sessionId: string;
        householdId: string;
        role: "owner" | "member";
        authMethod: string;
        transport: "bearer" | "cookie";
        authenticatedAt: Date;
      };
    }
  }
}

export {};
