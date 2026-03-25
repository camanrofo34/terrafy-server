import { Status } from '../../../domain/enums/status.enum';

export interface PublicSensor {
  sensorId: number;
  deviceId: number;
  variableId: number;
  sensorType: string;
  status: Status;
  creationDate: Date;
  updateDate: Date;
  alertDefinitionId?: number;
}

export interface SensorDetailResponse {
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
  alertDefinition?: {
    alertDefinitionId: number;
    minValue: number;
    maxValue: number;
  };
}
