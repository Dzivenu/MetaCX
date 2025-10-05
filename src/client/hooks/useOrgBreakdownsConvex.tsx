"use client";

import { useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function useOrgBreakdowns(breakableType: string, breakableId?: string) {
  const data = useQuery(
    api.functions.orgBreakdowns.listByBreakable,
    breakableId ? { breakableType, breakableId } : "skip"
  );

  const setForBreakable = useMutation(
    api.functions.orgBreakdowns.setForBreakable
  );
  const setCommitted = useMutation(api.functions.orgBreakdowns.setCommitted);
  const clearForBreakable = useMutation(
    api.functions.orgBreakdowns.clearForBreakable
  );

  const breakdowns = useMemo(() => data || [], [data]);

  const saveBreakdowns = useCallback(
    async (
      items: Array<{
        orgDenominationId: string;
        orgFloatStackId?: string;
        count: string;
        direction: string;
        status?: string;
      }>
    ) => {
      if (!breakableId) return { success: false };
      return await setForBreakable({
        breakableType,
        breakableId,
        breakdowns: items as any,
      });
    },
    [breakableId, breakableType, setForBreakable]
  );

  const commit = useCallback(async () => {
    if (!breakableId) return { success: false };
    return await setCommitted({ breakableType, breakableId, committed: true });
  }, [breakableId, breakableType, setCommitted]);

  const uncommit = useCallback(async () => {
    if (!breakableId) return { success: false };
    return await setCommitted({ breakableType, breakableId, committed: false });
  }, [breakableId, breakableType, setCommitted]);

  const clear = useCallback(async () => {
    if (!breakableId) return { success: false };
    return await clearForBreakable({ breakableType, breakableId });
  }, [breakableId, breakableType, clearForBreakable]);

  return {
    breakdowns,
    isLoading: data === undefined,
    saveBreakdowns,
    commit,
    uncommit,
    clear,
  };
}



