"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { UserRole } from "@/lib/mock-auth";
import { getMyProfile, type MeProfile } from "@/lib/profile-api";
import { isProfileCompleteForRole } from "@/lib/profile-completion";

type ProfileStatusContextValue = {
  profile: MeProfile | null;
  isLoading: boolean;
  isComplete: boolean;
  needsCompletionForLiveSession: boolean;
  refreshProfile: () => Promise<void>;
};

const ProfileStatusContext = createContext<ProfileStatusContextValue | null>(null);

type ProfileStatusProviderProps = {
  role: UserRole;
  children: React.ReactNode;
};

export function ProfileStatusProvider({ role, children }: ProfileStatusProviderProps) {
  const [profile, setProfile] = useState<MeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = async () => {
    setIsLoading(true);
    try {
      const data = await getMyProfile();
      setProfile(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshProfile();
  }, []);

  const value = useMemo<ProfileStatusContextValue>(() => {
    const isComplete = isProfileCompleteForRole(profile, role);
    const needsCompletionForLiveSession = (role === "student" || role === "teacher") && !isComplete;
    return {
      profile,
      isLoading,
      isComplete,
      needsCompletionForLiveSession,
      refreshProfile,
    };
  }, [isLoading, profile, role]);

  return <ProfileStatusContext.Provider value={value}>{children}</ProfileStatusContext.Provider>;
}

export function useProfileStatus() {
  const context = useContext(ProfileStatusContext);
  if (!context) {
    throw new Error("useProfileStatus must be used within ProfileStatusProvider.");
  }
  return context;
}
