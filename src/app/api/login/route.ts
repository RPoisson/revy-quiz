import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { success: false, error: "Login API disabled" },
    { status: 410 }
  );
}
