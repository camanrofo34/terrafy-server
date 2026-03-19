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
  @ApiOperation({
    summary: "Authenticate user",
    description:
      "Validates credentials and returns a signed JWT access token along with basic user info.",
  })
  @ApiBody({
    description: "User credentials",
    schema: {
      type: "object",
      required: ["email", "password"],
      properties: {
        email: { type: "string", format: "email", example: "user@example.com" },
        password: {
          type: "string",
          format: "password",
          minLength: 8,
          example: "P@ssw0rd!",
        },
      },
    },
  })
  login(@Body() payload: LoginRequest) {
    return this.authService.login(payload);
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({
    summary: "Register a new user",
    description:
      "Creates a new user account. The email must be unique across the system.",
  })
  @ApiBody({
    description: "New user data",
    schema: {
      type: "object",
      required: ["name", "email", "password"],
      properties: {
        name: { type: "string", example: "John Doe" },
        email: { type: "string", format: "email", example: "user@example.com" },
        password: {
          type: "string",
          format: "password",
          minLength: 8,
          example: "P@ssw0rd!",
        },
      },
    },
  })
  registerUser(@Body() payload: CreateUserRequest) {
    return this.usersService.registerUser(payload);
  }

  @Patch(":userId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({
    summary: "Update a user",
    description:
      "Partially updates a user's profile. Requires a valid JWT. Users should only be allowed to update their own profile.",
  })
  @ApiParam({
    name: "userId",
    description: "ID of the user to update",
    example: "123",
  })
  @ApiBody({
    description: "Fields to update (all optional)",
    schema: {
      type: "object",
      properties: {
        name: { type: "string", example: "Jane" },
        password: {
          type: "string",
          format: "password",
          minLength: 8,
          example: "NewP@ss1!",
        },
        email: { type: "string", format: "email", example: "jane.doe@example.com" }
      },
    },
  })
  updateUser(
    @Req() req: Request,
    @Body() payload: UpdateUserRequest,
    @Param("userId") userId: string
  ) {
    return this.usersService.updateUser(payload, userId);
  }

  @Delete(":userId")
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  @ApiBearerAuth("access-token")
  @ApiOperation({
    summary: "Deactivate a user",
    description:
      "Soft-deletes (deactivates) the user account. The record is retained in the database with `isActive: false`. Requires a valid JWT.",
  })
  @ApiParam({
    name: "userId",
    description: "ID of the user to deactivate",
    example: "123",
  })
  @ApiResponse({
    status: 204,
    description: "User deactivated — no content returned.",
  })
  async deleteUser(@Param("userId") userId: string) {
    await this.usersService.deleteUser(userId);
    return;
  }
}