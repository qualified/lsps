import type {
  DataCallback,
  Disposable,
  Message,
  MessageReader,
  PartialMessageInfo,
} from "vscode-jsonrpc";
import { Emitter } from "vscode-jsonrpc";

export const createMessageReader = (worker: Worker): MessageReader => {
  const messageEmitter = new Emitter<Message>();
  const errorEmitter = new Emitter<Error>();
  // These are not used, but required by the interface.
  const closeEmitter = new Emitter<void>();
  const partialMessageEmitter = new Emitter<PartialMessageInfo>();

  const messageHandler = (event: MessageEvent) => {
    messageEmitter.fire(event.data);
  };
  const errorHandler = (error: any) => {
    errorEmitter.fire(error);
  };
  worker.addEventListener("message", messageHandler);
  worker.addEventListener("error", errorHandler);
  worker.addEventListener("messageerror", errorHandler);

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
      return messageEmitter.event(callback);
    },

    dispose() {
      worker.removeEventListener("message", messageHandler);
      worker.removeEventListener("error", errorHandler);
      worker.removeEventListener("messageerror", errorHandler);
      messageEmitter.dispose();
      errorEmitter.dispose();
      closeEmitter.dispose();
      partialMessageEmitter.dispose();
    },
  };
};
