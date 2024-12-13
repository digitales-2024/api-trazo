import { PrismaClient } from '@prisma/client';

/**
 * Tipo para el contexto de transacción de Prisma.
 * Se usa cuando se pasa el contexto de transacción entre servicios.
 */
export type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;
