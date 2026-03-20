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

        if (payload.password) {
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
}