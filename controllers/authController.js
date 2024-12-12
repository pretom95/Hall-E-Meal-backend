const bcrypt = require("bcrypt");
const db = require("../config/db");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Register a new student
exports.registerStudent = async (req, res) => {
  const { student_ID, name, email, password } = req.body;
 
   // Validate input fields
   if (!student_ID || !name || !email || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  // if (!validator.isEmail(email)) {
  //   return res.status(400).json({ error: "Invalid email format." });
  // }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters long." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query =
      "INSERT INTO student (student_ID, name, email, password) VALUES (?, ?, ?, ?)";

    db.query(query, [student_ID, name, email, hashedPassword], (err, results) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ error: "Student ID or email already exists." });
        }
        return res.status(500).json({ error: "Failed to create account." });
      }
      res.json({ message: "Account created successfully." });
    });
  } catch (error) {
    console.error("Error hashing password:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Sign in a student
exports.signIn = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    // Query to check if the user is an admin
    const adminQuery = `
      SELECT 
        name, 
        email, 
        password, 
        'admin' AS role,
        CASE 
          WHEN a.email = ? THEN 1
          ELSE 0
        END AS is_admin
      FROM admin a
      WHERE a.email = ?
    `;

    db.query(adminQuery, [email, email], async (adminErr, adminResults) => {
      if (adminErr) {
        console.error("Database error (admin):", adminErr);
        return res.status(500).json({ error: "Internal server error." });
      }

      if (adminResults.length > 0) {
        // Admin found
        const admin = adminResults[0];
        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
          return res.status(401).json({ error: "Invalid credentials." });
        }

        // Generate JWT for admin
        const token = jwt.sign(
          { email: admin.email, name: admin.name, role: admin.role },
          JWT_SECRET,
          { expiresIn: "1h" }
        );

        return res.json({
          message: "Sign in successful.",
          token,
          user: { name: admin.name, email: admin.email, role: admin.role, is_admin: admin.is_admin },
        });
      }

      // If not found in admin, check in student table
      const studentQuery = `
        SELECT 
          s.*, 
          'student' AS role,
          CASE 
            WHEN CURRENT_DATE BETWEEN m.appointment_date AND m.retirement_date THEN 1
            ELSE 0
          END AS is_manager
        FROM student s
        LEFT JOIN meal_manager m ON s.student_ID = m.student_ID
        WHERE s.email = ?
      `;

      db.query(studentQuery, [email], async (studentErr, studentResults) => {
        if (studentErr) {
          console.error("Database error (student):", studentErr);
          return res.status(500).json({ error: "Internal server error." });
        }

        if (studentResults.length === 0) {
          return res.status(404).json({ error: "User not found." });
        }

        const student = studentResults[0];
        const isMatch = await bcrypt.compare(password, student.password);

        if (!isMatch) {
          return res.status(401).json({ error: "Invalid credentials." });
        }

        // Generate JWT for student
        const token = jwt.sign(
          {
            email: student.email,
            name: student.name,
            role: student.role,
            is_manager: student.is_manager === 1,
            student_ID: student.student_ID,
          },
          JWT_SECRET,
          { expiresIn: "1h" }
        );

        return res.json({
          message: "Sign in successful.",
          token,
          user: {
            name: student.name,
            email: student.email,
            role: student.role,
            is_manager: student.is_manager === 1,
            student_ID: student.student_ID,
          },
        });
      });
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}

