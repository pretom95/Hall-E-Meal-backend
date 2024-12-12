const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authenticateToken = require("../middleware/authenticateAdmin");

// Get today's meals
router.get("/today-meals", authenticateToken, (req, res) => {
  const query = `
    SELECT m.meal_type, m.description, m.price, s.name AS creator_name
    FROM meal m
    JOIN meal_manager mm ON m.manager_ID = mm.manager_ID
    JOIN student s ON mm.student_ID = s.student_ID
    WHERE m.Date = CURDATE()
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching today's meals:", err);
      return res.status(500).json({ error: "Failed to fetch today's meals." });
    }
    res.json(results);
  });
});

// Get highest meal taker
router.get("/highest-meal-taker", authenticateToken, (req, res) => {
  const query = `
    SELECT s.name, COUNT(b.booking_ID) AS totalMeals
    FROM booking b
    JOIN student s ON b.student_ID = s.student_ID
    WHERE MONTH(b.Date) = MONTH(CURDATE()) AND YEAR(b.Date) = YEAR(CURDATE())
    GROUP BY b.student_ID
    ORDER BY totalMeals DESC
    LIMIT 1
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching highest meal taker:", err);
      return res.status(500).json({ error: "Failed to fetch highest meal taker." });
    }
    res.json(results[0] || {});
  });
});

// Get highest bill payer
router.get("/highest-bill-payer", authenticateToken, (req, res) => {
  const query = `
    SELECT s.name, SUM(b.quantities * m.price) AS totalBill
    FROM booking b
    JOIN student s ON b.student_ID = s.student_ID
    JOIN meal m ON b.meal_Id = m.meal_ID
    WHERE MONTH(b.Date) = MONTH(CURDATE()) AND YEAR(b.Date) = YEAR(CURDATE())
    GROUP BY b.student_ID
    ORDER BY totalBill DESC
    LIMIT 1
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching highest bill payer:", err);
      return res.status(500).json({ error: "Failed to fetch highest bill payer." });
    }
    res.json(results[0] || {});
  });
});

// Get average meal price
router.get("/average-meal-price", authenticateToken, (req, res) => {
  const query = `
    SELECT AVG(m.price) AS averagePrice
    FROM meal m
    WHERE MONTH(m.Date) = MONTH(CURDATE()) AND YEAR(m.Date) = YEAR(CURDATE())
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching average meal price:", err);
      return res.status(500).json({ error: "Failed to fetch average meal price." });
    }
    res.json(results[0] || { averagePrice: 0 });
  });
});

// Get current managers
router.get("/current-managers", authenticateToken, (req, res) => {
  const query = `
    SELECT mm.manager_ID, mm.student_ID, s.name, mm.appointment_date, mm.retirement_date
    FROM meal_manager mm
    JOIN student s ON mm.student_ID = s.student_ID
    WHERE mm.retirement_date>(CURDATE())
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching current managers:", err);
      return res.status(500).json({ error: "Failed to fetch current managers." });
    }
    res.json(results);
  });
});

// Add a new manager
router.post("/add-manager", authenticateToken, (req, res) => {
    const { manager_ID, student_ID, appointment_date, retirement_date } = req.body;
  
    if (!manager_ID || !student_ID || !appointment_date || !retirement_date) {
      return res.status(400).json({ error: "All fields are required." });
    }
  
    // Log input data for debugging
    console.log("Received Data:", { manager_ID, student_ID, appointment_date, retirement_date });
  
    const query = `
      INSERT INTO meal_manager (manager_ID, student_ID, appointment_date, retirement_date)
      VALUES (?, ?, ?, ?);
    `;
  
    db.query(query, [manager_ID, student_ID, appointment_date, retirement_date], (err, results) => {
      if (err) {
        console.error("Error adding manager:", err.message, err.code);
        return res.status(500).json({ error: "Failed to add manager." });
      }
  
      res.json({ message: "Manager added successfully.", results });
    });
  });
  
// Remove a manager
router.delete("/remove-manager/:manager_ID", authenticateToken, (req, res) => {
  const { manager_ID } = req.params;

  const query = `DELETE FROM meal_manager WHERE manager_ID = ?`;
  db.query(query, [manager_ID], (err) => {
    if (err) {
      console.error("Error removing manager:", err);
      return res.status(500).json({ error: "Failed to remove manager." });
    }
    res.json({ message: "Manager removed successfully." });
  });
});

router.get("/meal-overview", authenticateToken, (req, res) => {
    const query = `
      SELECT m.description, COUNT(b.booking_ID) AS totalSold
      FROM booking b
      JOIN meal m ON b.meal_Id = m.meal_ID
      WHERE MONTH(b.Date) = MONTH(CURDATE()) AND YEAR(b.Date) = YEAR(CURDATE())
      GROUP BY b.meal_Id
      ORDER BY totalSold DESC
    `;
  
    db.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching meal overview:", err);
        return res.status(500).json({ error: "Failed to fetch meal overview." });
      }
      res.json(results);
    });
  });
  
  router.get("/sales-overview", authenticateToken, (req, res) => {
    const query = `
      SELECT 
        'weekly' AS period, 
        SUM(b.quantities * m.price) AS totalSale 
      FROM booking b
      JOIN meal m ON b.meal_Id = m.meal_ID
      WHERE b.Date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
  
      UNION ALL
  
      SELECT 
        'monthly' AS period, 
        SUM(b.quantities * m.price) AS totalSale 
      FROM booking b
      JOIN meal m ON b.meal_Id = m.meal_ID
      WHERE MONTH(b.Date) = MONTH(CURDATE()) AND YEAR(b.Date) = YEAR(CURDATE())
    `;
  
    db.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching sales overview:", err);
        return res.status(500).json({ error: "Failed to fetch sales overview." });
      }
      res.json(results);
    });
  });

  // Fetch admin profile
router.get("/get-profile", authenticateToken, (req, res) => {
    const adminEmail = req.user.email; // Extract admin email from JWT token
  
    const query = `
      SELECT 
        admin_ID, 
        name, 
        email 
      FROM admin 
      WHERE email = ?
    `;
  
    db.query(query, [adminEmail], (err, results) => {
      if (err) {
        console.error("Error fetching admin profile:", err);
        return res.status(500).json({ error: "Failed to fetch admin profile." });
      }
  
      if (results.length === 0) {
        return res.status(404).json({ error: "Admin not found." });
      }
  
      res.json(results[0]); // Return the admin's profile
    });
  });
  
  // Update admin profile
  router.put("/update-profile", authenticateToken, async (req, res) => {
    const { name, email, password } = req.body;
    const adminEmail = req.user.email; // Extract admin email from JWT token
  
    // Validate input fields
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required." });
    }
  
    try {
      let hashedPassword = null;
  
      // Hash the password if it's provided
      if (password) {
        if (password.length < 8) {
          return res.status(400).json({ error: "Password must be at least 8 characters long." });
        }
        hashedPassword = await bcrypt.hash(password, 10);
      }
  
      // Update query: Update only fields provided
      let query = `
        UPDATE admin 
        SET name = ?, email = ?
      `;
      const params = [name, email];
  
      if (hashedPassword) {
        query += `, password = ?`;
        params.push(hashedPassword);
      }
  
      query += ` WHERE email = ?`;
      params.push(adminEmail);
  
      db.query(query, params, (err, results) => {
        if (err) {
          console.error("Error updating admin profile:", err);
          return res.status(500).json({ error: "Failed to update profile." });
        }
  
        if (results.affectedRows === 0) {
          return res.status(404).json({ error: "Admin not found." });
        }
  
        res.json({ message: "Profile updated successfully." });
      });
    } catch (error) {
      console.error("Error hashing password:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  });

module.exports = router;
