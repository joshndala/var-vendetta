// Import directly from our re-export file
import { PrismaClient } from '../prisma/generated-client'

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: any;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma;
}

export default prisma; 