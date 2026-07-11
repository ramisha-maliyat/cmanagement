import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("health_check");

    if (error) {
      console.error("Supabase health-check error:", error.message);

      return NextResponse.json(
        {
          status: "error",
          message: "Could not connect to the database.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      status: "ok",
      service: "cmanagement",
      supabase: data,
    });
  } catch (error) {
    console.error("Unexpected health-check error:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Unexpected server error.",
      },
      {
        status: 500,
      },
    );
  }
}