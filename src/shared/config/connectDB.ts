import { connect } from 'mongoose';
import ENV from '@/env.js';


export async function connectDB() {
  try {
    await connect(ENV.MONGODB_URI)
    console.log("DB connected successfully")
  } catch (err) {
    console.error("Error connecting to DB:", err)
    process.exit(1)
  }
}