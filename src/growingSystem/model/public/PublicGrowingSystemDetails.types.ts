import { PublicGrowingSystem } from './PublicGrowingSystem.types';
import { Status } from '../../../domain/enums/status.enum';

export interface AgronomicVariableWithSampleRate {
    variableId: number;
    name: string;
    measurementUnit: string;
    description?: string;
    sampleRate: number;
    creationDate: Date;
    updateDate: Date;
    alertDefinition?: {
        alertDefinitionId: number;
        minValue: number;
        maxValue: number;
    };
}

export interface DeviceSensorInfo {
    sensorId: number;
    deviceId: number;
    variableId: number;
    sensorType: string;
    status: Status;
    creationDate: Date;
    updateDate: Date;
    device?: {
        deviceId: number;
        name: string;
    };
    variable?: {
        variableId: number;
        name: string;
        measurementUnit: string;
    };
}

export interface PublicGrowingSystemDetails {
    system: PublicGrowingSystem;
    sensors: DeviceSensorInfo[];
    agronomicVariables: AgronomicVariableWithSampleRate[];
}
