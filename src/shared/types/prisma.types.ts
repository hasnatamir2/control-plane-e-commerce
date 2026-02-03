import { Prisma, PrismaClient } from '@prisma/client'

/**
 * Represents a Prisma client context that can be a root client or a transaction-scoped client.
 */
export type PrismaDbClient = PrismaClient | Prisma.TransactionClient
