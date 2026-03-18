import { AlertType } from '../domain/enums/alert-type.enum';
import { Role } from '../domain/enums/role.enum';
import { Status } from '../domain/enums/status.enum';

export interface LoginDto {
  email: string;
  password: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role?: Role;
}

export interface CreateGrowingSystemDto {
  userId: number;
  name: string;
  location: string;
  description?: string;
}

export interface RegisterSensorDto {
  systemId: number;
  type: string;
  unit: string;
  sampleRate?: number;
}

export interface CreateAlertDefinitionDto {
  systemId: number;
  variable: string;
  minValue: number;
  maxValue: number;
}

export interface CreateMeasurementDto {
  sensorId: number;
  value: number;
  timestamp?: string;
}

export interface PublicUser {
  userId: number;
  name: string;
  email: string;
  role: Role;
  status: Status;
  creationDate: Date;
  updateDate: Date;
}

export interface LoginResponse {
  token: string;
  user: PublicUser;
}

export interface StatisticDto {
  variableId: number;
  variableName: string;
  measurementUnit: string;
  readingsCount: number;
  avgValue: number;
  minValue: number;
  maxValue: number;
  latestReadingAt: Date | null;
}

export interface AlertEventDto {
  alertId: number;
  sensorId: number;
  variableName: string;
  detectedValue: number;
  alertType: AlertType;
  creationDate: Date;
}
