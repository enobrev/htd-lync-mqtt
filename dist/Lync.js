import Connector from "htd-lync/dist/Connector.js";
import Protocol, { MP3, Zone } from "htd-lync/dist/Protocol.js";
import TypedEventEmitter from "./TypedEventEmitter.js";
export default class Lync {
    LC;
    Status;
    events;
    static CreateLync = async (host, port) => {
        const lync = new Lync(host, port);
        await lync.init();
        return lync;
    };
    constructor(host, port) {
        this.events = new TypedEventEmitter();
        this.LC = new Connector(host, port);
        const zones = this.initializeZones();
        this.Status = {
            id: '',
            sources: new Map,
            zones,
            all_on: false,
            all_off: false,
            party_mode: false,
            mp3: {
                repeat: false,
                file: '',
                artist: ''
            }
        };
    }
    initializeZones() {
        const zones = new Map();
        const zoneValues = [Zone._01, Zone._02, Zone._03, Zone._04, Zone._05, Zone._06, Zone._07, Zone._08, Zone._09, Zone._10, Zone._11, Zone._12];
        zoneValues.forEach((zoneEnum, index) => {
            zones.set(zoneEnum, {
                number: index + 1,
                name: `Zone ${index + 1}`,
                power: false,
                mute: false,
                dnd: false,
                source: 1,
                volume: 0,
                treble: 0,
                bass: 0,
                balance: 0,
                sources: new Map()
            });
        });
        return zones;
    }
    async init() {
        this.LC.events.on('socket:connected', () => {
            this.events.emit('socket:connected');
        });
        this.LC.events.on('socket:error', (error) => {
            this.events.emit('socket:error', error);
        });
        this.LC.events.on('system', (response) => {
            this.Status.all_on = response.system.all_on;
            this.Status.all_off = response.system.all_off;
            this.Status.party_mode = response.system.party_mode;
        });
        this.LC.events.on('status', (response) => {
            const zone = this.Status.zones.get(response.zone.number);
            if (zone) {
                const update = {
                    ...zone,
                    ...response.zone,
                };
                this.Status.zones.set(response.zone.number, update);
                this.events.emit('zone:update', this.Status.zones.get(response.zone.number));
            }
        });
        this.LC.events.on('id', (response) => {
            this.Status.id = response.id;
        });
        this.LC.events.on('source_name', (response) => {
            if (response.source.zone === 1) {
                this.Status.sources.set(response.source.number, response.source.name);
                this.events.emit('source:update', response.source.number, response.source.name);
            }
            this.Status.zones.get(response.source.zone)?.sources.set(response.source.number, response.source.name);
            this.events.emit('zone:update', this.Status.zones.get(response.source.zone));
        });
        this.LC.events.on('zone_name', (response) => {
            const zone = this.Status.zones.get(response.zone.number);
            if (zone) {
                const update = {
                    ...zone,
                    ...response.zone
                };
                this.Status.zones.set(response.zone.number, update);
                this.events.emit('zone:update', this.Status.zones.get(response.zone.number));
            }
        });
        this.LC.events.on('mp3:repeat', (response) => {
            this.Status.mp3.repeat = response.mp3.repeat;
            this.events.emit('mp3:update', this.Status.mp3);
        });
        this.LC.events.on('mp3:artist', (response) => {
            this.Status.mp3.artist = response.mp3.artist;
            this.events.emit('mp3:update', this.Status.mp3);
        });
        this.LC.events.on('mp3:file', (response) => {
            this.Status.mp3.file = response.mp3.file;
            this.events.emit('mp3:update', this.Status.mp3);
        });
    }
    async Ready() {
        await this.LC.send_command(Protocol.set_echo_mode(true));
        await this.LC.send_command(Protocol.get_status_all());
    }
    MP3_Stop() {
        this.LC.send_command(Protocol.mp3(MP3.Stop));
    }
    MP3_Play() {
        this.LC.send_command(Protocol.mp3(MP3.Play));
    }
    MP3_Forward() {
        this.LC.send_command(Protocol.mp3(MP3.FF));
    }
    MP3_Back() {
        this.LC.send_command(Protocol.mp3(MP3.Back));
    }
    Party_Mode(source) {
        this.LC.send_command(Protocol.set_party_mode_number(source));
    }
    async Zone_Power(zone, on) {
        try {
            await this.LC.send_command(Protocol.set_zone_power(zone, on));
        }
        catch (error) {
            console.error(`Failed to set zone ${zone} power:`, error);
            throw error;
        }
    }
    async Zone_DND(zone, on) {
        try {
            await this.LC.send_command(Protocol.set_dnd(zone, on));
            await this.Zone_Source(zone, this.Status.zones.get(zone).source); // Settings require re-setting source to take
        }
        catch (error) {
            console.error(`Failed to set zone ${zone} DND:`, error);
            throw error;
        }
    }
    async Zone_Name(zone, name) {
        try {
            await this.LC.send_command(Protocol.set_zone_name(zone, name));
            await this.Zone_Source(zone, this.Status.zones.get(zone).source); // Settings require re-setting source to take
        }
        catch (error) {
            console.error(`Failed to set zone ${zone} name:`, error);
            throw error;
        }
    }
    async Zone_Source(zone, source) {
        try {
            await this.LC.send_command(Protocol.set_source_number(zone, source));
        }
        catch (error) {
            console.error(`Failed to set zone ${zone} source:`, error);
            throw error;
        }
    }
    async Zone_Volume(zone, volume) {
        try {
            await this.LC.send_command(Protocol.set_volume(zone, volume));
            await this.Zone_Source(zone, this.Status.zones.get(zone).source); // Settings require re-setting source to take
        }
        catch (error) {
            console.error(`Failed to set zone ${zone} volume:`, error);
            throw error;
        }
    }
    async Zone_Mute(zone, on) {
        try {
            await this.LC.send_command(Protocol.set_mute(zone, on));
            await this.Zone_Source(zone, this.Status.zones.get(zone).source); // Settings require re-setting source to take
        }
        catch (error) {
            console.error(`Failed to set zone ${zone} mute:`, error);
            throw error;
        }
    }
    async Zone_Bass(zone, bass) {
        try {
            await this.LC.send_command(Protocol.set_bass(zone, bass));
            await this.Zone_Source(zone, this.Status.zones.get(zone).source); // Settings require re-setting source to take
        }
        catch (error) {
            console.error(`Failed to set zone ${zone} bass:`, error);
            throw error;
        }
    }
    async Zone_Treble(zone, treble) {
        try {
            await this.LC.send_command(Protocol.set_treble(zone, treble));
            await this.Zone_Source(zone, this.Status.zones.get(zone).source); // Settings require re-setting source to take
        }
        catch (error) {
            console.error(`Failed to set zone ${zone} treble:`, error);
            throw error;
        }
    }
    async Zone_Balance(zone, balance) {
        try {
            await this.LC.send_command(Protocol.set_balance(zone, balance));
            await this.Zone_Source(zone, this.Status.zones.get(zone).source); // Settings require re-setting source to take
        }
        catch (error) {
            console.error(`Failed to set zone ${zone} balance:`, error);
            throw error;
        }
    }
    async Zone_Source_Name(zone, source, name) {
        try {
            await this.LC.send_command(Protocol.set_zone_source_name(zone, source, name));
        }
        catch (error) {
            console.error(`Failed to set zone ${zone} source name:`, error);
            throw error;
        }
    }
}
