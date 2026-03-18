import { Role } from "../../../domain/enums/role.enum";
import { Status } from "../../../domain/enums/status.enum";

export interface PublicUser {
  userId: number;
  name: string;
  email: string;
  role: Role;
  status: Status;
  creationDate: Date;
  updateDate: Date;
}