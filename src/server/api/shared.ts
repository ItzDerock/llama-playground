import EventEmitter from "events";

// this is a set of client IDs that are currently generating text
export const generating = new Set<string>();
export const clients = new Set<string>();

// EventEmitter but with types
export class TypedEventEmitter<
  TEvents extends Record<string, any>
> extends EventEmitter {
  emit<TEventName extends keyof TEvents & string>(
    eventName: TEventName,
    ...eventArg: TEvents[TEventName]
  ) {
    return super.emit(eventName, ...(eventArg as []));
  }

  on<TEventName extends keyof TEvents & string>(
    eventName: TEventName,
    handler: (...eventArg: TEvents[TEventName]) => void
  ) {
    return super.on(eventName, handler as any);
  }

  off<TEventName extends keyof TEvents & string>(
    eventName: TEventName,
    handler: (...eventArg: TEvents[TEventName]) => void
  ) {
    return super.off(eventName, handler as any);
  }

  incrementMaxListeners(amount = 1) {
    return this.setMaxListeners(this.getMaxListeners() + amount);
  }

  decrementMaxListeners(amount = 1) {
    return this.setMaxListeners(this.getMaxListeners() - amount);
  }
}

// the events that can be emitted
type Events = {
  // client id, message
  generate: [string, string];

  // client id
  "generate:done": [string];

  // client id, error
  "generate:error": [string, Error];

  // client id
  "generate:cancel": [string];
};

// global event emitter
// can be replaced with a pubsub system if you want to scale
export const events = new TypedEventEmitter<Events>();
