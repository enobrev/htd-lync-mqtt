export default class TypedEventEmitter<TEvents extends Record<string, any>> {
    private emitter;
    emit<TEventName extends keyof TEvents & string>(eventName: TEventName, ...eventArg: TEvents[TEventName]): void;
    on<TEventName extends keyof TEvents & string>(eventName: TEventName, handler: (...eventArg: TEvents[TEventName]) => void): void;
    off<TEventName extends keyof TEvents & string>(eventName: TEventName, handler: (...eventArg: TEvents[TEventName]) => void): void;
    once<TEventName extends keyof TEvents & string>(eventName: TEventName, handler: (...eventArg: TEvents[TEventName]) => void): void;
    removeAllListeners<TEventName extends keyof TEvents & string>(eventName?: TEventName): void;
    listenerCount<TEventName extends keyof TEvents & string>(eventName: TEventName): number;
    eventNames(): (keyof TEvents)[];
}
//# sourceMappingURL=TypedEventEmitter.d.ts.map