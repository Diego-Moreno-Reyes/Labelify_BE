import { Request, Response } from "express";
import { LabelService } from "../services/labelService";
import { LogService } from "../services/logService";

export class LabelController {
  static async getLabelInfo(req: Request, res: Response) {
    const { id } = req.params;
    const { date } = req.query; // Expecting YYYY-MM-DD
    
    try {
      const label = await LabelService.getLabelById(parseInt(id));
      if (!label) {
        return res.status(404).json({ error: "Etiqueta no encontrada" });
      }

      const printCount = await LogService.getPrintCountByDate(
        parseInt(id), 
        date as string
      );

      return res.status(200).json({
        label,
        stats: {
          date: date || new Date().toISOString().split('T')[0],
          printed_count: printCount,
          remaining_limit: label.printing_limit - printCount
        }
      });
    } catch (error: any) {
      console.error("Get Label Info Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async listLabels(req: Request, res: Response) {
    try {
      const labels = await LabelService.getAllLabels();
      return res.status(200).json(labels);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getLabelLogs(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const logs = await LogService.getLogsByLabel(parseInt(id));
      return res.status(200).json(logs);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}

