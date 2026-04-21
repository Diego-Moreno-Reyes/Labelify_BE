import { PRINTER_DPMM } from "../config/printerConfig";

export class PreviewService {
  static async getPreviewImage(
    zpl: string,
    width: number = 1,
    height: number = 2,
  ): Promise<Buffer> {
    const url = `http://api.labelary.com/v1/printers/${PRINTER_DPMM}/labels/${width}x${height}/0/`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "image/png",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: zpl,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Labelary error: ${errorText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error("Labelary request failed:", error);
      throw error;
    }
  }
}
