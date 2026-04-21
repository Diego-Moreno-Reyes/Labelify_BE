import fs from "fs/promises";
import path from "path";
import pool from "../config/db";
import { ILabel, Label } from "../models/Label";

export class LabelService {
  static async getLabelById(id: number): Promise<ILabel | null> {
    const query = "SELECT * FROM labels WHERE id = $1";
    const { rows } = await pool.query(query, [id]);
    return rows.length ? Label.fromRow(rows[0]) : null;
  }

  static async getAllLabels(): Promise<any[]> {
    const query = `
      SELECT l.*, 
             COALESCE(p.count, 0) as printed_today,
             (l.printing_limit - COALESCE(p.count, 0)) as remaining_limit
      FROM labels l
      LEFT JOIN (
          SELECT label_id, COUNT(*) as count 
          FROM print_logs 
          WHERE printed_at::date = CURRENT_DATE
          GROUP BY label_id
      ) p ON l.id = p.label_id
      ORDER BY l.id ASC
    `;
    const { rows } = await pool.query(query);
    return rows; // Returning raw rows as they contain the extra stats
  }

  static async renderPartLabel(
    labelId: number,
    serial: string,
    date?: Date,
  ): Promise<string> {
    const label = await this.getLabelById(labelId);
    if (!label) throw new Error("Label not found");

    const templatePath = path.join(__dirname, "../templates/partLabel.zpl");
    let content = await fs.readFile(templatePath, "utf8");

    // Logic to determine which part number to use
    const partNumber = label.part_number || label.part_number_dpo;

    // Split part number for the design (first 4 and last 4)

    const part_4_1 = partNumber.substring(0, 4);
    const part_4_2 = partNumber.substring(Math.max(0, partNumber.length - 4));

    // Calculate Julian Date (YYDDD)
    const dateToUse = date || new Date();
    const start = new Date(dateToUse.getFullYear(), 0, 0);
    const diff =
      dateToUse.getTime() -
      start.getTime() +
      (start.getTimezoneOffset() - dateToUse.getTimezoneOffset()) * 60 * 1000;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay)
      .toString()
      .padStart(3, "0");
    const year = dateToUse.getFullYear().toString().substring(2);
    const julianDate = `${year}${dayOfYear}`;

    const data: Record<string, string> = {
      vpps: label.vpps,
      part_number: partNumber,
      part_4_1: part_4_1,
      part_4_2: part_4_2,
      duns: label.duns,
      serial: serial,
      julian_date: julianDate,
      location_code: label.location_code || "",
      vpps_serial_loc: `${label.vpps}${serial}${label.location_code || ""}`,
    };

    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, "g");
      content = content.replace(regex, value);
    }

    return content;
  }

  static generateBatch(renderedLabel: string, quantity: number): string {
    let batch = "";
    for (let i = 0; i < quantity; i++) {
      batch += renderedLabel + "\n";
    }
    return batch;
  }
}
