import { connect } from 'mongoose';

export async function connectDB() {
  try {
    await connect(process.env.MONGODB_URI!!)
    console.log("DB connected successfully")
  } catch (err) {
    console.error("Error connecting to DB:", err)
    process.exit(1)
  }
}