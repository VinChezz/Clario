import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { existsSync, mkdirSync } from "fs";
import { writeFile } from "fs/promises";
import path from "path";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const AVATAR_SIZE = 200;

export async function POST(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const action = formData.get("action") as string;

    const googleAvatar = user.picture || null;

    if (action === "reset-to-google") {
      if (!googleAvatar) {
        return NextResponse.json(
          { error: "No Google avatar available" },
          { status: 400 }
        );
      }

      await prisma.user.update({
        where: { id: dbUser.id },
        data: { image: googleAvatar },
      });

      return NextResponse.json({
        success: true,
        message: "Avatar reset to Google image",
        imageUrl: googleAvatar,
        isGoogleAvatar: true,
      });
    }

    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Use JPG, PNG, or WebP" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Max 5MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let processedImage: Buffer;
    try {
      processedImage = await sharp(buffer)
        .rotate()
        .resize(AVATAR_SIZE, AVATAR_SIZE, {
          fit: "cover",
          position: "center",
        })
        .jpeg({ quality: 85 })
        .toBuffer();
    } catch (error) {
      console.error("Image processing error:", error);
      return NextResponse.json(
        { error: "Failed to process image" },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const avatarsDir = path.join(uploadsDir, "avatars");
    const userDir = path.join(avatarsDir, dbUser.id);

    [uploadsDir, avatarsDir, userDir].forEach((dir) => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });

    const uniqueFileName = `${uuidv4()}.jpg`;
    const filePath = path.join(userDir, uniqueFileName);
    const relativePath = `/uploads/avatars/${dbUser.id}/${uniqueFileName}`;

    try {
      await writeFile(filePath, processedImage);
    } catch (error) {
      console.error("Failed to save image:", error);
      return NextResponse.json(
        { error: "Failed to save image" },
        { status: 500 }
      );
    }

    if (
      dbUser.image &&
      !dbUser.image.startsWith("http") &&
      !dbUser.image.startsWith("https")
    ) {
      try {
        const oldImagePath = path.join(process.cwd(), "public", dbUser.image);
        if (existsSync(oldImagePath)) {
          const fs = require("fs/promises");
          await fs.unlink(oldImagePath);
        }
      } catch (error) {
        console.error("Error deleting old avatar:", error);
      }
    }

    await prisma.user.update({
      where: { id: dbUser.id },
      data: { image: relativePath },
    });

    return NextResponse.json({
      success: true,
      message: "Avatar uploaded successfully",
      imageUrl: relativePath,
      isGoogleAvatar: false,
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Server error", message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    });

    const googleAvatar = user.picture || user.picture || user.picture || null;

    return NextResponse.json({
      success: true,
      currentAvatar: dbUser?.image || null,
      hasGoogleAvatar: !!googleAvatar,
      googleAvatar,
      isUsingGoogleAvatar: dbUser?.image === googleAvatar,
    });
  } catch (error) {
    console.error("Avatar info error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
