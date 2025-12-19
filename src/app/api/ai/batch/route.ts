import { NextRequest } from "next/server";
import {
  withAuth,
  successResponse,
  errorResponse,
  forbiddenResponse,
  parseBody,
  verifySheetOwnership,
} from "@/lib/api-utils";
import {
  batchProcess,
  loadSheetContext,
  AIFeatureType,
  ColumnContext,
  RowData,
} from "@/lib/ai";

// POST /api/ai/batch - ìì ‰ | AI ˜¬
export async function POST(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const body = await parseBody<{
      sheetId: string;
      columnId: string;
      rowIds: string[];
      feature?: AIFeatureType;
    }>(request);

    if (!body || !body.sheetId || !body.columnId || !body.rowIds?.length) {
      return errorResponse("sheetId, columnId, rowIds” D…Èä.");
    }

    // Ü¸ Œ Œ Ux
    const isOwner = await verifySheetOwnership(supabase, body.sheetId, user.id);
    if (!isOwner) {
      return forbiddenResponse();
    }

    // Ü¸ èM¤¸ \Ü
    const sheetContext = await loadSheetContext(supabase, body.sheetId);
    if (!sheetContext) {
      return errorResponse("Ü¸| >D  ÆµÈä.");
    }

    // ô ô
    const { data: column } = await supabase
      .from("columns")
      .select("name, type, ai_features, config")
      .eq("id", body.columnId)
      .single();

    if (!column) {
      return errorResponse("ôD >D  ÆµÈä.");
    }

    const targetColumn: ColumnContext = {
      name: column.name,
      type: column.type,
      aiFeatures: (column.ai_features as AIFeatureType[]) || [],
      config: column.config as Record<string, unknown>,
    };

    // ‰ pt0 \Ü
    const { data: cells } = await supabase
      .from("cells")
      .select("row_id, value, columns!inner(name)")
      .in("row_id", body.rowIds);

    // ‰Ä pt0 l1
    const rowDataMap = new Map<string, RowData>();
    body.rowIds.forEach((id) => rowDataMap.set(id, {}));

    cells?.forEach((cell) => {
      const columnName = (cell.columns as unknown as { name: string }).name;
      const rowData = rowDataMap.get(cell.row_id);
      if (rowData) {
        rowData[columnName] = cell.value;
      }
    });

    const rows = body.rowIds.map((rowId) => ({
      rowId,
      data: rowDataMap.get(rowId) || {},
    }));

    // AI 0¥ °
    const feature =
      body.feature || targetColumn.aiFeatures[0] || ("autofill" as AIFeatureType);

    // 0X ˜¬
    const result = await batchProcess(supabase, {
      feature,
      targetColumn,
      rows,
      sheetContext,
    });

    return successResponse(result);
  });
}
