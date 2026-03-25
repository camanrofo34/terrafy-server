export interface RegisterSensorRequest {
  systemId: number;
  type: string;
  unit: string;
  sampleRate?: number;
}

export interface CreateSensorRequest {
  deviceId: number;
  variableId: number;
  sensorType: string;
}
