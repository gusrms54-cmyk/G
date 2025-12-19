import { NextRequest } from "next/server";
import {
  withAuth,
  successResponse,
  errorResponse,
  notFoundResponse,
  forbiddenResponse,
  parseBody,
  verifySheetOwnership,
} from "@/lib/api-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/sheets/[id] - Ü¸ pt0 (ô, ‰, @ ìh)
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (user, supabase) => {
    const { id } = await params;

    // Ü¸ Œ Œ Ux
    const isOwner = await verifySheetOwnership(supabase, id, user.id);
    if (!isOwner) {
      return forbiddenResponse();
    }

    // Ü¸ 0ø ô
    const { data: sheet, error: sheetError } = await supabase
      .from("sheets")
      .select("*")
      .eq("id", id)
      .single();

    if (sheetError || !sheet) {
      return notFoundResponse("Ü¸");
    }

    // ô ô
    const { data: columns } = await supabase
      .from("columns")
      .select("*")
      .eq("sheet_id", id)
      .order("order_index", { ascending: true });

    // ‰ ô
    const { data: rows } = await supabase
      .from("rows")
      .select("*")
      .eq("sheet_id", id)
      .order("order_index", { ascending: true });

    // @ ô
    const rowIds = rows?.map((r) => r.id) || [];
    const { data: cells } = await supabase
      .from("cells")
      .select("*")
      .in("row_id", rowIds.length > 0 ? rowIds : ["none"]);

    return successResponse({
      ...sheet,
      columns: columns || [],
      rows: rows || [],
      cells: cells || [],
    });
  });
}

// PUT /api/sheets/[id] - Ü¸ 
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (user, supabase) => {
    const { id } = await params;

    const isOwner = await verifySheetOwnership(supabase, id, user.id);
    if (!isOwner) {
      return forbiddenResponse();
    }

    const body = await parseBody<{
      name?: string;
      icon?: string;
      order_index?: number;
    }>(request);

    if (!body) {
      return errorResponse("”­ ø8t D”iÈä.");
    }

    const { data, error } = await supabase
      .from("sheets")
      .update({
        ...(body.name && { name: body.name }),
        ...(body.icon !== undefined && { icon: body.icon }),
        ...(body.order_index !== undefined && { order_index: body.order_index }),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return errorResponse(error.message);
    }

    return successResponse(data);
  });
}
