"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { notifications } from "@mantine/notifications";
import { useEffect } from "react";

export function useOrgSettings() {
  const { orgId } = useAuth();

  const settings = useQuery(
    api.functions.orgSettings.getOrgSettings,
    orgId ? { clerkOrganizationId: orgId } : "skip"
  );

  const createSettingsMutation = useMutation(
    api.functions.orgSettings.createOrgSettingsIfNotExists
  );

  const updateSettingsMutation = useMutation(
    api.functions.orgSettings.updateOrgSettings
  );

  useEffect(() => {
    if (orgId && settings === null) {
      createSettingsMutation({ clerkOrganizationId: orgId });
    }
  }, [orgId, settings, createSettingsMutation]);

  const updateSettings = async (updates: any) => {
    if (!orgId) {
      notifications.show({
        title: "Error",
        message: "No organization selected",
        color: "red",
      });
      return;
    }

    try {
      await updateSettingsMutation({
        clerkOrganizationId: orgId,
        ...updates,
      });

      notifications.show({
        title: "Success",
        message: "Settings updated successfully",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to update settings",
        color: "red",
      });
    }
  };

  return {
    settings,
    updateSettings,
    isLoading: settings === undefined,
  };
}
