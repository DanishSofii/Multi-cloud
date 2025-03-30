/*
  Warnings:

  - A unique constraint covering the columns `[accountEmail]` on the table `CloudAuth` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `accountEmail` to the `CloudAuth` table without a default value. This is not possible if the table is not empty.
  - Added the required column `provider` to the `CloudAuth` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `cloudauth` DROP FOREIGN KEY `CloudAuth_userId_fkey`;

-- DropIndex
DROP INDEX `CloudAuth_userId_key` ON `cloudauth`;

-- AlterTable
ALTER TABLE `cloudauth` ADD COLUMN `accountEmail` VARCHAR(191) NOT NULL,
    ADD COLUMN `provider` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `CloudAuth_accountEmail_key` ON `CloudAuth`(`accountEmail`);

-- AddForeignKey
ALTER TABLE `CloudAuth` ADD CONSTRAINT `CloudAuth_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
