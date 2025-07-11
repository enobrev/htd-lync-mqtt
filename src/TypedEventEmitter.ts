// https://blog.makerx.com.au/a-type-safe-event-emitter-in-node-js/
import {EventEmitter} from "events";

export default class TypedEventEmitter<TEvents extends Record<string, any>> {
    private emitter = new EventEmitter()

    emit<TEventName extends keyof TEvents & string>(
        eventName: TEventName,
        ...eventArg: TEvents[TEventName]
    ) {
        this.emitter.emit(eventName, ...(eventArg as []))
    }

    on<TEventName extends keyof TEvents & string>(
        eventName: TEventName,
        handler: (...eventArg: TEvents[TEventName]) => void
    ) {
        this.emitter.on(eventName, handler as any)
    }

    off<TEventName extends keyof TEvents & string>(
        eventName: TEventName,
        handler: (...eventArg: TEvents[TEventName]) => void
    ) {
        this.emitter.off(eventName, handler as any)
    }

    once<TEventName extends keyof TEvents & string>(
        eventName: TEventName,
        handler: (...eventArg: TEvents[TEventName]) => void
    ) {
        this.emitter.once(eventName, handler as any)
    }

    removeAllListeners<TEventName extends keyof TEvents & string>(
        eventName?: TEventName
    ) {
        if (eventName) {
            this.emitter.removeAllListeners(eventName)
        } else {
            this.emitter.removeAllListeners()
        }
    }

    listenerCount<TEventName extends keyof TEvents & string>(
        eventName: TEventName
    ): number {
        return this.emitter.listenerCount(eventName)
    }

    eventNames(): (keyof TEvents)[] {
        return this.emitter.eventNames() as (keyof TEvents)[]
    }
}