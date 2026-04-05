import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  HttpCode,
  UseGuards,
  Req,
} from "@nestjs/common";
import type { LoginRequest } from "../model/dto/request/loginRequest.types";
import { AuthService } from "../services/auth.service";
import type { CreateUserRequest } from "../model/dto/request/CreateUserRequest.types";
import { UsersService } from "../services/users.service";
import type { UpdateUserRequest } from "../model/dto/request/UpdateUserRequest.types";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import type { Request } from "express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from "@nestjs/swagger";

@ApiTags("Users")
@Controller("api/users")
export class UsersController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService
  ) {}

  @Post("login")
  @HttpCode(200)
  async login(@Body() payload: LoginRequest) {
    return await this.authService.login(payload);
  }

  @Post()
  @HttpCode(201)
  async registerUser(@Body() payload: CreateUserRequest) {
    return await this.usersService.registerUser(payload);
  }

  @Patch(":userId")
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async updateUser(
    @Req() req: Request,
    @Body() payload: UpdateUserRequest,
    @Param("userId") userId: string
  ) {
    return await this.usersService.updateUser(payload, userId, (req as any).user);
  }

  @Delete(":userId")
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async deleteUser(@Param("userId") userId: string, @Req() req: Request) {
    await this.usersService.deleteUser(userId, (req as any).user);
    return;
  }
}