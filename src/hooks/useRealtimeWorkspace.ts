"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  subscribeToWorkspace,
  startChannel,
  unsubscribeChannel,
  getChannelName,
  RealtimePayload,
} from "@/lib/supabase/realtime";

// Ãl§òt§ pt0 ¿Ö
export interface Workspace {
  id: string;
  user_id: string;
  name: string;
  type: string;
  icon: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

// ‹∏ pt0 ¿Ö
export interface Sheet {
  id: string;
  workspace_id: string;
  name: string;
  icon: string | null;
  order_index: number;
  created_at: string;
}

// ≈ X ¿Ö
interface UseRealtimeWorkspaceReturn {
  workspace: Workspace | null;
  sheets: Sheet[];
  isConnected: boolean;
  error: string | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useRealtimeWorkspace(
  workspaceId: string | null
): UseRealtimeWorkspaceReturn {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  // pt0 \‹
  const loadData = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Ãl§òt§ \‹
      const { data: workspaceData, error: workspaceError } = await supabase
        .from("workspaces")
        .select("*")
        .eq("id", workspaceId)
        .single();

      if (workspaceError) throw workspaceError;

      setWorkspace(workspaceData);

      // ‹∏ \‹
      const { data: sheetsData, error: sheetsError } = await supabase
        .from("sheets")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("order_index");

      if (sheetsError) throw sheetsError;

      setSheets(sheetsData || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "pt0 \‹ ‰(");
    } finally {
      setLoading(false);
    }
  }, [workspaceId, supabase]);

  // Ãl§òt§ ¿Ω x‰Ï
  const handleWorkspaceChange = useCallback((payload: RealtimePayload) => {
    const { eventType, new: newWorkspace, old: oldWorkspace } = payload;

    if (eventType === "DELETE" && oldWorkspace?.id) {
      setWorkspace(null);
      setSheets([]);
    } else if (newWorkspace?.id) {
      setWorkspace(newWorkspace as unknown as Workspace);
    }
  }, []);

  // ‹∏ ¿Ω x‰Ï
  const handleSheetChange = useCallback((payload: RealtimePayload) => {
    const { eventType, new: newSheet, old: oldSheet } = payload;

    setSheets((prev) => {
      if (eventType === "DELETE" && oldSheet?.id) {
        return prev.filter((s) => s.id !== oldSheet.id);
      } else if (eventType === "INSERT" && newSheet?.id) {
        return [...prev, newSheet as unknown as Sheet].sort(
          (a, b) => a.order_index - b.order_index
        );
      } else if (eventType === "UPDATE" && newSheet?.id) {
        return prev
          .map((s) => (s.id === newSheet.id ? (newSheet as unknown as Sheet) : s))
          .sort((a, b) => a.order_index - b.order_index);
      }
      return prev;
    });
  }, []);

  // D l≈
  useEffect(() => {
    if (!workspaceId) return;

    const setupChannel = async () => {
      try {
        // 0 pt0 \‹
        await loadData();

        // D l≈
        const channel = subscribeToWorkspace(supabase, workspaceId, {
          onWorkspaceChange: handleWorkspaceChange,
          onSheetChange: handleSheetChange,
        });

        channelRef.current = channel;

        // D ‹ë
        await startChannel(channel);

        setIsConnected(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "∞ ‰(");
        setIsConnected(false);
      }
    };

    setupChannel();

    // t∞≈
    return () => {
      if (workspaceId) {
        const channelName = getChannelName("workspace", workspaceId);
        unsubscribeChannel(channelName);
        channelRef.current = null;
        setIsConnected(false);
      }
    };
  }, [
    workspaceId,
    supabase,
    loadData,
    handleWorkspaceChange,
    handleSheetChange,
  ]);

  // Ÿ ¨òX
  const refetch = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return {
    workspace,
    sheets,
    isConnected,
    error,
    loading,
    refetch,
  };
}

// Ãl§òt§ ©] ‰‹ ≈
export function useRealtimeWorkspaces(
  userId: string | null
): {
  workspaces: Workspace[];
  isConnected: boolean;
  error: string | null;
  loading: boolean;
} {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  // Ãl§òt§ ©] \‹
  const loadWorkspaces = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data, error: fetchError } = await supabase
        .from("workspaces")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setWorkspaces(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ãl§òt§ \‹ ‰(");
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  // Ãl§òt§ ¿Ω x‰Ï
  const handleChange = useCallback((payload: RealtimePayload) => {
    const { eventType, new: newItem, old: oldItem } = payload;

    setWorkspaces((prev) => {
      if (eventType === "DELETE" && oldItem?.id) {
        return prev.filter((w) => w.id !== oldItem.id);
      } else if (eventType === "INSERT" && newItem?.id) {
        return [newItem as unknown as Workspace, ...prev];
      } else if (eventType === "UPDATE" && newItem?.id) {
        return prev.map((w) =>
          w.id === newItem.id ? (newItem as unknown as Workspace) : w
        );
      }
      return prev;
    });
  }, []);

  // D l≈
  useEffect(() => {
    if (!userId) return;

    const setupChannel = async () => {
      try {
        await loadWorkspaces();

        const channelName = `workspaces:user:${userId}`;
        const channel = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "workspaces",
              filter: `user_id=eq.${userId}`,
            },
            handleChange
          );

        channelRef.current = channel;

        channel.subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setIsConnected(true);
          }
        });

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "∞ ‰(");
        setIsConnected(false);
      }
    };

    setupChannel();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsConnected(false);
      }
    };
  }, [userId, supabase, loadWorkspaces, handleChange]);

  return {
    workspaces,
    isConnected,
    error,
    loading,
  };
}
