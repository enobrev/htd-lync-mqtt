import { connect, MqttClient as MQTT } from 'mqtt';
import Lync, {StatusMP3, StatusZone} from "./Lync.js";
import {Source} from "htd-lync";

export default class LyncMQTTClient {
    private client: MQTT;
    private Lync: Lync;
    private connected: boolean = false;
    private haDiscoveryEnabled: boolean = true;
    private haDiscoveryPrefix: string = 'homeassistant';

    public static async CreateClient (mqtt_broker_url: string, lync_host: string, lync_port: number) {
        const lync = await Lync.CreateLync(lync_host, lync_port);
        return new LyncMQTTClient(mqtt_broker_url, lync);
    }

    private constructor(brokerUrl: string, lync: Lync) {
        this.client = connect(brokerUrl);
        this.Lync   = lync;

        this.client.on('connect', () => {
            console.log('Connected to MQTT broker');
            this.connected = true;
            this.subscribeTopics();
            if (this.haDiscoveryEnabled) {
                this.publishHomeAssistantDiscovery();
            }
            this.Lync.Ready();
        });

        this.client.on('message', (topic, message) => {
            this.handleMessage(topic, message.toString()).catch(error => {
                console.error('Error in message handler:', error);
            });
        });

        this.client.on('error', (error) => {
            console.error('MQTT connection error:', error);
        });

        this.client.on('close', () => {
            console.log('MQTT connection closed');
            this.connected = false;
        });

        this.client.on('reconnect', () => {
            console.log('MQTT reconnecting...');
        });

        this.client.on('offline', () => {
            console.log('MQTT client offline');
            this.connected = false;
        });

        this.Lync.events.on('socket:connected', this.lync_socket_connected.bind(this));
        this.Lync.events.on('socket:error',     this.lync_socket_error.bind(this));
        this.Lync.events.on('zone:update',      this.lync_zone_update.bind(this));
        this.Lync.events.on('mp3:update',       this.lync_mp3_update.bind(this));
    }

    private subscribeTopics() {
        const topics = [
            'lync/set/mp3/stop',
            'lync/set/mp3/play',
            'lync/set/mp3/forward',
            'lync/set/mp3/back',
            // 'lync/set/sources/+/name',
            'lync/set/zones/+/name',
            'lync/set/zones/+/power',
            'lync/set/zones/+/mute',
            'lync/set/zones/+/dnd',
            'lync/set/zones/+/source',
            'lync/set/zones/+/source_name',
            'lync/set/zones/+/volume',
            'lync/set/zones/+/treble',
            'lync/set/zones/+/bass',
            'lync/set/zones/+/balance',
            // 'lync/set/zones/+/source/+/name'
        ];

        topics.forEach(topic => this.client.subscribe(topic));
    }

    private async handleMessage(topic: string, message: string) {
        console.log(`Received message on ${topic}: ${message}`);

        try {
            if (topic.startsWith('lync/set/mp3/')) {
                switch(topic) {
                    case 'lync/set/mp3/stop':    this.Lync.MP3_Stop();      break;
                    case 'lync/set/mp3/play':    this.Lync.MP3_Play();      break;
                    case 'lync/set/mp3/forward': this.Lync.MP3_Forward();   break;
                    case 'lync/set/mp3/back':    this.Lync.MP3_Back();      break;
                }
            } else if (topic.startsWith('lync/set/zones/')) {
                const match = topic.match(/lync\/set\/zones\/(\d{1,2})\/(\w+)/);
                // console.log('MATCH', match)
                if (match) {
                    const zone = parseInt(match[1], 10);
                    const parameter = match[2];

                    switch(parameter) {
                        case 'name':        await this.Lync.Zone_Name(zone, message);                  break;
                        case 'power':       await this.Lync.Zone_Power(zone, message === '1');         break;
                        case 'mute':        await this.Lync.Zone_Mute(zone, message === '1');          break;
                        case 'dnd':         await this.Lync.Zone_DND(zone, message === '1');           break;
                        case 'source':      await this.Lync.Zone_Source(zone, parseInt(message, 10));  break;
                        case 'source_name': await this.handleSourceNameCommand(zone, message);         break;
                        case 'volume':      await this.Lync.Zone_Volume(zone, parseInt(message, 10));  break;
                        case 'treble':      await this.Lync.Zone_Treble(zone, parseInt(message, 10));  break;
                        case 'bass':        await this.Lync.Zone_Bass(zone, parseInt(message, 10));    break;
                        case 'balance':     await this.Lync.Zone_Balance(zone, parseInt(message, 10)); break;
                    }
                }
            }
        } catch (error) {
            console.error(`Error handling message for topic ${topic}:`, error);
        }
    }

    private lync_socket_connected() {
        this.client.publish('lync/connected/lync', '1');
    }

    private lync_socket_error(error: Error) {
        console.error(error);
    }

    private lync_zone_update(info: StatusZone) {
        const options = {retain: true};
        this.client.publish(`lync/zones/${info.number}/number`,    `${info.number}`, options);
        this.client.publish(`lync/zones/${info.number}/name`,         info.name,     options);
        this.client.publish(`lync/zones/${info.number}/power`,        info.power ? '1' : '0', options);
        this.client.publish(`lync/zones/${info.number}/mute`,         info.mute  ? '1' : '0', options);
        this.client.publish(`lync/zones/${info.number}/dnd`,          info.dnd   ? '1' : '0', options);
        this.client.publish(`lync/zones/${info.number}/source`,    `${info.source}`, options);
        this.client.publish(`lync/zones/${info.number}/volume`,    `${info.volume}`, options);
        this.client.publish(`lync/zones/${info.number}/treble`,    `${info.treble}`, options);
        this.client.publish(`lync/zones/${info.number}/bass`,      `${info.bass}`,   options);
        this.client.publish(`lync/zones/${info.number}/balance`,   `${info.balance}`, options);

        // Publish source name for Home Assistant select entity
        const sourceName = info.sources.get(info.source) || `Source ${info.source}`;
        this.client.publish(`lync/zones/${info.number}/source_name`, sourceName, options);

        info.sources.forEach(((source: string, index: number) => {
            this.client.publish(`lync/zones/${info.number}/sources/${index}`, source);
        }));

        // Update Home Assistant discovery with current source options
        this.updateSourceSelectOptions(info.number, info.sources);
    }

    private lync_mp3_update(mp3: StatusMP3) {
        const options = {retain: true};
        this.client.publish(`lync/mp3/repeat`, mp3.repeat ? '1' : '0', options);
        this.client.publish(`lync/mp3/artist`, mp3.artist, options);
        this.client.publish(`lync/mp3/file`,   mp3.file,   options);
    }

    // Method to close the MQTT connection
    public async close(): Promise<void> {
        return new Promise((resolve) => {
            if (this.connected) {
                this.client.end(false, {}, () => {
                    console.log('MQTT client closed gracefully');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    public isConnected(): boolean {
        return this.connected;
    }

    public setHomeAssistantDiscovery(enabled: boolean, prefix: string = 'homeassistant') {
        this.haDiscoveryEnabled = enabled;
        this.haDiscoveryPrefix = prefix;
    }

    private async handleSourceNameCommand(zone: number, sourceName: string) {
        // Find the source number by name
        const zoneInfo = this.Lync.Status.zones.get(zone);
        if (!zoneInfo) {
            console.warn(`Zone ${zone} not found`);
            return;
        }

        let sourceNumber: number | undefined;
        for (const [num, name] of zoneInfo.sources) {
            if (name === sourceName) {
                sourceNumber = num;
                break;
            }
        }

        if (sourceNumber !== undefined) {
            await this.Lync.Zone_Source(zone, sourceNumber);
        }
    }

    private updateSourceSelectOptions(zone: number, sources: Map<number, string>) {
        if (!this.haDiscoveryEnabled) return;

        const zoneDevice = {
            identifiers: [`htd_lync_zone_${zone}`],
            name: `HTD Lync Zone ${zone}`,
            manufacturer: "HTD",
            model: "Lync",
            via_device: "htd_lync"
        };

        const options = Array.from(sources.values()).filter(name => name.trim() !== '');
        
        // Only update if we have source names
        if (options.length > 0) {
            this.client.publish(`${this.haDiscoveryPrefix}/select/htd_lync_zone_${zone}/source/config`, JSON.stringify({
                name: "Source",
                unique_id: `htd_lync_zone_${zone}_source`,
                state_topic: `lync/zones/${zone}/source_name`,
                command_topic: `lync/set/zones/${zone}/source_name`,
                options: options,
                device: zoneDevice
            }), { retain: true });
        }
    }

    private publishHomeAssistantDiscovery() {
        const deviceInfo = {
            identifiers: ["htd_lync"],
            name: "HTD Lync Audio System",
            manufacturer: "HTD",
            model: "Lync"
        };

        // Publish discovery for each zone
        for (let zone = 1; zone <= 12; zone++) {
            this.publishZoneDiscovery(zone, deviceInfo);
        }

        // Publish MP3 player discovery
        this.publishMP3Discovery(deviceInfo);
    }

    private publishZoneDiscovery(zone: number, deviceInfo: any) {
        const zoneDevice = {
            ...deviceInfo,
            identifiers: [`htd_lync_zone_${zone}`],
            name: `HTD Lync Zone ${zone}`,
            via_device: "htd_lync"
        };

        // Zone Power Switch
        this.client.publish(`${this.haDiscoveryPrefix}/switch/htd_lync_zone_${zone}/power/config`, JSON.stringify({
            name: "Power",
            unique_id: `htd_lync_zone_${zone}_power`,
            state_topic: `lync/zones/${zone}/power`,
            command_topic: `lync/set/zones/${zone}/power`,
            payload_on: "1",
            payload_off: "0",
            device: zoneDevice
        }), { retain: true });

        // Zone Mute Switch
        this.client.publish(`${this.haDiscoveryPrefix}/switch/htd_lync_zone_${zone}/mute/config`, JSON.stringify({
            name: "Mute",
            unique_id: `htd_lync_zone_${zone}_mute`,
            state_topic: `lync/zones/${zone}/mute`,
            command_topic: `lync/set/zones/${zone}/mute`,
            payload_on: "1",
            payload_off: "0",
            device: zoneDevice
        }), { retain: true });

        // Zone DND Switch
        this.client.publish(`${this.haDiscoveryPrefix}/switch/htd_lync_zone_${zone}/dnd/config`, JSON.stringify({
            name: "Do Not Disturb",
            unique_id: `htd_lync_zone_${zone}_dnd`,
            state_topic: `lync/zones/${zone}/dnd`,
            command_topic: `lync/set/zones/${zone}/dnd`,
            payload_on: "1",
            payload_off: "0",
            device: zoneDevice
        }), { retain: true });

        // Zone Volume Number
        this.client.publish(`${this.haDiscoveryPrefix}/number/htd_lync_zone_${zone}/volume/config`, JSON.stringify({
            name: "Volume",
            unique_id: `htd_lync_zone_${zone}_volume`,
            state_topic: `lync/zones/${zone}/volume`,
            command_topic: `lync/set/zones/${zone}/volume`,
            min: 0,
            max: 60,
            device: zoneDevice
        }), { retain: true });

        // Zone Treble Number
        this.client.publish(`${this.haDiscoveryPrefix}/number/htd_lync_zone_${zone}/treble/config`, JSON.stringify({
            name: "Treble",
            unique_id: `htd_lync_zone_${zone}_treble`,
            state_topic: `lync/zones/${zone}/treble`,
            command_topic: `lync/set/zones/${zone}/treble`,
            min: -10,
            max: 10,
            device: zoneDevice
        }), { retain: true });

        // Zone Bass Number
        this.client.publish(`${this.haDiscoveryPrefix}/number/htd_lync_zone_${zone}/bass/config`, JSON.stringify({
            name: "Bass",
            unique_id: `htd_lync_zone_${zone}_bass`,
            state_topic: `lync/zones/${zone}/bass`,
            command_topic: `lync/set/zones/${zone}/bass`,
            min: -10,
            max: 10,
            device: zoneDevice
        }), { retain: true });

        // Zone Balance Number
        this.client.publish(`${this.haDiscoveryPrefix}/number/htd_lync_zone_${zone}/balance/config`, JSON.stringify({
            name: "Balance",
            unique_id: `htd_lync_zone_${zone}_balance`,
            state_topic: `lync/zones/${zone}/balance`,
            command_topic: `lync/set/zones/${zone}/balance`,
            min: -10,
            max: 10,
            device: zoneDevice
        }), { retain: true });

        // Zone Source Select
        this.client.publish(`${this.haDiscoveryPrefix}/select/htd_lync_zone_${zone}/source/config`, JSON.stringify({
            name: "Source",
            unique_id: `htd_lync_zone_${zone}_source`,
            state_topic: `lync/zones/${zone}/source_name`,
            command_topic: `lync/set/zones/${zone}/source_name`,
            options: [], // Will be populated dynamically when source names are available
            device: zoneDevice
        }), { retain: true });

        // Zone Name Sensor
        this.client.publish(`${this.haDiscoveryPrefix}/sensor/htd_lync_zone_${zone}/name/config`, JSON.stringify({
            name: "Zone Name",
            unique_id: `htd_lync_zone_${zone}_name`,
            state_topic: `lync/zones/${zone}/name`,
            device: zoneDevice
        }), { retain: true });
    }

    private publishMP3Discovery(deviceInfo: any) {
        const mp3Device = {
            ...deviceInfo,
            identifiers: ["htd_lync_mp3"],
            name: "HTD Lync MP3 Player",
            via_device: "htd_lync"
        };

        // MP3 Play Button
        this.client.publish(`${this.haDiscoveryPrefix}/button/htd_lync_mp3/play/config`, JSON.stringify({
            name: "Play",
            unique_id: "htd_lync_mp3_play",
            command_topic: "lync/set/mp3/play",
            device: mp3Device
        }), { retain: true });

        // MP3 Stop Button
        this.client.publish(`${this.haDiscoveryPrefix}/button/htd_lync_mp3/stop/config`, JSON.stringify({
            name: "Stop",
            unique_id: "htd_lync_mp3_stop",
            command_topic: "lync/set/mp3/stop",
            device: mp3Device
        }), { retain: true });

        // MP3 Forward Button
        this.client.publish(`${this.haDiscoveryPrefix}/button/htd_lync_mp3/forward/config`, JSON.stringify({
            name: "Next Track",
            unique_id: "htd_lync_mp3_forward",
            command_topic: "lync/set/mp3/forward",
            device: mp3Device
        }), { retain: true });

        // MP3 Back Button
        this.client.publish(`${this.haDiscoveryPrefix}/button/htd_lync_mp3/back/config`, JSON.stringify({
            name: "Previous Track",
            unique_id: "htd_lync_mp3_back",
            command_topic: "lync/set/mp3/back",
            device: mp3Device
        }), { retain: true });

        // MP3 Repeat Switch
        this.client.publish(`${this.haDiscoveryPrefix}/switch/htd_lync_mp3/repeat/config`, JSON.stringify({
            name: "Repeat",
            unique_id: "htd_lync_mp3_repeat",
            state_topic: "lync/mp3/repeat",
            payload_on: "1",
            payload_off: "0",
            device: mp3Device
        }), { retain: true });

        // MP3 Artist Sensor
        this.client.publish(`${this.haDiscoveryPrefix}/sensor/htd_lync_mp3/artist/config`, JSON.stringify({
            name: "Artist",
            unique_id: "htd_lync_mp3_artist",
            state_topic: "lync/mp3/artist",
            device: mp3Device
        }), { retain: true });

        // MP3 File Sensor
        this.client.publish(`${this.haDiscoveryPrefix}/sensor/htd_lync_mp3/file/config`, JSON.stringify({
            name: "File",
            unique_id: "htd_lync_mp3_file",
            state_topic: "lync/mp3/file",
            device: mp3Device
        }), { retain: true });
    }
}