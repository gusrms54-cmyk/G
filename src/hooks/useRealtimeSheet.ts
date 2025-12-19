"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  subscribeToSheet,
  startChannel,
  trackPresence,
  updatePresence,
  unsubscribeChannel,
  getChannelName,
  RealtimePayload,
  PresenceState,
} from "@/lib/supabase/realtime";

// 셀 데이터 타입
export interface Cell {
  id: string;
  row_id: string;
  column_id: string;
  value: string | null;
  ai_generated: boolean;
  ai_confidence: number | null;
  updated_at: string;
}

// 행 데이터 타입
export interface Row {
  id: string;
  sheet_id: string;
  order_index: number;
  created_at: string;
}

// 열 데이터 타입
export interface Column {
  id: string;
  sheet_id: string;
  name: string;
  type: string;
  ai_features: string[];
  order_index: number;
  config: Record<string, unknown>;
}

// 다른 사용자 편집 상태
export interface OtherUserEdit {
  userId: string;
  userEmail: string;
  userName?: string;
  cellId?: string;
  color: string;
}

// 훅 반환 타입
interface UseRealtimeSheetReturn {
  cells: Map<string, Cell>;
  rows: Row[];
  columns: Column[];
  otherUsers: OtherUserEdit[];
  isConnected: boolean;
  error: string | null;
  updateCell: (cellId: string, value: string) => void;
  selectCell: (cellId: string | null) => void;
}

// 사용자 색상 할당
const userColors = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
  "#BB8FCE", "#85C1E9", "#F8B500", "#00CED1",
];

function getUserColor(index: number): string {
  return userColors[index % userColors.length];
}

export function useRealtimeSheet(
  sheetId: string | null,
  userId: string | null,
  userEmail: string | null,
  userName?: string
): UseRealtimeSheetReturn {
  const [cells, setCells] = useState<Map<string, Cell>>(new Map());
  const [rows, setRows] = useState<Row[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [otherUsers, setOtherUsers] = useState<OtherUserEdit[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  // 초기 데이터 로드
  const loadInitialData = useCallback(async () => {
    if (!sheetId) return;

    try {
      // 열 로드
      const { data: columnsData } = await supabase
        .from("columns")
        .select("*")
        .eq("sheet_id", sheetId)
        .order("order_index");

      if (columnsData) {
        setColumns(columnsData);
      }

      // 행 로드
      const { data: rowsData } = await supabase
        .from("rows")
        .select("*")
        .eq("sheet_id", sheetId)
        .order("order_index");

      if (rowsData) {
        setRows(rowsData);

        // 셀 로드
        const rowIds = rowsData.map((r) => r.id);
        if (rowIds.length > 0) {
          const { data: cellsData } = await supabase
            .from("cells")
            .select("*")
            .in("row_id", rowIds);

          if (cellsData) {
            const cellsMap = new Map<string, Cell>();
            cellsData.forEach((cell) => {
              cellsMap.set(cell.id, cell);
            });
            setCells(cellsMap);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터 로드 실패");
    }
  }, [sheetId, supabase]);

  // 셀 변경 핸들러
  const handleCellChange = useCallback((payload: RealtimePayload) => {
    const { eventType, new: newCell, old: oldCell } = payload;

    setCells((prev) => {
      const updated = new Map(prev);

      if (eventType === "DELETE" && oldCell?.id) {
        updated.delete(oldCell.id as string);
      } else if (newCell?.id) {
        updated.set(newCell.id as string, newCell as unknown as Cell);
      }

      return updated;
    });
  }, []);

  // 행 변경 핸들러
  const handleRowChange = useCallback((payload: RealtimePayload) => {
    const { eventType, new: newRow, old: oldRow } = payload;

    setRows((prev) => {
      if (eventType === "DELETE" && oldRow?.id) {
        return prev.filter((r) => r.id !== oldRow.id);
      } else if (eventType === "INSERT" && newRow?.id) {
        return [...prev, newRow as unknown as Row].sort(
          (a, b) => a.order_index - b.order_index
        );
      } else if (eventType === "UPDATE" && newRow?.id) {
        return prev
          .map((r) => (r.id === newRow.id ? (newRow as unknown as Row) : r))
          .sort((a, b) => a.order_index - b.order_index);
      }
      return prev;
    });
  }, []);

  // 열 변경 핸들러
  const handleColumnChange = useCallback((payload: RealtimePayload) => {
    const { eventType, new: newColumn, old: oldColumn } = payload;

    setColumns((prev) => {
      if (eventType === "DELETE" && oldColumn?.id) {
        return prev.filter((c) => c.id !== oldColumn.id);
      } else if (eventType === "INSERT" && newColumn?.id) {
        return [...prev, newColumn as unknown as Column].sort(
          (a, b) => a.order_index - b.order_index
        );
      } else if (eventType === "UPDATE" && newColumn?.id) {
        return prev
          .map((c) => (c.id === newColumn.id ? (newColumn as unknown as Column) : c))
          .sort((a, b) => a.order_index - b.order_index);
      }
      return prev;
    });
  }, []);

  // Presence 동기화 핸들러
  const handlePresenceSync = useCallback(
    (state: Record<string, PresenceState[]>) => {
      const users: OtherUserEdit[] = [];
      let colorIndex = 0;

      Object.values(state).forEach((presences) => {
        presences.forEach((presence) => {
          // 자신 제외
          if (presence.userId !== userId) {
            users.push({
              userId: presence.userId,
              userEmail: presence.userEmail,
              userName: presence.userName,
              cellId: presence.cellId,
              color: getUserColor(colorIndex++),
            });
          }
        });
      });

      setOtherUsers(users);
    },
    [userId]
  );

  // Presence 참가 핸들러
  const handlePresenceJoin = useCallback(
    (_key: string, state: PresenceState) => {
      if (state.userId !== userId) {
        setOtherUsers((prev) => {
          // 이미 존재하면 무시
          if (prev.some((u) => u.userId === state.userId)) {
            return prev;
          }
          return [
            ...prev,
            {
              userId: state.userId,
              userEmail: state.userEmail,
              userName: state.userName,
              cellId: state.cellId,
              color: getUserColor(prev.length),
            },
          ];
        });
      }
    },
    [userId]
  );

  // Presence 떠남 핸들러
  const handlePresenceLeave = useCallback(
    (_key: string, state: PresenceState) => {
      setOtherUsers((prev) => prev.filter((u) => u.userId !== state.userId));
    },
    []
  );

  // 채널 구독
  useEffect(() => {
    if (!sheetId || !userId || !userEmail) return;

    const setupChannel = async () => {
      try {
        // 초기 데이터 로드
        await loadInitialData();

        // 채널 구독
        const channel = subscribeToSheet(supabase, sheetId, {
          onCellChange: handleCellChange,
          onRowChange: handleRowChange,
          onColumnChange: handleColumnChange,
          onPresenceSync: handlePresenceSync,
          onPresenceJoin: handlePresenceJoin,
          onPresenceLeave: handlePresenceLeave,
        });

        channelRef.current = channel;

        // 채널 시작
        await startChannel(channel);

        // Presence 등록
        await trackPresence(channel, {
          userId: userId,
          userEmail,
          userName,
        });

        setIsConnected(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "연결 실패");
        setIsConnected(false);
      }
    };

    setupChannel();

    // 클린업
    return () => {
      if (sheetId) {
        const channelName = getChannelName("sheet", sheetId);
        unsubscribeChannel(channelName);
        channelRef.current = null;
        setIsConnected(false);
      }
    };
  }, [
    sheetId,
    userId,
    userEmail,
    userName,
    supabase,
    loadInitialData,
    handleCellChange,
    handleRowChange,
    handleColumnChange,
    handlePresenceSync,
    handlePresenceJoin,
    handlePresenceLeave,
  ]);

  // 셀 업데이트
  const updateCell = useCallback(
    async (cellId: string, value: string) => {
      try {
        await supabase
          .from("cells")
          .update({ value, ai_generated: false })
          .eq("id", cellId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "셀 업데이트 실패");
      }
    },
    [supabase]
  );

  // 셀 선택 (Presence 업데이트)
  const selectCell = useCallback(
    async (cellId: string | null) => {
      if (channelRef.current && userId && userEmail) {
        await updatePresence(channelRef.current, {
          userId: userId,
          userEmail,
          userName,
          cellId: cellId || undefined,
        });
      }
    },
    [userId, userEmail, userName]
  );

  return {
    cells,
    rows,
    columns,
    otherUsers,
    isConnected,
    error,
    updateCell,
    selectCell,
  };
}
