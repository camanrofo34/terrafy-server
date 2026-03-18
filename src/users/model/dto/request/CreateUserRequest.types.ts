import { Role } from "../../../../domain/enums/role.enum";

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role?: Role;
}