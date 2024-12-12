const db = require("../config/db");

// Fetch all students
exports.getStudents = (req, res) => {
  const query = "SELECT * FROM student";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching students:", err);
      return res.status(500).json({ error: "Failed to fetch students." });
    }
    res.json(results);
  });
};
