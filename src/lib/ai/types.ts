// AI 0¥ À… X

export type AIFeatureType =
  | "autofill"
  | "lookup"
  | "analyze"
  | "recommend"
  | "generate"
  | "score";

export interface ColumnContext {
  name: string;
  type: string;
  aiFeatures: AIFeatureType[];
  config?: Record<string, unknown>;
}

export interface RowData {
  [columnName: string]: string | null;
}

export interface SheetContext {
  sheetName: string;
  workspaceType: string;
  columns: ColumnContext[];
  sampleData: RowData[];
}

export interface AIRequest {
  feature: AIFeatureType;
  targetColumn: ColumnContext;
  currentRow: RowData;
  sheetContext: SheetContext;
  additionalContext?: string;
}

export interface AIResponse {
  value: string;
  confidence: number;
  reasoning?: string;
  alternatives?: string[];
  metadata?: Record<string, unknown>;
}

export interface AIStreamChunk {
  type: "text" | "done" | "error";
  content: string;
  metadata?: Record<string, unknown>;
}

export interface BatchRequest {
  feature: AIFeatureType;
  targetColumn: ColumnContext;
  rows: { rowId: string; data: RowData }[];
  sheetContext: SheetContext;
}

export interface BatchResponse {
  results: {
    rowId: string;
    response: AIResponse;
  }[];
  totalProcessed: number;
  errors: { rowId: string; error: string }[];
}

export interface CorrectionData {
  originalValue: string;
  correctedValue: string;
  columnContext: ColumnContext;
  rowData: RowData;
  feature: AIFeatureType;
}

export interface LearnedPattern {
  id: string;
  patternType: AIFeatureType;
  inputPattern: string;
  outputPattern: string;
  successRate: number;
  usageCount: number;
}
