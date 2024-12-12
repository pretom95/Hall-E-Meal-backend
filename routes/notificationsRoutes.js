const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");

// Get all notifications for the logged-in user
router.get("/", authenticateToken, (req, res) => {
  const query = `
    SELECT notice_ID, type, message, date
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

// // Mark a notification as read
// router.put("/:id/mark-read", authenticateToken, (req, res) => {
//   const { id } = req.params;

//   const query = `
//     UPDATE notice
//     SET status = 1
//     WHERE id = ?
//   `;

//   db.query(query, [id], (err, results) => {
//     if (err) {
//       console.error("Error marking notification as read:", err);
//       return res.status(500).json({ error: "Failed to mark notification as read." });
//     }
//     res.json({ message: "Notification marked as read." });
//   });
// });

module.exports = router;
