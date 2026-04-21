import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "5432"),
});

pool.on("connect", () => {
  console.log("Conectado a la base de datos PostgreSQL");
});

pool.on("error", (err) => {
  console.error("Error inesperado en el cliente de PostgreSQL", err);
  process.exit(-1);
});

export default pool;
