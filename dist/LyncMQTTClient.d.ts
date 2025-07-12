export default class LyncMQTTClient {
    private client;
    private Lync;
    private connected;
    private haDiscoveryEnabled;
    private haDiscoveryPrefix;
    static CreateClient(mqtt_broker_url: string, lync_host: string, lync_port: number): Promise<LyncMQTTClient>;
    private constructor();
    private subscribeTopics;
    private handleMessage;
    private lync_socket_connected;
    private lync_socket_error;
    private lync_zone_update;
    private lync_mp3_update;
    close(): Promise<void>;
    isConnected(): boolean;
    setHomeAssistantDiscovery(enabled: boolean, prefix?: string): void;
    private handleSourceNameCommand;
    private updateSourceSelectOptions;
    private publishHomeAssistantDiscovery;
    private publishZoneDiscovery;
    private publishMP3Discovery;
}
//# sourceMappingURL=LyncMQTTClient.d.ts.map