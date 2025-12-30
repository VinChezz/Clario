import { prisma } from "@/lib/prisma";
import { calculateFileSize } from "@/lib/fileSizeCalculator";
import { getTeamStorageInfo, TeamStorageInfo } from "@/lib/teamStorageUtils";

export interface CreateFileWithTeamCheckParams {
  fileName: string;
  teamId: string;
  userId: string;
  document?: string;
  whiteboard?: string;
  archive?: boolean;
  isPublic?: boolean;
  permissions?: string;
  autoVersioning?: boolean;
}

export interface FileOperationResult {
  success: boolean;
  file?: any;
  error?: string;
  teamStorageInfo?: TeamStorageInfo;
}

export function canTeamStoreFile(
  teamStorageInfo: TeamStorageInfo,
  fileSizeBytes: bigint
): boolean {
  return teamStorageInfo.availableBytes >= fileSizeBytes;
}

function formatSizeForMessage(bytes: bigint): string {
  const bytesNum = Number(bytes);
  if (bytesNum >= 1024 ** 3) {
    return `${(bytesNum / 1024 ** 3).toFixed(2)} GB`;
  } else if (bytesNum >= 1024 ** 2) {
    return `${(bytesNum / 1024 ** 2).toFixed(2)} MB`;
  } else if (bytesNum >= 1024) {
    return `${(bytesNum / 1024).toFixed(2)} KB`;
  }
  return `${bytesNum} B`;
}

export async function createFileWithTeamCheck({
  fileName,
  teamId,
  userId,
  document,
  whiteboard,
  archive = false,
  isPublic = false,
  permissions = "VIEW",
  autoVersioning = true,
}: CreateFileWithTeamCheckParams): Promise<FileOperationResult> {
  try {
    const fileSizeBytes = calculateFileSize(document, whiteboard);

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        createdBy: true,
        files: {
          where: { deletedAt: null },
          select: {
            document: true,
            whiteboard: true,
            sizeBytes: true,
          },
        },
        members: {
          select: { id: true, userId: true },
        },
      },
    });

    if (!team) {
      return { success: false, error: "Team not found" };
    }

    const isMember = team.members.some((member) => member.userId === userId);

    if (!isMember) {
      return {
        success: false,
        error: "You are not a member of this team",
      };
    }

    const teamStorageInfo = await getTeamStorageInfo({
      ...team,
      members: team.members,
    });

    if (!canTeamStoreFile(teamStorageInfo, fileSizeBytes)) {
      const availableFormatted = formatSizeForMessage(
        teamStorageInfo.availableBytes
      );
      const neededFormatted = formatSizeForMessage(fileSizeBytes);

      return {
        success: false,
        error: `Team storage insufficient. Available: ${availableFormatted}, Needed: ${neededFormatted}`,
        teamStorageInfo,
      };
    }

    const file = await prisma.file.create({
      data: {
        fileName,
        teamId,
        createdById: userId,
        document,
        whiteboard,
        archive,
        isPublic,
        permissions,
        sizeBytes: fileSizeBytes,
        autoVersioning,
        version: 1,
        currentVersion: 1,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                plan: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        totalCreatedFiles: { increment: 1 },
      },
    });

    return {
      success: true,
      file,
      teamStorageInfo,
    };
  } catch (error) {
    console.error("Error creating file with team check:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create file",
    };
  }
}

export async function updateFileWithTeamCheck({
  fileId,
  userId,
  document,
  whiteboard,
  fileName,
  archive,
  isPublic,
  permissions,
  createNewVersion = true,
}: any): Promise<FileOperationResult> {
  try {
    const existingFile = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        team: {
          include: {
            createdBy: true,
            files: {
              where: { deletedAt: null },
              select: {
                document: true,
                whiteboard: true,
                sizeBytes: true,
              },
            },
            members: {
              select: { id: true, userId: true },
            },
          },
        },
      },
    });

    if (!existingFile) {
      return { success: false, error: "File not found" };
    }

    if (existingFile.createdById !== userId) {
      const isTeamAdmin = await prisma.teamMember.findFirst({
        where: {
          teamId: existingFile.teamId,
          userId: userId,
          role: "ADMIN",
        },
      });

      if (!isTeamAdmin) {
        return {
          success: false,
          error: "You don't have permission to edit this file",
        };
      }
    }

    const newDocument =
      document !== undefined ? document : existingFile.document;
    const newWhiteboard =
      whiteboard !== undefined ? whiteboard : existingFile.whiteboard;
    const newFileSizeBytes = calculateFileSize(newDocument, newWhiteboard);

    const sizeDifference =
      newFileSizeBytes - (existingFile.sizeBytes || BigInt(0));

    if (sizeDifference > 0) {
      const teamStorageInfo = await getTeamStorageInfo(existingFile.team);

      if (!canTeamStoreFile(teamStorageInfo, sizeDifference)) {
        const availableFormatted = formatSizeForMessage(
          teamStorageInfo.availableBytes
        );
        const neededFormatted = formatSizeForMessage(sizeDifference);

        return {
          success: false,
          error: `Team storage insufficient. Available: ${availableFormatted}, Needed: ${neededFormatted}`,
          teamStorageInfo,
        };
      }
    }

    if (createNewVersion && existingFile.autoVersioning) {
      await prisma.documentVersion.create({
        data: {
          version: existingFile.version,
          name: `Version ${existingFile.version}`,
          content: existingFile.document || existingFile.whiteboard || "",
          type: existingFile.document ? "document" : "whiteboard",
          fileId: existingFile.id,
          authorId: userId,
        },
      });
    }

    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: {
        fileName: fileName !== undefined ? fileName : existingFile.fileName,
        document: document !== undefined ? document : existingFile.document,
        whiteboard:
          whiteboard !== undefined ? whiteboard : existingFile.whiteboard,
        archive: archive !== undefined ? archive : existingFile.archive,
        isPublic: isPublic !== undefined ? isPublic : existingFile.isPublic,
        permissions:
          permissions !== undefined ? permissions : existingFile.permissions,
        sizeBytes: newFileSizeBytes,
        version:
          createNewVersion && existingFile.autoVersioning
            ? existingFile.version + 1
            : existingFile.version,
        currentVersion:
          createNewVersion && existingFile.autoVersioning
            ? existingFile.version + 1
            : existingFile.currentVersion,
        updatedAt: new Date(),
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                plan: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        versions: {
          orderBy: { version: "desc" },
          take: 5,
        },
      },
    });

    const team = await prisma.team.findUnique({
      where: { id: existingFile.teamId },
      include: {
        createdBy: true,
        files: {
          where: { deletedAt: null },
          select: { sizeBytes: true },
        },
        members: {
          select: { id: true },
        },
      },
    });

    const teamStorageInfo = team ? await getTeamStorageInfo(team) : undefined;

    return {
      success: true,
      file: updatedFile,
      teamStorageInfo,
    };
  } catch (error) {
    console.error("Error updating file with team check:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update file",
    };
  }
}

export async function deleteFileWithTeamCheck(
  fileId: string,
  userId: string
): Promise<FileOperationResult> {
  try {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        team: {
          include: {
            createdBy: true,
            files: {
              where: { deletedAt: null },
              select: { sizeBytes: true },
            },
            members: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!file) {
      return {
        success: false,
        error: "File not found",
      };
    }

    if (file.createdById !== userId) {
      const isTeamAdmin = await prisma.teamMember.findFirst({
        where: {
          teamId: file.teamId,
          userId: userId,
          role: "ADMIN",
        },
      });

      if (!isTeamAdmin) {
        return {
          success: false,
          error: "You don't have permission to delete this file",
        };
      }
    }

    const deletedFile = await prisma.file.update({
      where: { id: fileId },
      data: {
        deletedAt: new Date(),
      },
    });

    const team = await prisma.team.findUnique({
      where: { id: file.teamId },
      include: {
        createdBy: true,
        files: {
          where: { deletedAt: null },
          select: { sizeBytes: true },
        },
        members: {
          select: { id: true },
        },
      },
    });

    const teamStorageInfo = team ? await getTeamStorageInfo(team) : undefined;

    return {
      success: true,
      file: deletedFile,
      teamStorageInfo,
    };
  } catch (error) {
    console.error("Error deleting file with team check:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete file",
    };
  }
}

export async function getFileStorageInfo(
  fileId: string
): Promise<FileOperationResult> {
  try {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        team: {
          include: {
            createdBy: true,
            files: {
              where: { deletedAt: null },
              select: { sizeBytes: true },
            },
            members: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!file) {
      return {
        success: false,
        error: "File not found",
      };
    }

    const teamStorageInfo = await getTeamStorageInfo(file.team);

    return {
      success: true,
      teamStorageInfo,
    };
  } catch (error) {
    console.error("Error getting file storage info:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get storage info",
    };
  }
}

export async function checkTeamStorageAvailability(
  teamId: string,
  requiredBytes: bigint
): Promise<{
  available: boolean;
  teamStorageInfo?: TeamStorageInfo;
  error?: string;
}> {
  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        createdBy: true,
        files: {
          where: { deletedAt: null },
          select: { sizeBytes: true },
        },
        members: {
          select: { id: true },
        },
      },
    });

    if (!team) {
      return {
        available: false,
        error: "Team not found",
      };
    }

    const teamStorageInfo = await getTeamStorageInfo(team);
    const available = canTeamStoreFile(teamStorageInfo, requiredBytes);

    return {
      available,
      teamStorageInfo,
    };
  } catch (error) {
    console.error("Error checking team storage:", error);
    return {
      available: false,
      error: error instanceof Error ? error.message : "Failed to check storage",
    };
  }
}
