const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authenticateToken = require('../middleware/authMiddleware');
const bcrypt = require('bcrypt');

router.get("/get-profile", authenticateToken, (req, res) => {
    const student_ID = req.user.student_ID; // Extract student_ID from the JWT token
  
    // SQL Query to fetch profile details including password
    const query = `
      SELECT 
        name, 
        email, 
        password 
      FROM 
        student 
      WHERE 
        student_ID = ?
    `;
  
    // Execute the query
    db.query(query, [student_ID], (err, results) => {
      if (err) {
        console.error("Error fetching profile:", err);
        return res.status(500).json({ error: "Failed to fetch profile details." });
      }
  
      // Check if user exists
      if (results.length === 0) {
        return res.status(404).json({ error: "Profile not found." });
      }
  
      // Send the profile details
      res.json(results[0]); // Return the first result as a JSON object
    });
  });
  

  
// Update student profile (name, email, password)
router.put('/update-profile', authenticateToken, async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  const student_ID = req.user.student_ID; // Get student ID from the token

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required." });
  }

  if (password && password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match." });
  }

  try {
    // If password is provided, hash it
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Update query: only update the fields that have been changed
    let query = `
      UPDATE student
      SET name = ?, email = ?`;

    const params = [name, email];

    if (hashedPassword) {
      query += ", password = ?";
      params.push(hashedPassword);
    }

    query += " WHERE student_ID = ?";

    params.push(student_ID);

    db.query(query, params, (err, results) => {
      if (err) {
        console.error("Error updating profile:", err);
        return res.status(500).json({ error: "Failed to update profile." });
      }
      
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "Student not found." });
      }

      res.json({ message: "Profile updated successfully!" });
    });
  } catch (error) {
    console.error("Error hashing password:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
