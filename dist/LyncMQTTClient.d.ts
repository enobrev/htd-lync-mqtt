export default class LyncMQTTClient {
    private client;
    private Lync;
    private connected;
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
}
//# sourceMappingURL=LyncMQTTClient.d.ts.map