import { Request, Response, NextFunction } from "express";

export class ValidationMiddleware {
  static validateLabelPrint(req: Request, res: Response, next: NextFunction) {
    const { labelId } = req.body || {};

    if (!labelId) {
      return res.status(400).json({ 
        error: "Validación fallida: El campo 'labelId' es requerido." 
      });
    }
    next();
  }

}

