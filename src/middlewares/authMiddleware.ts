import { Request, Response, NextFunction } from "express";

export const authMiddleware = (req: any, res: Response, next: NextFunction) => {
  const token = req.cookies ? req.cookies.auth_token : null;
  const username = req.cookies ? req.cookies.user_name : null;
  const roleId = req.cookies ? req.cookies.user_role : null;

  if (token === "super-secret-session-id") {
    // Attach user info to request
    req.user = {
      username: username || "anonymous",
      roleId: parseInt(roleId || "1")
    };
    return next();
  }

  return res.status(401).json({ error: "No autorizado. Por favor inicie sesión." });
};

