export interface CreateMeasurementRequest {
  sensorId: number;
  value: number;
  timestamp?: string;
}

export interface CreateBatchMeasurementRequest {
  sensorId: number;
  readings: Array<{
    value: number;
    timestamp: string;
  }>;
}
