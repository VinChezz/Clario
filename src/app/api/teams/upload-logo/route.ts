import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { existsSync, mkdirSync } from "fs";
import { writeFile, unlink } from "fs/promises";
import path from "path";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const LOGO_SIZE = 512;

export async function POST(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const teamId = formData.get("teamId") as string;

    if (!file || !teamId) {
      return NextResponse.json(
        { error: "File and teamId are required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Use JPG, PNG, WebP, or GIF" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Max 5MB" },
        { status: 400 }
      );
    }

    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: dbUser.id,
        role: "ADMIN",
      },
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: "No permission to update this team" },
        { status: 403 }
      );
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let processedImage: Buffer;
    try {
      if (file.type === "image/gif") {
        processedImage = buffer;
      } else {
        processedImage = await sharp(buffer)
          .rotate()
          .resize(LOGO_SIZE, LOGO_SIZE, {
            fit: "contain",
            background: { r: 255, g: 255, b: 255, alpha: 0 },
          })
          .png({ quality: 90 })
          .toBuffer();
      }
    } catch (error) {
      console.error("Image processing error:", error);
      return NextResponse.json(
        { error: "Failed to process image" },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const teamsDir = path.join(uploadsDir, "teams");
    const teamDir = path.join(teamsDir, teamId);

    [uploadsDir, teamsDir, teamDir].forEach((dir) => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });

    const extension = file.type === "image/gif" ? "gif" : "png";
    const uniqueFileName = `${uuidv4()}.${extension}`;
    const filePath = path.join(teamDir, uniqueFileName);
    const relativePath = `/uploads/teams/${teamId}/${uniqueFileName}`;

    try {
      await writeFile(filePath, processedImage);
    } catch (error) {
      console.error("Failed to save image:", error);
      return NextResponse.json(
        { error: "Failed to save image" },
        { status: 500 }
      );
    }

    if (team?.logo && !team.logo.startsWith("http")) {
      try {
        const oldLogoPath = path.join(process.cwd(), "public", team.logo);
        if (existsSync(oldLogoPath)) {
          await unlink(oldLogoPath);
        }
      } catch (error) {
        console.error("Error deleting old logo:", error);
      }
    }

    await prisma.team.update({
      where: { id: teamId },
      data: { logo: relativePath },
    });

    return NextResponse.json({
      success: true,
      message: "Logo uploaded successfully",
      logoUrl: relativePath,
    });
  } catch (error) {
    console.error("Logo upload error:", error);
    return NextResponse.json(
      { error: "Server error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
