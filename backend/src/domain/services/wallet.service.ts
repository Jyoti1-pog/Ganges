import { prisma } from '../../core/database/prisma';
import { WalletTransactionType, WalletTransaction } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../../core/errors';

export class WalletService {
    /**
     * Get Wallet for User
     */
    static async getWallet(userId: string) {
        let wallet = await prisma.wallet.findUnique({
            where: { userId },
            include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } }
        });

        if (!wallet) {
            // Auto-create wallet if missing
            wallet = await prisma.wallet.create({
                data: { userId, balance: 0 },
                include: { transactions: true }
            });
        }

        return wallet;
    }

    /**
     * Add Funds (Credit Wallet)
     */
    static async creditWallet(userId: string, amount: number, referenceId: string, description: string) {
        const wallet = await this.getWallet(userId);

        return prisma.$transaction(async (tx: any) => {
            // 1. Update Balance
            const updatedWallet = await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: { increment: amount } }
            });

            // 2. Create Transaction Record
            await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    amount,
                    type: WalletTransactionType.DEPOSIT,
                    referenceId,
                    description,
                    status: 'COMPLETED'
                }
            });

            return updatedWallet;
        });
    }

    /**
     * Debit Wallet (Payment for Shipment)
     */
    static async debitWallet(userId: string, amount: number, referenceId: string, description: string) {
        const wallet = await this.getWallet(userId);

        if (Number(wallet.balance) < amount) {
            throw new BadRequestError('Insufficient wallet balance');
        }

        return prisma.$transaction(async (tx: any) => {
            const updatedWallet = await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: { decrement: amount } }
            });

            await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    amount: -amount,
                    type: WalletTransactionType.PAYMENT,
                    referenceId,
                    description,
                    status: 'COMPLETED'
                }
            });

            return updatedWallet;
        });
    }
}
