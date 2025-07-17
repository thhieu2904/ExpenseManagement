// Check users in database
const mongoose = require("mongoose");
require("dotenv").config();

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ Connected to MongoDB");

    const User = require("./models/User");
    const users = await User.find({}).select("email username fullname");

    console.log(`📊 Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(
        `${index + 1}. Email: ${user.email}, Username: ${
          user.username
        }, Name: ${user.fullname}`
      );
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkUsers();
