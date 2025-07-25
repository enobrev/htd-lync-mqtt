# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MQTT bridge for HTD Lync home audio systems, written in TypeScript. The project connects to an HTD Lync audio controller via TCP and bridges its functionality to MQTT topics for home automation integration.

## Development Commands

- `npm run dev` - Run the application in development mode using tsx
- `npm run build` - Compile TypeScript to JavaScript using tsc
- `npm test` - Run tests using vitest  
- `npm run preview` - Run vite preview server

## Docker & Deployment Commands

- `npm run build` - Build TypeScript source
- `docker build -t htd-lync-mqtt:latest .` - Build Docker container
- `docker run -d --name htd-lync-mqtt --env-file .env htd-lync-mqtt:latest` - Run container locally
- `nomad job run nomad.hcl` - Deploy to Nomad cluster
- `./deploy.sh` - Complete build-to-deploy pipeline (recommended)

## Architecture

### Core Components

1. **LyncMQTTClient** (`src/LyncMQTTClient.ts`) - Main orchestrator that:
   - Connects to MQTT broker and HTD Lync device
   - Subscribes to MQTT control topics (`lync/set/*`)
   - Publishes device state to MQTT status topics (`lync/zones/*`, `lync/mp3/*`)
   - Handles bidirectional message translation between MQTT and Lync protocols
   - Publishes Home Assistant MQTT discovery messages for automatic device detection

2. **Lync** (`src/Lync.ts`) - HTD Lync device interface that:
   - Manages TCP connection to HTD Lync controller using htd-lync library
   - Maintains device state (zones, sources, MP3 player)
   - Provides typed methods for device control (Zone_Power, Zone_Volume, MP3_Play, etc.)
   - Emits typed events for state changes

3. **TypedEventEmitter** (`src/TypedEventEmitter.ts`) - Type-safe event emitter wrapper around Node.js EventEmitter

### MQTT Topic Structure

- Control topics: `lync/set/zones/{zone}/power`, `lync/set/mp3/play`, etc.
- Status topics: `lync/zones/{zone}/name`, `lync/mp3/artist`, etc.
- Connection status: `lync/connected/lync`, `lync/connected/mqtt`

### Key Dependencies

- `htd-lync` - Core library for HTD Lync protocol communication
- `mqtt` - MQTT client for broker communication
- Uses ES modules (`"type": "module"` in package.json)

### Entry Point

The application starts in `src/index.ts` which creates a LyncMQTTClient using environment variables for configuration.

## Configuration

The application requires environment variables for configuration. All environment variables are **required** and the application will exit with an error if any are missing. Environment variables are loaded using the `dotenv` package.

**Required Environment Variables:**
- `MQTT_BROKER_URL` - MQTT broker connection string (e.g., `mqtt://10.0.0.10`)
- `LYNC_HOST` - HTD Lync device IP address (e.g., `10.0.0.25`)
- `LYNC_PORT` - HTD Lync device port (e.g., `10006`)

**Optional Environment Variables:**
- `HA_DISCOVERY_ENABLED` - Enable/disable Home Assistant MQTT discovery (default: `true`)
- `HA_DISCOVERY_PREFIX` - MQTT discovery prefix (default: `homeassistant`)

**Setup:**
1. Copy `.env.example` to `.env`
2. Modify the values for your environment
3. The `.env` file will be automatically loaded at application startup

The application will validate all required environment variables on startup and provide clear error messages for any missing values.

## Containerization

The project includes Docker support for containerized deployment:

### Docker Configuration
- **Multi-stage build** using Node.js 22 Alpine for optimized image size
- **Production runtime** with non-root user for security
- **tsx runtime** to handle ES module compatibility issues with htd-lync library
- **pnpm** for efficient package management

### Container Files
- `Dockerfile` - Multi-stage build configuration
- `.dockerignore` - Excludes unnecessary files from build context
- `nomad.hcl` - Nomad job specification for orchestrated deployment

### ES Module Compatibility
The application uses ES modules but the htd-lync dependency has import resolution issues. The container uses `tsx` instead of `node` to handle these compatibility issues in production.

## Development Notes

- TypeScript configuration uses ES2022 target with strict mode enabled
- All zone control methods require re-setting the source after changes due to device protocol requirements
- The project uses pnpm for package management
- Device supports 12 zones and 18 sources
- MP3 player functionality is built into the HTD Lync device

## Home Assistant Integration

The application includes automatic Home Assistant MQTT discovery support. When enabled, it publishes discovery messages for:

**Per Zone (12 zones):**
- Power switch
- Mute switch  
- Do Not Disturb (DND) switch
- Volume number control (0-60)
- Treble adjustment (-10 to +10)
- Bass adjustment (-10 to +10)
- Balance adjustment (-10 to +10)
- Source selection (1-18)
- Zone name sensor

**MP3 Player:**
- Play button
- Stop button
- Next track button
- Previous track button
- Repeat switch
- Artist sensor
- File sensor

Discovery messages are published on MQTT connect and use retained messages for persistence. Each zone appears as a separate device in Home Assistant with the main HTD Lync device as the parent.