import { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./client";

// 활성 채널 저장소
const activeChannels = new Map<string, RealtimeChannel>();

// 채널 타입
export type ChannelType = "sheet" | "workspace" | "presence";

// 페이로드 타입
export interface RealtimePayload<T = Record<string, unknown>> {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: T;
  old: T;
  table: string;
}

// Presence 상태
export interface PresenceState {
  userId: string;
  userEmail: string;
  userName?: string;
  cellId?: string;
  lastActive: string;
}

// 채널 이름 생성
export function getChannelName(type: ChannelType, id: string): string {
  return `${type}:${id}`;
}

// 채널 가져오기 또는 생성
export function getOrCreateChannel(
  supabase: SupabaseClient,
  channelName: string
): RealtimeChannel {
  const existing = activeChannels.get(channelName);
  if (existing) {
    return existing;
  }

  const channel = supabase.channel(channelName);
  activeChannels.set(channelName, channel);
  return channel;
}

// 시트 채널 구독
export function subscribeToSheet(
  supabase: SupabaseClient,
  sheetId: string,
  callbacks: {
    onCellChange?: (payload: RealtimePayload) => void;
    onRowChange?: (payload: RealtimePayload) => void;
    onColumnChange?: (payload: RealtimePayload) => void;
    onPresenceSync?: (state: Record<string, PresenceState[]>) => void;
    onPresenceJoin?: (key: string, state: PresenceState) => void;
    onPresenceLeave?: (key: string, state: PresenceState) => void;
  }
): RealtimeChannel {
  const channelName = getChannelName("sheet", sheetId);
  const channel = getOrCreateChannel(supabase, channelName);

  // 셀 변경 구독
  if (callbacks.onCellChange) {
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "cells",
        filter: `row_id=in.(select id from rows where sheet_id=eq.${sheetId})`,
      },
      callbacks.onCellChange
    );
  }

  // 행 변경 구독
  if (callbacks.onRowChange) {
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "rows",
        filter: `sheet_id=eq.${sheetId}`,
      },
      callbacks.onRowChange
    );
  }

  // 열 변경 구독
  if (callbacks.onColumnChange) {
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "columns",
        filter: `sheet_id=eq.${sheetId}`,
      },
      callbacks.onColumnChange
    );
  }

  // Presence 구독 (다른 사용자 편집 상태)
  if (callbacks.onPresenceSync || callbacks.onPresenceJoin || callbacks.onPresenceLeave) {
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceState>();
        callbacks.onPresenceSync?.(state);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        if (newPresences[0]) {
          callbacks.onPresenceJoin?.(key, newPresences[0] as PresenceState);
        }
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        if (leftPresences[0]) {
          callbacks.onPresenceLeave?.(key, leftPresences[0] as PresenceState);
        }
      });
  }

  return channel;
}

// 워크스페이스 채널 구독
export function subscribeToWorkspace(
  supabase: SupabaseClient,
  workspaceId: string,
  callbacks: {
    onWorkspaceChange?: (payload: RealtimePayload) => void;
    onSheetChange?: (payload: RealtimePayload) => void;
  }
): RealtimeChannel {
  const channelName = getChannelName("workspace", workspaceId);
  const channel = getOrCreateChannel(supabase, channelName);

  // 워크스페이스 변경 구독
  if (callbacks.onWorkspaceChange) {
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "workspaces",
        filter: `id=eq.${workspaceId}`,
      },
      callbacks.onWorkspaceChange
    );
  }

  // 시트 변경 구독
  if (callbacks.onSheetChange) {
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "sheets",
        filter: `workspace_id=eq.${workspaceId}`,
      },
      callbacks.onSheetChange
    );
  }

  return channel;
}

// 채널 시작
export async function startChannel(channel: RealtimeChannel): Promise<void> {
  return new Promise((resolve, reject) => {
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        resolve();
      } else if (status === "CHANNEL_ERROR") {
        reject(new Error("채널 구독에 실패했습니다."));
      }
    });
  });
}

// Presence 상태 전송
export async function trackPresence(
  channel: RealtimeChannel,
  state: Omit<PresenceState, "lastActive">
): Promise<void> {
  await channel.track({
    ...state,
    lastActive: new Date().toISOString(),
  });
}

// Presence 상태 업데이트 (셀 선택 변경 등)
export async function updatePresence(
  channel: RealtimeChannel,
  updates: Partial<PresenceState>
): Promise<void> {
  await channel.track({
    ...updates,
    lastActive: new Date().toISOString(),
  });
}

// 채널 구독 해제
export async function unsubscribeChannel(channelName: string): Promise<void> {
  const channel = activeChannels.get(channelName);
  if (channel) {
    const supabase = createClient();
    await supabase.removeChannel(channel);
    activeChannels.delete(channelName);
  }
}

// 모든 채널 구독 해제
export async function unsubscribeAllChannels(): Promise<void> {
  const supabase = createClient();
  for (const [name, channel] of activeChannels) {
    await supabase.removeChannel(channel);
    activeChannels.delete(name);
  }
}

// 브로드캐스트 메시지 전송
export async function broadcastMessage(
  channel: RealtimeChannel,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  await channel.send({
    type: "broadcast",
    event,
    payload,
  });
}

// 브로드캐스트 메시지 수신 구독
export function onBroadcast(
  channel: RealtimeChannel,
  event: string,
  callback: (payload: Record<string, unknown>) => void
): void {
  channel.on("broadcast", { event }, ({ payload }) => {
    callback(payload);
  });
}
