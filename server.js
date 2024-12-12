// Import dependencies
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const db = require("./config/db"); // Import the database connection


//import components
const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes"); // Include the new routes
const headerRoutes = require("./routes/headerRoutes"); // Import header routes
const historyRoutes = require("./routes/historyRoutes");
const billingRoutes = require("./routes/billingRoutes");
const profileRoutes = require('./routes/profileRoutes');
const noticeRoutes = require('./routes/notificationsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const managerRoutes = require('./routes/managerRoutes');




// Initialize the Express application
const app = express();
app.use(cors());
// Middleware
app.use(express.json()); // Parse JSON request bodies


//routes
app.use("/auth", authRoutes);
app.use("/students", studentRoutes);
app.use("/dashboard", dashboardRoutes); // Dashboard routes
app.use("/schedule", scheduleRoutes); // Register schedule routes
app.use("/dashboard", headerRoutes); // Register header route
app.use("/history", historyRoutes);
app.use("/billing", billingRoutes);
app.use('/profile', profileRoutes);
app.use('/notice', noticeRoutes);
app.use('/admin', adminRoutes);
app.use('/manager', managerRoutes);



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
