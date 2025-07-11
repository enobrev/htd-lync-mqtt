import Connector from "htd-lync/dist/Connector";
import Protocol, {MP3, PartySource, Source, Zone} from "htd-lync/dist/Protocol";
import type {
    Response_Id,
    Response_MP3_Artist,
    Response_MP3_File,
    Response_MP3_Repeat,
    Response_Source_Name,
    Response_Status,
    Response_Zone_Name,
    Response_System
} from "htd-lync";
import TypedEventEmitter from "./TypedEventEmitter";


export interface StatusZone {
    number: number
    name: string
    power: boolean;
    mute: boolean;
    dnd: boolean;
    source: number
    volume: number
    treble: number
    bass: number
    balance: number
    sources: Map<number, string>
}

export interface StatusMP3 {
    repeat: boolean
    file: string
    artist: string
}

export type EventTypes = {
    'socket:connected': [],
    'socket:error':     [Error],
    'zone:update':      [StatusZone],
    'source:update':    [number, string],
    'mp3:update':       [StatusMP3],
    'status:update':    []
}

type Status = {
    id: string
    all_on:      boolean
    all_off:     boolean
    party_mode:  boolean
    mp3:         StatusMP3
    sources:     Map<number, string>
    zones:       Map<number, StatusZone>
}

export default class Lync {
    private LC: Connector;
    public Status: Status;
    events: TypedEventEmitter<EventTypes>;

    public static CreateLync = async(host: string, port: number): Promise<Lync> => {
        const lync = new Lync(host, port);
        await lync.init();

        return lync;
    }

    private constructor(host: string, port: number) {
        this.events = new TypedEventEmitter<EventTypes>();
        this.LC     = new Connector(host, port);

        const zones = new Map<Zone, StatusZone>();
        zones.set(Zone._01, {number: 1,  name: "Zone 1",  power: false, mute: false, dnd: false, source: 1, volume: 0, treble: 0, bass: 0, balance: 0, sources: new Map()});
        zones.set(Zone._02, {number: 2,  name: "Zone 2",  power: false, mute: false, dnd: false, source: 1, volume: 0, treble: 0, bass: 0, balance: 0, sources: new Map()});
        zones.set(Zone._03, {number: 3,  name: "Zone 3",  power: false, mute: false, dnd: false, source: 1, volume: 0, treble: 0, bass: 0, balance: 0, sources: new Map()});
        zones.set(Zone._04, {number: 4,  name: "Zone 4",  power: false, mute: false, dnd: false, source: 1, volume: 0, treble: 0, bass: 0, balance: 0, sources: new Map()});
        zones.set(Zone._05, {number: 5,  name: "Zone 5",  power: false, mute: false, dnd: false, source: 1, volume: 0, treble: 0, bass: 0, balance: 0, sources: new Map()});
        zones.set(Zone._06, {number: 6,  name: "Zone 6",  power: false, mute: false, dnd: false, source: 1, volume: 0, treble: 0, bass: 0, balance: 0, sources: new Map()});
        zones.set(Zone._07, {number: 7,  name: "Zone 7",  power: false, mute: false, dnd: false, source: 1, volume: 0, treble: 0, bass: 0, balance: 0, sources: new Map()});
        zones.set(Zone._08, {number: 8,  name: "Zone 8",  power: false, mute: false, dnd: false, source: 1, volume: 0, treble: 0, bass: 0, balance: 0, sources: new Map()});
        zones.set(Zone._09, {number: 9,  name: "Zone 9",  power: false, mute: false, dnd: false, source: 1, volume: 0, treble: 0, bass: 0, balance: 0, sources: new Map()});
        zones.set(Zone._10, {number: 10, name: "Zone 10", power: false, mute: false, dnd: false, source: 1, volume: 0, treble: 0, bass: 0, balance: 0, sources: new Map()});
        zones.set(Zone._11, {number: 11, name: "Zone 11", power: false, mute: false, dnd: false, source: 1, volume: 0, treble: 0, bass: 0, balance: 0, sources: new Map()});
        zones.set(Zone._12, {number: 12, name: "Zone 12", power: false, mute: false, dnd: false, source: 1, volume: 0, treble: 0, bass: 0, balance: 0, sources: new Map()});

        this.Status = {
            id: '',
            sources: new Map<number, string>,
            zones,
            all_on: false,
            all_off: false,
            party_mode: false,
            mp3: {
                repeat: false,
                file: '',
                artist: ''
            }
        }
    }

    private async init() {
        this.LC.events.on('socket:connected', () => {
            this.events.emit('socket:connected');
        });

        this.LC.events.on('socket:error', (error) => {
            this.events.emit('socket:error', error);
        });

        this.LC.events.on('system', (response: Response_System) => {
            this.Status.all_on     = response.system.all_on;
            this.Status.all_off    = response.system.all_off;
            this.Status.party_mode = response.system.party_mode;
        });

        this.LC.events.on('status', (response: Response_Status) => {
            const zone = this.Status.zones.get(response.zone.number);
            if (zone) {
                const update: StatusZone = {
                    ...zone,
                    ...response.zone,

                };

                this.Status.zones.set(response.zone.number, update);
                this.events.emit('zone:update', <StatusZone> this.Status.zones.get(response.zone.number));
            }
        });

        this.LC.events.on('id', (response: Response_Id) => {
            this.Status.id = response.id;
        });

        this.LC.events.on('source_name', (response: Response_Source_Name) => {
            if (response.source.zone === 1) {
                this.Status.sources.set(response.source.number, response.source.name);
                this.events.emit('source:update', response.source.number, response.source.name);
            }

            this.Status.zones.get(response.source.zone)?.sources.set(response.source.number, response.source.name);
            this.events.emit('zone:update', <StatusZone> this.Status.zones.get(response.source.zone));
        });

        this.LC.events.on('zone_name', (response: Response_Zone_Name) => {
            const zone = this.Status.zones.get(response.zone.number);
            if (zone) {
                const update: StatusZone = {
                    ...zone,
                    ...response.zone
                };

                this.Status.zones.set(response.zone.number, update);
                this.events.emit('zone:update', <StatusZone> this.Status.zones.get(response.zone.number));
            }
        });

        this.LC.events.on('mp3:repeat', (response: Response_MP3_Repeat) => {
            this.Status.mp3.repeat = response.mp3.repeat;
            this.events.emit('mp3:update', this.Status.mp3);
        });

        this.LC.events.on('mp3:artist', (response: Response_MP3_Artist) => {
            this.Status.mp3.artist = response.mp3.artist;
            this.events.emit('mp3:update', this.Status.mp3);
        });

        this.LC.events.on('mp3:file', (response: Response_MP3_File) => {
            this.Status.mp3.file = response.mp3.file;
            this.events.emit('mp3:update', this.Status.mp3);
        });
    }

    public async Ready() {
        await this.LC.send_command(Protocol.set_echo_mode(true));
        await this.LC.send_command(Protocol.get_status_all());
    }

    public MP3_Stop() {
        this.LC.send_command(Protocol.mp3(MP3.Stop));
    }

    public MP3_Play() {
        this.LC.send_command(Protocol.mp3(MP3.Play));
    }

    public MP3_Forward() {
        this.LC.send_command(Protocol.mp3(MP3.FF));
    }

    public MP3_Back() {
        this.LC.send_command(Protocol.mp3(MP3.Back));
    }

    public Party_Mode(source: PartySource) {
        this.LC.send_command(Protocol.set_party_mode_number(source));
    }

    public Zone_Power(zone: Zone, on: boolean) {
        this.LC.send_command(Protocol.set_zone_power(zone, on));
    }

    public Zone_DND(zone: Zone, on: boolean) {
        this.LC.send_command(Protocol.set_dnd(zone, on));
        this.Zone_Source(zone, this.Status.zones.get(zone)!.source); // Settings require re-setting source to take
    }

    public Zone_Name(zone: Zone, name: string) {
        this.LC.send_command(Protocol.set_zone_name(zone, name));
        this.Zone_Source(zone, this.Status.zones.get(zone)!.source); // Settings require re-setting source to take
    }

    public Zone_Source(zone: Zone, source: Source) {
        this.LC.send_command(Protocol.set_source_number(zone, source));
    }

    public Zone_Volume(zone: Zone, volume: number) {
        this.LC.send_command(Protocol.set_volume(zone, volume));
        console.log('Zone_Volume', zone, this.Status.zones.get(zone)!.source);
        this.Zone_Source(zone, this.Status.zones.get(zone)!.source); // Settings require re-setting source to take
    }

    public Zone_Mute(zone: Zone, on: boolean) {
        this.LC.send_command(Protocol.set_mute(zone, on));
        this.Zone_Source(zone, this.Status.zones.get(zone)!.source); // Settings require re-setting source to take
    }

    public Zone_Bass(zone: Zone, bass: number) {
        this.LC.send_command(Protocol.set_bass(zone, bass));
        this.Zone_Source(zone, this.Status.zones.get(zone)!.source); // Settings require re-setting source to take
    }

    public Zone_Treble(zone: Zone, treble: number) {
        this.LC.send_command(Protocol.set_treble(zone, treble));
        this.Zone_Source(zone, this.Status.zones.get(zone)!.source); // Settings require re-setting source to take
    }

    public Zone_Balance(zone: Zone, balance: number) {
        this.LC.send_command(Protocol.set_balance(zone, balance));
        this.Zone_Source(zone, this.Status.zones.get(zone)!.source); // Settings require re-setting source to take
    }

    public Zone_Source_Name(zone: Zone, source: Source, name: string) {
        this.LC.send_command(Protocol.set_zone_source_name(zone, source, name));
    }
}

// const LC = new Connector('10.0.0.25', 10006);