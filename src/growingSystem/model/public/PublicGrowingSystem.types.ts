import { Status } from "../../../domain/enums/status.enum";

export interface PublicGrowingSystem {
    systemId: number;
    name: string;
    ubication: string;
    description?: string;
    status: Status;
    creationDate: Date;
    updateDate: Date;
    user?: {
        userId: number;
        name: string;
        email: string;
    }
}