import { connect } from 'mqtt';
import Lync from "./Lync.js";
export default class LyncMQTTClient {
    client;
    Lync;
    connected = false;
    static async CreateClient(mqtt_broker_url, lync_host, lync_port) {
        const lync = await Lync.CreateLync(lync_host, lync_port);
        return new LyncMQTTClient(mqtt_broker_url, lync);
    }
    constructor(brokerUrl, lync) {
        this.client = connect(brokerUrl);
        this.Lync = lync;
        this.client.on('connect', () => {
            console.log('Connected to MQTT broker');
            this.connected = true;
            this.subscribeTopics();
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
        this.Lync.events.on('socket:error', this.lync_socket_error.bind(this));
        this.Lync.events.on('zone:update', this.lync_zone_update.bind(this));
        this.Lync.events.on('mp3:update', this.lync_mp3_update.bind(this));
    }
    subscribeTopics() {
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
            'lync/set/zones/+/volume',
            'lync/set/zones/+/treble',
            'lync/set/zones/+/bass',
            'lync/set/zones/+/balance',
            // 'lync/set/zones/+/source/+/name'
        ];
        topics.forEach(topic => this.client.subscribe(topic));
    }
    async handleMessage(topic, message) {
        console.log(`Received message on ${topic}: ${message}`);
        try {
            if (topic.startsWith('lync/set/mp3/')) {
                switch (topic) {
                    case 'lync/set/mp3/stop':
                        this.Lync.MP3_Stop();
                        break;
                    case 'lync/set/mp3/play':
                        this.Lync.MP3_Play();
                        break;
                    case 'lync/set/mp3/forward':
                        this.Lync.MP3_Forward();
                        break;
                    case 'lync/set/mp3/back':
                        this.Lync.MP3_Back();
                        break;
                }
            }
            else if (topic.startsWith('lync/set/zones/')) {
                const match = topic.match(/lync\/set\/zones\/(\d{1,2})\/(\w+)/);
                // console.log('MATCH', match)
                if (match) {
                    const zone = parseInt(match[1], 10);
                    const parameter = match[2];
                    switch (parameter) {
                        case 'name':
                            await this.Lync.Zone_Name(zone, message);
                            break;
                        case 'power':
                            await this.Lync.Zone_Power(zone, message === '1');
                            break;
                        case 'mute':
                            await this.Lync.Zone_Mute(zone, message === '1');
                            break;
                        case 'dnd':
                            await this.Lync.Zone_DND(zone, message === '1');
                            break;
                        case 'source':
                            await this.Lync.Zone_Source(zone, parseInt(message, 10));
                            break;
                        case 'volume':
                            await this.Lync.Zone_Volume(zone, parseInt(message, 10));
                            break;
                        case 'treble':
                            await this.Lync.Zone_Treble(zone, parseInt(message, 10));
                            break;
                        case 'bass':
                            await this.Lync.Zone_Bass(zone, parseInt(message, 10));
                            break;
                        case 'balance':
                            await this.Lync.Zone_Balance(zone, parseInt(message, 10));
                            break;
                    }
                }
            }
        }
        catch (error) {
            console.error(`Error handling message for topic ${topic}:`, error);
        }
    }
    lync_socket_connected() {
        this.client.publish('lync/connected/lync', '1');
    }
    lync_socket_error(error) {
        console.error(error);
    }
    lync_zone_update(info) {
        const options = { retain: true };
        this.client.publish(`lync/zones/${info.number}/number`, `${info.number}`, options);
        this.client.publish(`lync/zones/${info.number}/name`, info.name, options);
        this.client.publish(`lync/zones/${info.number}/power`, info.power ? '1' : '0', options);
        this.client.publish(`lync/zones/${info.number}/mute`, info.mute ? '1' : '0', options);
        this.client.publish(`lync/zones/${info.number}/dnd`, info.dnd ? '1' : '0', options);
        this.client.publish(`lync/zones/${info.number}/source`, `${info.source}`, options);
        this.client.publish(`lync/zones/${info.number}/volume`, `${info.volume}`, options);
        this.client.publish(`lync/zones/${info.number}/treble`, `${info.treble}`, options);
        this.client.publish(`lync/zones/${info.number}/bass`, `${info.bass}`, options);
        this.client.publish(`lync/zones/${info.number}/balance`, `${info.balance}`, options);
        info.sources.forEach(((source, index) => {
            this.client.publish(`lync/zones/${info.number}/sources/${index}`, source);
        }));
    }
    lync_mp3_update(mp3) {
        const options = { retain: true };
        this.client.publish(`lync/mp3/repeat`, mp3.repeat ? '1' : '0', options);
        this.client.publish(`lync/mp3/artist`, mp3.artist, options);
        this.client.publish(`lync/mp3/file`, mp3.file, options);
    }
    // Method to close the MQTT connection
    async close() {
        return new Promise((resolve) => {
            if (this.connected) {
                this.client.end(false, {}, () => {
                    console.log('MQTT client closed gracefully');
                    resolve();
                });
            }
            else {
                resolve();
            }
        });
    }
    isConnected() {
        return this.connected;
    }
}
