-- Phase 9: text/caption options alongside images.

CREATE TYPE "OptionType" AS ENUM ('Image', 'Text');

ALTER TABLE "Option" ADD COLUMN "content" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Option" ADD COLUMN "type" "OptionType" NOT NULL DEFAULT 'Image';
