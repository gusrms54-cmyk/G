import { NextRequest } from "next/server";
import {
  withAuth,
  successResponse,
  errorResponse,
  parseBody,
} from "@/lib/api-utils";

// GET /api/workspaces - ´ Ìl¤˜t¤ ©]
export async function GET() {
  return withAuth(async (user, supabase) => {
    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return errorResponse(error.message);
    }

    return successResponse(data);
  });
}

// POST /api/workspaces - È Ìl¤˜t¤ Ý1
export async function POST(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const body = await parseBody<{
      name: string;
      type: string;
      icon?: string;
      color?: string;
    }>(request);

    if (!body || !body.name || !body.type) {
      return errorResponse("t„ü À…@ D…Èä.");
    }

    const validTypes = ["marketing", "sales", "accounting", "hr", "project", "custom"];
    if (!validTypes.includes(body.type)) {
      return errorResponse(" ¨XÀ J@ Ìl¤˜t¤ À……Èä.");
    }

    const { data, error } = await supabase
      .from("workspaces")
      .insert({
        user_id: user.id,
        name: body.name,
        type: body.type,
        icon: body.icon,
        color: body.color,
      })
      .select()
      .single();

    if (error) {
      return errorResponse(error.message);
    }

    return successResponse(data, 201);
  });
}
