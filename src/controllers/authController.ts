import { Request, Response } from "express";
import { UserService } from "../services/userService";

export class AuthController {
  static async login(req: Request, res: Response) {
    
    // Verificación de licencia
    const expirationStr =
      process.env.LICENSE_EXPIRATION || "2025-02-21T00:00:00";
    const expirationDate = new Date(
      expirationStr.includes("T") ? expirationStr : `${expirationStr}T00:00:00`,
    );

    if (new Date() >= expirationDate) {
      const formattedDate = expirationDate.toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      return res.status(403).json({
        error: `Licencia Expirada: El periodo de uso de este sistema finalizó el ${formattedDate}. Contacte al administrador para su renovación.`,
      });
    }

    const { username, password } = req.body || {};

    try {
      const authenticatedUser = await UserService.authenticate(
        username,
        password,
      );

      if (authenticatedUser) {
        // Check if user is active
        if (authenticatedUser.status === false) {
          return res
            .status(403)
            .json({ error: "Usuario desactivado. Contacte al administrador." });
        }

        res.cookie("auth_token", "super-secret-session-id", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 3600000,
        });

        res.cookie("user_role", authenticatedUser.role_id.toString(), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 3600000,
        });

        res.cookie("user_name", authenticatedUser.username, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 3600000,
        });

        res.cookie("user_id", authenticatedUser.id!.toString(), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 3600000,
        });

        // Don't send back the password hash
        const { password_hash, ...userResponse } = authenticatedUser;

        return res.status(200).json({
          message: "Login exitoso",
          user: userResponse,
        });
      }

      return res.status(401).json({ error: "Credenciales inválidas" });
    } catch (error) {
      console.error("Login error:", error);
      return res
        .status(500)
        .json({ error: "Error en el servidor durante el login" });
    }
  }

  static async me(req: any, res: Response) {
    const token = req.cookies?.auth_token;
    const userId = req.cookies?.user_id;

    if (token === "super-secret-session-id" && userId) {
      try {
        const user = await UserService.getUserById(parseInt(userId));
        if (user) {
          const { password_hash, ...userResponse } = user;
          return res.status(200).json({
            user: userResponse,
            authenticated: true,
          });
        }
      } catch (error) {
        console.error("Error in me endpoint:", error);
      }
    }

    return res
      .status(401)
      .json({ error: "No autenticado", authenticated: false });
  }

  static logout(req: Request, res: Response) {
    res.clearCookie("auth_token");
    res.clearCookie("user_role");
    res.clearCookie("user_name");
    res.clearCookie("user_id");
    return res.status(200).json({ message: "Sesión cerrada correctamente" });
  }
}
