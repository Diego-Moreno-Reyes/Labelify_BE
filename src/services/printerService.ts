import net from "net";
import pool from "../config/db";

export class PrinterService {
  static async getPrinterById(id: number) {
    const { rows } = await pool.query("SELECT * FROM printers WHERE id = $1", [
      id,
    ]);
    return rows[0];
  }

  static sendToPrinter(ip: string, port: number, data: string): Promise<void> {
    console.log(data);
    //return Promise.resolve();

    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      client.setTimeout(5000);

      client.connect(port, ip, () => {
        client.write(data, (err) => {
          if (err) {
            reject(new Error(`Failed to send data: ${err.message}`));
          } else {
            client.destroy();
            resolve();
          }
        });
      });

      client.on("error", (err) => {
        client.destroy();
        reject(new Error(`Printer error: ${err.message}`));
      });

      client.on("timeout", () => {
        client.destroy();
        reject(new Error("Printer connection timeout"));
      });
    });
  }
}
