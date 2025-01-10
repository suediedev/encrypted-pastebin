import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt, verifyPassword } from "@/lib/encryption";
import { rateLimiter } from "@/lib/rate-limit";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success } = await rateLimiter.limit(ip);
    
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    const snippet = await prisma.snippet.findUnique({
      where: { id: params.id },
    });

    if (!snippet) {
      return NextResponse.json(
        { error: "Snippet not found" },
        { status: 404 }
      );
    }

    // Check expiration
    if (snippet.expiresAt && new Date() > snippet.expiresAt) {
      await prisma.snippet.delete({
        where: { id: params.id },
      });
      return NextResponse.json(
        { error: "Snippet has expired" },
        { status: 404 }
      );
    }

    // If password protected, only return metadata
    if (snippet.passwordHash) {
      return NextResponse.json({
        isProtected: true,
        expiresAt: snippet.expiresAt,
      });
    }

    // Decrypt content
    const decryptedContent = decrypt(snippet.content, snippet.iv);

    return NextResponse.json({
      content: decryptedContent,
      expiresAt: snippet.expiresAt,
    });
  } catch (error) {
    console.error("Error retrieving snippet:", error);
    return NextResponse.json(
      { error: "Failed to retrieve snippet" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { password } = await req.json();
    const snippet = await prisma.snippet.findUnique({
      where: { id: params.id },
    });

    if (!snippet || !snippet.passwordHash || !snippet.salt) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    if (!verifyPassword(password, snippet.passwordHash, snippet.salt)) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    const decryptedContent = decrypt(snippet.content, snippet.iv);

    return NextResponse.json({
      content: decryptedContent,
      expiresAt: snippet.expiresAt,
    });
  } catch (error) {
    console.error("Error verifying password:", error);
    return NextResponse.json(
      { error: "Failed to verify password" },
      { status: 500 }
    );
  }
}