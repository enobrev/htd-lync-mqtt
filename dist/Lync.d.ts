import { PartySource, Source, Zone } from "htd-lync/dist/Protocol.js";
import TypedEventEmitter from "./TypedEventEmitter.js";
export interface StatusZone {
    number: number;
    name: string;
    power: boolean;
    mute: boolean;
    dnd: boolean;
    source: number;
    volume: number;
    treble: number;
    bass: number;
    balance: number;
    sources: Map<number, string>;
}
export interface StatusMP3 {
    repeat: boolean;
    file: string;
    artist: string;
}
export type EventTypes = {
    'socket:connected': [];
    'socket:error': [Error];
    'zone:update': [StatusZone];
    'source:update': [number, string];
    'mp3:update': [StatusMP3];
    'status:update': [];
};
type Status = {
    id: string;
    all_on: boolean;
    all_off: boolean;
    party_mode: boolean;
    mp3: StatusMP3;
    sources: Map<number, string>;
    zones: Map<number, StatusZone>;
};
export default class Lync {
    private LC;
    Status: Status;
    events: TypedEventEmitter<EventTypes>;
    static CreateLync: (host: string, port: number) => Promise<Lync>;
    private constructor();
    private initializeZones;
    private init;
    Ready(): Promise<void>;
    MP3_Stop(): void;
    MP3_Play(): void;
    MP3_Forward(): void;
    MP3_Back(): void;
    Party_Mode(source: PartySource): void;
    Zone_Power(zone: Zone, on: boolean): Promise<void>;
    Zone_DND(zone: Zone, on: boolean): Promise<void>;
    Zone_Name(zone: Zone, name: string): Promise<void>;
    Zone_Source(zone: Zone, source: Source): Promise<void>;
    Zone_Volume(zone: Zone, volume: number): Promise<void>;
    Zone_Mute(zone: Zone, on: boolean): Promise<void>;
    Zone_Bass(zone: Zone, bass: number): Promise<void>;
    Zone_Treble(zone: Zone, treble: number): Promise<void>;
    Zone_Balance(zone: Zone, balance: number): Promise<void>;
    Zone_Source_Name(zone: Zone, source: Source, name: string): Promise<void>;
}
export {};
//# sourceMappingURL=Lync.d.ts.map