import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";

@Injectable()
export class BcryptService {
    constructor(){}

    async hashPassword(password: string): Promise<string> {
        const saltRounds = 10;
        return bcrypt.hash(password, saltRounds);
    }

    async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(plainPassword, hashedPassword);
    }
}