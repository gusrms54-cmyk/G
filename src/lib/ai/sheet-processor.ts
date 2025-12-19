import { SupabaseClient } from "@supabase/supabase-js";
import {
  AIFeatureType,
  AIRequest,
  AIResponse,
  AIStreamChunk,
  BatchRequest,
  BatchResponse,
  ColumnContext,
  CorrectionData,
  RowData,
  SheetContext,
} from "./types";
import {
  executeAIFeature,
  executeAIFeatureStream,
  callClaude,
} from "./claude";
import { buildBatchPrompt } from "./prompts";

// ‹∏ ËM§∏ \‹
export async function loadSheetContext(
  supabase: SupabaseClient,
  sheetId: string
): Promise<SheetContext | null> {
  // ‹∏ Ù
  const { data: sheet } = await supabase
    .from("sheets")
    .select(`
      name,
      workspaces!inner (
        type
      )
    `)
    .eq("id", sheetId)
    .single();

  if (!sheet) return null;

  // Ù Ù
  const { data: columns } = await supabase
    .from("columns")
    .select("name, type, ai_features, config")
    .eq("sheet_id", sheetId)
    .order("order_index");

  // ÿ pt0 (\¸ 20â)
  const { data: rows } = await supabase
    .from("rows")
    .select("id")
    .eq("sheet_id", sheetId)
    .order("created_at", { ascending: false })
    .limit(20);

  const rowIds = rows?.map((r) => r.id) || [];

  const { data: cells } = await supabase
    .from("cells")
    .select("row_id, column_id, value, columns!inner(name)")
    .in("row_id", rowIds.length > 0 ? rowIds : ["none"]);

  // ÿ pt0 l1
  const sampleData: RowData[] = [];
  const rowDataMap = new Map<string, RowData>();

  cells?.forEach((cell) => {
    const columnName = (cell.columns as unknown as { name: string }).name;
    if (!rowDataMap.has(cell.row_id)) {
      rowDataMap.set(cell.row_id, {});
    }
    rowDataMap.get(cell.row_id)![columnName] = cell.value;
  });

  rowDataMap.forEach((data) => {
    if (Object.keys(data).length > 0) {
      sampleData.push(data);
    }
  });

  const workspace = sheet.workspaces as unknown as { type: string };

  return {
    sheetName: sheet.name,
    workspaceType: workspace.type,
    columns:
      columns?.map((c) => ({
        name: c.name,
        type: c.type,
        aiFeatures: (c.ai_features as AIFeatureType[]) || [],
        config: c.config as Record<string, unknown>,
      })) || [],
    sampleData,
  };
}

// â pt0 \‹
export async function loadRowData(
  supabase: SupabaseClient,
  rowId: string
): Promise<RowData | null> {
  const { data: cells } = await supabase
    .from("cells")
    .select("value, columns!inner(name)")
    .eq("row_id", rowId);

  if (!cells || cells.length === 0) return {};

  const rowData: RowData = {};
  cells.forEach((cell) => {
    const columnName = (cell.columns as unknown as { name: string }).name;
    rowData[columnName] = cell.value;
  });

  return rowData;
}

// Ë| Ù AI ò¨
export async function processAIColumn(
  supabase: SupabaseClient,
  options: {
    sheetId: string;
    columnId: string;
    rowId: string;
    feature?: AIFeatureType;
    additionalContext?: string;
  }
): Promise<AIResponse> {
  const { sheetId, columnId, rowId, feature, additionalContext } = options;

  // ËM§∏ \‹
  const sheetContext = await loadSheetContext(supabase, sheetId);
  if (!sheetContext) {
    throw new Error("‹∏| >D  ∆µ»‰.");
  }

  // Ù Ù
  const { data: column } = await supabase
    .from("columns")
    .select("name, type, ai_features, config")
    .eq("id", columnId)
    .single();

  if (!column) {
    throw new Error("ÙD >D  ∆µ»‰.");
  }

  const targetColumn: ColumnContext = {
    name: column.name,
    type: column.type,
    aiFeatures: (column.ai_features as AIFeatureType[]) || [],
    config: column.config as Record<string, unknown>,
  };

  // â pt0
  const currentRow = await loadRowData(supabase, rowId);
  if (!currentRow) {
    throw new Error("â pt0| >D  ∆µ»‰.");
  }

  // AI 0• ∞
  const aiFeature =
    feature || targetColumn.aiFeatures[0] || ("autofill" as AIFeatureType);

  // AI î≠
  const request: AIRequest = {
    feature: aiFeature,
    targetColumn,
    currentRow,
    sheetContext,
    additionalContext,
  };

  return executeAIFeature(request);
}

// Ë| Ù AI ò¨ (§∏¨)
export async function* processAIColumnStream(
  supabase: SupabaseClient,
  options: {
    sheetId: string;
    columnId: string;
    rowId: string;
    feature?: AIFeatureType;
    additionalContext?: string;
  }
): AsyncGenerator<AIStreamChunk> {
  const { sheetId, columnId, rowId, feature, additionalContext } = options;

  // ËM§∏ \‹
  const sheetContext = await loadSheetContext(supabase, sheetId);
  if (!sheetContext) {
    yield { type: "error", content: "‹∏| >D  ∆µ»‰." };
    return;
  }

  // Ù Ù
  const { data: column } = await supabase
    .from("columns")
    .select("name, type, ai_features, config")
    .eq("id", columnId)
    .single();

  if (!column) {
    yield { type: "error", content: "ÙD >D  ∆µ»‰." };
    return;
  }

  const targetColumn: ColumnContext = {
    name: column.name,
    type: column.type,
    aiFeatures: (column.ai_features as AIFeatureType[]) || [],
    config: column.config as Record<string, unknown>,
  };

  // â pt0
  const currentRow = await loadRowData(supabase, rowId);
  if (!currentRow) {
    yield { type: "error", content: "â pt0| >D  ∆µ»‰." };
    return;
  }

  const aiFeature =
    feature || targetColumn.aiFeatures[0] || ("autofill" as AIFeatureType);

  const request: AIRequest = {
    feature: aiFeature,
    targetColumn,
    currentRow,
    sheetContext,
    additionalContext,
  };

  yield* executeAIFeatureStream(request);
}

// 0X ò¨
export async function batchProcess(
  supabase: SupabaseClient,
  request: BatchRequest
): Promise<BatchResponse> {
  const { feature, targetColumn, rows, sheetContext } = request;

  const results: BatchResponse["results"] = [];
  const errors: BatchResponse["errors"] = [];

  // 0X l0 (\ à– ò¨` â )
  const BATCH_SIZE = 10;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    try {
      const prompt = buildBatchPrompt(
        feature,
        targetColumn,
        batch,
        sheetContext
      );

      const response = await callClaude(prompt, { maxTokens: 4096 });

      // Qı Ò
      const parsed = parseBatchResponse(response, batch);
      results.push(...parsed.results);
      errors.push(...parsed.errors);
    } catch (error) {
      // 0X ‰( ‹ ƒ ò¨
      for (const row of batch) {
        errors.push({
          rowId: row.rowId,
          error: error instanceof Error ? error.message : "0X ò¨ ‰(",
        });
      }
    }
  }

  return {
    results,
    totalProcessed: results.length,
    errors,
  };
}

// 0X Qı Ò
function parseBatchResponse(
  response: string,
  rows: { rowId: string; data: RowData }[]
): { results: BatchResponse["results"]; errors: BatchResponse["errors"] } {
  const results: BatchResponse["results"] = [];
  const errors: BatchResponse["errors"] = [];

  try {
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : response;
    const parsed = JSON.parse(jsonStr);

    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        const row = rows.find((r) => r.rowId === item.rowId);
        if (row) {
          results.push({
            rowId: item.rowId,
            response: {
              value: String(item.value || ""),
              confidence: Number(item.confidence) || 0.5,
              alternatives: item.alternatives || [],
            },
          });
        }
      }
    }
  } catch {
    // Ò ‰( ‹ ®‡ âD –Ï\ ò¨
    for (const row of rows) {
      errors.push({
        rowId: row.rowId,
        error: "Qı Ò ‰(",
      });
    }
  }

  return { results, errors };
}

// ¨©ê  Yµ
export async function learnFromCorrection(
  supabase: SupabaseClient,
  workspaceId: string,
  correction: CorrectionData
): Promise<void> {
  const { originalValue, correctedValue, columnContext, rowData, feature } =
    correction;

  // 0t (4 Ä…
  const { data: existingPattern } = await supabase
    .from("ai_patterns")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("pattern_type", feature)
    .single();

  // (4 pt0 ›1
  const patternData = {
    corrections: [
      {
        original: originalValue,
        corrected: correctedValue,
        context: {
          columnName: columnContext.name,
          columnType: columnContext.type,
          rowData: Object.keys(rowData).slice(0, 5), // §Ã  •
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  if (existingPattern) {
    // 0t (4 ≈pt∏
    const existingCorrections = (
      existingPattern.pattern_data as { corrections?: unknown[] }
    ).corrections || [];
    const updatedCorrections = [...existingCorrections, ...patternData.corrections].slice(
      -100
    ); // \  100  ¿

    // 1ı` ƒ∞ (t Dîà‰î É@ ‰()
    const newSuccessRate = Math.max(
      0,
      (existingPattern.success_rate || 1) * 0.95
    );

    await supabase
      .from("ai_patterns")
      .update({
        pattern_data: { corrections: updatedCorrections },
        success_rate: newSuccessRate,
        usage_count: (existingPattern.usage_count || 0) + 1,
      })
      .eq("id", existingPattern.id);
  } else {
    // » (4 ›1
    await supabase.from("ai_patterns").insert({
      workspace_id: workspaceId,
      pattern_type: feature,
      pattern_data: patternData,
      success_rate: 0.5, // 0 1ı`
      usage_count: 1,
    });
  }
}

// Yµ (4 ©
export async function applyLearnedPatterns(
  supabase: SupabaseClient,
  workspaceId: string,
  feature: AIFeatureType,
  context: string
): Promise<string | null> {
  const { data: pattern } = await supabase
    .from("ai_patterns")
    .select("pattern_data, success_rate")
    .eq("workspace_id", workspaceId)
    .eq("pattern_type", feature)
    .single();

  if (!pattern || (pattern.success_rate || 0) < 0.3) {
    return null; // 1ı`t 4 Æ<t ©X¿ JL
  }

  // (4 pt0– å∏ îú
  const corrections = (pattern.pattern_data as { corrections?: unknown[] })
    .corrections || [];
  if (corrections.length === 0) {
    return null;
  }

  // \¸  ¥ÌD å∏\ ı
  const hints = corrections
    .slice(-5)
    .map(
      (c: { original: string; corrected: string }) => `"${c.original}" í "${c.corrected}"`
    )
    .join("\n");

  return `

## Yµ (4 (t  ¥Ì 8‡)
${hints}

 (4D 8‡XÏ T U\ D ›1t¸8î.`;
}

// @   •  ≈pt∏
export async function saveCellValue(
  supabase: SupabaseClient,
  options: {
    rowId: string;
    columnId: string;
    value: string;
    aiGenerated: boolean;
    confidence?: number;
  }
): Promise<void> {
  const { rowId, columnId, value, aiGenerated, confidence } = options;

  // 0t @ Ux
  const { data: existingCell } = await supabase
    .from("cells")
    .select("id")
    .eq("row_id", rowId)
    .eq("column_id", columnId)
    .single();

  if (existingCell) {
    // ≈pt∏
    await supabase
      .from("cells")
      .update({
        value,
        ai_generated: aiGenerated,
        ai_confidence: confidence,
      })
      .eq("id", existingCell.id);
  } else {
    // »\ ›1
    await supabase.from("cells").insert({
      row_id: rowId,
      column_id: columnId,
      value,
      ai_generated: aiGenerated,
      ai_confidence: confidence,
    });
  }
}
