const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware"); // JWT authentication middleware

// Fetch today's meal
router.get("/student/today-meal", authenticateToken, (req, res) => {
  const query = `
    SELECT description, meal_type, price 
    FROM meal 
    WHERE DATE(Date) = CURDATE()
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching today's meal:", err);
      return res.status(500).json({ error: "Failed to fetch today's meal." });
    }
    res.json(results);
  });
});

// Fetch total meals for the current month
router.get("/student/total-meals", authenticateToken, (req, res) => {
  const student_ID = req.user.student_ID; // Extract student_ID from the token
  const query = `
    SELECT SUM(b.quantities) AS total_meals 
    FROM booking b
    WHERE student_ID = ? AND MONTH(Date) = MONTH(CURDATE()) AND YEAR(Date) = YEAR(CURDATE())
  `;
  db.query(query, [student_ID], (err, results) => {
    if (err) {
      console.error("Error fetching total meals:", err);
      return res.status(500).json({ error: "Failed to fetch total meals." });
    }
    res.json(results[0]);
  });
});

// Fetch outstanding dues
router.get("/student/outstanding-dues", authenticateToken, (req, res) => {
  const student_ID = req.user.student_ID; // Extract student_ID from the token
  const query = `
    SELECT SUM(m.price * b.quantities) AS outstanding_dues 
    FROM booking b
    JOIN meal m ON b.meal_Id = m.meal_ID
    WHERE b.student_ID = ? AND b.Date <= CURDATE()
  `;
  db.query(query, [student_ID], (err, results) => {
    if (err) {
      console.error("Error fetching outstanding dues:", err);
      return res.status(500).json({ error: "Failed to fetch outstanding dues." });
    }
    res.json(results[0]);
  });
});

// Fetch meal schedule
router.get("/student/schedule", authenticateToken, (req, res) => {
  const query = `
    SELECT meal_ID, Date, meal_type, description, price 
    FROM meal 
    WHERE Date >= CURDATE()
    ORDER BY Date ASC
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching meal schedule:", err);
      return res.status(500).json({ error: "Failed to fetch meal schedule." });
    }
    res.json(results);
  });
});

// Fetch notices
router.get("/student/notifications", authenticateToken, (req, res) => {
  const query = `
    SELECT subject, description, date 
    FROM notice 
    ORDER BY date DESC
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching notifications:", err);
      return res.status(500).json({ error: "Failed to fetch notifications." });
    }
    res.json(results);
  });
});

// Fetch meal history
router.get("/student/meal-history", authenticateToken, (req, res) => {
  const student_ID = req.user.student_ID;
  const query = `
    SELECT meal.meal_type, booking.Date, booking.quantities, meal.price 
    FROM booking 
    JOIN meal ON booking.meal_Id = meal.meal_ID
    WHERE booking.student_ID = ? 
    ORDER BY booking.Date DESC
  `;
  db.query(query, [student_ID], (err, results) => {
    if (err) {
      console.error("Error fetching meal history:", err);
      return res.status(500).json({ error: "Failed to fetch meal history." });
    }
    res.json(results);
  });
});

// Fetch billing details
router.get("/student/billing", authenticateToken, (req, res) => {
  const student_ID = req.user.student_ID;
  const query = `
    SELECT meal.description, meal.price, booking.quantities, (meal.price * booking.quantities) AS total_cost
    FROM booking
    JOIN meal ON booking.meal_Id = meal.meal_ID
    WHERE booking.student_ID = ?
  `;
  db.query(query, [student_ID], (err, results) => {
    if (err) {
      console.error("Error fetching billing details:", err);
      return res.status(500).json({ error: "Failed to fetch billing details." });
    }
    res.json(results);
  });
});

// Fetch student profile
router.get("/student/profile", authenticateToken, (req, res) => {
  const student_ID = req.user.student_ID;
  const query = `
    SELECT student_ID, name, email, created_at 
    FROM student 
    WHERE student_ID = ?
  `;
  db.query(query, [student_ID], (err, results) => {
    if (err) {
      console.error("Error fetching profile:", err);
      return res.status(500).json({ error: "Failed to fetch profile details." });
    }
    res.json(results[0]);
  });
});

router.get("/highest-meal-taker", authenticateToken, (req, res) => {
  const query = `
    SELECT 
  s.name AS name,
  SUM(b.quantities) AS totalMeals
FROM 
  booking b
JOIN 
  student s ON b.student_ID = s.student_ID
JOIN 
  meal m ON b.meal_Id = m.meal_ID
WHERE 
  MONTH(b.Date) = MONTH(CURDATE()) 
  AND YEAR(b.Date) = YEAR(CURDATE())
GROUP BY 
  b.student_ID
ORDER BY 
  totalMeals DESC, 
  SUM(b.quantities * m.price) DESC
LIMIT 1;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching highest meal taker:", err);
      return res.status(500).json({ error: "Failed to fetch highest meal taker." });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "No meal data found for this month." });
    }

    res.json(results[0]); // Send the name and total meals
  });
});

module.exports = router;
