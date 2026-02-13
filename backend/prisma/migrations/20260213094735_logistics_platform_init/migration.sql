/*
  Warnings:

  - The values [DRAFT,PAYMENT_PENDING,PAID,PROCESSING,DISPATCHED] on the enum `ShipmentStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [USER,RESELLER,EXPORTER,WAREHOUSE_ADMIN,SUPER_ADMIN,SUPPORT_AGENT] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `carrier` on the `Shipment` table. All the data in the column will be lost.
  - You are about to drop the column `chargeableWeight` on the `Shipment` table. All the data in the column will be lost.
  - You are about to drop the column `courierLabelUrl` on the `Shipment` table. All the data in the column will be lost.
  - You are about to drop the column `customsValue` on the `Shipment` table. All the data in the column will be lost.
  - You are about to drop the column `destinationAddress` on the `Shipment` table. All the data in the column will be lost.
  - You are about to drop the column `destinationCountry` on the `Shipment` table. All the data in the column will be lost.
  - You are about to drop the column `insuranceCost` on the `Shipment` table. All the data in the column will be lost.
  - You are about to drop the column `invoiceUrl` on the `Shipment` table. All the data in the column will be lost.
  - You are about to drop the column `shippingCost` on the `Shipment` table. All the data in the column will be lost.
  - You are about to drop the column `totalWeight` on the `Shipment` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Shipment` table. All the data in the column will be lost.
  - You are about to drop the column `volumetricWeight` on the `Shipment` table. All the data in the column will be lost.
  - You are about to alter the column `totalCost` on the `Shipment` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to drop the column `isVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Coupon` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ExporterApplication` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `IdempotencyKey` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LockerItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Package` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PersonalShopperRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ResellerApplication` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ShipmentItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SupportTicket` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TrackingEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VirtualAddress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Wallet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WalletTransaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WarehousePhoto` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WebhookEvent` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[trackingNumber]` on the table `Shipment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `baseCost` to the `Shipment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerId` to the `Shipment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deliveryAddress` to the `Shipment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `distanceCost` to the `Shipment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickupAddress` to the `Shipment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weight` to the `Shipment` table without a default value. This is not possible if the table is not empty.
  - Made the column `totalCost` on table `Shipment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `trackingNumber` on table `Shipment` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ShipmentStatus_new" AS ENUM ('PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');
ALTER TABLE "public"."Shipment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Shipment" ALTER COLUMN "status" TYPE "ShipmentStatus_new" USING ("status"::text::"ShipmentStatus_new");
ALTER TABLE "ShipmentStatusHistory" ALTER COLUMN "status" TYPE "ShipmentStatus_new" USING ("status"::text::"ShipmentStatus_new");
ALTER TYPE "ShipmentStatus" RENAME TO "ShipmentStatus_old";
ALTER TYPE "ShipmentStatus_new" RENAME TO "ShipmentStatus";
DROP TYPE "public"."ShipmentStatus_old";
ALTER TABLE "Shipment" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'MANAGER', 'DRIVER', 'CUSTOMER');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'CUSTOMER';
COMMIT;

-- DropForeignKey
ALTER TABLE "ExporterApplication" DROP CONSTRAINT "ExporterApplication_userId_fkey";

-- DropForeignKey
ALTER TABLE "LockerItem" DROP CONSTRAINT "LockerItem_packageId_fkey";

-- DropForeignKey
ALTER TABLE "Package" DROP CONSTRAINT "Package_virtualAddressId_fkey";

-- DropForeignKey
ALTER TABLE "PersonalShopperRequest" DROP CONSTRAINT "PersonalShopperRequest_userId_fkey";

-- DropForeignKey
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_userId_fkey";

-- DropForeignKey
ALTER TABLE "ResellerApplication" DROP CONSTRAINT "ResellerApplication_userId_fkey";

-- DropForeignKey
ALTER TABLE "ShipmentItem" DROP CONSTRAINT "ShipmentItem_lockerItemId_fkey";

-- DropForeignKey
ALTER TABLE "ShipmentItem" DROP CONSTRAINT "ShipmentItem_shipmentId_fkey";

-- DropForeignKey
ALTER TABLE "SupportTicket" DROP CONSTRAINT "SupportTicket_userId_fkey";

-- DropForeignKey
ALTER TABLE "TrackingEvent" DROP CONSTRAINT "TrackingEvent_shipmentId_fkey";

-- DropForeignKey
ALTER TABLE "VirtualAddress" DROP CONSTRAINT "VirtualAddress_userId_fkey";

-- DropForeignKey
ALTER TABLE "Wallet" DROP CONSTRAINT "Wallet_userId_fkey";

-- DropForeignKey
ALTER TABLE "WalletTransaction" DROP CONSTRAINT "WalletTransaction_walletId_fkey";

-- DropForeignKey
ALTER TABLE "WarehousePhoto" DROP CONSTRAINT "WarehousePhoto_packageId_fkey";

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "zipCode" TEXT;

-- AlterTable
ALTER TABLE "Shipment" DROP COLUMN "carrier",
DROP COLUMN "chargeableWeight",
DROP COLUMN "courierLabelUrl",
DROP COLUMN "customsValue",
DROP COLUMN "destinationAddress",
DROP COLUMN "destinationCountry",
DROP COLUMN "insuranceCost",
DROP COLUMN "invoiceUrl",
DROP COLUMN "shippingCost",
DROP COLUMN "totalWeight",
DROP COLUMN "userId",
DROP COLUMN "volumetricWeight",
ADD COLUMN     "actualDelivery" TIMESTAMP(3),
ADD COLUMN     "baseCost" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "customerId" TEXT NOT NULL,
ADD COLUMN     "deliveryAddress" TEXT NOT NULL,
ADD COLUMN     "deliveryLat" DOUBLE PRECISION,
ADD COLUMN     "deliveryLng" DOUBLE PRECISION,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "dimensions" TEXT,
ADD COLUMN     "distanceCost" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "driverId" TEXT,
ADD COLUMN     "estimatedDelivery" TIMESTAMP(3),
ADD COLUMN     "pickupAddress" TEXT NOT NULL,
ADD COLUMN     "pickupLat" DOUBLE PRECISION,
ADD COLUMN     "pickupLng" DOUBLE PRECISION,
ADD COLUMN     "weight" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING',
ALTER COLUMN "totalCost" SET NOT NULL,
ALTER COLUMN "totalCost" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "trackingNumber" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isVerified",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "role" SET DEFAULT 'CUSTOMER';

-- DropTable
DROP TABLE "AuditLog";

-- DropTable
DROP TABLE "Coupon";

-- DropTable
DROP TABLE "ExporterApplication";

-- DropTable
DROP TABLE "IdempotencyKey";

-- DropTable
DROP TABLE "LockerItem";

-- DropTable
DROP TABLE "Package";

-- DropTable
DROP TABLE "PersonalShopperRequest";

-- DropTable
DROP TABLE "ResellerApplication";

-- DropTable
DROP TABLE "ShipmentItem";

-- DropTable
DROP TABLE "SupportTicket";

-- DropTable
DROP TABLE "TrackingEvent";

-- DropTable
DROP TABLE "VirtualAddress";

-- DropTable
DROP TABLE "Wallet";

-- DropTable
DROP TABLE "WalletTransaction";

-- DropTable
DROP TABLE "WarehousePhoto";

-- DropTable
DROP TABLE "WebhookEvent";

-- DropEnum
DROP TYPE "PackageStatus";

-- DropEnum
DROP TYPE "WalletTransactionType";

-- CreateTable
CREATE TABLE "ShipmentStatusHistory" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "status" "ShipmentStatus" NOT NULL,
    "notes" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "ShipmentStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "vehiclePlate" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "currentLat" DOUBLE PRECISION,
    "currentLng" DOUBLE PRECISION,
    "totalDeliveries" INTEGER NOT NULL DEFAULT 0,
    "onTimeDeliveries" INTEGER NOT NULL DEFAULT 0,
    "totalEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShipmentStatusHistory_shipmentId_idx" ON "ShipmentStatusHistory"("shipmentId");

-- CreateIndex
CREATE INDEX "ShipmentStatusHistory_createdAt_idx" ON "ShipmentStatusHistory"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DriverProfile_userId_key" ON "DriverProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverProfile_licenseNumber_key" ON "DriverProfile"("licenseNumber");

-- CreateIndex
CREATE INDEX "DriverProfile_userId_idx" ON "DriverProfile"("userId");

-- CreateIndex
CREATE INDEX "DriverProfile_isAvailable_idx" ON "DriverProfile"("isAvailable");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_entity_entityId_idx" ON "ActivityLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_trackingNumber_key" ON "Shipment"("trackingNumber");

-- CreateIndex
CREATE INDEX "Shipment_customerId_idx" ON "Shipment"("customerId");

-- CreateIndex
CREATE INDEX "Shipment_driverId_idx" ON "Shipment"("driverId");

-- CreateIndex
CREATE INDEX "Shipment_status_idx" ON "Shipment"("status");

-- CreateIndex
CREATE INDEX "Shipment_createdAt_idx" ON "Shipment"("createdAt");

-- CreateIndex
CREATE INDEX "Shipment_trackingNumber_idx" ON "Shipment"("trackingNumber");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DriverProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentStatusHistory" ADD CONSTRAINT "ShipmentStatusHistory_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverProfile" ADD CONSTRAINT "DriverProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
