// Import directly from our re-export file
import { PrismaClient } from '../prisma/generated-client'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

// Promisify exec for async/await usage
const execAsync = promisify(exec)

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: any;
  var initialized: boolean;
}

// Database initialization function
async function initializeDatabase() {
  try {
    // Check if the database file exists
    const dbPath = path.join(process.cwd(), 'prisma', 'var-vendetta.db')
    const dbExists = fs.existsSync(dbPath)
    
    if (!dbExists || global.initialized !== true) {
      console.log('Database needs initialization. Running Prisma db push...')
      
      // Run prisma db push to create tables
      await execAsync('npx prisma db push')
      console.log('Database tables created successfully')
      
      global.initialized = true
    }
  } catch (error) {
    console.error('Error initializing database:', error)
  }
}

// Initialize Prisma client
const prisma = global.prisma || new PrismaClient();

// Initialize database on first import
if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma;
  
  // Initialize database when module is loaded
  initializeDatabase().catch(error => {
    console.error('Failed to initialize database on startup:', error)
  })
}

export default prisma; 