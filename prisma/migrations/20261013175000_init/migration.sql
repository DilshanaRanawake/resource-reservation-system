-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('pending', 'confirmed', 'cancelled');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "resource_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "start_time" TIMESTAMPTZ(6) NOT NULL,
    "end_time" TIMESTAMPTZ(6) NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- btree_gist is required to combine equality on resource_id with a timestamptz range in one GiST exclusion constraint.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Reject zero-length and inverted ranges. The overlap constraint below uses a half-open range.
ALTER TABLE "reservations"
  ADD CONSTRAINT "reservations_end_after_start"
  CHECK ("end_time" > "start_time");

-- Confirmed reservations for one resource may not overlap. [start_time, end_time) allows back-to-back bookings.
ALTER TABLE "reservations"
  ADD CONSTRAINT "reservations_no_confirmed_overlap"
  EXCLUDE USING gist (
    "resource_id" WITH =,
    tstzrange("start_time", "end_time", '[)') WITH &&
  )
  WHERE ("status" = 'confirmed');
