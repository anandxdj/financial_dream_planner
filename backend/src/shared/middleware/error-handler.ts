import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/app-error";
import { logger } from "../logger/logger";

import { recordAuthFailure, recordStorageOperation } from "../../modules/metrics/metrics";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    if (err.statusCode === 401 || err.statusCode === 403) {
      recordAuthFailure(err.code.toLowerCase());
    }
    if (err.code === "STORAGE_UNAVAILABLE") {
      recordStorageOperation("unknown", "failure");
    }
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId: req.requestId,
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request",
        details: err.issues,
        requestId: req.requestId,
      },
    });
    return;
  }

  logger.error("unhandled_error", {
    requestId: req.requestId,
    err: err instanceof Error ? err.message : "unknown",
  });

  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Internal server error",
      requestId: req.requestId,
    },
  });
}
