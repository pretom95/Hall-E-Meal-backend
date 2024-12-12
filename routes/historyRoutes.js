const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");

// Fetch meal history for a specific student
router.get("/meal-history", authenticateToken, (req, res) => {
  const student_ID = req.user.student_ID; // Extract student ID from JWT payload

  // Query to fetch meal history
  const query = `
    SELECT 
      b.booking_ID AS id, 
      m.meal_type AS type, 
      b.Date AS date, 
      (b.quantities * m.price) AS cost, -- Total cost calculation
      CASE 
        WHEN b.quantities > 0 THEN 'Taken' 
        ELSE 'Skipped' 
      END AS status
    FROM 
      booking b
    INNER JOIN 
      meal m ON b.meal_Id = m.meal_ID
    WHERE 
      b.student_ID = ?
    ORDER BY 
      b.Date DESC
  `;

  db.query(query, [student_ID], (err, results) => {
    if (err) {
      console.error("Error fetching meal history:", err);
      return res.status(500).json({ error: "Failed to fetch meal history." });
    }
    res.json(results);
  });
});

module.exports = router;
