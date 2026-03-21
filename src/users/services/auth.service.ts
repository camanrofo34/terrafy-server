import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { LoginRequest } from "../model/dto/request/loginRequest.types";
import * as jwt from "jsonwebtoken";
import { BcryptService } from "./bcrypt.service";
import { Status } from "../../domain/enums/status.enum";
import { LoginResponse } from "../model/dto/response/loginResponse.types";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly bcryptService: BcryptService
  ) {}

  async login(payload: LoginRequest): Promise<LoginResponse> {
    const user = await this.usersService.getUserByEmail(payload.email);

    if (!user || !await this.bcryptService.comparePasswords(payload.password, user.password)) {
      throw new UnauthorizedException("Invalid email or password");
    }

    if (user.status !== Status.ACTIVE) {
      throw new BadRequestException("User account is not active");
    }

    const token = await this.generateToken(user.userId, user.email);

    return {
        token,
        user: {
            userId: user.userId,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            creationDate: user.creationDate,
            updateDate: user.updateDate,
        }
    }
  }

  private async generateToken(userId: number, email: string): Promise<string> {
    const payload = { sub: userId, email };
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new InternalServerErrorException("JWT_SECRET is not configured");
    }

    return jwt.sign(payload, jwtSecret, {
      expiresIn: (process.env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]) ?? "1d",
      issuer: process.env.JWT_ISSUER ?? "terrafy",
    });
  }
}