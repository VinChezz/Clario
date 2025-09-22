import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user?.email) return NextResponse.json(null);

  let dbUser = await prisma.user.findUnique({ where: { email: user.email } });

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        name: user.given_name || user.family_name || user.email.split("@")[0],
        email: user.email,
        image: user.picture ?? "",
      },
    });
  }

  return NextResponse.json(dbUser);
}
