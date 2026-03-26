export interface PublicSensorReading {
  readingId: number;
  sensorId: number;
  value: number;
  timestamp: Date;
  creationDate: Date;
}

export interface SensorReadingDetailResponse {
  readingId: number;
  sensorId: number;
  value: number;
  timestamp: Date;
  creationDate: Date;
  sensor?: {
    sensorId: number;
    sensorType: string;
    variable?: {
      variableId: number;
      name: string;
      measurementUnit: string;
    };
  };
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
