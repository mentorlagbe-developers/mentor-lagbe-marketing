"use client";

import { useAuth } from "@/lib/use-auth";

export function AuthBootstrap() {
  useAuth();
  return null;
}
