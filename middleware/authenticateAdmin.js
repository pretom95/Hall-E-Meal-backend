const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token is missing." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admin access required." });
    }

    req.user = decoded; // Attach user data to the request
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    res.status(403).json({ error: "Unauthorized: Invalid token." });
  }
};

module.exports = authenticateAdmin;
