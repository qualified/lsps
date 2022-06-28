// Derived from [dphilipson/sturdy-websocket](https://github.com/dphilipson/sturdy-websocket).
// MIT license is included at the bottom of this file.
// Changed to prevent buffered messages while disconnected from sent on reconnection.
export interface Options {
  /**
   * If a newly opened WebSocket closes immediately, it is considered to be a
   * failed connection for the purposes of increasing time between attempts and
   * counting towards `maxReconnectAttempts`.
   * This option controls how long a connection must remain open to be considered
   * "successful" and reset these values.
   * Default: 5000
   */
  allClearResetTime?: number;
  /**
   * When attempting to open a new connection, how long to wait before giving up and
   * making a new connection. Note that it is possible for an attempt to open a WebSocket
   * to stall forever, which is why this option is needed.
   * Default: 5000
   */
  connectTimeout?: number;
  /**
   * If true, print various debug information to console.log, such as notifying
   * about reconnect attempts.
   * Default: false
   */
  debug?: boolean;
  /**
   * The minimum positive time between failed reconnect attempts.
   * Note that the first reconnect attempt happens immediately on the first failure,
   * so this is actually the delay between the first and second reconnect attempts.
   * Default: 1000
   */
  minReconnectDelay?: number;
  /**
   * The maximum time between failed reconnect attempts.
   * Additional attempts will repeatedly use this as their delay.
   * Default: 30000
   */
  maxReconnectDelay?: number;
  /**
   * If reconnects fail this many times in a row, then the SturdyWebSocket closes permanently,
   * providing the CloseEvent from the last failed reconnect attempt.
   * Default: Infinity
   */
  maxReconnectAttempts?: number;
  /**
   * The factor by which the time between reconnect attempts increases after each failure.
   * Default: 1.5
   */
  reconnectBackoffFactor?: number;
}

interface SturdyWebSocketEventMap extends WebSocketEventMap {
  down: CloseEvent;
  reopen: Event;
}

type WebSocketListener<K extends keyof SturdyWebSocketEventMap> = (
  this: WebSocket,
  event: SturdyWebSocketEventMap[K]
) => any;

type WebSocketListeners = {
  [K in keyof SturdyWebSocketEventMap]?: Array<WebSocketListener<K>>;
} & {
  [key: string]: EventListenerOrEventListenerObject[];
};

export const DEFAULT_OPTIONS: Required<Options> = Object.freeze({
  allClearResetTime: 5000,
  connectTimeout: 5000,
  debug: false,
  minReconnectDelay: 1000,
  maxReconnectDelay: 30000,
  maxReconnectAttempts: Number.POSITIVE_INFINITY,
  reconnectBackoffFactor: 1.5,
});

const CONNECTING = 0;
const OPEN = 1;
const CLOSING = 2;
const CLOSED = 3;

export default class SturdyWebSocket implements WebSocket {
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onopen: ((event: Event) => void) | null = null;
  /**
   * Called when the backing WebSocket is closed but `SturdyWebSocket` will try to reconnect.
   * Recieves the `CloseEvent` of the backing WebSocket.
   * If this was triggered by a call to `reconnect()`, then the event will be `undefined`.
   */
  ondown: ((event: CloseEvent | undefined) => void) | null = null;
  /**
   * Called when the backing WebSocket is reopened after it closed.
   */
  onreopen: ((event: Event) => void) | null = null;
  readonly CONNECTING = CONNECTING;
  readonly OPEN = OPEN;
  readonly CLOSING = CLOSING;
  readonly CLOSED = CLOSED;

  private readonly protocols?: string | string[];
  private readonly options: Required<Options>;
  readonly url: string;
  private ws?: WebSocket;
  private hasBeenOpened = false;
  private isClosed = false;
  private messageBuffer: any[] = [];
  private nextRetryTime: number = 0;
  private reconnectCount = 0;
  private allClearTimeoutId?: any;
  private connectTimeoutId?: any;
  private binaryTypeInternal?: BinaryType;
  private lastKnownExtensions = "";
  private lastKnownProtocol = "";
  private readonly listeners: WebSocketListeners = {};

  constructor(url: string, options?: Options);
  constructor(
    url: string,
    protocols: string | string[] | undefined,
    options?: Options
  );
  constructor(
    url: string,
    protocolsOrOptions?: string | string[] | Options,
    options: Options = {}
  ) {
    this.url = url;
    if (
      protocolsOrOptions == null ||
      typeof protocolsOrOptions === "string" ||
      Array.isArray(protocolsOrOptions)
    ) {
      this.protocols = protocolsOrOptions;
    } else {
      options = protocolsOrOptions;
    }
    this.options = Object.assign({}, DEFAULT_OPTIONS, options);
    this.openNewWebSocket();
  }

  get binaryType(): BinaryType {
    return this.binaryTypeInternal || "blob";
  }

  set binaryType(binaryType: BinaryType) {
    this.binaryTypeInternal = binaryType;
    if (this.ws) {
      this.ws.binaryType = binaryType;
    }
  }

  get bufferedAmount(): number {
    let sum = this.ws ? this.ws.bufferedAmount : 0;
    let hasUnknownAmount = false;
    this.messageBuffer.forEach((data) => {
      const byteLength = getDataByteLength(data);
      if (byteLength != null) {
        sum += byteLength;
      } else {
        hasUnknownAmount = true;
      }
    });
    if (hasUnknownAmount) {
      this.debugLog(
        "Some buffered data had unknown length. bufferedAmount()" +
          " return value may be below the correct amount."
      );
    }
    return sum;
  }

  get extensions(): string {
    return this.ws ? this.ws.extensions : this.lastKnownExtensions;
  }

  get protocol(): string {
    return this.ws ? this.ws.protocol : this.lastKnownProtocol;
  }

  get readyState(): number {
    return this.isClosed ? CLOSED : OPEN;
  }

  close(code?: number, reason?: string): void {
    this.disposeSocket(code, reason);
    this.shutdown();
    this.debugLog("WebSocket permanently closed by client.");
  }

  send(data: any): void {
    if (this.ws && this.ws.readyState === this.OPEN) {
      this.ws.send(data);
    } else {
      this.messageBuffer.push(data);
    }
  }

  /**
   * Closes the backing websocket and opens a new one.
   * This will immediately call the `down` handler with no event,
   * followed by the `reopen` handler once the connection is reestablished.
   */
  reconnect(): void {
    if (this.isClosed) {
      throw new Error(
        "Cannot call reconnect() on socket which is permanently closed."
      );
    }
    this.disposeSocket(1000, "Client requested reconnect.");
    this.handleClose(undefined);
  }

  addEventListener<K extends keyof SturdyWebSocketEventMap>(
    type: K,
    listener: (this: WebSocket, event: SturdyWebSocketEventMap[K]) => void
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject
  ): void {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(listener);
  }

  dispatchEvent(event: Event): boolean {
    return this.dispatchEventOfType(event.type, event);
  }

  removeEventListener<K extends keyof SturdyWebSocketEventMap>(
    type: K,
    listener: (this: WebSocket, event: SturdyWebSocketEventMap[K]) => void
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject
  ): void {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter((l) => l !== listener);
    }
  }

  private openNewWebSocket(): void {
    if (this.isClosed) return;

    const { connectTimeout } = this.options;
    this.debugLog(`Opening new WebSocket to ${this.url}.`);
    const ws = new WebSocket(this.url, this.protocols);
    ws.onclose = (event) => this.handleClose(event);
    ws.onerror = (event) => this.handleError(event);
    ws.onmessage = (event) => this.handleMessage(event);
    ws.onopen = (event) => this.handleOpen(event);
    this.connectTimeoutId = setTimeout(() => {
      // If this is running, we still haven't opened the websocket.
      // Kill it so we can try again.
      this.clearConnectTimeout();
      this.disposeSocket();
      this.handleClose(undefined);
    }, connectTimeout);
    this.ws = ws;
  }

  private handleOpen(event: Event): void {
    if (!this.ws || this.isClosed) return;

    const { allClearResetTime } = this.options;
    this.debugLog("WebSocket opened.");
    if (this.binaryTypeInternal != null) {
      this.ws.binaryType = this.binaryTypeInternal;
    } else {
      this.binaryTypeInternal = this.ws.binaryType;
    }
    this.clearConnectTimeout();
    if (this.hasBeenOpened) {
      this.dispatchEventOfType("reopen", event);
      // Note that buffered messages from while the connection was down is not sent.
      // We need to re-initialize the Language Server state.
    } else {
      this.dispatchEventOfType("open", event);
      this.hasBeenOpened = true;
      this.messageBuffer.forEach((message) => this.send(message));
    }
    this.messageBuffer = [];
    this.allClearTimeoutId = setTimeout(() => {
      this.clearAllClearTimeout();
      this.nextRetryTime = 0;
      this.reconnectCount = 0;
      const openTime = (allClearResetTime / 1000) | 0;
      this.debugLog(
        `WebSocket remained open for ${openTime}s. Resetting retry time and count`
      );
    }, allClearResetTime);
  }

  private handleMessage(event: MessageEvent): void {
    if (this.isClosed) return;

    this.dispatchEventOfType("message", event);
  }

  private handleClose(event: CloseEvent | undefined): void {
    if (this.isClosed) return;

    const { maxReconnectAttempts } = this.options;
    this.clearConnectTimeout();
    this.clearAllClearTimeout();
    if (this.ws) {
      this.lastKnownExtensions = this.ws.extensions;
      this.lastKnownProtocol = this.ws.protocol;
      this.ws = undefined;
    }
    this.dispatchEventOfType("down", event);
    if (this.reconnectCount >= maxReconnectAttempts) {
      const reason = `Failed to reconnect after ${maxReconnectAttempts} attempts. Closing permanently.`;
      this.stopReconnecting(event, reason);
    } else {
      this.reestablishConnection();
    }
  }

  private handleError(event: Event): void {
    this.dispatchEventOfType("error", event);
    this.debugLog("WebSocket encountered an error.");
  }

  private reestablishConnection(): void {
    const { minReconnectDelay, maxReconnectDelay, reconnectBackoffFactor } =
      this.options;
    this.reconnectCount++;
    const retryTime = this.nextRetryTime;
    this.nextRetryTime = Math.max(
      minReconnectDelay,
      Math.min(this.nextRetryTime * reconnectBackoffFactor, maxReconnectDelay)
    );
    setTimeout(() => this.openNewWebSocket(), retryTime);
    const retryTimeSeconds = (retryTime / 1000) | 0;
    this.debugLog(`WebSocket was closed. Re-opening in ${retryTimeSeconds}s.`);
  }

  private stopReconnecting(
    event: CloseEvent | undefined,
    debugReason: string
  ): void {
    this.debugLog(debugReason);
    this.shutdown();
    if (event) {
      this.dispatchEventOfType("close", event);
    }
  }

  private shutdown(): void {
    this.isClosed = true;
    this.clearAllTimeouts();
    this.messageBuffer = [];
  }

  private disposeSocket(closeCode?: number, reason?: string): void {
    if (!this.ws) return;

    this.ws.onerror = noop;
    this.ws.onclose = noop;
    this.ws.onmessage = noop;
    this.ws.onopen = noop;
    this.ws.close(closeCode, reason);
    this.ws = undefined;
  }

  private clearAllTimeouts(): void {
    this.clearConnectTimeout();
    this.clearAllClearTimeout();
  }

  private clearConnectTimeout(): void {
    if (this.connectTimeoutId != null) {
      clearTimeout(this.connectTimeoutId);
      this.connectTimeoutId = undefined;
    }
  }

  private clearAllClearTimeout(): void {
    if (this.allClearTimeoutId != null) {
      clearTimeout(this.allClearTimeoutId);
      this.allClearTimeoutId = undefined;
    }
  }

  private dispatchEventOfType(type: string, event: any): boolean {
    switch (type) {
      case "close":
        if (this.onclose) this.onclose(event);
        break;
      case "error":
        if (this.onerror) this.onerror(event);
        break;
      case "message":
        if (this.onmessage) this.onmessage(event);
        break;
      case "open":
        if (this.onopen) this.onopen(event);
        break;
      case "down":
        if (this.ondown) this.ondown(event);
        break;
      case "reopen":
        if (this.onreopen) this.onreopen(event);
        break;
    }
    if (type in this.listeners) {
      this.listeners[type]
        .slice()
        .forEach((listener) => this.callListener(listener, event));
    }
    return !event || !(event as Event).defaultPrevented;
  }

  private callListener(
    listener: EventListenerOrEventListenerObject,
    event: Event
  ): void {
    if (typeof listener === "function") {
      listener.call(this, event);
    } else {
      listener.handleEvent.call(this, event);
    }
  }

  private debugLog(message: string): void {
    if (this.options.debug) console.debug(message);
  }
}

function getDataByteLength(data: any): number | undefined {
  if (typeof data === "string") {
    // UTF-16 strings use two bytes per character.
    return 2 * data.length;
  } else if (data instanceof ArrayBuffer) {
    return data.byteLength;
  } else if (data instanceof Blob) {
    return data.size;
  } else {
    return undefined;
  }
}

const noop = () => {};

// MIT License
//
// Copyright (c) 2017 David Philipson
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
