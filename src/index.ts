import "dotenv/config";
import { connectDB } from "./config/connectDB.js";
import { app } from "./app.js";


connectDB()
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server is running on port ${process.env.PORT || 3000}`)
    })
  })
  .catch((err) => {
    console.log("DB Connection Err", err);
    process.exit(1);
  });
