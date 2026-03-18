import { Body, Controller, Post } from "@nestjs/common";
import type { LoginRequest } from "../model/dto/request/loginRequest.types";
import { AuthService } from "../services/auth.service";
import type { CreateUserRequest } from "../model/dto/request/CreateUserRequest.types";
import { UsersService } from "../services/users.service";

@Controller('api/users')
export class UsersController {
    constructor(private readonly authService: AuthService, private readonly usersService: UsersService) {}

    @Post('login')
    login(@Body() payload: LoginRequest) {
        return this.authService.login(payload);
    }

    @Post('register')
    registerUser(@Body() payload: CreateUserRequest) {
        return this.usersService.registerUser(payload);
    }
}