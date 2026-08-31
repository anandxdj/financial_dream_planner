import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";

const REQUEST_ID_REGEX = /^[A-Za-z0-9_.-]{1,128}$/;

export function isValidRequestId(id: string): boolean {
  return REQUEST_ID_REGEX.test(id);
}

export function requestId(req: Request, res: Response, next: NextFunction) {
  const header = req.header("x-request-id");
  const trimmed = header ? header.trim() : "";
  req.requestId = trimmed && isValidRequestId(trimmed) ? trimmed : randomUUID();
  res.setHeader("x-request-id", req.requestId);
  next();
}
