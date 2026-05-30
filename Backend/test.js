import db from "./db/db.config.js";

try {
  const [rows] = await db.query("SELECT NOW()");
  console.log("Connected successfully!");
  console.log(rows);
} catch (error) {
  console.error(error);
}
