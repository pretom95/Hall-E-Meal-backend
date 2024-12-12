const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");

// Fetch current month's billing details
router.get("/current-month", authenticateToken, (req, res) => {
  const student_ID = req.user.student_ID;

  const query = `
  SELECT 
    SUM(b.quantities) AS mealsTaken,
    MAX(m.price) AS costPerMeal, -- Ensures compatibility with ONLY_FULL_GROUP_BY
    SUM(b.quantities * m.price) AS totalAmount
  FROM 
    booking b
  INNER JOIN 
    meal m ON b.meal_Id = m.meal_ID
  WHERE 
    b.student_ID = ? 
    AND MONTH(b.Date) = MONTH(CURDATE()) 
    AND YEAR(b.Date) = YEAR(CURDATE())
`;
  db.query(query, [student_ID], (err, results) => {
    if (err) {
      console.error("Error fetching current month's billing:", err);
      return res.status(500).json({ error: "Failed to fetch billing details." });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "No billing data found for this month." });
    }

    // Simulate extra charges and discounts
    const billingDetails = {
      mealsTaken: results[0].mealsTaken || 0,
      costPerMeal: results[0].costPerMeal || 0,
    //   extraCharges: 20, // Example static extra charges
    //   discounts: 10, // Example static discounts
      totalAmount:
        (results[0].totalAmount || 0) , // Total Amount with extra charges and discounts
    };

    res.json(billingDetails);
  });
});

module.exports = router;
