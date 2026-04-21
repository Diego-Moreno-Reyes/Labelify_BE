import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/userService";

export const roleMiddleware = (allowedRoles: number[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const roleId = parseInt(req.cookies?.user_role || "0");

    if (!allowedRoles.includes(roleId)) {
      return res.status(403).json({ 
        error: "Acceso denegado: No tienes los permisos necesarios para esta operación." 
      });
    }

    next();
  };
};

