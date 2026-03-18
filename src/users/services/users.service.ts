import { ConflictException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../../domain/entities";
import { Repository } from "typeorm";
import { CreateUserRequest } from "../model/dto/request/CreateUserRequest.types";
import { PublicUser } from "../model/public/publicUser.types";
import { BcryptService } from "./bcrypt.service";
import { Role } from "../../domain/enums/role.enum";
import { Status } from "../../domain/enums/status.enum";

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
            return user || null;
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

}