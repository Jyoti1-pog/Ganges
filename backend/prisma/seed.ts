import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Clear existing data
    await prisma.shipmentStatusHistory.deleteMany();
    await prisma.shipment.deleteMany();
    await prisma.driverProfile.deleteMany();
    await prisma.activityLog.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.user.deleteMany();

    // Create Admin User
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.create({
        data: {
            email: 'admin@ganges.com',
            password: adminPassword,
            role: 'ADMIN',
            profile: {
                create: {
                    firstName: 'Admin',
                    lastName: 'User',
                    phone: '+1234567890',
                },
            },
        },
    });

    // Create Manager User
    const managerPassword = await bcrypt.hash('manager123', 12);
    const manager = await prisma.user.create({
        data: {
            email: 'manager@ganges.com',
            password: managerPassword,
            role: 'MANAGER',
            profile: {
                create: {
                    firstName: 'John',
                    lastName: 'Manager',
                    phone: '+1234567891',
                },
            },
        },
    });

    // Create Driver Users
    const driverPassword = await bcrypt.hash('driver123', 12);
    const driver1 = await prisma.user.create({
        data: {
            email: 'driver1@ganges.com',
            password: driverPassword,
            role: 'DRIVER',
            profile: {
                create: {
                    firstName: 'Mike',
                    lastName: 'Driver',
                    phone: '+1234567892',
                },
            },
            driverProfile: {
                create: {
                    licenseNumber: 'DL123456',
                    vehicleType: 'Van',
                    vehiclePlate: 'ABC-1234',
                    isAvailable: true,
                    totalDeliveries: 45,
                    onTimeDeliveries: 42,
                    totalEarnings: 2250,
                    rating: 4.8,
                },
            },
        },
    });

    const driver2 = await prisma.user.create({
        data: {
            email: 'driver2@ganges.com',
            password: driverPassword,
            role: 'DRIVER',
            profile: {
                create: {
                    firstName: 'Sarah',
                    lastName: 'Wilson',
                    phone: '+1234567893',
                },
            },
            driverProfile: {
                create: {
                    licenseNumber: 'DL789012',
                    vehicleType: 'Truck',
                    vehiclePlate: 'XYZ-5678',
                    isAvailable: true,
                    totalDeliveries: 38,
                    onTimeDeliveries: 36,
                    totalEarnings: 1900,
                    rating: 4.9,
                },
            },
        },
    });

    // Create Customer Users
    const customerPassword = await bcrypt.hash('customer123', 12);
    const customer1 = await prisma.user.create({
        data: {
            email: 'customer1@example.com',
            password: customerPassword,
            role: 'CUSTOMER',
            profile: {
                create: {
                    firstName: 'Alice',
                    lastName: 'Johnson',
                    phone: '+1234567894',
                    address: '123 Main St',
                    city: 'New York',
                    state: 'NY',
                    zipCode: '10001',
                },
            },
        },
    });

    const customer2 = await prisma.user.create({
        data: {
            email: 'customer2@example.com',
            password: customerPassword,
            role: 'CUSTOMER',
            profile: {
                create: {
                    firstName: 'Bob',
                    lastName: 'Smith',
                    phone: '+1234567895',
                    address: '456 Oak Ave',
                    city: 'Los Angeles',
                    state: 'CA',
                    zipCode: '90001',
                },
            },
        },
    });

    // Get driver profiles
    const driver1Profile = await prisma.driverProfile.findUnique({
        where: { userId: driver1.id },
    });

    const driver2Profile = await prisma.driverProfile.findUnique({
        where: { userId: driver2.id },
    });

    // Create Sample Shipments
    const shipments = [
        {
            customerId: customer1.id,
            driverId: driver1Profile!.id,
            pickupAddress: '123 Main St, New York, NY 10001',
            deliveryAddress: '789 Broadway, New York, NY 10003',
            weight: 5.5,
            status: 'DELIVERED',
            baseCost: 10,
            distanceCost: 5,
            totalCost: 25.5,
            actualDelivery: new Date('2024-02-10'),
        },
        {
            customerId: customer1.id,
            driverId: driver2Profile!.id,
            pickupAddress: '123 Main St, New York, NY 10001',
            deliveryAddress: '321 Park Ave, New York, NY 10022',
            weight: 12.0,
            status: 'IN_TRANSIT',
            baseCost: 10,
            distanceCost: 8,
            totalCost: 42.0,
        },
        {
            customerId: customer2.id,
            driverId: driver1Profile!.id,
            pickupAddress: '456 Oak Ave, Los Angeles, CA 90001',
            deliveryAddress: '789 Sunset Blvd, Los Angeles, CA 90028',
            weight: 8.0,
            status: 'ASSIGNED',
            baseCost: 10,
            distanceCost: 6,
            totalCost: 32.0,
        },
        {
            customerId: customer2.id,
            pickupAddress: '456 Oak Ave, Los Angeles, CA 90001',
            deliveryAddress: '123 Hollywood Blvd, Los Angeles, CA 90028',
            weight: 3.5,
            status: 'PENDING',
            baseCost: 10,
            distanceCost: 4,
            totalCost: 21.0,
        },
    ];

    for (const shipmentData of shipments) {
        const trackingNumber = `GNG-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        await prisma.shipment.create({
            data: {
                ...shipmentData,
                trackingNumber,
                statusHistory: {
                    create: {
                        status: shipmentData.status as any,
                        notes: `Shipment ${shipmentData.status.toLowerCase()}`,
                    },
                },
            },
        });
    }

    console.log('✅ Database seeded successfully!');
    console.log('\n📧 Test Accounts:');
    console.log('Admin: admin@ganges.com / admin123');
    console.log('Manager: manager@ganges.com / manager123');
    console.log('Driver 1: driver1@ganges.com / driver123');
    console.log('Driver 2: driver2@ganges.com / driver123');
    console.log('Customer 1: customer1@example.com / customer123');
    console.log('Customer 2: customer2@example.com / customer123');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
