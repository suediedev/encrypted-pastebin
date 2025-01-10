import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt, hashPassword } from "@/lib/encryption";
import { rateLimiter } from "@/lib/rate-limit";
import { z } from "zod";
import { nanoid } from "nanoid";

export const dynamic = 'force-dynamic';

const snippetSchema = z.object({
  content: z.string().min(1),
  password: z.string().optional(),
  expiresIn: z.enum(["1h", "1d", "1w", "never"]),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success } = await rateLimiter.limit(ip);
    
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validated = snippetSchema.parse(body);

    // Calculate expiration
    let expiresAt: Date | null = null;
    if (validated.expiresIn !== "never") {
      expiresAt = new Date();
      switch (validated.expiresIn) {
        case "1h":
          expiresAt.setHours(expiresAt.getHours() + 1);
          break;
        case "1d":
          expiresAt.setDate(expiresAt.getDate() + 1);
          break;
        case "1w":
          expiresAt.setDate(expiresAt.getDate() + 7);
          break;
      }
    }

    // Encrypt content
    const { content: encryptedContent, iv } = encrypt(validated.content);

    // Handle password protection
    let passwordHash = null;
    let salt = null;
    if (validated.password) {
      const { hash, salt: pwdSalt } = hashPassword(validated.password);
      passwordHash = hash;
      salt = pwdSalt;
    }

    const snippet = await prisma.snippet.create({
      data: {
        id: nanoid(10),
        content: encryptedContent,
        iv,
        passwordHash,
        salt,
        expiresAt,
      },
    });

    return NextResponse.json({ id: snippet.id });
  } catch (error) {
    console.error("Error creating snippet:", error);
    return NextResponse.json(
      { error: "Failed to create snippet" },
      { status: 500 }
    );
  }
}