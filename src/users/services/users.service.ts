import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../../domain/entities";
import { Repository } from "typeorm";
import { CreateUserRequest } from "../model/dto/request/CreateUserRequest.types";
import { PublicUser } from "../model/public/publicUser.types";
import { BcryptService } from "./bcrypt.service";
import { Role } from "../../domain/enums/role.enum";
import { Status } from "../../domain/enums/status.enum";
import { UpdateUserRequest } from "../model/dto/request/UpdateUserRequest.types";

@Injectable()
export class UsersService{

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly bcryptService: BcryptService
    ) {}


    async getUserByEmail(email: string): Promise<User | null> {
        try {
            const user = await this.userRepository.findOne({ where: { email } });
            return user;
        }
        catch (error) {
            console.error('Error fetching user by email:', error);
            throw error;
        }
    }

    async registerUser(payload: CreateUserRequest): Promise<PublicUser> {
        const existingUser = await this.getUserByEmail(payload.email);

        if (existingUser) {
            throw new ConflictException("Email is already in use");
        }

        await this.checkPasswordStrength(payload.password);

        const newPassword = await this.bcryptService.hashPassword(payload.password);

        const newUser = this.userRepository.create({
            name: payload.name,
            email: payload.email,
            password: newPassword,
            role: payload.role ?? Role.AGRARIAN,
            status: Status.ACTIVE,
        });

        const savedUser = await this.userRepository.save(newUser);

        return {
            userId: savedUser.userId,
            name: savedUser.name,
            email: savedUser.email,
            role: savedUser.role,
            status: savedUser.status,
            creationDate: savedUser.creationDate,
            updateDate: savedUser.updateDate,
        }
    }

    async getUserById(userId: number): Promise<User | null> {
        try {
            const user = await this.userRepository.findOne({ where: { userId } });
            return user;
        }
        catch (error) {
            console.error('Error fetching user by ID:', error);
            throw error;
        }
    }

    async updateUser(payload: UpdateUserRequest, userId: string): Promise<PublicUser> {
        const existingUser = await this.getUserById(parseInt(userId));

        if (!existingUser) {
            throw new NotFoundException("User not found");
        }

        if (existingUser.status !== Status.ACTIVE) {
            throw new BadRequestException("User account is not active");
        }

        if (payload.email && payload.email !== existingUser.email) {
            const emailInUse = await this.getUserByEmail(payload.email);
            if (emailInUse) {
                throw new ConflictException("Email is already in use");
            }
        }

        if (payload.password) {
            await this.checkPasswordStrength(payload.password);
            payload.password = await this.bcryptService.hashPassword(payload.password);
        }

        const updatedUser = this.userRepository.merge(existingUser, payload);
        const savedUser = await this.userRepository.save(updatedUser);

        return {
            userId: savedUser.userId,
            name: savedUser.name,
            email: savedUser.email,
            role: savedUser.role,
            status: savedUser.status,
            creationDate: savedUser.creationDate,
            updateDate: savedUser.updateDate,
        }
    }

    async deleteUser(userId: string): Promise<void> {
        const existingUser = await this.getUserById(parseInt(userId));
        if (!existingUser) {
            throw new NotFoundException("User not found");
        }

        this.userRepository.merge(existingUser, { status: Status.INACTIVE });
        await this.userRepository.save(existingUser);
    }

    private async checkPasswordStrength(password: string): Promise<void> {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            throw new BadRequestException("Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character");
        }
    }
}