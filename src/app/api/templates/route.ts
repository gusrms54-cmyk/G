import { NextRequest } from "next/server";
import {
  withAuth,
  successResponse,
  errorResponse,
} from "@/lib/api-utils";

// GET /api/templates - \¿ ©]
export async function GET(request: NextRequest) {
  return withAuth(async (_user, supabase) => {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let query = supabase
      .from("templates")
      .select("*")
      .order("users_count", { ascending: false });

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      return errorResponse(error.message);
    }

    return successResponse(data);
  });
}
