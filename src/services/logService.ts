import pool from "../config/db";

export class LogService {
  static async getCurrentDayCount(labelId: number): Promise<number> {
    const query = `
      SELECT COUNT(*) as count 
      FROM print_logs 
      WHERE label_id = $1 AND printed_at::date = CURRENT_DATE AND reprint = false
    `;
    const { rows } = await pool.query(query, [labelId]);
    return parseInt(rows[0].count);
  }

  static async getNextSerialNumber(
    labelId: number,
    limit: number,
  ): Promise<string> {
    const query = `
      SELECT MAX(serial_number::integer) as max_serial 
      FROM print_logs 
      WHERE label_id = $1 AND printed_at::date = CURRENT_DATE AND reprint = false
    `;
    const { rows } = await pool.query(query, [labelId]);
    const nextSerial = (rows[0].max_serial || 0) + 1;

    const padding = limit.toString().length;
    return nextSerial.toString().padStart(padding, "0");
  }

  static async createBatchLogs(
    labelId: number,
    startSerial: number,
    quantity: number,
    padding: number,
    username: string,
  ): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (let i = 0; i < quantity; i++) {
        const serialStr = (startSerial + i).toString().padStart(padding, "0");
        await client.query(
          "INSERT INTO print_logs (label_id, serial_number, printed_by, printed_at, reprint) VALUES ($1, $2, $3, NOW(), false)",
          [labelId, serialStr, username],
        );
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  static async logReprint(
    labelId: number,
    serial: string,
    username: string,
  ): Promise<void> {
    const query = `
      INSERT INTO print_logs (label_id, serial_number, printed_by, printed_at, reprint) 
      VALUES ($1, $2, $3, NOW(), true)
    `;
    await pool.query(query, [labelId, serial, username]);
  }

  static async getLogsByLabel(labelId: number): Promise<any[]> {
    const query = `
      SELECT id, serial_number, printed_by, printed_at, reprint, reprint as is_reprint
      FROM print_logs
      WHERE label_id = $1
      ORDER BY printed_at DESC
      LIMIT 100
    `;
    const { rows } = await pool.query(query, [labelId]);
    return rows;
  }

  static async getPrintCountByDate(
    labelId: number,
    date?: string,
  ): Promise<number> {
    const dateToUse = date || "CURRENT_DATE";

    // Safety check for raw date string
    const query = `
      SELECT COUNT(*) as count 
      FROM print_logs 
      WHERE label_id = $1 AND printed_at::date = $2::date AND reprint = false
    `;

    const { rows } = await pool.query(query, [
      labelId,
      date || new Date().toISOString().split("T")[0],
    ]);
    return parseInt(rows[0].count);
  }
}
