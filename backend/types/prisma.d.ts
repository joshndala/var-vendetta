declare module '@prisma/client' {
  import { PrismaClient as OriginalPrismaClient } from '.prisma/client';
  export const PrismaClient: typeof OriginalPrismaClient;
} 