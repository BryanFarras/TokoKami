import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

export const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306),
    ssl: {
      ca: fs.readFileSync(path.resolve(process.cwd(), process.env.DB_CA_PATH)), // load CA
        rejectUnauthorized: true
    }
});
