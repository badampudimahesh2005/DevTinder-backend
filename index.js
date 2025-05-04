const express = require("express");
const connectDB = require("./config/database");
const app = express();
const cookieParser = require("cookie-parser");

require("dotenv").config();



app.use(express.json());
app.use(cookieParser());

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");

app.use("/", authRouter);
app.use("/" , profileRouter);



connectDB()
  .then(() => {
    console.log("Database connection established...");
    
  })
  .catch((err) => {
    console.error("Database cannot be connected!!");
  });

  app.listen(process.env.PORT, () => {
    console.log("Server is successfully listening on port 5000...");
  });