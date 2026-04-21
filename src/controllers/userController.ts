import { Request, Response } from "express";
import { UserService } from "../services/userService";

export class UserController {
  static async getAll(req: Request, res: Response) {
    try {
      const users = await UserService.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener usuarios" });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const user = await UserService.getUserById(id);
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ error: "Usuario no encontrado" });
      }
    } catch (error) {
      res.status(500).json({ error: "Error al obtener usuario" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const newUser = await UserService.createUser(req.body);
      res.status(201).json(newUser);
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        res.status(400).json({ error: "El nombre de usuario ya existe" });
      } else {
        res.status(500).json({ error: "Error al crear usuario" });
      }
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const updatedUser = await UserService.updateUser(id, req.body);
      if (updatedUser) {
        res.json({ message: "Usuario actualizado correctamente", user: updatedUser });
      } else {
        res.status(404).json({ error: "Usuario no encontrado" });
      }
    } catch (error) {
      console.error("Update User Error:", error);
      res.status(500).json({ error: "Error al actualizar usuario" });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const deleted = await UserService.deleteUser(id);
      if (deleted) {
        res.json({ message: "Usuario eliminado correctamente" });
      } else {
        res.status(404).json({ error: "Usuario no encontrado" });
      }
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar usuario" });
    }
  }
}



