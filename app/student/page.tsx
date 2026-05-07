"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/use-auth";

export default function StudentHomePage() {
  const router = useRouter();
  const { user, isHydrating, roleHomePath } = useAuth();

  useEffect(() => {
    if (isHydrating) return;
    if (!user) {
      router.replace("/?auth=login");
      return;
    }
    if (user.role !== "student") {
      router.replace(roleHomePath(user.role));
      return;
    }
    router.replace("/dashboard/dashboard");
  }, [isHydrating, roleHomePath, router, user]);

  return null;
}
