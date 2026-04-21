import { Request, Response } from "express";
import pool from "../config/db";

import { LabelService } from "../services/labelService";
import { PrinterService } from "../services/printerService";
import { PreviewService } from "../services/previewService";
import { LogService } from "../services/logService";

export class PrintController {
  static async printLabel(req: Request, res: Response) {
    const { labelId, quantity = 1 } = req.body;
    const username = (req as any).user?.username || "system";

    console.log((req as any).user);

    try {
      // 1. Fetch label info
      const label = await LabelService.getLabelById(labelId);
      if (!label)
        return res.status(404).json({ error: "Etiqueta no encontrada" });

      const printer = await PrinterService.getPrinterById(label.printer_id);

      if (!printer)
        return res
          .status(404)
          .json({ error: "Configuración de impresora no encontrada" });

      // 2. Check printing limit
      const currentCount = await LogService.getCurrentDayCount(labelId);
      if (currentCount + quantity > label.printing_limit) {
        return res.status(403).json({
          error: `Límite de impresión excedido. Límite diario: ${label.printing_limit}, Impresiones actuales: ${currentCount}, Solicitadas: ${quantity}`,
        });
      }

      // 3. Generate all labels manually as requested (not using ^SN optimized mode)
      const startSerialStr = await LogService.getNextSerialNumber(
        labelId,
        label.printing_limit,
      );
      const startSerialNum = parseInt(startSerialStr);
      const padding = label.printing_limit.toString().length;

      let fullBatchZpl = "";
      for (let i = 0; i < quantity; i++) {
        const currentSerialNum = startSerialNum + i;
        const currentSerialStr = currentSerialNum
          .toString()
          .padStart(padding, "0");

        const renderedLabel = await LabelService.renderPartLabel(
          labelId,
          currentSerialStr,
        );
        fullBatchZpl += renderedLabel + "\n";
      }

      // 4. Send the full batch to the printer
      await PrinterService.sendToPrinter(
        printer.ip_address,
        printer.port,
        fullBatchZpl,
      );

      // 5. Save logs
      LogService.createBatchLogs(
        labelId,
        startSerialNum,
        quantity,
        padding,
        username,
      ).catch((err) => console.error("Background Logging Error:", err));

      const endSerialNum = startSerialNum + quantity - 1;
      const endSerialStr = endSerialNum.toString().padStart(padding, "0");

      return res.status(200).json({
        message:
          quantity === 1
            ? `Impresin de etiqueta enviada exitosamente`
            : `Lote de ${quantity} etiquetas enviado exitosamente`,
        printer: {
          ip: printer.ip_address,
          port: printer.port,
        },
        serials: {
          start: startSerialStr,
          end: endSerialStr,
          quantity: quantity,
        },
      });
    } catch (error: any) {
      console.error("Print Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async previewLabel(req: Request, res: Response) {
    const { labelId } = req.body;
    let { serial } = req.body;

    try {
      const label = await LabelService.getLabelById(labelId);
      if (!label)
        return res.status(404).json({ error: "Etiqueta no encontrada" });

      // 1. Calculate next serial if not provided
      if (!serial) {
        const nextSerialStr = await LogService.getNextSerialNumber(
          labelId,
          label.printing_limit,
        );
        const nextSerialNum = parseInt(nextSerialStr);

        // Cap at printing_limit if it exceeds it
        if (nextSerialNum > label.printing_limit) {
          const padding = label.printing_limit.toString().length;
          serial = label.printing_limit.toString().padStart(padding, "0");
        } else {
          serial = nextSerialStr;
        }
      }

      const rendered = await LabelService.renderPartLabel(labelId, serial);

      // User specified dims 1x2 (usually Width x Height, so 2x1 if wide)
      const width = 2;
      const height = 1;

      const imageBuffer = await PreviewService.getPreviewImage(
        rendered,
        width,
        height,
      );

      res.setHeader("Content-Type", "image/png");
      return res.send(imageBuffer);
    } catch (error: any) {
      console.error("Preview Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async reprintLabel(req: Request, res: Response) {
    const { labelId } = req.body; // In the context of reprinting, labelId refers to the specific LOG entry ID
    const username = (req as any).user?.username || "system";

    try {
      if (!labelId) {
        return res.status(400).json({
          error: "El ID del registro es requerido para la reimpresión",
        });
      }

      // 1. Find the specific log entry (the "printed label" record)
      const logQuery =
        "SELECT label_id, serial_number, printed_at FROM print_logs WHERE id = $1";
      const { rows: logRows } = await pool.query(logQuery, [labelId]);

      if (logRows.length === 0) {
        return res
          .status(404)
          .json({ error: "No se encontró el registro de impresión original" });
      }

      const {
        label_id: configId,
        serial_number: serial,
        printed_at: originalDate,
      } = logRows[0];

      // 2. Fetch label and printer info
      const label = await LabelService.getLabelById(configId);
      if (!label)
        return res
          .status(404)
          .json({ error: "Configuración de etiqueta no encontrada" });

      const printer = await PrinterService.getPrinterById(label.printer_id);
      if (!printer)
        return res.status(404).json({ error: "Impresora no encontrada" });

      // 3. Render and Send
      const zpl = await LabelService.renderPartLabel(
        configId,
        serial,
        originalDate,
      );
      await PrinterService.sendToPrinter(printer.ip_address, printer.port, zpl);

      // 4. Log as reprint (background)
      LogService.logReprint(configId, serial, username).catch((err) =>
        console.error("Reprint Log Error:", err),
      );

      return res.json({
        message: `Reimpresión de serie específica (${serial}) enviada correctamente`,
        printer: printer.ip_address,
        serial: serial,
      });
    } catch (error: any) {
      console.error("Reprint Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async previewReprint(req: Request, res: Response) {
    const { logId } = req.body;

    try {
      if (!logId) {
        return res.status(400).json({
          error: "El ID del registro (logId) es requerido",
        });
      }

      const logQuery =
        "SELECT label_id, serial_number, printed_at FROM print_logs WHERE id = $1";
      const { rows: logRows } = await pool.query(logQuery, [logId]);

      if (logRows.length === 0) {
        return res
          .status(404)
          .json({ error: "No se encontró el registro de impresión original" });
      }

      const {
        label_id: configId,
        serial_number: serial,
        printed_at: originalDate,
      } = logRows[0];

      const zpl = await LabelService.renderPartLabel(
        configId,
        serial,
        originalDate,
      );

      const width = 2; // Default 2x1 inches
      const height = 1;
      const imageBuffer = await PreviewService.getPreviewImage(
        zpl,
        width,
        height,
      );

      res.setHeader("Content-Type", "image/png");
      return res.send(imageBuffer);
    } catch (error: any) {
      console.error("Preview Reprint Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }
}
