import type { Message, MessageWriter } from "vscode-jsonrpc";
import { Emitter } from "vscode-jsonrpc";

export const createMessageWriter = (worker: Worker): MessageWriter => {
  const errorEmitter = new Emitter<
    [Error, Message | undefined, number | undefined]
  >();
  const closeEmitter = new Emitter<void>();
  let errorCount = 0;
  const errorHandler = (error: any) => {
    errorEmitter.fire([toError(error), undefined, ++errorCount]);
  };
  worker.addEventListener("error", errorHandler);
  return {
    get onError() {
      return errorEmitter.event;
    },

    get onClose() {
      return closeEmitter.event;
    },

    async write(msg: Message) {
      try {
        worker.postMessage(msg);
      } catch (e) {
        errorEmitter.fire([toError(e), msg, ++errorCount]);
      }
    },

    dispose() {
      worker.removeEventListener("error", errorHandler);
      errorEmitter.dispose();
      closeEmitter.dispose();
    },
  };
};

const toError = (err: any): Error =>
  err instanceof Error ? err : new Error(err?.message || "Unknown error");
