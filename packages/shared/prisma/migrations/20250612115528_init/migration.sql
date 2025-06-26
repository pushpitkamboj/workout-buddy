/*
  Warnings:

  - You are about to drop the column `name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `verificationExpiry` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "name",
DROP COLUMN "verificationExpiry",
ADD COLUMN     "username" TEXT,
ADD COLUMN     "verificationTokenExpiry" TIMESTAMP(3);
