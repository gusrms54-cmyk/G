import { NextRequest } from "next/server";
import {
  withAuth,
  successResponse,
  errorResponse,
  notFoundResponse,
  forbiddenResponse,
  parseBody,
  verifyWorkspaceOwnership,
} from "@/lib/api-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/workspaces/[id] - Ìl¤˜t¤ Á8 (Ü¸ ìh)
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (user, supabase) => {
    const { id } = await params;

    const { data, error } = await supabase
      .from("workspaces")
      .select(`
        *,
        sheets (
          id,
          name,
          icon,
          order_index,
          created_at
        )
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return notFoundResponse("Ìl¤˜t¤");
    }

    return successResponse(data);
  });
}

// PUT /api/workspaces/[id] - Ìl¤˜t¤ 
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (user, supabase) => {
    const { id } = await params;

    const isOwner = await verifyWorkspaceOwnership(supabase, id, user.id);
    if (!isOwner) {
      return forbiddenResponse();
    }

    const body = await parseBody<{
      name?: string;
      type?: string;
      icon?: string;
      color?: string;
    }>(request);

    if (!body) {
      return errorResponse("”­ ø8t D”iÈä.");
    }

    if (body.type) {
      const validTypes = ["marketing", "sales", "accounting", "hr", "project", "custom"];
      if (!validTypes.includes(body.type)) {
        return errorResponse(" ¨XÀ J@ Ìl¤˜t¤ À……Èä.");
      }
    }

    const { data, error } = await supabase
      .from("workspaces")
      .update({
        ...(body.name && { name: body.name }),
        ...(body.type && { type: body.type }),
        ...(body.icon !== undefined && { icon: body.icon }),
        ...(body.color !== undefined && { color: body.color }),
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

// DELETE /api/workspaces/[id] - Ìl¤˜t¤ ­
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (user, supabase) => {
    const { id } = await params;

    const isOwner = await verifyWorkspaceOwnership(supabase, id, user.id);
    if (!isOwner) {
      return forbiddenResponse();
    }

    const { error } = await supabase
      .from("workspaces")
      .delete()
      .eq("id", id);

    if (error) {
      return errorResponse(error.message);
    }

    return successResponse({ deleted: true });
  });
}
