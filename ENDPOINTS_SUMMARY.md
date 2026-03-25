# API Endpoints Summary

## 📋 Controllers Created

### 1. **IoT Devices Controller** ✅
**Location:** `src/iotDevice/controller/iot-device.controller.ts`  
**Base Path:** `/api/iot-devices`  
**Methods:** 7

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/iot-devices` | Create new device |
| GET | `/api/iot-devices/:deviceId` | Get device by ID |
| GET | `/api/iot-devices` | List all devices (paginated) |
| GET | `/api/iot-devices/system/:systemId/devices` | Get devices by system |
| PATCH | `/api/iot-devices/:deviceId` | Update device |
| DELETE | `/api/iot-devices/:deviceId` | Delete device |
| PATCH | `/api/iot-devices/:deviceId/activate` | Reactivate device |

---

### 2. **Sensors Controller** ✅
**Location:** `src/sensor/controller/sensor.controller.ts`  
**Base Path:** `/api/sensors`  
**Methods:** 9

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sensors/register` | Register sensor (auto-hub creation) |
| POST | `/api/sensors` | Create sensor manually |
| GET | `/api/sensors/:sensorId` | Get sensor by ID |
| GET | `/api/sensors` | List all sensors (paginated) |
| GET | `/api/sensors/system/:systemId` | Get sensors by system |
| GET | `/api/sensors/device/:deviceId` | Get sensors by device |
| PATCH | `/api/sensors/:sensorId` | Update sensor |
| DELETE | `/api/sensors/:sensorId` | Delete sensor |
| PATCH | `/api/sensors/:sensorId/alert-definition/:alertDefinitionId` | Assign alert |
| DELETE | `/api/sensors/:sensorId/alert-definition` | Remove alert |

---

### 3. **Sensor Readings Controller** ✅
**Location:** `src/sensorReading/controller/sensor-reading.controller.ts`  
**Base Path:** `/api/sensor-readings`  
**Methods:** 8

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sensor-readings` | Create single reading |
| POST | `/api/sensor-readings/batch` | Create batch readings |
| GET | `/api/sensor-readings/sensor/:sensorId` | Get readings with date filtering |
| GET | `/api/sensor-readings/sensor/:sensorId/latest` | Get latest reading |
| GET | `/api/sensor-readings/sensor/:sensorId/recent` | Get recent N readings |
| GET | `/api/sensor-readings/statistics` | Get aggregated statistics |
| GET | `/api/sensor-readings/variable/:variableId/statistics` | Get variable stats |
| DELETE | `/api/sensor-readings/:readingId` | Delete reading |
| POST | `/api/sensor-readings/cleanup/old-readings` | Delete old readings |

---

### 4. **Alerts Controller** ✅
**Location:** `src/alert/controller/alert.controller.ts`  
**Base Path:** `/api/alerts`  
**Methods:** 10

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/alerts/definitions` | Create alert definition |
| GET | `/api/alerts/definitions/:alertDefinitionId` | Get definition by ID |
| GET | `/api/alerts/definitions` | List all definitions |
| GET | `/api/alerts/definitions/system/:systemId` | Get definitions by system |
| PATCH | `/api/alerts/definitions/:alertDefinitionId` | Update definition |
| DELETE | `/api/alerts/definitions/:alertDefinitionId` | Delete definition |
| GET | `/api/alerts/events` | Get alert events |
| GET | `/api/alerts/sensor/:sensorId` | Get alerts by sensor |
| PATCH | `/api/alerts/:alertId/resolve` | Resolve alert |
| DELETE | `/api/alerts/:alertId` | Delete alert |
| POST | `/api/alerts/cleanup/old-alerts` | Delete old alerts |

---

## 🔐 Authentication

All endpoints require:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Get token:**
```bash
POST /api/users/login
{
  "email": "user@example.com",
  "password": "P@ssw0rd!"
}
```

---

## 📊 Total Endpoints

- **IoT Devices:** 7 endpoints
- **Sensors:** 10 endpoints
- **Sensor Readings:** 9 endpoints
- **Alerts:** 11 endpoints
- **Existing APIs:**
  - Users: 3 endpoints (/login, /register, /update, /delete)
  - Growing Systems: 5 endpoints
  - Agronomic Variables: 5 endpoints

**Total New Endpoints: 37**  
**Total API Endpoints: ~50+**

---

## 🚀 How to Test in APIdog

### Prerequisites
1. Application running: `npm run start:dev`
2. Database configured (MySQL)
3. APIdog installed

### Quick Setup

1. **Create Environment**
   ```
   baseUrl = http://localhost:3000
   token = (leave empty, will populate after login)
   ```

2. **Test Login**
   ```
   POST {{baseUrl}}/api/users/login
   Body:
   {
     "email": "user@example.com",
     "password": "P@ssw0rd!"
   }
   ```
   
   Extract token and set as variable

3. **All Subsequent Requests**
   ```
   Headers:
   Authorization: Bearer {{token}}
   ```

### Test Workflow

**Phase 1: Create Resources**
1. Create Growing System → Save systemId
2. Create IoT Device → Save deviceId
3. Register Sensor → Save sensorId

**Phase 2: Record Data**
1. Create Sensor Reading
2. Create Batch Readings
3. Check Statistics

**Phase 3: Setup Monitoring**
1. Create Alert Definition
2. Assign to Sensor
3. Post reading exceeding threshold
4. View triggered alerts

---

## 📄 API Documentation File

Full API documentation with examples available in:
```
API_DOCUMENTATION.md
```

Copy endpoint details directly to APIdog

---

## ✨ Key Features

✅ Full CRUD operations for all new resources  
✅ Pagination support (page, limit)  
✅ Search & filtering  
✅ Sorting (sortBy, sortOrder)  
✅ Date range filtering for readings  
✅ Batch operations  
✅ Automatic alert detection on threshold breach  
✅ Data aggregation & statistics  
✅ Soft deletes (status-based)  
✅ Cleanup operations for old data  
✅ Swagger/OpenAPI documentation  
✅ JWT authentication  

---

## 🔗 Important Notes

1. All timestamps are in ISO 8601 format
2. All IDs are numeric (no UUIDs)
3. Status values: `ACTIVE`, `INACTIVE`
4. Device Types: `SENSOR_HUB`, `GATEWAY`
5. Alert Types: `WARNING`, `DANGEROUS`
6. Soft deletes preserve data - use status filters
7. Sensor registration auto-creates:
   - Agronomic Variable (if not exists)
   - IoT Device (if not exists)
   - System-Variable association

---

## 🐛 Error Handling

All errors return standard HTTP status codes:
- **200:** Success
- **201:** Created
- **204:** No Content (delete success)
- **400:** Bad Request (validation)
- **401:** Unauthorized (invalid token)
- **404:** Not Found
- **409:** Conflict (duplicate)
- **500:** Server Error

Response format:
```json
{
  "statusCode": 400,
  "message": "Error description"
}
```
