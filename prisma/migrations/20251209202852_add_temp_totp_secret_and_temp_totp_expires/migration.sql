-- AlterTable
ALTER TABLE "UserSecurity" ADD COLUMN     "tempTotpExpires" TIMESTAMP(3),
ADD COLUMN     "tempTotpSecret" TEXT;
