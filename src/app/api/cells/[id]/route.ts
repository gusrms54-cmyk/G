import { NextRequest } from "next/server";
import {
  withAuth,
  successResponse,
  errorResponse,
  notFoundResponse,
  forbiddenResponse,
  parseBody,
} from "@/lib/api-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/cells/[id] - @  
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (user, supabase) => {
    const { id } = await params;

    const body = await parseBody<{
      value?: string;
      ai_generated?: boolean;
      ai_confidence?: number;
    }>(request);

    if (!body) {
      return errorResponse("î≠ ¯8t Dîi»‰.");
    }

    // @ å å Ux (row -> sheet -> workspace -> user)
    const { data: cell } = await supabase
      .from("cells")
      .select(`
        id,
        rows!inner (
          sheet_id,
          sheets!inner (
            workspace_id,
            workspaces!inner (
              user_id
            )
          )
        )
      `)
      .eq("id", id)
      .single();

    if (!cell) {
      return notFoundResponse("@");
    }

    // ¿Ö Ë∏D µ\ ¸
    const rows = cell.rows as unknown as {
      sheets: {
        workspaces: {
          user_id: string;
        };
      };
    };

    if (rows.sheets.workspaces.user_id !== user.id) {
      return forbiddenResponse();
    }

    // ai_confidence î Äù
    if (body.ai_confidence !== undefined) {
      if (body.ai_confidence < 0 || body.ai_confidence > 1) {
        return errorResponse("ai_confidenceî 0¸ 1 ¨tÏ| i»‰.");
      }
    }

    const { data, error } = await supabase
      .from("cells")
      .update({
        ...(body.value !== undefined && { value: body.value }),
        ...(body.ai_generated !== undefined && { ai_generated: body.ai_generated }),
        ...(body.ai_confidence !== undefined && { ai_confidence: body.ai_confidence }),
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
