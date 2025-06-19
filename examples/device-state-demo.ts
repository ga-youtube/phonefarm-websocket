/**
 * Device State Tracking Demo
 * 
 * This script demonstrates the device state tracking functionality:
 * 1. Device registration with initial state
 * 2. State updates (battery, CPU, etc.)
 * 3. State queries
 * 4. Real-time state monitoring
 */

// Example WebSocket messages for device state tracking

// 1. Device Registration (sets initial ONLINE state)
const deviceInfoMessage = {
  type: "device_info",
  data: {
    serial: "ABC123456",
    imei: "123456789012345",
    macAddress: "AA:BB:CC:DD:EE:FF",
    wifiIpAddress: "192.168.1.100",
    brand: "Samsung",
    model: "Galaxy S21",
    release: "12",
    sdkInt: 31
  }
};

// 2. Device State Update - Normal operation
const stateUpdateNormal = {
  type: "device_state_update",
  data: {
    deviceId: "1", // Will be returned after device registration
    serial: "ABC123456",
    state: "IDLE",
    batteryLevel: 85,
    temperature: 28,
    cpuUsage: 15,
    memoryUsage: 45,
    storageUsage: 60,
    metadata: {
      networkType: "wifi",
      signalStrength: -45
    }
  }
};

// 3. Device State Update - High CPU usage
const stateUpdateBusy = {
  type: "device_state_update",
  data: {
    deviceId: "1",
    serial: "ABC123456",
    state: "BUSY",
    batteryLevel: 75,
    temperature: 35,
    cpuUsage: 85,
    memoryUsage: 78,
    storageUsage: 60
  }
};

// 4. Device State Update - Low battery
const stateUpdateLowBattery = {
  type: "device_state_update",
  data: {
    deviceId: "1",
    serial: "ABC123456",
    state: "BATTERY_LOW",
    batteryLevel: 15,
    temperature: 30,
    cpuUsage: 20,
    memoryUsage: 50,
    storageUsage: 60
  }
};

// 5. Query all device states
const getAllStates = {
  type: "get_device_states",
  data: {}
};

// 6. Query specific device states
const getSpecificDevices = {
  type: "get_device_states",
  data: {
    deviceIds: ["1", "2", "3"]
  }
};

// 7. Query devices by state
const getDevicesByState = {
  type: "get_device_states",
  data: {
    state: "ONLINE"
  }
};

// Example WebSocket client code
console.log(`
// WebSocket Client Example
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  console.log('Connected to WebSocket server');
  
  // Register device
  ws.send(JSON.stringify(${JSON.stringify(deviceInfoMessage, null, 2)}));
};

ws.onmessage = (event) => {
  const response = JSON.parse(event.data);
  console.log('Received:', response);
  
  if (response.type === 'device_info' && response.data.status === 'registered') {
    const deviceId = response.data.deviceId;
    console.log('Device registered with ID:', deviceId);
    
    // Send state updates
    setTimeout(() => {
      const stateUpdate = ${JSON.stringify(stateUpdateNormal, null, 2)};
      stateUpdate.data.deviceId = deviceId;
      ws.send(JSON.stringify(stateUpdate));
    }, 1000);
    
    // Query all device states
    setTimeout(() => {
      ws.send(JSON.stringify(${JSON.stringify(getAllStates, null, 2)}));
    }, 2000);
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from WebSocket server');
};
`);

// Example expected responses
console.log('\n// Expected Responses:\n');

console.log('// Device Registration Response:');
console.log(JSON.stringify({
  type: "device_info",
  data: {
    deviceId: "1",
    status: "registered",
    message: "Device registered successfully",
    displayName: "Samsung Galaxy S21 (Android 12) - 192.168.1.100"
  }
}, null, 2));

console.log('\n// State Update Response:');
console.log(JSON.stringify({
  type: "device_state_update",
  data: {
    deviceId: "1",
    status: "updated",
    state: "IDLE",
    message: "Device state updated successfully",
    timestamp: "2024-01-01T12:00:00.000Z"
  }
}, null, 2));

console.log('\n// Get Device States Response:');
console.log(JSON.stringify({
  type: "get_device_states",
  data: {
    devices: [
      {
        deviceId: "1",
        serial: "ABC123456",
        state: "IDLE",
        lastUpdated: "2024-01-01T12:00:00.000Z",
        isStale: false,
        needsAttention: false,
        brand: "Samsung",
        model: "Galaxy S21",
        displayName: "Samsung Galaxy S21 (Android 12) - 192.168.1.100",
        metrics: {
          batteryLevel: 85,
          temperature: 28,
          cpuUsage: 15,
          memoryUsage: 45,
          storageUsage: 60,
          healthScore: 95
        }
      }
    ],
    summary: {
      totalDevices: 1,
      onlineCount: 1,
      stateBreakdown: {
        "IDLE": 1
      },
      devicesNeedingAttention: 0,
      averageHealthScore: 95
    },
    timestamp: "2024-01-01T12:00:01.000Z"
  }
}, null, 2));

console.log('\n// Device State Alerts:');
console.log('// Devices need attention when:');
console.log('// - Battery < 20%');
console.log('// - Temperature > 70°C');
console.log('// - CPU usage > 90%');
console.log('// - Memory usage > 90%');
console.log('// - Storage usage > 95%');
console.log('// - State is ERROR or UNREACHABLE');