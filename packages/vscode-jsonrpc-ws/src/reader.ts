import type {
  DataCallback,
  Disposable,
  Message,
  MessageReader,
  PartialMessageInfo,
} from "vscode-jsonrpc";
import { Emitter } from "vscode-jsonrpc";

export const createMessageReader = (wsocket: WebSocket): MessageReader => {
  let state: "initial" | "listening" | "closed" = "initial";
  const buffer: { message?: any; error?: any }[] = [];
  const errorEmitter = new Emitter<Error>();
  const closeEmitter = new Emitter<void>();
  // This is not used, but required by the interface.
  const partialMessageEmitter = new Emitter<PartialMessageInfo>();
  const messageEmitter = new Emitter<Message>();

  const readMessage = (message: any) => {
    if (state === "initial") {
      buffer.push({ message });
    } else if (state === "listening") {
      messageEmitter.fire(JSON.parse(message));
    }
  };

  const fireError = (error: Error) => {
    if (state === "initial") {
      buffer.push({ error });
    } else if (state === "listening") {
      errorEmitter.fire(error);
    }
  };

  const fireClose = () => {
    if (state === "listening") closeEmitter.fire();
    state = "closed";
  };

  const messageHandler = (event: MessageEvent) => readMessage(event.data);
  const closeHandler = (event: CloseEvent) => {
    // Note that error code is almost always generic 1006 (closed abnormally)
    if (event.code !== 1000) {
      fireError(new Error(`WebSocket Error (${event.code}): ${event.reason}`));
    }
    fireClose();
  };
  wsocket.addEventListener("message", messageHandler);
  // Note that we're not adding "errror" event handler because WebSocket doesn't pass
  // anything useful there. "close" event may receive error details.
  wsocket.addEventListener("close", closeHandler);

  return {
    get onError() {
      return errorEmitter.event;
    },

    get onClose() {
      return closeEmitter.event;
    },

    get onPartialMessage() {
      return partialMessageEmitter.event;
    },

    listen(callback: DataCallback): Disposable {
      if (state !== "initial") throw new Error(`Already listening`);

      const res = messageEmitter.event(callback);
      state = "listening";
      if (buffer.length === 0) return res;

      for (const event of buffer) {
        if (event.message) {
          readMessage(event.message);
        } else if (event.error) {
          fireError(event.error);
        }
      }
      buffer.length = 0;

      return res;
    },

    dispose() {
      wsocket.removeEventListener("message", messageHandler);
      wsocket.removeEventListener("close", closeHandler);
      errorEmitter.dispose();
      closeEmitter.dispose();
      partialMessageEmitter.dispose();
      buffer.length = 0;
    },
  };
};
