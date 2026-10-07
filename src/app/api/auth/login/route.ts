import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  signSessionToken,
  ensureDefaultAccounts,
} from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await ensureDefaultAccounts();

    const body = await req.json();
    const { email, password, loginType } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user || !verifyPassword(password, user.password)) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Role enforcement based on selected login portal
    if (loginType === "admin" && user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Access denied: This account does not possess administrator privileges. Please use the User Portal.",
        },
        { status: 403 }
      );
    }

    const token = signSessionToken({
      id: user.id,
      email: user.email,
      name: user.name || (user.role === "ADMIN" ? "Admin" : "User"),
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    // Set HTTP-only secure session cookie
    response.cookies.set("matrix_auth_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Authentication failed: " + err.message },
      { status: 500 }
    );
  }
}
