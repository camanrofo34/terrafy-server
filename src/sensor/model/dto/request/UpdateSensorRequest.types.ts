import { Status } from "../../../../domain/enums/status.enum";


export interface UpdateSensorRequest {
  sensorType?: string;
  status?: Status;
}
