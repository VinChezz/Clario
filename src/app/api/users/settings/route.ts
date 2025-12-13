import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      include: {
        teamMembers: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          name:
            user.given_name + " " + user.family_name ||
            user.email?.split("@")[0] ||
            "User",
          email: user.email!,
          image: user.picture,
          lastLoginAt: new Date(),
          availabilityStatus: "AVAILABLE",
          showPresence: true,
        },
        include: {
          teamMembers: {
            include: {
              team: true,
            },
          },
        },
      });
    } else {
      await prisma.user.update({
        where: { email: user.email! },
        data: { lastLoginAt: new Date() },
      });
    }

    const teamMember = dbUser.teamMembers[0];
    const teamId = teamMember?.teamId || null;

    const settings = await prisma.userSettings.findUnique({
      where: { userId: dbUser.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            bio: true,
            timezone: true,
            availabilityStatus: true,
            customStatus: true,
            showPresence: true,
            plan: true,
            totalCreatedFiles: true,
            maxFiles: true,
            maxTeams: true,
            createdAt: true,
            lastLoginAt: true,
          },
        },
      },
    });

    if (!settings) {
      const defaultSettings = await prisma.userSettings.create({
        data: {
          userId: dbUser.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              bio: true,
              timezone: true,
              availabilityStatus: true,
              customStatus: true,
              showPresence: true,
              plan: true,
              totalCreatedFiles: true,
              maxFiles: true,
              maxTeams: true,
              createdAt: true,
              lastLoginAt: true,
            },
          },
        },
      });

      return NextResponse.json({
        ...defaultSettings,
        teamId,
      });
    }

    return NextResponse.json({
      ...settings,
      teamId,
    });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data = await request.json();
    console.log("Received update data:", data);

    const userData: any = {};
    const settingsData: any = {};

    const userFields = [
      "name",
      "bio",
      "timezone",
      "image",
      "availabilityStatus",
      "customStatus",
      "showPresence",
    ];

    const settingsFields = [
      "theme",
      "fontSize",
      "emailNotifications",
      "pushNotifications",
      "mentionEmails",
      "commentEmails",
      "autoSave",
      "spellCheck",
      "lineNumbers",
    ];

    Object.keys(data).forEach((key) => {
      if (userFields.includes(key)) {
        userData[key] = data[key];
      } else if (settingsFields.includes(key)) {
        settingsData[key] = data[key];
      }
    });

    if (Object.keys(userData).length > 0) {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: userData,
      });
    }

    if (Object.keys(settingsData).length > 0) {
      await prisma.userSettings.update({
        where: { userId: dbUser.id },
        data: settingsData,
      });
    }

    const updatedSettings = await prisma.userSettings.findUnique({
      where: { userId: dbUser.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            bio: true,
            timezone: true,
            plan: true,
            availabilityStatus: true,
            customStatus: true,
            showPresence: true,
            totalCreatedFiles: true,
            maxFiles: true,
            maxTeams: true,
            createdAt: true,
            lastLoginAt: true,
          },
        },
      },
    });

    if (!updatedSettings) {
      return NextResponse.json(
        { error: "Settings not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error("Error updating user settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
