/*
  Warnings:

  - You are about to drop the column `code` on the `QuestionOption` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `Question` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "QuestionOption_code_key";

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "QuestionOption" DROP COLUMN "code";

-- CreateIndex
CREATE UNIQUE INDEX "Question_code_key" ON "Question"("code");
