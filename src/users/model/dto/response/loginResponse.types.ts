import { PublicUser } from "../../public/publicUser.types";

export interface LoginResponse {
  token: string;
  user: PublicUser;
}