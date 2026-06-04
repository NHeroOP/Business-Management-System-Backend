import "dotenv/config";
import ENV from "./env.js";
import { app } from "./app.js";
import { connectDB } from "./shared/config/connectDB.js";

connectDB()
  .then(() => {
    app.listen(ENV.PORT || 3000, () => {
      console.log(`Server is running on port ${ENV.PORT || 3000}`);
    });
  })
  .catch((err) => {
    console.log("DB Connection Err", err);
    process.exit(1);
  });
