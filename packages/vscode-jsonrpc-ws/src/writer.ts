import type { Message, MessageWriter } from "vscode-jsonrpc";
import { Emitter } from "vscode-jsonrpc";

export const createMessageWriter = (wsocket: WebSocket): MessageWriter => {
  const errorEmitter = new Emitter<[Error, Message, number]>();
  const closeEmitter = new Emitter<void>();
  const closeHandler = () => {
    closeEmitter.fire();
  };
  wsocket.addEventListener("close", closeHandler);

  let errorCount = 0;
  return {
    get onError() {
      return errorEmitter.event;
    },

    get onClose() {
      return closeEmitter.event;
    },

    async write(msg: Message) {
      try {
        // Can throw InvalidStateError if this was called when readyState is CONNECTING.
        wsocket.send(JSON.stringify(msg));
      } catch (e) {
        errorEmitter.fire([toError(e), msg, ++errorCount]);
      }
    },

    dispose() {
      errorEmitter.dispose();
      closeEmitter.dispose();
      wsocket.removeEventListener("close", closeHandler);
    },
  };
};

const toError = (err: any): Error =>
  err instanceof Error ? err : new Error(err?.message || "Unknown error");
