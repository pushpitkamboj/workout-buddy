/*
  Warnings:

  - You are about to drop the column `passwordResetExpiry` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "passwordResetExpiry",
ADD COLUMN     "passwordResetTokenExpiry" TIMESTAMP(3);
