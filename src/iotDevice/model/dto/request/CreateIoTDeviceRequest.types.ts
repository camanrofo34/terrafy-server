import { DeviceType } from "../../../../domain/enums/device-type.enum";

export interface CreateIoTDeviceRequest {
  systemId: number;
  name: string;
  deviceType: DeviceType;
  logicId?: string;
}
