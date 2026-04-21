import pool from "../config/db";
import { IUser, User } from "../models/User";
import bcrypt from "bcryptjs";

export class UserService {
  static async getAllUsers(): Promise<IUser[]> {
    const query = `
      SELECT u.*, r.name as role_name 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ORDER BY u.id ASC
    `;
    const { rows } = await pool.query(query);
    return rows.map(User.fromRow);
  }

  static async getUserById(id: number): Promise<IUser | null> {
    const query = `
      SELECT u.*, r.name as role_name 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    return rows.length ? User.fromRow(rows[0]) : null;
  }

  static async getUserByUsername(username: string): Promise<IUser | null> {
    const query = `
      SELECT u.*, r.name as role_name 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.username = $1
    `;
    const { rows } = await pool.query(query, [username]);
    return rows.length ? User.fromRow(rows[0]) : null;
  }

  static async createUser(userData: Partial<IUser>): Promise<IUser> {
    const { username, password_hash, role_id } = userData;
    const hashedPassword = await bcrypt.hash(password_hash!, 10);

    const query = `
      INSERT INTO users (username, password_hash, role_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const { rows } = await pool.query(query, [
      username,
      hashedPassword,
      role_id,
    ]);
    return User.fromRow(rows[0]);
  }

  static async updateUser(id: number, userData: any): Promise<IUser | null> {
    const { username, role_id, status, password } = userData;

    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const query = `
      UPDATE users 
      SET username = COALESCE($1, username), 
          role_id = COALESCE($2, role_id), 
          status = COALESCE($3, status),
          password_hash = COALESCE($4, password_hash)
      WHERE id = $5
      RETURNING *
    `;
    const { rows } = await pool.query(query, [
      username,
      role_id,
      status,
      hashedPassword,
      id,
    ]);
    return rows.length ? User.fromRow(rows[0]) : null;
  }

  static async deleteUser(id: number): Promise<boolean> {
    const query = "DELETE FROM users WHERE id = $1";
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  static async authenticate(
    username: string,
    password_plain: string,
  ): Promise<IUser | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;

    const isValid = await bcrypt.compare(password_plain, user.password_hash);
    return isValid ? user : null;
  }
}
