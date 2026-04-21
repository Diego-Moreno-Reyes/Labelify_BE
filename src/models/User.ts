export interface IUser {
  id?: number;
  username: string;
  password_hash: string;
  role_id: number;
  status: boolean;
  created_at?: Date;
  role_name?: string; 
}

export class User {
  static fromRow(row: any): IUser {
    return {
      id: row.id,
      username: row.username,
      password_hash: row.password_hash,
      role_id: row.role_id,
      status: row.status,
      created_at: row.created_at,
      role_name: row.role_name
    };
  }
}

