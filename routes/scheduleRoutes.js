const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");

// Fetch next day's meal schedule
router.get("/next-day-schedule", authenticateToken, (req, res) => {
  const query = `
    SELECT meal_ID, meal_type, description, price 
    FROM meal 
    WHERE DATE(Date) = curdate();
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching next day's schedule:", err);
      return res.status(500).json({ error: "Failed to fetch next day's schedule." });
    }
    res.json(results);
  });
});

// Book a meal for the student
router.post("/book-meal", authenticateToken, (req, res) => {
  const { meal_ID, quantities } = req.body;
  const student_ID = req.user.student_ID;

  // Log to verify the student_ID
  //console.log("Student ID from JWT:", student_ID);

  if (!meal_ID || !quantities) {
    return res.status(400).json({ error: "Meal ID and quantities are required." });
  }

  const query = `
    INSERT INTO booking (Date, quantities, student_ID, meal_Id)
    VALUES (CURDATE(), ?, ?, ?)
  `;

  db.query(query, [quantities, student_ID, meal_ID], (err, results) => {
    if (err) {
      console.error("Error booking meal:", err);
      return res.status(500).json({ error: "Failed to book meal." });
    }

    const booking_ID = results.insertId;
    res.json({
      message: "Meal booked successfully.",
      booking_ID,
    });
  });
});




module.exports = router;
