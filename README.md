# HTD Lync MQTT Bridge

A TypeScript MQTT bridge for HTD Lync home audio systems, enabling integration with home automation platforms like Home Assistant, OpenHAB, and Node-RED.

## Features

- **Bidirectional MQTT Communication** - Control HTD Lync devices via MQTT and receive real-time status updates
- **Multi-Zone Audio Control** - Support for all 12 zones with individual control
- **MP3 Player Integration** - Control built-in MP3 player functionality
- **Type-Safe Implementation** - Full TypeScript support with comprehensive error handling
- **Environment-Based Configuration** - Secure configuration via environment variables
- **Real-time Status Updates** - Live feedback on zone states, volume levels, and MP3 playback

## Prerequisites

- Node.js 18+ 
- HTD Lync audio controller (Lync12 or compatible)
- MQTT broker (Mosquitto, etc.)
- Network access to both MQTT broker and HTD Lync device

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd htd-lync-mqtt
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or with pnpm
   pnpm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

## Configuration

All configuration is done via environment variables. Copy `.env.example` to `.env` and modify:

```bash
# MQTT Broker Configuration
MQTT_BROKER_URL=mqtt://your-broker-ip

# HTD Lync Device Configuration  
LYNC_HOST=192.168.1.100
LYNC_PORT=10006
```

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MQTT_BROKER_URL` | MQTT broker connection string | - | ✅ |
| `LYNC_HOST` | HTD Lync device IP address | - | ✅ |
| `LYNC_PORT` | HTD Lync device port | - | ✅ |

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Build (optional)
```bash
npm run build
```

## MQTT Topics

### Status Topics (Published by Bridge)

#### Connection Status
- `lync/connected/lync` - Lync device connection status (`1`/`0`)
- `lync/connected/mqtt` - MQTT broker connection status (`1`/`0`)

#### Zone Status (per zone 1-12)
- `lync/zones/{zone}/number` - Zone number
- `lync/zones/{zone}/name` - Zone display name
- `lync/zones/{zone}/power` - Power state (`1`/`0`)
- `lync/zones/{zone}/mute` - Mute state (`1`/`0`)
- `lync/zones/{zone}/dnd` - Do Not Disturb state (`1`/`0`)
- `lync/zones/{zone}/source` - Active source number (1-18)
- `lync/zones/{zone}/volume` - Volume level (0-60)
- `lync/zones/{zone}/treble` - Treble adjustment (-10 to +10)
- `lync/zones/{zone}/bass` - Bass adjustment (-10 to +10)
- `lync/zones/{zone}/balance` - Balance adjustment (-10 to +10)

#### MP3 Player Status
- `lync/mp3/repeat` - Repeat mode (`1`/`0`)
- `lync/mp3/artist` - Currently playing artist
- `lync/mp3/file` - Currently playing file

### Control Topics (Subscribe for Commands)

#### Zone Control (zones 1-12)
- `lync/set/zones/{zone}/name` - Set zone name (string)
- `lync/set/zones/{zone}/power` - Set power state (`1`/`0`)
- `lync/set/zones/{zone}/mute` - Set mute state (`1`/`0`)
- `lync/set/zones/{zone}/dnd` - Set DND state (`1`/`0`)
- `lync/set/zones/{zone}/source` - Set source (1-18)
- `lync/set/zones/{zone}/volume` - Set volume (0-60)
- `lync/set/zones/{zone}/treble` - Set treble (-10 to +10)
- `lync/set/zones/{zone}/bass` - Set bass (-10 to +10)
- `lync/set/zones/{zone}/balance` - Set balance (-10 to +10)

#### MP3 Player Control
- `lync/set/mp3/play` - Start playback
- `lync/set/mp3/stop` - Stop playback
- `lync/set/mp3/forward` - Next track
- `lync/set/mp3/back` - Previous track

## Example Usage

### Home Assistant Configuration

```yaml
# configuration.yaml
mqtt:
  sensor:
    - name: "Living Room Volume"
      state_topic: "lync/zones/1/volume"
      unit_of_measurement: "%"
    
    - name: "Living Room Power"
      state_topic: "lync/zones/1/power"
      payload_on: "1"
      payload_off: "0"

  switch:
    - name: "Living Room Audio"
      command_topic: "lync/set/zones/1/power"
      state_topic: "lync/zones/1/power"
      payload_on: "1"
      payload_off: "0"

  number:
    - name: "Living Room Volume"
      command_topic: "lync/set/zones/1/volume"
      state_topic: "lync/zones/1/volume"
      min: 0
      max: 60
```

### Node-RED Example

```javascript
// Set zone 1 to source 3 at volume 25
msg.topic = "lync/set/zones/1/source";
msg.payload = "3";
node.send(msg);

msg.topic = "lync/set/zones/1/volume";
msg.payload = "25";
node.send(msg);
```

## Architecture

- **TypeScript** - Full type safety and modern JavaScript features
- **MQTT.js** - Robust MQTT client with automatic reconnection
- **htd-lync** - HTD Lync protocol implementation
- **Async/Await** - Modern asynchronous programming with comprehensive error handling
- **Environment Variables** - Secure configuration management with dotenv

## Error Handling

The application includes comprehensive error handling:

- **Connection Failures** - Automatic retry logic for both MQTT and Lync connections
- **Invalid Commands** - Graceful handling of malformed MQTT messages
- **Device Errors** - Specific error logging for each zone operation
- **Network Issues** - Robust reconnection handling

## Development

### Project Structure
```
src/
├── index.ts              # Application entry point
├── LyncMQTTClient.ts     # Main MQTT bridge logic
├── Lync.ts               # HTD Lync device interface
└── TypedEventEmitter.ts  # Type-safe event handling
```

### Available Scripts
- `npm run dev` - Development mode with hot reload
- `npm start` - Production mode
- `npm run build` - TypeScript compilation
- `npm test` - Run test suite

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## Troubleshooting

### Common Issues

**Connection Refused**
- Verify HTD Lync device IP and port (typically 10006)
- Check network connectivity between bridge and device
- Ensure Lync device is powered on and network-enabled

**MQTT Connection Failed**
- Verify MQTT broker URL and credentials
- Check firewall settings
- Test MQTT broker with another client

**Environment Variables Not Loaded**
- Ensure `.env` file exists in project root
- Verify all required variables are set
- Check for typos in variable names

## Related Projects

- [htd-lync](https://www.npmjs.com/package/htd-lync) - Core HTD Lync protocol library
- [Home Assistant](https://www.home-assistant.io/) - Home automation platform
- [Node-RED](https://nodered.org/) - Visual programming for IoT