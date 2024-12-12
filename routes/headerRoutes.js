const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware"); // Middleware for JWT verification

// Get logged-in student's name for the header
router.get("/header/student-name", authenticateToken, (req, res) => {
  const student_ID = req.user.student_ID; // Extract student_ID from JWT token

  const query = `
    SELECT name 
    FROM student 
    WHERE student_ID = ?
  `;

  db.query(query, [student_ID], (err, results) => {
    if (err) {
      console.error("Error fetching student name:", err);
      return res.status(500).json({ error: "Failed to fetch student name." });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Student not found." });
    }

    res.json({ name: results[0].name }); // Return the student's name
  });
});

router.post("/logout", (req, res) => {
  // On the client side, the token should be removed from localStorage or cookies
  res.json({ message: "Logout successful. Please clear your local session data." });
});

module.exports = router;
