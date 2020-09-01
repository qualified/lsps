import type { Logger, MessageConnection } from "vscode-jsonrpc";
import { createMessageConnection as createMessageConnectionRW } from "vscode-jsonrpc";

import { createMessageReader } from "./reader";
import { createMessageWriter } from "./writer";

/**
 * Create VSCode JSON RPC `MessageConnection` with Web Worker.
 * @param worker
 * @param logger
 */
export const createMessageConnection = (
  worker: Worker,
  logger: Logger = createConsoleLogger()
): Promise<MessageConnection> => {
  const conn = createMessageConnectionRW(
    createMessageReader(worker),
    createMessageWriter(worker),
    logger
  );
  conn.onClose(() => conn.dispose());
  // Return MessageConnection wrapped in Promise to match the Web Socket version.
  return Promise.resolve(conn);
};

const createConsoleLogger = (): Logger => ({
  error: (message: string) => console.error(message),
  warn: (message: string) => console.warn(message),
  info: (message: string) => console.info(message),
  log: (message: string) => console.log(message),
});
