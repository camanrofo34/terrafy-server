export interface CreateAlertDefinitionRequest {
  systemId: number;
  variable: string;
  minValue: number;
  maxValue: number;
}

export interface UpdateAlertDefinitionRequest {
  minValue?: number;
  maxValue?: number;
}
