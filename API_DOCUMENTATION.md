# Terrafy API Documentation

## Overview
This document provides complete API endpoint documentation for testing in APIdog or Postman. All endpoints require a valid JWT token in the `Authorization` header.

---

## 🔐 Authentication

### Login
**Endpoint:** `POST /api/users/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "P@ssw0rd!"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "role": "AGRARIAN",
    "status": "ACTIVE",
    "creationDate": "2026-03-25T10:00:00.000Z",
    "updateDate": "2026-03-25T10:00:00.000Z"
  }
}
```

**Headers for all subsequent requests:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

---

## 👤 Users API

### Register User
**Endpoint:** `POST /api/users`

**Request:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "SecureP@ss123",
  "role": "AGRARIAN"
}
```

**Response (201):** 
```json
{
  "userId": 2,
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "AGRARIAN",
  "status": "ACTIVE",
  "creationDate": "2026-03-25T11:00:00.000Z",
  "updateDate": "2026-03-25T11:00:00.000Z"
}
```

### Update User
**Endpoint:** `PATCH /api/users/:userId`

**Request:**
```json
{
  "name": "Jane Updated",
  "password": "NewSecureP@ss123"
}
```

### Delete User
**Endpoint:** `DELETE /api/users/:userId`

**Response (204):** No content

---

## 🌱 Growing Systems API

### Create Growing System
**Endpoint:** `POST /api/growing-systems`

**Request:**
```json
{
  "userId": 1,
  "name": "Main Greenhouse",
  "location": "Backyard North",
  "description": "Primary hydroponic growing system"
}
```

**Response (201):**
```json
{
  "systemId": 1,
  "name": "Main Greenhouse",
  "ubication": "Backyard North",
  "description": "Primary hydroponic growing system",
  "status": "ACTIVE",
  "creationDate": "2026-03-25T10:30:00.000Z",
  "updateDate": "2026-03-25T10:30:00.000Z",
  "user": {
    "userId": 1,
    "name": "John Doe",
    "email": "user@example.com"
  }
}
```

### Get Systems by User
**Endpoint:** `GET /api/growing-systems/:userId?page=1&limit=10&query=&sortBy=creationDate&sortOrder=DESC`

**Response (200):**
```json
{
  "systems": [
    {
      "systemId": 1,
      "name": "Main Greenhouse",
      "ubication": "Backyard North",
      "description": "Primary hydroponic growing system",
      "status": "ACTIVE",
      "creationDate": "2026-03-25T10:30:00.000Z",
      "updateDate": "2026-03-25T10:30:00.000Z",
      "user": {
        "userId": 1,
        "name": "John Doe",
        "email": "user@example.com"
      }
    }
  ],
  "total": 1,
  "page": 1,
  "lastPage": 1
}
```

### Update Growing System
**Endpoint:** `PATCH /api/growing-systems/:systemId`

**Request:**
```json
{
  "name": "Updated Greenhouse Name",
  "location": "New Location",
  "description": "Updated description"
}
```

### Delete Growing System
**Endpoint:** `DELETE /api/growing-systems/:systemId`

**Response (204):** No content

### Associate Agronomic Variable
**Endpoint:** `PATCH /api/growing-systems/:systemId/variable/:variableId`

**Request:**
```json
{
  "sampleRate": 60
}
```

---

## 📡 IoT Devices API

### Create IoT Device
**Endpoint:** `POST /api/iot-devices`

**Request:**
```json
{
  "systemId": 1,
  "name": "Primary Sensor Hub",
  "deviceType": "SENSOR_HUB",
  "logicId": "hub-main-greenhouse-01"
}
```

**Response (201):**
```json
{
  "deviceId": 1,
  "systemId": 1,
  "name": "Primary Sensor Hub",
  "deviceType": "SENSOR_HUB",
  "logicId": "hub-main-greenhouse-01",
  "status": "ACTIVE",
  "creationDate": "2026-03-25T11:00:00.000Z",
  "updateDate": "2026-03-25T11:00:00.000Z"
}
```

### Get Device by ID
**Endpoint:** `GET /api/iot-devices/:deviceId`

### Get All Devices
**Endpoint:** `GET /api/iot-devices?page=1&limit=10&query=&sortBy=creationDate&sortOrder=DESC`

### Get Devices by System
**Endpoint:** `GET /api/iot-devices/system/:systemId/devices?page=1&limit=10`

### Update Device
**Endpoint:** `PATCH /api/iot-devices/:deviceId`

**Request:**
```json
{
  "name": "Updated Hub Name",
  "logicId": "updated-logic-id"
}
```

### Delete Device
**Endpoint:** `DELETE /api/iot-devices/:deviceId`

**Response (204):** No content

### Activate Device
**Endpoint:** `PATCH /api/iot-devices/:deviceId/activate`

---

## 🌡️ Sensors API

### Register Sensor (Auto Hub Creation)
**Endpoint:** `POST /api/sensors/register`

**Request:**
```json
{
  "systemId": 1,
  "type": "Temperature",
  "unit": "°C",
  "sampleRate": 60
}
```

**Response (201):**
```json
{
  "sensorId": 1,
  "deviceId": 1,
  "variableId": 1,
  "sensorType": "Temperature",
  "status": "ACTIVE",
  "creationDate": "2026-03-25T11:15:00.000Z",
  "updateDate": "2026-03-25T11:15:00.000Z",
  "alertDefinitionId": null
}
```

### Create Sensor (Manual)
**Endpoint:** `POST /api/sensors`

**Request:**
```json
{
  "deviceId": 1,
  "variableId": 1,
  "sensorType": "DHT22"
}
```

### Get Sensor by ID
**Endpoint:** `GET /api/sensors/:sensorId`

**Response (200):**
```json
{
  "sensorId": 1,
  "deviceId": 1,
  "variableId": 1,
  "sensorType": "Temperature",
  "status": "ACTIVE",
  "creationDate": "2026-03-25T11:15:00.000Z",
  "updateDate": "2026-03-25T11:15:00.000Z",
  "device": {
    "deviceId": 1,
    "name": "Primary Sensor Hub"
  },
  "variable": {
    "variableId": 1,
    "name": "Temperature",
    "measurementUnit": "°C"
  },
  "alertDefinition": null
}
```

### Get All Sensors
**Endpoint:** `GET /api/sensors?page=1&limit=10&query=Temperature`

### Get Sensors by System
**Endpoint:** `GET /api/sensors/system/:systemId?page=1&limit=10`

### Get Sensors by Device
**Endpoint:** `GET /api/sensors/device/:deviceId?page=1&limit=10`

### Update Sensor
**Endpoint:** `PATCH /api/sensors/:sensorId`

**Request:**
```json
{
  "sensorType": "DHT22",
  "status": "ACTIVE"
}
```

### Delete Sensor
**Endpoint:** `DELETE /api/sensors/:sensorId`

**Response (204):** No content

### Assign Alert Definition
**Endpoint:** `PATCH /api/sensors/:sensorId/alert-definition/:alertDefinitionId`

### Remove Alert Definition
**Endpoint:** `DELETE /api/sensors/:sensorId/alert-definition`

---

## 📊 Sensor Readings API

### Create Reading
**Endpoint:** `POST /api/sensor-readings`

**Request:**
```json
{
  "sensorId": 1,
  "value": 27.5,
  "timestamp": "2026-03-25T12:00:00Z"
}
```

**Response (201):**
```json
{
  "readingId": 1,
  "sensorId": 1,
  "value": 27.5,
  "timestamp": "2026-03-25T12:00:00.000Z",
  "creationDate": "2026-03-25T12:00:00.000Z",
  "sensor": {
    "sensorId": 1,
    "sensorType": "Temperature",
    "variable": {
      "variableId": 1,
      "name": "Temperature",
      "measurementUnit": "°C"
    }
  }
}
```

### Batch Create Readings
**Endpoint:** `POST /api/sensor-readings/batch`

**Request:**
```json
{
  "sensorId": 1,
  "readings": [
    {
      "value": 25.0,
      "timestamp": "2026-03-25T11:00:00Z"
    },
    {
      "value": 26.5,
      "timestamp": "2026-03-25T11:05:00Z"
    },
    {
      "value": 27.5,
      "timestamp": "2026-03-25T11:10:00Z"
    }
  ]
}
```

**Response (201):**
```json
[
  {
    "readingId": 1,
    "sensorId": 1,
    "value": 25.0,
    "timestamp": "2026-03-25T11:00:00.000Z",
    "creationDate": "2026-03-25T12:00:00.000Z"
  },
  {
    "readingId": 2,
    "sensorId": 1,
    "value": 26.5,
    "timestamp": "2026-03-25T11:05:00.000Z",
    "creationDate": "2026-03-25T12:00:00.000Z"
  },
  {
    "readingId": 3,
    "sensorId": 1,
    "value": 27.5,
    "timestamp": "2026-03-25T11:10:00.000Z",
    "creationDate": "2026-03-25T12:00:00.000Z"
  }
]
```

### Get Readings by Sensor
**Endpoint:** `GET /api/sensor-readings/sensor/:sensorId?page=1&limit=500&startDate=2026-03-01&endDate=2026-03-31`

### Get Latest Reading
**Endpoint:** `GET /api/sensor-readings/sensor/:sensorId/latest`

**Response (200):**
```json
{
  "readingId": 100,
  "sensorId": 1,
  "value": 28.5,
  "timestamp": "2026-03-25T13:45:00.000Z",
  "creationDate": "2026-03-25T13:45:00.000Z",
  "sensor": {
    "sensorId": 1,
    "sensorType": "Temperature",
    "variable": {
      "variableId": 1,
      "name": "Temperature",
      "measurementUnit": "°C"
    }
  }
}
```

### Get Recent Readings
**Endpoint:** `GET /api/sensor-readings/sensor/:sensorId/recent?limit=10`

### Get Statistics
**Endpoint:** `GET /api/sensor-readings/statistics?systemId=1`

**Response (200):**
```json
[
  {
    "variableId": 1,
    "variableName": "Temperature",
    "measurementUnit": "°C",
    "readingsCount": 100,
    "avgValue": 25.3,
    "minValue": 18.5,
    "maxValue": 32.1,
    "latestReadingAt": "2026-03-25T13:45:00.000Z"
  },
  {
    "variableId": 2,
    "variableName": "Humidity",
    "measurementUnit": "%",
    "readingsCount": 98,
    "avgValue": 65.2,
    "minValue": 45.0,
    "maxValue": 85.5,
    "latestReadingAt": "2026-03-25T13:44:00.000Z"
  }
]
```

### Get Variable Statistics
**Endpoint:** `GET /api/sensor-readings/variable/:variableId/statistics`

### Delete Reading
**Endpoint:** `DELETE /api/sensor-readings/:readingId`

**Response (204):** No content

### Cleanup Old Readings
**Endpoint:** `POST /api/sensor-readings/cleanup/old-readings`

**Request:**
```json
{
  "daysOld": 90
}
```

**Response (200):**
```json
{
  "deletedCount": 250
}
```

---

## 🚨 Alerts API

### Create Alert Definition
**Endpoint:** `POST /api/alerts/definitions`

**Request:**
```json
{
  "systemId": 1,
  "variable": "Temperature",
  "minValue": 15,
  "maxValue": 30
}
```

**Response (201):**
```json
{
  "alertDefinitionId": 1,
  "systemVariableId": 1,
  "minValue": 15,
  "maxValue": 30,
  "creationDate": "2026-03-25T12:00:00.000Z",
  "updateDate": "2026-03-25T12:00:00.000Z",
  "systemVariable": {
    "systemVariableId": 1,
    "systemId": 1,
    "variableId": 1,
    "sampleRate": 60,
    "variable": {
      "variableId": 1,
      "name": "Temperature",
      "measurementUnit": "°C"
    }
  }
}
```

### Get Alert Definition by ID
**Endpoint:** `GET /api/alerts/definitions/:alertDefinitionId`

### Get All Alert Definitions
**Endpoint:** `GET /api/alerts/definitions?page=1&limit=10`

### Get Alert Definitions by System
**Endpoint:** `GET /api/alerts/definitions/system/:systemId?page=1&limit=10`

### Update Alert Definition
**Endpoint:** `PATCH /api/alerts/definitions/:alertDefinitionId`

**Request:**
```json
{
  "minValue": 10,
  "maxValue": 35
}
```

### Delete Alert Definition
**Endpoint:** `DELETE /api/alerts/definitions/:alertDefinitionId`

**Response (204):** No content

### Get Alert Events
**Endpoint:** `GET /api/alerts/events?systemId=1&page=1&limit=200`

**Response (200):**
```json
{
  "events": [
    {
      "alertId": 1,
      "sensorId": 1,
      "variableName": "Temperature",
      "detectedValue": 35.5,
      "alertType": "DANGEROUS",
      "creationDate": "2026-03-25T13:20:00.000Z"
    },
    {
      "alertId": 2,
      "sensorId": 2,
      "variableName": "Humidity",
      "detectedValue": 12.0,
      "alertType": "WARNING",
      "creationDate": "2026-03-25T13:15:00.000Z"
    }
  ],
  "total": 2,
  "page": 1,
  "lastPage": 1
}
```

### Get Alerts by Sensor
**Endpoint:** `GET /api/alerts/sensor/:sensorId?page=1&limit=100`

### Resolve Alert
**Endpoint:** `PATCH /api/alerts/:alertId/resolve`

**Response (200):**
```json
{
  "alertId": 1,
  "sensorId": 1,
  "detectedValue": 35.5,
  "alertType": "DANGEROUS",
  "status": "INACTIVE",
  "creationDate": "2026-03-25T13:20:00.000Z"
}
```

### Delete Alert
**Endpoint:** `DELETE /api/alerts/:alertId`

**Response (204):** No content

### Cleanup Old Alerts
**Endpoint:** `POST /api/alerts/cleanup/old-alerts`

**Request:**
```json
{
  "daysOld": 90
}
```

---

## 🧬 Agronomic Variables API

### Create Agronomic Variable
**Endpoint:** `POST /api/agronomic-variables`

**Request:**
```json
{
  "name": "Temperature",
  "measurementUnit": "°C",
  "description": "Temperature measurement in Celsius"
}
```

**Response (201):**
```json
{
  "variableId": 1,
  "name": "Temperature",
  "measurementUnit": "°C",
  "description": "Temperature measurement in Celsius",
  "creationDate": "2026-03-25T10:00:00.000Z",
  "updateDate": "2026-03-25T10:00:00.000Z"
}
```

### Get Variable by ID
**Endpoint:** `GET /api/agronomic-variables/:variableId`

### Get All Variables
**Endpoint:** `GET /api/agronomic-variables?page=1&limit=10&query=Temperature`

### Update Variable
**Endpoint:** `PATCH /api/agronomic-variables/:variableId`

**Request:**
```json
{
  "name": "Temperature (Celsius)",
  "description": "Updated description"
}
```

### Delete Variable
**Endpoint:** `DELETE /api/agronomic-variables/:variableId`

**Response (204):** No content

---

## ✅ Testing Workflow in APIdog

### Step 1: Setup Environment
1. Create a new collection called "Terrafy API"
2. Add a variable `baseUrl` = `http://localhost:3000`
3. Add a variable `token` = (will be set after login)

### Step 2: Test Authentication
1. POST `/api/users/login`
2. Extract token from response → Set `{{token}}` variable
3. Add Authorization header: `Bearer {{token}}`

### Step 3: Test Growing System
1. POST `/api/growing-systems` (with userId = 1)
2. Copy systemId for next tests
3. GET `/api/growing-systems/:userId`

### Step 4: Test IoT Devices
1. POST `/api/iot-devices` (with systemId)
2. Copy deviceId for sensor tests
3. GET `/api/iot-devices/:deviceId`

### Step 5: Test Sensors
1. POST `/api/sensors/register` (with systemId)
2. Copy sensorId for reading tests
3. GET `/api/sensors/:sensorId`

### Step 6: Test Sensor Readings
1. POST `/api/sensor-readings` (with sensorId and value)
2. POST `/api/sensor-readings/batch` (bulk inserts)
3. GET `/api/sensor-readings/sensor/:sensorId`
4. GET `/api/sensor-readings/statistics?systemId=1`

### Step 7: Test Alerts
1. POST `/api/alerts/definitions` (define thresholds)
2. POST `/api/sensors/:sensorId/alert-definition/:alertDefinitionId`
3. POST `/api/sensor-readings` (with value exceeding threshold)
4. GET `/api/alerts/events?systemId=1` (view triggered alerts)

---

## 📌 Common Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "minValue cannot be greater than maxValue"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid email or password"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Sensor 999 not found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Email is already in use"
}
```

---

## 🔗 Quick Links

- **Base URL:** `http://localhost:3000`
- **API Prefix:** `/api`
- **Documentation:** Auto-generated at `/api/docs` (Swagger UI)
- **All endpoints:** Require JWT Bearer token in Authorization header
