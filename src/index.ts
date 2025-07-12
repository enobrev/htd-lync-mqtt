import 'dotenv/config';
import LyncMQTTClient from "./LyncMQTTClient.js";

// Check for required environment variables
const requiredEnvVars = ['MQTT_BROKER_URL', 'LYNC_HOST', 'LYNC_PORT'] as const;
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:');
    missingEnvVars.forEach(envVar => console.error(`  - ${envVar}`));
    console.error('\nPlease create a .env file based on .env.example');
    process.exit(1);
}

const mqttBrokerUrl = process.env.MQTT_BROKER_URL!;
const lyncHost = process.env.LYNC_HOST!;
const lyncPort = parseInt(process.env.LYNC_PORT!);
const haDiscoveryEnabled = process.env.HA_DISCOVERY_ENABLED?.toLowerCase() === 'true';
const haDiscoveryPrefix = process.env.HA_DISCOVERY_PREFIX || 'homeassistant';

if (isNaN(lyncPort)) {
    console.error('Invalid LYNC_PORT value. Must be a valid number.');
    process.exit(1);
}

console.log(`Connecting to MQTT broker: ${mqttBrokerUrl}`);
console.log(`Connecting to Lync device: ${lyncHost}:${lyncPort}`);
console.log(`Home Assistant discovery: ${haDiscoveryEnabled ? 'enabled' : 'disabled'}`);
if (haDiscoveryEnabled) {
    console.log(`Discovery prefix: ${haDiscoveryPrefix}`);
}

async function main() {
    try {
        const client = await LyncMQTTClient.CreateClient(mqttBrokerUrl, lyncHost, lyncPort);
        client.setHomeAssistantDiscovery(haDiscoveryEnabled, haDiscoveryPrefix);
        console.log('Client initialized successfully');
    } catch (error) {
        console.error('Failed to initialize client:', error);
        process.exit(1);
    }
}

main();
