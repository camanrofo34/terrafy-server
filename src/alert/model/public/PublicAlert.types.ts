import { AlertType } from '../../../domain/enums/alert-type.enum';
import { Status } from '../../../domain/enums/status.enum';

export interface PublicAlert {
  alertId: number;
  sensorId: number;
  detectedValue: number;
  alertType: AlertType;
  status: Status;
  creationDate: Date;
}

export interface AlertDetailResponse {
  alertId: number;
  sensorId: number;
  detectedValue: number;
  alertType: AlertType;
  status: Status;
  creationDate: Date;
  sensor?: {
    sensorId: number;
    sensorType: string;
    variable?: {
      variableId: number;
      name: string;
    };
  };
}

export interface PublicAlertDefinition {
  alertDefinitionId: number;
  systemVariableId: number;
  minValue: number;
  maxValue: number;
  creationDate: Date;
  updateDate: Date;
}

export interface AlertDefinitionDetailResponse {
  alertDefinitionId: number;
  systemVariableId: number;
  minValue: number;
  maxValue: number;
  creationDate: Date;
  updateDate: Date;
  systemVariable?: {
    systemVariableId: number;
    systemId: number;
    variableId: number;
    sampleRate: number;
    variable?: {
      variableId: number;
      name: string;
      measurementUnit: string;
    };
  };
}

export interface AlertEventDto {
  alertId: number;
  sensorId: number;
  variableName: string;
  detectedValue: number;
  alertType: AlertType;
  creationDate: Date;
}
