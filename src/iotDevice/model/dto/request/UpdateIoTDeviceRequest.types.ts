import { DeviceType } from "../../../../domain/enums/device-type.enum";


export interface UpdateIoTDeviceRequest {
  name?: string;
  deviceType?: DeviceType;
  logicId?: string;
}
