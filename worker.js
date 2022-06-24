var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getAugmentedNamespace(n) {
  var f = n.default;
	if (typeof f == "function") {
		var a = function () {
			return f.apply(this, arguments);
		};
		a.prototype = f.prototype;
  } else a = {};
  Object.defineProperty(a, '__esModule', {value: true});
	Object.keys(n).forEach(function (k) {
		var d = Object.getOwnPropertyDescriptor(n, k);
		Object.defineProperty(a, k, d.get ? d : {
			enumerable: true,
			get: function () {
				return n[k];
			}
		});
	});
	return a;
}

var browser$1 = {exports: {}};

var main$3 = {};

var browser = {exports: {}};

var main$2 = {};

var ril = {};

var ral$1 = {};

/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(ral$1, "__esModule", { value: true });
let _ral$1;
function RAL$1() {
    if (_ral$1 === undefined) {
        throw new Error(`No runtime abstraction layer installed`);
    }
    return _ral$1;
}
(function (RAL) {
    function install(ral) {
        if (ral === undefined) {
            throw new Error(`No runtime abstraction layer provided`);
        }
        _ral$1 = ral;
    }
    RAL.install = install;
})(RAL$1 || (RAL$1 = {}));
ral$1.default = RAL$1;

var disposable = {};

(function (exports) {
	/*---------------------------------------------------------------------------------------------
	 *  Copyright (c) Microsoft Corporation. All rights reserved.
	 *  Licensed under the MIT License. See License.txt in the project root for license information.
	 *--------------------------------------------------------------------------------------------*/
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Disposable = void 0;
	(function (Disposable) {
	    function create(func) {
	        return {
	            dispose: func
	        };
	    }
	    Disposable.create = create;
	})(exports.Disposable || (exports.Disposable = {}));
	
} (disposable));

var events = {};

(function (exports) {
	/* --------------------------------------------------------------------------------------------
	 * Copyright (c) Microsoft Corporation. All rights reserved.
	 * Licensed under the MIT License. See License.txt in the project root for license information.
	 * ------------------------------------------------------------------------------------------ */
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Emitter = exports.Event = void 0;
	const ral_1 = ral$1;
	(function (Event) {
	    const _disposable = { dispose() { } };
	    Event.None = function () { return _disposable; };
	})(exports.Event || (exports.Event = {}));
	class CallbackList {
	    add(callback, context = null, bucket) {
	        if (!this._callbacks) {
	            this._callbacks = [];
	            this._contexts = [];
	        }
	        this._callbacks.push(callback);
	        this._contexts.push(context);
	        if (Array.isArray(bucket)) {
	            bucket.push({ dispose: () => this.remove(callback, context) });
	        }
	    }
	    remove(callback, context = null) {
	        if (!this._callbacks) {
	            return;
	        }
	        let foundCallbackWithDifferentContext = false;
	        for (let i = 0, len = this._callbacks.length; i < len; i++) {
	            if (this._callbacks[i] === callback) {
	                if (this._contexts[i] === context) {
	                    // callback & context match => remove it
	                    this._callbacks.splice(i, 1);
	                    this._contexts.splice(i, 1);
	                    return;
	                }
	                else {
	                    foundCallbackWithDifferentContext = true;
	                }
	            }
	        }
	        if (foundCallbackWithDifferentContext) {
	            throw new Error('When adding a listener with a context, you should remove it with the same context');
	        }
	    }
	    invoke(...args) {
	        if (!this._callbacks) {
	            return [];
	        }
	        const ret = [], callbacks = this._callbacks.slice(0), contexts = this._contexts.slice(0);
	        for (let i = 0, len = callbacks.length; i < len; i++) {
	            try {
	                ret.push(callbacks[i].apply(contexts[i], args));
	            }
	            catch (e) {
	                // eslint-disable-next-line no-console
	                ral_1.default().console.error(e);
	            }
	        }
	        return ret;
	    }
	    isEmpty() {
	        return !this._callbacks || this._callbacks.length === 0;
	    }
	    dispose() {
	        this._callbacks = undefined;
	        this._contexts = undefined;
	    }
	}
	class Emitter {
	    constructor(_options) {
	        this._options = _options;
	    }
	    /**
	     * For the public to allow to subscribe
	     * to events from this Emitter
	     */
	    get event() {
	        if (!this._event) {
	            this._event = (listener, thisArgs, disposables) => {
	                if (!this._callbacks) {
	                    this._callbacks = new CallbackList();
	                }
	                if (this._options && this._options.onFirstListenerAdd && this._callbacks.isEmpty()) {
	                    this._options.onFirstListenerAdd(this);
	                }
	                this._callbacks.add(listener, thisArgs);
	                const result = {
	                    dispose: () => {
	                        if (!this._callbacks) {
	                            // disposable is disposed after emitter is disposed.
	                            return;
	                        }
	                        this._callbacks.remove(listener, thisArgs);
	                        result.dispose = Emitter._noop;
	                        if (this._options && this._options.onLastListenerRemove && this._callbacks.isEmpty()) {
	                            this._options.onLastListenerRemove(this);
	                        }
	                    }
	                };
	                if (Array.isArray(disposables)) {
	                    disposables.push(result);
	                }
	                return result;
	            };
	        }
	        return this._event;
	    }
	    /**
	     * To be kept private to fire an event to
	     * subscribers
	     */
	    fire(event) {
	        if (this._callbacks) {
	            this._callbacks.invoke.call(this._callbacks, event);
	        }
	    }
	    dispose() {
	        if (this._callbacks) {
	            this._callbacks.dispose();
	            this._callbacks = undefined;
	        }
	    }
	}
	exports.Emitter = Emitter;
	Emitter._noop = function () { };
	
} (events));

var messageBuffer = {};

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(messageBuffer, "__esModule", { value: true });
messageBuffer.AbstractMessageBuffer = void 0;
const CR = 13;
const LF = 10;
const CRLF = '\r\n';
class AbstractMessageBuffer {
    constructor(encoding = 'utf-8') {
        this._encoding = encoding;
        this._chunks = [];
        this._totalLength = 0;
    }
    get encoding() {
        return this._encoding;
    }
    append(chunk) {
        const toAppend = typeof chunk === 'string' ? this.fromString(chunk, this._encoding) : chunk;
        this._chunks.push(toAppend);
        this._totalLength += toAppend.byteLength;
    }
    tryReadHeaders() {
        if (this._chunks.length === 0) {
            return undefined;
        }
        let state = 0;
        let chunkIndex = 0;
        let offset = 0;
        let chunkBytesRead = 0;
        row: while (chunkIndex < this._chunks.length) {
            const chunk = this._chunks[chunkIndex];
            offset = 0;
            while (offset < chunk.length) {
                const value = chunk[offset];
                switch (value) {
                    case CR:
                        switch (state) {
                            case 0:
                                state = 1;
                                break;
                            case 2:
                                state = 3;
                                break;
                            default:
                                state = 0;
                        }
                        break;
                    case LF:
                        switch (state) {
                            case 1:
                                state = 2;
                                break;
                            case 3:
                                state = 4;
                                offset++;
                                break row;
                            default:
                                state = 0;
                        }
                        break;
                    default:
                        state = 0;
                }
                offset++;
            }
            chunkBytesRead += chunk.byteLength;
            chunkIndex++;
        }
        if (state !== 4) {
            return undefined;
        }
        // The buffer contains the two CRLF at the end. So we will
        // have two empty lines after the split at the end as well.
        const buffer = this._read(chunkBytesRead + offset);
        const result = new Map();
        const headers = this.toString(buffer, 'ascii').split(CRLF);
        if (headers.length < 2) {
            return result;
        }
        for (let i = 0; i < headers.length - 2; i++) {
            const header = headers[i];
            const index = header.indexOf(':');
            if (index === -1) {
                throw new Error('Message header must separate key and value using :');
            }
            const key = header.substr(0, index);
            const value = header.substr(index + 1).trim();
            result.set(key, value);
        }
        return result;
    }
    tryReadBody(length) {
        if (this._totalLength < length) {
            return undefined;
        }
        return this._read(length);
    }
    get numberOfBytes() {
        return this._totalLength;
    }
    _read(byteCount) {
        if (byteCount === 0) {
            return this.emptyBuffer();
        }
        if (byteCount > this._totalLength) {
            throw new Error(`Cannot read so many bytes!`);
        }
        if (this._chunks[0].byteLength === byteCount) {
            // super fast path, precisely first chunk must be returned
            const chunk = this._chunks[0];
            this._chunks.shift();
            this._totalLength -= byteCount;
            return this.asNative(chunk);
        }
        if (this._chunks[0].byteLength > byteCount) {
            // fast path, the reading is entirely within the first chunk
            const chunk = this._chunks[0];
            const result = this.asNative(chunk, byteCount);
            this._chunks[0] = chunk.slice(byteCount);
            this._totalLength -= byteCount;
            return result;
        }
        const result = this.allocNative(byteCount);
        let resultOffset = 0;
        let chunkIndex = 0;
        while (byteCount > 0) {
            const chunk = this._chunks[chunkIndex];
            if (chunk.byteLength > byteCount) {
                // this chunk will survive
                const chunkPart = chunk.slice(0, byteCount);
                result.set(chunkPart, resultOffset);
                resultOffset += byteCount;
                this._chunks[chunkIndex] = chunk.slice(byteCount);
                this._totalLength -= byteCount;
                byteCount -= byteCount;
            }
            else {
                // this chunk will be entirely read
                result.set(chunk, resultOffset);
                resultOffset += chunk.byteLength;
                this._chunks.shift();
                this._totalLength -= chunk.byteLength;
                byteCount -= chunk.byteLength;
            }
        }
        return result;
    }
}
messageBuffer.AbstractMessageBuffer = AbstractMessageBuffer;

/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(ril, "__esModule", { value: true });
const ral_1 = ral$1;
const disposable_1 = disposable;
const events_1 = events;
const messageBuffer_1 = messageBuffer;
class MessageBuffer extends messageBuffer_1.AbstractMessageBuffer {
    constructor(encoding = 'utf-8') {
        super(encoding);
        this.asciiDecoder = new TextDecoder('ascii');
    }
    emptyBuffer() {
        return MessageBuffer.emptyBuffer;
    }
    fromString(value, _encoding) {
        return (new TextEncoder()).encode(value);
    }
    toString(value, encoding) {
        if (encoding === 'ascii') {
            return this.asciiDecoder.decode(value);
        }
        else {
            return (new TextDecoder(encoding)).decode(value);
        }
    }
    asNative(buffer, length) {
        if (length === undefined) {
            return buffer;
        }
        else {
            return buffer.slice(0, length);
        }
    }
    allocNative(length) {
        return new Uint8Array(length);
    }
}
MessageBuffer.emptyBuffer = new Uint8Array(0);
class ReadableStreamWrapper {
    constructor(socket) {
        this.socket = socket;
        this._onData = new events_1.Emitter();
        this._messageListener = (event) => {
            const blob = event.data;
            blob.arrayBuffer().then((buffer) => {
                this._onData.fire(new Uint8Array(buffer));
            });
        };
        this.socket.addEventListener('message', this._messageListener);
    }
    onClose(listener) {
        this.socket.addEventListener('close', listener);
        return disposable_1.Disposable.create(() => this.socket.removeEventListener('close', listener));
    }
    onError(listener) {
        this.socket.addEventListener('error', listener);
        return disposable_1.Disposable.create(() => this.socket.removeEventListener('error', listener));
    }
    onEnd(listener) {
        this.socket.addEventListener('end', listener);
        return disposable_1.Disposable.create(() => this.socket.removeEventListener('end', listener));
    }
    onData(listener) {
        return this._onData.event(listener);
    }
}
class WritableStreamWrapper {
    constructor(socket) {
        this.socket = socket;
    }
    onClose(listener) {
        this.socket.addEventListener('close', listener);
        return disposable_1.Disposable.create(() => this.socket.removeEventListener('close', listener));
    }
    onError(listener) {
        this.socket.addEventListener('error', listener);
        return disposable_1.Disposable.create(() => this.socket.removeEventListener('error', listener));
    }
    onEnd(listener) {
        this.socket.addEventListener('end', listener);
        return disposable_1.Disposable.create(() => this.socket.removeEventListener('end', listener));
    }
    write(data, encoding) {
        if (typeof data === 'string') {
            if (encoding !== undefined && encoding !== 'utf-8') {
                throw new Error(`In a Browser environments only utf-8 text encding is supported. But got encoding: ${encoding}`);
            }
            this.socket.send(data);
        }
        else {
            this.socket.send(data);
        }
        return Promise.resolve();
    }
    end() {
        this.socket.close();
    }
}
const _textEncoder = new TextEncoder();
const _ril = Object.freeze({
    messageBuffer: Object.freeze({
        create: (encoding) => new MessageBuffer(encoding)
    }),
    applicationJson: Object.freeze({
        encoder: Object.freeze({
            name: 'application/json',
            encode: (msg, options) => {
                if (options.charset !== 'utf-8') {
                    throw new Error(`In a Browser environments only utf-8 text encding is supported. But got encoding: ${options.charset}`);
                }
                return Promise.resolve(_textEncoder.encode(JSON.stringify(msg, undefined, 0)));
            }
        }),
        decoder: Object.freeze({
            name: 'application/json',
            decode: (buffer, options) => {
                if (!(buffer instanceof Uint8Array)) {
                    throw new Error(`In a Browser environments only Uint8Arrays are supported.`);
                }
                return Promise.resolve(JSON.parse(new TextDecoder(options.charset).decode(buffer)));
            }
        })
    }),
    stream: Object.freeze({
        asReadableStream: (socket) => new ReadableStreamWrapper(socket),
        asWritableStream: (socket) => new WritableStreamWrapper(socket)
    }),
    console: console,
    timer: Object.freeze({
        setTimeout(callback, ms, ...args) {
            return setTimeout(callback, ms, ...args);
        },
        clearTimeout(handle) {
            clearTimeout(handle);
        },
        setImmediate(callback, ...args) {
            return setTimeout(callback, 0, ...args);
        },
        clearImmediate(handle) {
            clearTimeout(handle);
        }
    })
});
function RIL() {
    return _ril;
}
(function (RIL) {
    function install() {
        ral_1.default.install(_ril);
    }
    RIL.install = install;
})(RIL || (RIL = {}));
ril.default = RIL;

var api$1 = {};

var messages$1 = {};

var is$1 = {};

var hasRequiredIs;

function requireIs () {
	if (hasRequiredIs) return is$1;
	hasRequiredIs = 1;
	/* --------------------------------------------------------------------------------------------
	 * Copyright (c) Microsoft Corporation. All rights reserved.
	 * Licensed under the MIT License. See License.txt in the project root for license information.
	 * ------------------------------------------------------------------------------------------ */
	Object.defineProperty(is$1, "__esModule", { value: true });
	is$1.stringArray = is$1.array = is$1.func = is$1.error = is$1.number = is$1.string = is$1.boolean = void 0;
	function boolean(value) {
	    return value === true || value === false;
	}
	is$1.boolean = boolean;
	function string(value) {
	    return typeof value === 'string' || value instanceof String;
	}
	is$1.string = string;
	function number(value) {
	    return typeof value === 'number' || value instanceof Number;
	}
	is$1.number = number;
	function error(value) {
	    return value instanceof Error;
	}
	is$1.error = error;
	function func(value) {
	    return typeof value === 'function';
	}
	is$1.func = func;
	function array(value) {
	    return Array.isArray(value);
	}
	is$1.array = array;
	function stringArray(value) {
	    return array(value) && value.every(elem => string(elem));
	}
	is$1.stringArray = stringArray;
	
	return is$1;
}

var hasRequiredMessages;

function requireMessages () {
	if (hasRequiredMessages) return messages$1;
	hasRequiredMessages = 1;
	(function (exports) {
		/* --------------------------------------------------------------------------------------------
		 * Copyright (c) Microsoft Corporation. All rights reserved.
		 * Licensed under the MIT License. See License.txt in the project root for license information.
		 * ------------------------------------------------------------------------------------------ */
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.isResponseMessage = exports.isNotificationMessage = exports.isRequestMessage = exports.NotificationType9 = exports.NotificationType8 = exports.NotificationType7 = exports.NotificationType6 = exports.NotificationType5 = exports.NotificationType4 = exports.NotificationType3 = exports.NotificationType2 = exports.NotificationType1 = exports.NotificationType0 = exports.NotificationType = exports.RequestType9 = exports.RequestType8 = exports.RequestType7 = exports.RequestType6 = exports.RequestType5 = exports.RequestType4 = exports.RequestType3 = exports.RequestType2 = exports.RequestType1 = exports.RequestType = exports.RequestType0 = exports.AbstractMessageSignature = exports.ParameterStructures = exports.ResponseError = exports.ErrorCodes = void 0;
		const is = requireIs();
		/**
		 * Predefined error codes.
		 */
		var ErrorCodes;
		(function (ErrorCodes) {
		    // Defined by JSON RPC
		    ErrorCodes.ParseError = -32700;
		    ErrorCodes.InvalidRequest = -32600;
		    ErrorCodes.MethodNotFound = -32601;
		    ErrorCodes.InvalidParams = -32602;
		    ErrorCodes.InternalError = -32603;
		    /**
		     * This is the start range of JSON RPC reserved error codes.
		     * It doesn't denote a real error code. No application error codes should
		     * be defined between the start and end range. For backwards
		     * compatibility the `ServerNotInitialized` and the `UnknownErrorCode`
		     * are left in the range.
		     *
		     * @since 3.16.0
		    */
		    ErrorCodes.jsonrpcReservedErrorRangeStart = -32099;
		    /** @deprecated use  jsonrpcReservedErrorRangeStart */
		    ErrorCodes.serverErrorStart = ErrorCodes.jsonrpcReservedErrorRangeStart;
		    ErrorCodes.MessageWriteError = -32099;
		    ErrorCodes.MessageReadError = -32098;
		    ErrorCodes.ServerNotInitialized = -32002;
		    ErrorCodes.UnknownErrorCode = -32001;
		    /**
		     * This is the end range of JSON RPC reserved error codes.
		     * It doesn't denote a real error code.
		     *
		     * @since 3.16.0
		    */
		    ErrorCodes.jsonrpcReservedErrorRangeEnd = -32000;
		    /** @deprecated use  jsonrpcReservedErrorRangeEnd */
		    ErrorCodes.serverErrorEnd = ErrorCodes.jsonrpcReservedErrorRangeEnd;
		})(ErrorCodes = exports.ErrorCodes || (exports.ErrorCodes = {}));
		/**
		 * An error object return in a response in case a request
		 * has failed.
		 */
		class ResponseError extends Error {
		    constructor(code, message, data) {
		        super(message);
		        this.code = is.number(code) ? code : ErrorCodes.UnknownErrorCode;
		        this.data = data;
		        Object.setPrototypeOf(this, ResponseError.prototype);
		    }
		    toJson() {
		        return {
		            code: this.code,
		            message: this.message,
		            data: this.data,
		        };
		    }
		}
		exports.ResponseError = ResponseError;
		class ParameterStructures {
		    constructor(kind) {
		        this.kind = kind;
		    }
		    static is(value) {
		        return value === ParameterStructures.auto || value === ParameterStructures.byName || value === ParameterStructures.byPosition;
		    }
		    toString() {
		        return this.kind;
		    }
		}
		exports.ParameterStructures = ParameterStructures;
		/**
		 * The parameter structure is automatically inferred on the number of parameters
		 * and the parameter type in case of a single param.
		 */
		ParameterStructures.auto = new ParameterStructures('auto');
		/**
		 * Forces `byPosition` parameter structure. This is useful if you have a single
		 * parameter which has a literal type.
		 */
		ParameterStructures.byPosition = new ParameterStructures('byPosition');
		/**
		 * Forces `byName` parameter structure. This is only useful when having a single
		 * parameter. The library will report errors if used with a different number of
		 * parameters.
		 */
		ParameterStructures.byName = new ParameterStructures('byName');
		/**
		 * An abstract implementation of a MessageType.
		 */
		class AbstractMessageSignature {
		    constructor(method, numberOfParams) {
		        this.method = method;
		        this.numberOfParams = numberOfParams;
		    }
		    get parameterStructures() {
		        return ParameterStructures.auto;
		    }
		}
		exports.AbstractMessageSignature = AbstractMessageSignature;
		/**
		 * Classes to type request response pairs
		 */
		class RequestType0 extends AbstractMessageSignature {
		    constructor(method) {
		        super(method, 0);
		    }
		}
		exports.RequestType0 = RequestType0;
		class RequestType extends AbstractMessageSignature {
		    constructor(method, _parameterStructures = ParameterStructures.auto) {
		        super(method, 1);
		        this._parameterStructures = _parameterStructures;
		    }
		    get parameterStructures() {
		        return this._parameterStructures;
		    }
		}
		exports.RequestType = RequestType;
		class RequestType1 extends AbstractMessageSignature {
		    constructor(method, _parameterStructures = ParameterStructures.auto) {
		        super(method, 1);
		        this._parameterStructures = _parameterStructures;
		    }
		    get parameterStructures() {
		        return this._parameterStructures;
		    }
		}
		exports.RequestType1 = RequestType1;
		class RequestType2 extends AbstractMessageSignature {
		    constructor(method) {
		        super(method, 2);
		    }
		}
		exports.RequestType2 = RequestType2;
		class RequestType3 extends AbstractMessageSignature {
		    constructor(method) {
		        super(method, 3);
		    }
		}
		exports.RequestType3 = RequestType3;
		class RequestType4 extends AbstractMessageSignature {
		    constructor(method) {
		        super(method, 4);
		    }
		}
		exports.RequestType4 = RequestType4;
		class RequestType5 extends AbstractMessageSignature {
		    constructor(method) {
		        super(method, 5);
		    }
		}
		exports.RequestType5 = RequestType5;
		class RequestType6 extends AbstractMessageSignature {
		    constructor(method) {
		        super(method, 6);
		    }
		}
		exports.RequestType6 = RequestType6;
		class RequestType7 extends AbstractMessageSignature {
		    constructor(method) {
		        super(method, 7);
		    }
		}
		exports.RequestType7 = RequestType7;
		class RequestType8 extends AbstractMessageSignature {
		    constructor(method) {
		        super(method, 8);
		    }
		}
		exports.RequestType8 = RequestType8;
		class RequestType9 extends AbstractMessageSignature {
		    constructor(method) {
		        super(method, 9);
		    }
		}
		exports.RequestType9 = RequestType9;
		class NotificationType extends AbstractMessageSignature {
		    constructor(method, _parameterStructures = ParameterStructures.auto) {
		        super(method, 1);
		        this._parameterStructures = _parameterStructures;
		    }
		    get parameterStructures() {
		        return this._parameterStructures;
		    }
		}
		exports.NotificationType = NotificationType;
		class NotificationType0 extends AbstractMessageSignature {
		    constructor(method) {
		        super(method, 0);
		    }
		}
		exports.NotificationType0 = NotificationType0;
		class NotificationType1 extends AbstractMessageSignature {
		    constructor(method, _parameterStructures = ParameterStructures.auto) {
		        super(method, 1);
		        this._parameterStructures = _parameterStructures;
		    }
		    get parameterStructures() {
		        return this._parameterStructures;
		    }
		}
		exports.NotificationType1 = NotificationType1;
		class NotificationType2 extends AbstractMessageSignature {
		    constructor(method) {
		        super(method, 2);
		    }
		}
		exports.NotificationType2 = NotificationType2;
		class NotificationType3 extends AbstractMessageSignature {
		    constructor(method) {
		        super(method, 3);
		    }
		}
		exports.NotificationType3 = NotificationType3;
		class NotificationType4 extends AbstractMessageSignature {
		    constructor(method) {
		        super(method, 4);
		    }
		}
		exports.NotificationType4 = NotificationType4;
		class NotificationType5 extends AbstractMessageSignature {
		    constructor(method) {
		        super(method, 5);
		    }
		}
		exports.NotificationType5 = NotificationType5;
		class NotificationType6 extends AbstractMessageSignature {
		    constructor(method) {
		        super(method, 6);
		    }
		}
		exports.NotificationType6 = NotificationType6;
		class NotificationType7 extends AbstractMessageSignature {
		    constructor(method) {
		        super(method, 7);
		    }
		}
		exports.NotificationType7 = NotificationType7;
		class NotificationType8 extends AbstractMessageSignature {
		    constructor(method) {
		        super(method, 8);
		    }
		}
		exports.NotificationType8 = NotificationType8;
		class NotificationType9 extends AbstractMessageSignature {
		    constructor(method) {
		        super(method, 9);
		    }
		}
		exports.NotificationType9 = NotificationType9;
		/**
		 * Tests if the given message is a request message
		 */
		function isRequestMessage(message) {
		    const candidate = message;
		    return candidate && is.string(candidate.method) && (is.string(candidate.id) || is.number(candidate.id));
		}
		exports.isRequestMessage = isRequestMessage;
		/**
		 * Tests if the given message is a notification message
		 */
		function isNotificationMessage(message) {
		    const candidate = message;
		    return candidate && is.string(candidate.method) && message.id === void 0;
		}
		exports.isNotificationMessage = isNotificationMessage;
		/**
		 * Tests if the given message is a response message
		 */
		function isResponseMessage(message) {
		    const candidate = message;
		    return candidate && (candidate.result !== void 0 || !!candidate.error) && (is.string(candidate.id) || is.number(candidate.id) || candidate.id === null);
		}
		exports.isResponseMessage = isResponseMessage;
		
} (messages$1));
	return messages$1;
}

var cancellation = {};

var hasRequiredCancellation;

function requireCancellation () {
	if (hasRequiredCancellation) return cancellation;
	hasRequiredCancellation = 1;
	(function (exports) {
		/*---------------------------------------------------------------------------------------------
		 *  Copyright (c) Microsoft Corporation. All rights reserved.
		 *  Licensed under the MIT License. See License.txt in the project root for license information.
		 *--------------------------------------------------------------------------------------------*/
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.CancellationTokenSource = exports.CancellationToken = void 0;
		const ral_1 = ral$1;
		const Is = requireIs();
		const events_1 = events;
		var CancellationToken;
		(function (CancellationToken) {
		    CancellationToken.None = Object.freeze({
		        isCancellationRequested: false,
		        onCancellationRequested: events_1.Event.None
		    });
		    CancellationToken.Cancelled = Object.freeze({
		        isCancellationRequested: true,
		        onCancellationRequested: events_1.Event.None
		    });
		    function is(value) {
		        const candidate = value;
		        return candidate && (candidate === CancellationToken.None
		            || candidate === CancellationToken.Cancelled
		            || (Is.boolean(candidate.isCancellationRequested) && !!candidate.onCancellationRequested));
		    }
		    CancellationToken.is = is;
		})(CancellationToken = exports.CancellationToken || (exports.CancellationToken = {}));
		const shortcutEvent = Object.freeze(function (callback, context) {
		    const handle = ral_1.default().timer.setTimeout(callback.bind(context), 0);
		    return { dispose() { ral_1.default().timer.clearTimeout(handle); } };
		});
		class MutableToken {
		    constructor() {
		        this._isCancelled = false;
		    }
		    cancel() {
		        if (!this._isCancelled) {
		            this._isCancelled = true;
		            if (this._emitter) {
		                this._emitter.fire(undefined);
		                this.dispose();
		            }
		        }
		    }
		    get isCancellationRequested() {
		        return this._isCancelled;
		    }
		    get onCancellationRequested() {
		        if (this._isCancelled) {
		            return shortcutEvent;
		        }
		        if (!this._emitter) {
		            this._emitter = new events_1.Emitter();
		        }
		        return this._emitter.event;
		    }
		    dispose() {
		        if (this._emitter) {
		            this._emitter.dispose();
		            this._emitter = undefined;
		        }
		    }
		}
		class CancellationTokenSource {
		    get token() {
		        if (!this._token) {
		            // be lazy and create the token only when
		            // actually needed
		            this._token = new MutableToken();
		        }
		        return this._token;
		    }
		    cancel() {
		        if (!this._token) {
		            // save an object by returning the default
		            // cancelled token when cancellation happens
		            // before someone asks for the token
		            this._token = CancellationToken.Cancelled;
		        }
		        else {
		            this._token.cancel();
		        }
		    }
		    dispose() {
		        if (!this._token) {
		            // ensure to initialize with an empty token if we had none
		            this._token = CancellationToken.None;
		        }
		        else if (this._token instanceof MutableToken) {
		            // actually dispose
		            this._token.dispose();
		        }
		    }
		}
		exports.CancellationTokenSource = CancellationTokenSource;
		
} (cancellation));
	return cancellation;
}

var messageReader = {};

var hasRequiredMessageReader;

function requireMessageReader () {
	if (hasRequiredMessageReader) return messageReader;
	hasRequiredMessageReader = 1;
	(function (exports) {
		/* --------------------------------------------------------------------------------------------
		 * Copyright (c) Microsoft Corporation. All rights reserved.
		 * Licensed under the MIT License. See License.txt in the project root for license information.
		 * ------------------------------------------------------------------------------------------ */
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.ReadableStreamMessageReader = exports.AbstractMessageReader = exports.MessageReader = void 0;
		const ral_1 = ral$1;
		const Is = requireIs();
		const events_1 = events;
		(function (MessageReader) {
		    function is(value) {
		        let candidate = value;
		        return candidate && Is.func(candidate.listen) && Is.func(candidate.dispose) &&
		            Is.func(candidate.onError) && Is.func(candidate.onClose) && Is.func(candidate.onPartialMessage);
		    }
		    MessageReader.is = is;
		})(exports.MessageReader || (exports.MessageReader = {}));
		class AbstractMessageReader {
		    constructor() {
		        this.errorEmitter = new events_1.Emitter();
		        this.closeEmitter = new events_1.Emitter();
		        this.partialMessageEmitter = new events_1.Emitter();
		    }
		    dispose() {
		        this.errorEmitter.dispose();
		        this.closeEmitter.dispose();
		    }
		    get onError() {
		        return this.errorEmitter.event;
		    }
		    fireError(error) {
		        this.errorEmitter.fire(this.asError(error));
		    }
		    get onClose() {
		        return this.closeEmitter.event;
		    }
		    fireClose() {
		        this.closeEmitter.fire(undefined);
		    }
		    get onPartialMessage() {
		        return this.partialMessageEmitter.event;
		    }
		    firePartialMessage(info) {
		        this.partialMessageEmitter.fire(info);
		    }
		    asError(error) {
		        if (error instanceof Error) {
		            return error;
		        }
		        else {
		            return new Error(`Reader received error. Reason: ${Is.string(error.message) ? error.message : 'unknown'}`);
		        }
		    }
		}
		exports.AbstractMessageReader = AbstractMessageReader;
		var ResolvedMessageReaderOptions;
		(function (ResolvedMessageReaderOptions) {
		    function fromOptions(options) {
		        var _a;
		        let charset;
		        let contentDecoder;
		        const contentDecoders = new Map();
		        let contentTypeDecoder;
		        const contentTypeDecoders = new Map();
		        if (options === undefined || typeof options === 'string') {
		            charset = options !== null && options !== void 0 ? options : 'utf-8';
		        }
		        else {
		            charset = (_a = options.charset) !== null && _a !== void 0 ? _a : 'utf-8';
		            if (options.contentDecoder !== undefined) {
		                contentDecoder = options.contentDecoder;
		                contentDecoders.set(contentDecoder.name, contentDecoder);
		            }
		            if (options.contentDecoders !== undefined) {
		                for (const decoder of options.contentDecoders) {
		                    contentDecoders.set(decoder.name, decoder);
		                }
		            }
		            if (options.contentTypeDecoder !== undefined) {
		                contentTypeDecoder = options.contentTypeDecoder;
		                contentTypeDecoders.set(contentTypeDecoder.name, contentTypeDecoder);
		            }
		            if (options.contentTypeDecoders !== undefined) {
		                for (const decoder of options.contentTypeDecoders) {
		                    contentTypeDecoders.set(decoder.name, decoder);
		                }
		            }
		        }
		        if (contentTypeDecoder === undefined) {
		            contentTypeDecoder = ral_1.default().applicationJson.decoder;
		            contentTypeDecoders.set(contentTypeDecoder.name, contentTypeDecoder);
		        }
		        return { charset, contentDecoder, contentDecoders, contentTypeDecoder, contentTypeDecoders };
		    }
		    ResolvedMessageReaderOptions.fromOptions = fromOptions;
		})(ResolvedMessageReaderOptions || (ResolvedMessageReaderOptions = {}));
		class ReadableStreamMessageReader extends AbstractMessageReader {
		    constructor(readable, options) {
		        super();
		        this.readable = readable;
		        this.options = ResolvedMessageReaderOptions.fromOptions(options);
		        this.buffer = ral_1.default().messageBuffer.create(this.options.charset);
		        this._partialMessageTimeout = 10000;
		        this.nextMessageLength = -1;
		        this.messageToken = 0;
		    }
		    set partialMessageTimeout(timeout) {
		        this._partialMessageTimeout = timeout;
		    }
		    get partialMessageTimeout() {
		        return this._partialMessageTimeout;
		    }
		    listen(callback) {
		        this.nextMessageLength = -1;
		        this.messageToken = 0;
		        this.partialMessageTimer = undefined;
		        this.callback = callback;
		        const result = this.readable.onData((data) => {
		            this.onData(data);
		        });
		        this.readable.onError((error) => this.fireError(error));
		        this.readable.onClose(() => this.fireClose());
		        return result;
		    }
		    onData(data) {
		        this.buffer.append(data);
		        while (true) {
		            if (this.nextMessageLength === -1) {
		                const headers = this.buffer.tryReadHeaders();
		                if (!headers) {
		                    return;
		                }
		                const contentLength = headers.get('Content-Length');
		                if (!contentLength) {
		                    throw new Error('Header must provide a Content-Length property.');
		                }
		                const length = parseInt(contentLength);
		                if (isNaN(length)) {
		                    throw new Error('Content-Length value must be a number.');
		                }
		                this.nextMessageLength = length;
		            }
		            const body = this.buffer.tryReadBody(this.nextMessageLength);
		            if (body === undefined) {
		                /** We haven't received the full message yet. */
		                this.setPartialMessageTimer();
		                return;
		            }
		            this.clearPartialMessageTimer();
		            this.nextMessageLength = -1;
		            let p;
		            if (this.options.contentDecoder !== undefined) {
		                p = this.options.contentDecoder.decode(body);
		            }
		            else {
		                p = Promise.resolve(body);
		            }
		            p.then((value) => {
		                this.options.contentTypeDecoder.decode(value, this.options).then((msg) => {
		                    this.callback(msg);
		                }, (error) => {
		                    this.fireError(error);
		                });
		            }, (error) => {
		                this.fireError(error);
		            });
		        }
		    }
		    clearPartialMessageTimer() {
		        if (this.partialMessageTimer) {
		            ral_1.default().timer.clearTimeout(this.partialMessageTimer);
		            this.partialMessageTimer = undefined;
		        }
		    }
		    setPartialMessageTimer() {
		        this.clearPartialMessageTimer();
		        if (this._partialMessageTimeout <= 0) {
		            return;
		        }
		        this.partialMessageTimer = ral_1.default().timer.setTimeout((token, timeout) => {
		            this.partialMessageTimer = undefined;
		            if (token === this.messageToken) {
		                this.firePartialMessage({ messageToken: token, waitingTime: timeout });
		                this.setPartialMessageTimer();
		            }
		        }, this._partialMessageTimeout, this.messageToken, this._partialMessageTimeout);
		    }
		}
		exports.ReadableStreamMessageReader = ReadableStreamMessageReader;
		
} (messageReader));
	return messageReader;
}

var messageWriter = {};

var semaphore = {};

var hasRequiredSemaphore;

function requireSemaphore () {
	if (hasRequiredSemaphore) return semaphore;
	hasRequiredSemaphore = 1;
	/* --------------------------------------------------------------------------------------------
	 * Copyright (c) Microsoft Corporation. All rights reserved.
	 * Licensed under the MIT License. See License.txt in the project root for license information.
	 * ------------------------------------------------------------------------------------------ */
	Object.defineProperty(semaphore, "__esModule", { value: true });
	semaphore.Semaphore = void 0;
	const ral_1 = ral$1;
	class Semaphore {
	    constructor(capacity = 1) {
	        if (capacity <= 0) {
	            throw new Error('Capacity must be greater than 0');
	        }
	        this._capacity = capacity;
	        this._active = 0;
	        this._waiting = [];
	    }
	    lock(thunk) {
	        return new Promise((resolve, reject) => {
	            this._waiting.push({ thunk, resolve, reject });
	            this.runNext();
	        });
	    }
	    get active() {
	        return this._active;
	    }
	    runNext() {
	        if (this._waiting.length === 0 || this._active === this._capacity) {
	            return;
	        }
	        ral_1.default().timer.setImmediate(() => this.doRunNext());
	    }
	    doRunNext() {
	        if (this._waiting.length === 0 || this._active === this._capacity) {
	            return;
	        }
	        const next = this._waiting.shift();
	        this._active++;
	        if (this._active > this._capacity) {
	            throw new Error(`To many thunks active`);
	        }
	        try {
	            const result = next.thunk();
	            if (result instanceof Promise) {
	                result.then((value) => {
	                    this._active--;
	                    next.resolve(value);
	                    this.runNext();
	                }, (err) => {
	                    this._active--;
	                    next.reject(err);
	                    this.runNext();
	                });
	            }
	            else {
	                this._active--;
	                next.resolve(result);
	                this.runNext();
	            }
	        }
	        catch (err) {
	            this._active--;
	            next.reject(err);
	            this.runNext();
	        }
	    }
	}
	semaphore.Semaphore = Semaphore;
	
	return semaphore;
}

var hasRequiredMessageWriter;

function requireMessageWriter () {
	if (hasRequiredMessageWriter) return messageWriter;
	hasRequiredMessageWriter = 1;
	(function (exports) {
		/* --------------------------------------------------------------------------------------------
		 * Copyright (c) Microsoft Corporation. All rights reserved.
		 * Licensed under the MIT License. See License.txt in the project root for license information.
		 * ------------------------------------------------------------------------------------------ */
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.WriteableStreamMessageWriter = exports.AbstractMessageWriter = exports.MessageWriter = void 0;
		const ral_1 = ral$1;
		const Is = requireIs();
		const semaphore_1 = requireSemaphore();
		const events_1 = events;
		const ContentLength = 'Content-Length: ';
		const CRLF = '\r\n';
		(function (MessageWriter) {
		    function is(value) {
		        let candidate = value;
		        return candidate && Is.func(candidate.dispose) && Is.func(candidate.onClose) &&
		            Is.func(candidate.onError) && Is.func(candidate.write);
		    }
		    MessageWriter.is = is;
		})(exports.MessageWriter || (exports.MessageWriter = {}));
		class AbstractMessageWriter {
		    constructor() {
		        this.errorEmitter = new events_1.Emitter();
		        this.closeEmitter = new events_1.Emitter();
		    }
		    dispose() {
		        this.errorEmitter.dispose();
		        this.closeEmitter.dispose();
		    }
		    get onError() {
		        return this.errorEmitter.event;
		    }
		    fireError(error, message, count) {
		        this.errorEmitter.fire([this.asError(error), message, count]);
		    }
		    get onClose() {
		        return this.closeEmitter.event;
		    }
		    fireClose() {
		        this.closeEmitter.fire(undefined);
		    }
		    asError(error) {
		        if (error instanceof Error) {
		            return error;
		        }
		        else {
		            return new Error(`Writer received error. Reason: ${Is.string(error.message) ? error.message : 'unknown'}`);
		        }
		    }
		}
		exports.AbstractMessageWriter = AbstractMessageWriter;
		var ResolvedMessageWriterOptions;
		(function (ResolvedMessageWriterOptions) {
		    function fromOptions(options) {
		        var _a, _b;
		        if (options === undefined || typeof options === 'string') {
		            return { charset: options !== null && options !== void 0 ? options : 'utf-8', contentTypeEncoder: ral_1.default().applicationJson.encoder };
		        }
		        else {
		            return { charset: (_a = options.charset) !== null && _a !== void 0 ? _a : 'utf-8', contentEncoder: options.contentEncoder, contentTypeEncoder: (_b = options.contentTypeEncoder) !== null && _b !== void 0 ? _b : ral_1.default().applicationJson.encoder };
		        }
		    }
		    ResolvedMessageWriterOptions.fromOptions = fromOptions;
		})(ResolvedMessageWriterOptions || (ResolvedMessageWriterOptions = {}));
		class WriteableStreamMessageWriter extends AbstractMessageWriter {
		    constructor(writable, options) {
		        super();
		        this.writable = writable;
		        this.options = ResolvedMessageWriterOptions.fromOptions(options);
		        this.errorCount = 0;
		        this.writeSemaphore = new semaphore_1.Semaphore(1);
		        this.writable.onError((error) => this.fireError(error));
		        this.writable.onClose(() => this.fireClose());
		    }
		    async write(msg) {
		        return this.writeSemaphore.lock(async () => {
		            const payload = this.options.contentTypeEncoder.encode(msg, this.options).then((buffer) => {
		                if (this.options.contentEncoder !== undefined) {
		                    return this.options.contentEncoder.encode(buffer);
		                }
		                else {
		                    return buffer;
		                }
		            });
		            return payload.then((buffer) => {
		                const headers = [];
		                headers.push(ContentLength, buffer.byteLength.toString(), CRLF);
		                headers.push(CRLF);
		                return this.doWrite(msg, headers, buffer);
		            }, (error) => {
		                this.fireError(error);
		                throw error;
		            });
		        });
		    }
		    async doWrite(msg, headers, data) {
		        try {
		            await this.writable.write(headers.join(''), 'ascii');
		            return this.writable.write(data);
		        }
		        catch (error) {
		            this.handleError(error, msg);
		            return Promise.reject(error);
		        }
		    }
		    handleError(error, msg) {
		        this.errorCount++;
		        this.fireError(error, msg, this.errorCount);
		    }
		    end() {
		        this.writable.end();
		    }
		}
		exports.WriteableStreamMessageWriter = WriteableStreamMessageWriter;
		
} (messageWriter));
	return messageWriter;
}

var connection$1 = {};

var linkedMap = {};

var hasRequiredLinkedMap;

function requireLinkedMap () {
	if (hasRequiredLinkedMap) return linkedMap;
	hasRequiredLinkedMap = 1;
	(function (exports) {
		/*---------------------------------------------------------------------------------------------
		 *  Copyright (c) Microsoft Corporation. All rights reserved.
		 *  Licensed under the MIT License. See License.txt in the project root for license information.
		 *--------------------------------------------------------------------------------------------*/
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.LRUCache = exports.LinkedMap = exports.Touch = void 0;
		var Touch;
		(function (Touch) {
		    Touch.None = 0;
		    Touch.First = 1;
		    Touch.AsOld = Touch.First;
		    Touch.Last = 2;
		    Touch.AsNew = Touch.Last;
		})(Touch = exports.Touch || (exports.Touch = {}));
		class LinkedMap {
		    constructor() {
		        this[Symbol.toStringTag] = 'LinkedMap';
		        this._map = new Map();
		        this._head = undefined;
		        this._tail = undefined;
		        this._size = 0;
		        this._state = 0;
		    }
		    clear() {
		        this._map.clear();
		        this._head = undefined;
		        this._tail = undefined;
		        this._size = 0;
		        this._state++;
		    }
		    isEmpty() {
		        return !this._head && !this._tail;
		    }
		    get size() {
		        return this._size;
		    }
		    get first() {
		        var _a;
		        return (_a = this._head) === null || _a === void 0 ? void 0 : _a.value;
		    }
		    get last() {
		        var _a;
		        return (_a = this._tail) === null || _a === void 0 ? void 0 : _a.value;
		    }
		    has(key) {
		        return this._map.has(key);
		    }
		    get(key, touch = Touch.None) {
		        const item = this._map.get(key);
		        if (!item) {
		            return undefined;
		        }
		        if (touch !== Touch.None) {
		            this.touch(item, touch);
		        }
		        return item.value;
		    }
		    set(key, value, touch = Touch.None) {
		        let item = this._map.get(key);
		        if (item) {
		            item.value = value;
		            if (touch !== Touch.None) {
		                this.touch(item, touch);
		            }
		        }
		        else {
		            item = { key, value, next: undefined, previous: undefined };
		            switch (touch) {
		                case Touch.None:
		                    this.addItemLast(item);
		                    break;
		                case Touch.First:
		                    this.addItemFirst(item);
		                    break;
		                case Touch.Last:
		                    this.addItemLast(item);
		                    break;
		                default:
		                    this.addItemLast(item);
		                    break;
		            }
		            this._map.set(key, item);
		            this._size++;
		        }
		        return this;
		    }
		    delete(key) {
		        return !!this.remove(key);
		    }
		    remove(key) {
		        const item = this._map.get(key);
		        if (!item) {
		            return undefined;
		        }
		        this._map.delete(key);
		        this.removeItem(item);
		        this._size--;
		        return item.value;
		    }
		    shift() {
		        if (!this._head && !this._tail) {
		            return undefined;
		        }
		        if (!this._head || !this._tail) {
		            throw new Error('Invalid list');
		        }
		        const item = this._head;
		        this._map.delete(item.key);
		        this.removeItem(item);
		        this._size--;
		        return item.value;
		    }
		    forEach(callbackfn, thisArg) {
		        const state = this._state;
		        let current = this._head;
		        while (current) {
		            if (thisArg) {
		                callbackfn.bind(thisArg)(current.value, current.key, this);
		            }
		            else {
		                callbackfn(current.value, current.key, this);
		            }
		            if (this._state !== state) {
		                throw new Error(`LinkedMap got modified during iteration.`);
		            }
		            current = current.next;
		        }
		    }
		    keys() {
		        const map = this;
		        const state = this._state;
		        let current = this._head;
		        const iterator = {
		            [Symbol.iterator]() {
		                return iterator;
		            },
		            next() {
		                if (map._state !== state) {
		                    throw new Error(`LinkedMap got modified during iteration.`);
		                }
		                if (current) {
		                    const result = { value: current.key, done: false };
		                    current = current.next;
		                    return result;
		                }
		                else {
		                    return { value: undefined, done: true };
		                }
		            }
		        };
		        return iterator;
		    }
		    values() {
		        const map = this;
		        const state = this._state;
		        let current = this._head;
		        const iterator = {
		            [Symbol.iterator]() {
		                return iterator;
		            },
		            next() {
		                if (map._state !== state) {
		                    throw new Error(`LinkedMap got modified during iteration.`);
		                }
		                if (current) {
		                    const result = { value: current.value, done: false };
		                    current = current.next;
		                    return result;
		                }
		                else {
		                    return { value: undefined, done: true };
		                }
		            }
		        };
		        return iterator;
		    }
		    entries() {
		        const map = this;
		        const state = this._state;
		        let current = this._head;
		        const iterator = {
		            [Symbol.iterator]() {
		                return iterator;
		            },
		            next() {
		                if (map._state !== state) {
		                    throw new Error(`LinkedMap got modified during iteration.`);
		                }
		                if (current) {
		                    const result = { value: [current.key, current.value], done: false };
		                    current = current.next;
		                    return result;
		                }
		                else {
		                    return { value: undefined, done: true };
		                }
		            }
		        };
		        return iterator;
		    }
		    [Symbol.iterator]() {
		        return this.entries();
		    }
		    trimOld(newSize) {
		        if (newSize >= this.size) {
		            return;
		        }
		        if (newSize === 0) {
		            this.clear();
		            return;
		        }
		        let current = this._head;
		        let currentSize = this.size;
		        while (current && currentSize > newSize) {
		            this._map.delete(current.key);
		            current = current.next;
		            currentSize--;
		        }
		        this._head = current;
		        this._size = currentSize;
		        if (current) {
		            current.previous = undefined;
		        }
		        this._state++;
		    }
		    addItemFirst(item) {
		        // First time Insert
		        if (!this._head && !this._tail) {
		            this._tail = item;
		        }
		        else if (!this._head) {
		            throw new Error('Invalid list');
		        }
		        else {
		            item.next = this._head;
		            this._head.previous = item;
		        }
		        this._head = item;
		        this._state++;
		    }
		    addItemLast(item) {
		        // First time Insert
		        if (!this._head && !this._tail) {
		            this._head = item;
		        }
		        else if (!this._tail) {
		            throw new Error('Invalid list');
		        }
		        else {
		            item.previous = this._tail;
		            this._tail.next = item;
		        }
		        this._tail = item;
		        this._state++;
		    }
		    removeItem(item) {
		        if (item === this._head && item === this._tail) {
		            this._head = undefined;
		            this._tail = undefined;
		        }
		        else if (item === this._head) {
		            // This can only happend if size === 1 which is handle
		            // by the case above.
		            if (!item.next) {
		                throw new Error('Invalid list');
		            }
		            item.next.previous = undefined;
		            this._head = item.next;
		        }
		        else if (item === this._tail) {
		            // This can only happend if size === 1 which is handle
		            // by the case above.
		            if (!item.previous) {
		                throw new Error('Invalid list');
		            }
		            item.previous.next = undefined;
		            this._tail = item.previous;
		        }
		        else {
		            const next = item.next;
		            const previous = item.previous;
		            if (!next || !previous) {
		                throw new Error('Invalid list');
		            }
		            next.previous = previous;
		            previous.next = next;
		        }
		        item.next = undefined;
		        item.previous = undefined;
		        this._state++;
		    }
		    touch(item, touch) {
		        if (!this._head || !this._tail) {
		            throw new Error('Invalid list');
		        }
		        if ((touch !== Touch.First && touch !== Touch.Last)) {
		            return;
		        }
		        if (touch === Touch.First) {
		            if (item === this._head) {
		                return;
		            }
		            const next = item.next;
		            const previous = item.previous;
		            // Unlink the item
		            if (item === this._tail) {
		                // previous must be defined since item was not head but is tail
		                // So there are more than on item in the map
		                previous.next = undefined;
		                this._tail = previous;
		            }
		            else {
		                // Both next and previous are not undefined since item was neither head nor tail.
		                next.previous = previous;
		                previous.next = next;
		            }
		            // Insert the node at head
		            item.previous = undefined;
		            item.next = this._head;
		            this._head.previous = item;
		            this._head = item;
		            this._state++;
		        }
		        else if (touch === Touch.Last) {
		            if (item === this._tail) {
		                return;
		            }
		            const next = item.next;
		            const previous = item.previous;
		            // Unlink the item.
		            if (item === this._head) {
		                // next must be defined since item was not tail but is head
		                // So there are more than on item in the map
		                next.previous = undefined;
		                this._head = next;
		            }
		            else {
		                // Both next and previous are not undefined since item was neither head nor tail.
		                next.previous = previous;
		                previous.next = next;
		            }
		            item.next = undefined;
		            item.previous = this._tail;
		            this._tail.next = item;
		            this._tail = item;
		            this._state++;
		        }
		    }
		    toJSON() {
		        const data = [];
		        this.forEach((value, key) => {
		            data.push([key, value]);
		        });
		        return data;
		    }
		    fromJSON(data) {
		        this.clear();
		        for (const [key, value] of data) {
		            this.set(key, value);
		        }
		    }
		}
		exports.LinkedMap = LinkedMap;
		class LRUCache extends LinkedMap {
		    constructor(limit, ratio = 1) {
		        super();
		        this._limit = limit;
		        this._ratio = Math.min(Math.max(0, ratio), 1);
		    }
		    get limit() {
		        return this._limit;
		    }
		    set limit(limit) {
		        this._limit = limit;
		        this.checkTrim();
		    }
		    get ratio() {
		        return this._ratio;
		    }
		    set ratio(ratio) {
		        this._ratio = Math.min(Math.max(0, ratio), 1);
		        this.checkTrim();
		    }
		    get(key, touch = Touch.AsNew) {
		        return super.get(key, touch);
		    }
		    peek(key) {
		        return super.get(key, Touch.None);
		    }
		    set(key, value) {
		        super.set(key, value, Touch.Last);
		        this.checkTrim();
		        return this;
		    }
		    checkTrim() {
		        if (this.size > this._limit) {
		            this.trimOld(Math.round(this._limit * this._ratio));
		        }
		    }
		}
		exports.LRUCache = LRUCache;
		
} (linkedMap));
	return linkedMap;
}

var hasRequiredConnection;

function requireConnection () {
	if (hasRequiredConnection) return connection$1;
	hasRequiredConnection = 1;
	(function (exports) {
		/* --------------------------------------------------------------------------------------------
		 * Copyright (c) Microsoft Corporation. All rights reserved.
		 * Licensed under the MIT License. See License.txt in the project root for license information.
		 * ------------------------------------------------------------------------------------------ */
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.createMessageConnection = exports.ConnectionOptions = exports.CancellationStrategy = exports.CancellationSenderStrategy = exports.CancellationReceiverStrategy = exports.ConnectionStrategy = exports.ConnectionError = exports.ConnectionErrors = exports.LogTraceNotification = exports.SetTraceNotification = exports.TraceFormat = exports.Trace = exports.NullLogger = exports.ProgressType = void 0;
		const ral_1 = ral$1;
		const Is = requireIs();
		const messages_1 = requireMessages();
		const linkedMap_1 = requireLinkedMap();
		const events_1 = events;
		const cancellation_1 = requireCancellation();
		var CancelNotification;
		(function (CancelNotification) {
		    CancelNotification.type = new messages_1.NotificationType('$/cancelRequest');
		})(CancelNotification || (CancelNotification = {}));
		var ProgressNotification;
		(function (ProgressNotification) {
		    ProgressNotification.type = new messages_1.NotificationType('$/progress');
		})(ProgressNotification || (ProgressNotification = {}));
		class ProgressType {
		    constructor() {
		    }
		}
		exports.ProgressType = ProgressType;
		var StarRequestHandler;
		(function (StarRequestHandler) {
		    function is(value) {
		        return Is.func(value);
		    }
		    StarRequestHandler.is = is;
		})(StarRequestHandler || (StarRequestHandler = {}));
		exports.NullLogger = Object.freeze({
		    error: () => { },
		    warn: () => { },
		    info: () => { },
		    log: () => { }
		});
		var Trace;
		(function (Trace) {
		    Trace[Trace["Off"] = 0] = "Off";
		    Trace[Trace["Messages"] = 1] = "Messages";
		    Trace[Trace["Verbose"] = 2] = "Verbose";
		})(Trace = exports.Trace || (exports.Trace = {}));
		(function (Trace) {
		    function fromString(value) {
		        if (!Is.string(value)) {
		            return Trace.Off;
		        }
		        value = value.toLowerCase();
		        switch (value) {
		            case 'off':
		                return Trace.Off;
		            case 'messages':
		                return Trace.Messages;
		            case 'verbose':
		                return Trace.Verbose;
		            default:
		                return Trace.Off;
		        }
		    }
		    Trace.fromString = fromString;
		    function toString(value) {
		        switch (value) {
		            case Trace.Off:
		                return 'off';
		            case Trace.Messages:
		                return 'messages';
		            case Trace.Verbose:
		                return 'verbose';
		            default:
		                return 'off';
		        }
		    }
		    Trace.toString = toString;
		})(Trace = exports.Trace || (exports.Trace = {}));
		var TraceFormat;
		(function (TraceFormat) {
		    TraceFormat["Text"] = "text";
		    TraceFormat["JSON"] = "json";
		})(TraceFormat = exports.TraceFormat || (exports.TraceFormat = {}));
		(function (TraceFormat) {
		    function fromString(value) {
		        value = value.toLowerCase();
		        if (value === 'json') {
		            return TraceFormat.JSON;
		        }
		        else {
		            return TraceFormat.Text;
		        }
		    }
		    TraceFormat.fromString = fromString;
		})(TraceFormat = exports.TraceFormat || (exports.TraceFormat = {}));
		var SetTraceNotification;
		(function (SetTraceNotification) {
		    SetTraceNotification.type = new messages_1.NotificationType('$/setTrace');
		})(SetTraceNotification = exports.SetTraceNotification || (exports.SetTraceNotification = {}));
		var LogTraceNotification;
		(function (LogTraceNotification) {
		    LogTraceNotification.type = new messages_1.NotificationType('$/logTrace');
		})(LogTraceNotification = exports.LogTraceNotification || (exports.LogTraceNotification = {}));
		var ConnectionErrors;
		(function (ConnectionErrors) {
		    /**
		     * The connection is closed.
		     */
		    ConnectionErrors[ConnectionErrors["Closed"] = 1] = "Closed";
		    /**
		     * The connection got disposed.
		     */
		    ConnectionErrors[ConnectionErrors["Disposed"] = 2] = "Disposed";
		    /**
		     * The connection is already in listening mode.
		     */
		    ConnectionErrors[ConnectionErrors["AlreadyListening"] = 3] = "AlreadyListening";
		})(ConnectionErrors = exports.ConnectionErrors || (exports.ConnectionErrors = {}));
		class ConnectionError extends Error {
		    constructor(code, message) {
		        super(message);
		        this.code = code;
		        Object.setPrototypeOf(this, ConnectionError.prototype);
		    }
		}
		exports.ConnectionError = ConnectionError;
		var ConnectionStrategy;
		(function (ConnectionStrategy) {
		    function is(value) {
		        const candidate = value;
		        return candidate && Is.func(candidate.cancelUndispatched);
		    }
		    ConnectionStrategy.is = is;
		})(ConnectionStrategy = exports.ConnectionStrategy || (exports.ConnectionStrategy = {}));
		var CancellationReceiverStrategy;
		(function (CancellationReceiverStrategy) {
		    CancellationReceiverStrategy.Message = Object.freeze({
		        createCancellationTokenSource(_) {
		            return new cancellation_1.CancellationTokenSource();
		        }
		    });
		    function is(value) {
		        const candidate = value;
		        return candidate && Is.func(candidate.createCancellationTokenSource);
		    }
		    CancellationReceiverStrategy.is = is;
		})(CancellationReceiverStrategy = exports.CancellationReceiverStrategy || (exports.CancellationReceiverStrategy = {}));
		var CancellationSenderStrategy;
		(function (CancellationSenderStrategy) {
		    CancellationSenderStrategy.Message = Object.freeze({
		        sendCancellation(conn, id) {
		            conn.sendNotification(CancelNotification.type, { id });
		        },
		        cleanup(_) { }
		    });
		    function is(value) {
		        const candidate = value;
		        return candidate && Is.func(candidate.sendCancellation) && Is.func(candidate.cleanup);
		    }
		    CancellationSenderStrategy.is = is;
		})(CancellationSenderStrategy = exports.CancellationSenderStrategy || (exports.CancellationSenderStrategy = {}));
		var CancellationStrategy;
		(function (CancellationStrategy) {
		    CancellationStrategy.Message = Object.freeze({
		        receiver: CancellationReceiverStrategy.Message,
		        sender: CancellationSenderStrategy.Message
		    });
		    function is(value) {
		        const candidate = value;
		        return candidate && CancellationReceiverStrategy.is(candidate.receiver) && CancellationSenderStrategy.is(candidate.sender);
		    }
		    CancellationStrategy.is = is;
		})(CancellationStrategy = exports.CancellationStrategy || (exports.CancellationStrategy = {}));
		(function (ConnectionOptions) {
		    function is(value) {
		        const candidate = value;
		        return candidate && (CancellationStrategy.is(candidate.cancellationStrategy) || ConnectionStrategy.is(candidate.connectionStrategy));
		    }
		    ConnectionOptions.is = is;
		})(exports.ConnectionOptions || (exports.ConnectionOptions = {}));
		var ConnectionState;
		(function (ConnectionState) {
		    ConnectionState[ConnectionState["New"] = 1] = "New";
		    ConnectionState[ConnectionState["Listening"] = 2] = "Listening";
		    ConnectionState[ConnectionState["Closed"] = 3] = "Closed";
		    ConnectionState[ConnectionState["Disposed"] = 4] = "Disposed";
		})(ConnectionState || (ConnectionState = {}));
		function createMessageConnection(messageReader, messageWriter, _logger, options) {
		    const logger = _logger !== undefined ? _logger : exports.NullLogger;
		    let sequenceNumber = 0;
		    let notificationSquenceNumber = 0;
		    let unknownResponseSquenceNumber = 0;
		    const version = '2.0';
		    let starRequestHandler = undefined;
		    const requestHandlers = Object.create(null);
		    let starNotificationHandler = undefined;
		    const notificationHandlers = Object.create(null);
		    const progressHandlers = new Map();
		    let timer;
		    let messageQueue = new linkedMap_1.LinkedMap();
		    let responsePromises = Object.create(null);
		    let requestTokens = Object.create(null);
		    let trace = Trace.Off;
		    let traceFormat = TraceFormat.Text;
		    let tracer;
		    let state = ConnectionState.New;
		    const errorEmitter = new events_1.Emitter();
		    const closeEmitter = new events_1.Emitter();
		    const unhandledNotificationEmitter = new events_1.Emitter();
		    const unhandledProgressEmitter = new events_1.Emitter();
		    const disposeEmitter = new events_1.Emitter();
		    const cancellationStrategy = (options && options.cancellationStrategy) ? options.cancellationStrategy : CancellationStrategy.Message;
		    function createRequestQueueKey(id) {
		        if (id === null) {
		            throw new Error(`Can't send requests with id null since the response can't be correlated.`);
		        }
		        return 'req-' + id.toString();
		    }
		    function createResponseQueueKey(id) {
		        if (id === null) {
		            return 'res-unknown-' + (++unknownResponseSquenceNumber).toString();
		        }
		        else {
		            return 'res-' + id.toString();
		        }
		    }
		    function createNotificationQueueKey() {
		        return 'not-' + (++notificationSquenceNumber).toString();
		    }
		    function addMessageToQueue(queue, message) {
		        if (messages_1.isRequestMessage(message)) {
		            queue.set(createRequestQueueKey(message.id), message);
		        }
		        else if (messages_1.isResponseMessage(message)) {
		            queue.set(createResponseQueueKey(message.id), message);
		        }
		        else {
		            queue.set(createNotificationQueueKey(), message);
		        }
		    }
		    function cancelUndispatched(_message) {
		        return undefined;
		    }
		    function isListening() {
		        return state === ConnectionState.Listening;
		    }
		    function isClosed() {
		        return state === ConnectionState.Closed;
		    }
		    function isDisposed() {
		        return state === ConnectionState.Disposed;
		    }
		    function closeHandler() {
		        if (state === ConnectionState.New || state === ConnectionState.Listening) {
		            state = ConnectionState.Closed;
		            closeEmitter.fire(undefined);
		        }
		        // If the connection is disposed don't sent close events.
		    }
		    function readErrorHandler(error) {
		        errorEmitter.fire([error, undefined, undefined]);
		    }
		    function writeErrorHandler(data) {
		        errorEmitter.fire(data);
		    }
		    messageReader.onClose(closeHandler);
		    messageReader.onError(readErrorHandler);
		    messageWriter.onClose(closeHandler);
		    messageWriter.onError(writeErrorHandler);
		    function triggerMessageQueue() {
		        if (timer || messageQueue.size === 0) {
		            return;
		        }
		        timer = ral_1.default().timer.setImmediate(() => {
		            timer = undefined;
		            processMessageQueue();
		        });
		    }
		    function processMessageQueue() {
		        if (messageQueue.size === 0) {
		            return;
		        }
		        const message = messageQueue.shift();
		        try {
		            if (messages_1.isRequestMessage(message)) {
		                handleRequest(message);
		            }
		            else if (messages_1.isNotificationMessage(message)) {
		                handleNotification(message);
		            }
		            else if (messages_1.isResponseMessage(message)) {
		                handleResponse(message);
		            }
		            else {
		                handleInvalidMessage(message);
		            }
		        }
		        finally {
		            triggerMessageQueue();
		        }
		    }
		    const callback = (message) => {
		        try {
		            // We have received a cancellation message. Check if the message is still in the queue
		            // and cancel it if allowed to do so.
		            if (messages_1.isNotificationMessage(message) && message.method === CancelNotification.type.method) {
		                const key = createRequestQueueKey(message.params.id);
		                const toCancel = messageQueue.get(key);
		                if (messages_1.isRequestMessage(toCancel)) {
		                    const strategy = options === null || options === void 0 ? void 0 : options.connectionStrategy;
		                    const response = (strategy && strategy.cancelUndispatched) ? strategy.cancelUndispatched(toCancel, cancelUndispatched) : cancelUndispatched(toCancel);
		                    if (response && (response.error !== undefined || response.result !== undefined)) {
		                        messageQueue.delete(key);
		                        response.id = toCancel.id;
		                        traceSendingResponse(response, message.method, Date.now());
		                        messageWriter.write(response);
		                        return;
		                    }
		                }
		            }
		            addMessageToQueue(messageQueue, message);
		        }
		        finally {
		            triggerMessageQueue();
		        }
		    };
		    function handleRequest(requestMessage) {
		        if (isDisposed()) {
		            // we return here silently since we fired an event when the
		            // connection got disposed.
		            return;
		        }
		        function reply(resultOrError, method, startTime) {
		            const message = {
		                jsonrpc: version,
		                id: requestMessage.id
		            };
		            if (resultOrError instanceof messages_1.ResponseError) {
		                message.error = resultOrError.toJson();
		            }
		            else {
		                message.result = resultOrError === undefined ? null : resultOrError;
		            }
		            traceSendingResponse(message, method, startTime);
		            messageWriter.write(message);
		        }
		        function replyError(error, method, startTime) {
		            const message = {
		                jsonrpc: version,
		                id: requestMessage.id,
		                error: error.toJson()
		            };
		            traceSendingResponse(message, method, startTime);
		            messageWriter.write(message);
		        }
		        function replySuccess(result, method, startTime) {
		            // The JSON RPC defines that a response must either have a result or an error
		            // So we can't treat undefined as a valid response result.
		            if (result === undefined) {
		                result = null;
		            }
		            const message = {
		                jsonrpc: version,
		                id: requestMessage.id,
		                result: result
		            };
		            traceSendingResponse(message, method, startTime);
		            messageWriter.write(message);
		        }
		        traceReceivedRequest(requestMessage);
		        const element = requestHandlers[requestMessage.method];
		        let type;
		        let requestHandler;
		        if (element) {
		            type = element.type;
		            requestHandler = element.handler;
		        }
		        const startTime = Date.now();
		        if (requestHandler || starRequestHandler) {
		            const tokenKey = String(requestMessage.id);
		            const cancellationSource = cancellationStrategy.receiver.createCancellationTokenSource(tokenKey);
		            requestTokens[tokenKey] = cancellationSource;
		            try {
		                let handlerResult;
		                if (requestHandler) {
		                    if (requestMessage.params === undefined) {
		                        if (type !== undefined && type.numberOfParams !== 0) {
		                            replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InvalidParams, `Request ${requestMessage.method} defines ${type.numberOfParams} params but recevied none.`), requestMessage.method, startTime);
		                            return;
		                        }
		                        handlerResult = requestHandler(cancellationSource.token);
		                    }
		                    else if (Array.isArray(requestMessage.params)) {
		                        if (type !== undefined && type.parameterStructures === messages_1.ParameterStructures.byName) {
		                            replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InvalidParams, `Request ${requestMessage.method} defines parameters by name but received parameters by position`), requestMessage.method, startTime);
		                            return;
		                        }
		                        handlerResult = requestHandler(...requestMessage.params, cancellationSource.token);
		                    }
		                    else {
		                        if (type !== undefined && type.parameterStructures === messages_1.ParameterStructures.byPosition) {
		                            replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InvalidParams, `Request ${requestMessage.method} defines parameters by position but received parameters by name`), requestMessage.method, startTime);
		                            return;
		                        }
		                        handlerResult = requestHandler(requestMessage.params, cancellationSource.token);
		                    }
		                }
		                else if (starRequestHandler) {
		                    handlerResult = starRequestHandler(requestMessage.method, requestMessage.params, cancellationSource.token);
		                }
		                const promise = handlerResult;
		                if (!handlerResult) {
		                    delete requestTokens[tokenKey];
		                    replySuccess(handlerResult, requestMessage.method, startTime);
		                }
		                else if (promise.then) {
		                    promise.then((resultOrError) => {
		                        delete requestTokens[tokenKey];
		                        reply(resultOrError, requestMessage.method, startTime);
		                    }, error => {
		                        delete requestTokens[tokenKey];
		                        if (error instanceof messages_1.ResponseError) {
		                            replyError(error, requestMessage.method, startTime);
		                        }
		                        else if (error && Is.string(error.message)) {
		                            replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InternalError, `Request ${requestMessage.method} failed with message: ${error.message}`), requestMessage.method, startTime);
		                        }
		                        else {
		                            replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InternalError, `Request ${requestMessage.method} failed unexpectedly without providing any details.`), requestMessage.method, startTime);
		                        }
		                    });
		                }
		                else {
		                    delete requestTokens[tokenKey];
		                    reply(handlerResult, requestMessage.method, startTime);
		                }
		            }
		            catch (error) {
		                delete requestTokens[tokenKey];
		                if (error instanceof messages_1.ResponseError) {
		                    reply(error, requestMessage.method, startTime);
		                }
		                else if (error && Is.string(error.message)) {
		                    replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InternalError, `Request ${requestMessage.method} failed with message: ${error.message}`), requestMessage.method, startTime);
		                }
		                else {
		                    replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InternalError, `Request ${requestMessage.method} failed unexpectedly without providing any details.`), requestMessage.method, startTime);
		                }
		            }
		        }
		        else {
		            replyError(new messages_1.ResponseError(messages_1.ErrorCodes.MethodNotFound, `Unhandled method ${requestMessage.method}`), requestMessage.method, startTime);
		        }
		    }
		    function handleResponse(responseMessage) {
		        if (isDisposed()) {
		            // See handle request.
		            return;
		        }
		        if (responseMessage.id === null) {
		            if (responseMessage.error) {
		                logger.error(`Received response message without id: Error is: \n${JSON.stringify(responseMessage.error, undefined, 4)}`);
		            }
		            else {
		                logger.error(`Received response message without id. No further error information provided.`);
		            }
		        }
		        else {
		            const key = String(responseMessage.id);
		            const responsePromise = responsePromises[key];
		            traceReceivedResponse(responseMessage, responsePromise);
		            if (responsePromise) {
		                delete responsePromises[key];
		                try {
		                    if (responseMessage.error) {
		                        const error = responseMessage.error;
		                        responsePromise.reject(new messages_1.ResponseError(error.code, error.message, error.data));
		                    }
		                    else if (responseMessage.result !== undefined) {
		                        responsePromise.resolve(responseMessage.result);
		                    }
		                    else {
		                        throw new Error('Should never happen.');
		                    }
		                }
		                catch (error) {
		                    if (error.message) {
		                        logger.error(`Response handler '${responsePromise.method}' failed with message: ${error.message}`);
		                    }
		                    else {
		                        logger.error(`Response handler '${responsePromise.method}' failed unexpectedly.`);
		                    }
		                }
		            }
		        }
		    }
		    function handleNotification(message) {
		        if (isDisposed()) {
		            // See handle request.
		            return;
		        }
		        let type = undefined;
		        let notificationHandler;
		        if (message.method === CancelNotification.type.method) {
		            notificationHandler = (params) => {
		                const id = params.id;
		                const source = requestTokens[String(id)];
		                if (source) {
		                    source.cancel();
		                }
		            };
		        }
		        else {
		            const element = notificationHandlers[message.method];
		            if (element) {
		                notificationHandler = element.handler;
		                type = element.type;
		            }
		        }
		        if (notificationHandler || starNotificationHandler) {
		            try {
		                traceReceivedNotification(message);
		                if (notificationHandler) {
		                    if (message.params === undefined) {
		                        if (type !== undefined) {
		                            if (type.numberOfParams !== 0 && type.parameterStructures !== messages_1.ParameterStructures.byName) {
		                                logger.error(`Notification ${message.method} defines ${type.numberOfParams} params but recevied none.`);
		                            }
		                        }
		                        notificationHandler();
		                    }
		                    else if (Array.isArray(message.params)) {
		                        if (type !== undefined) {
		                            if (type.parameterStructures === messages_1.ParameterStructures.byName) {
		                                logger.error(`Notification ${message.method} defines parameters by name but received parameters by position`);
		                            }
		                            if (type.numberOfParams !== message.params.length) {
		                                logger.error(`Notification ${message.method} defines ${type.numberOfParams} params but received ${message.params.length} argumennts`);
		                            }
		                        }
		                        notificationHandler(...message.params);
		                    }
		                    else {
		                        if (type !== undefined && type.parameterStructures === messages_1.ParameterStructures.byPosition) {
		                            logger.error(`Notification ${message.method} defines parameters by position but received parameters by name`);
		                        }
		                        notificationHandler(message.params);
		                    }
		                }
		                else if (starNotificationHandler) {
		                    starNotificationHandler(message.method, message.params);
		                }
		            }
		            catch (error) {
		                if (error.message) {
		                    logger.error(`Notification handler '${message.method}' failed with message: ${error.message}`);
		                }
		                else {
		                    logger.error(`Notification handler '${message.method}' failed unexpectedly.`);
		                }
		            }
		        }
		        else {
		            unhandledNotificationEmitter.fire(message);
		        }
		    }
		    function handleInvalidMessage(message) {
		        if (!message) {
		            logger.error('Received empty message.');
		            return;
		        }
		        logger.error(`Received message which is neither a response nor a notification message:\n${JSON.stringify(message, null, 4)}`);
		        // Test whether we find an id to reject the promise
		        const responseMessage = message;
		        if (Is.string(responseMessage.id) || Is.number(responseMessage.id)) {
		            const key = String(responseMessage.id);
		            const responseHandler = responsePromises[key];
		            if (responseHandler) {
		                responseHandler.reject(new Error('The received response has neither a result nor an error property.'));
		            }
		        }
		    }
		    function traceSendingRequest(message) {
		        if (trace === Trace.Off || !tracer) {
		            return;
		        }
		        if (traceFormat === TraceFormat.Text) {
		            let data = undefined;
		            if (trace === Trace.Verbose && message.params) {
		                data = `Params: ${JSON.stringify(message.params, null, 4)}\n\n`;
		            }
		            tracer.log(`Sending request '${message.method} - (${message.id})'.`, data);
		        }
		        else {
		            logLSPMessage('send-request', message);
		        }
		    }
		    function traceSendingNotification(message) {
		        if (trace === Trace.Off || !tracer) {
		            return;
		        }
		        if (traceFormat === TraceFormat.Text) {
		            let data = undefined;
		            if (trace === Trace.Verbose) {
		                if (message.params) {
		                    data = `Params: ${JSON.stringify(message.params, null, 4)}\n\n`;
		                }
		                else {
		                    data = 'No parameters provided.\n\n';
		                }
		            }
		            tracer.log(`Sending notification '${message.method}'.`, data);
		        }
		        else {
		            logLSPMessage('send-notification', message);
		        }
		    }
		    function traceSendingResponse(message, method, startTime) {
		        if (trace === Trace.Off || !tracer) {
		            return;
		        }
		        if (traceFormat === TraceFormat.Text) {
		            let data = undefined;
		            if (trace === Trace.Verbose) {
		                if (message.error && message.error.data) {
		                    data = `Error data: ${JSON.stringify(message.error.data, null, 4)}\n\n`;
		                }
		                else {
		                    if (message.result) {
		                        data = `Result: ${JSON.stringify(message.result, null, 4)}\n\n`;
		                    }
		                    else if (message.error === undefined) {
		                        data = 'No result returned.\n\n';
		                    }
		                }
		            }
		            tracer.log(`Sending response '${method} - (${message.id})'. Processing request took ${Date.now() - startTime}ms`, data);
		        }
		        else {
		            logLSPMessage('send-response', message);
		        }
		    }
		    function traceReceivedRequest(message) {
		        if (trace === Trace.Off || !tracer) {
		            return;
		        }
		        if (traceFormat === TraceFormat.Text) {
		            let data = undefined;
		            if (trace === Trace.Verbose && message.params) {
		                data = `Params: ${JSON.stringify(message.params, null, 4)}\n\n`;
		            }
		            tracer.log(`Received request '${message.method} - (${message.id})'.`, data);
		        }
		        else {
		            logLSPMessage('receive-request', message);
		        }
		    }
		    function traceReceivedNotification(message) {
		        if (trace === Trace.Off || !tracer || message.method === LogTraceNotification.type.method) {
		            return;
		        }
		        if (traceFormat === TraceFormat.Text) {
		            let data = undefined;
		            if (trace === Trace.Verbose) {
		                if (message.params) {
		                    data = `Params: ${JSON.stringify(message.params, null, 4)}\n\n`;
		                }
		                else {
		                    data = 'No parameters provided.\n\n';
		                }
		            }
		            tracer.log(`Received notification '${message.method}'.`, data);
		        }
		        else {
		            logLSPMessage('receive-notification', message);
		        }
		    }
		    function traceReceivedResponse(message, responsePromise) {
		        if (trace === Trace.Off || !tracer) {
		            return;
		        }
		        if (traceFormat === TraceFormat.Text) {
		            let data = undefined;
		            if (trace === Trace.Verbose) {
		                if (message.error && message.error.data) {
		                    data = `Error data: ${JSON.stringify(message.error.data, null, 4)}\n\n`;
		                }
		                else {
		                    if (message.result) {
		                        data = `Result: ${JSON.stringify(message.result, null, 4)}\n\n`;
		                    }
		                    else if (message.error === undefined) {
		                        data = 'No result returned.\n\n';
		                    }
		                }
		            }
		            if (responsePromise) {
		                const error = message.error ? ` Request failed: ${message.error.message} (${message.error.code}).` : '';
		                tracer.log(`Received response '${responsePromise.method} - (${message.id})' in ${Date.now() - responsePromise.timerStart}ms.${error}`, data);
		            }
		            else {
		                tracer.log(`Received response ${message.id} without active response promise.`, data);
		            }
		        }
		        else {
		            logLSPMessage('receive-response', message);
		        }
		    }
		    function logLSPMessage(type, message) {
		        if (!tracer || trace === Trace.Off) {
		            return;
		        }
		        const lspMessage = {
		            isLSPMessage: true,
		            type,
		            message,
		            timestamp: Date.now()
		        };
		        tracer.log(lspMessage);
		    }
		    function throwIfClosedOrDisposed() {
		        if (isClosed()) {
		            throw new ConnectionError(ConnectionErrors.Closed, 'Connection is closed.');
		        }
		        if (isDisposed()) {
		            throw new ConnectionError(ConnectionErrors.Disposed, 'Connection is disposed.');
		        }
		    }
		    function throwIfListening() {
		        if (isListening()) {
		            throw new ConnectionError(ConnectionErrors.AlreadyListening, 'Connection is already listening');
		        }
		    }
		    function throwIfNotListening() {
		        if (!isListening()) {
		            throw new Error('Call listen() first.');
		        }
		    }
		    function undefinedToNull(param) {
		        if (param === undefined) {
		            return null;
		        }
		        else {
		            return param;
		        }
		    }
		    function nullToUndefined(param) {
		        if (param === null) {
		            return undefined;
		        }
		        else {
		            return param;
		        }
		    }
		    function isNamedParam(param) {
		        return param !== undefined && param !== null && !Array.isArray(param) && typeof param === 'object';
		    }
		    function computeSingleParam(parameterStructures, param) {
		        switch (parameterStructures) {
		            case messages_1.ParameterStructures.auto:
		                if (isNamedParam(param)) {
		                    return nullToUndefined(param);
		                }
		                else {
		                    return [undefinedToNull(param)];
		                }
		            case messages_1.ParameterStructures.byName:
		                if (!isNamedParam(param)) {
		                    throw new Error(`Recevied parameters by name but param is not an object literal.`);
		                }
		                return nullToUndefined(param);
		            case messages_1.ParameterStructures.byPosition:
		                return [undefinedToNull(param)];
		            default:
		                throw new Error(`Unknown parameter structure ${parameterStructures.toString()}`);
		        }
		    }
		    function computeMessageParams(type, params) {
		        let result;
		        const numberOfParams = type.numberOfParams;
		        switch (numberOfParams) {
		            case 0:
		                result = undefined;
		                break;
		            case 1:
		                result = computeSingleParam(type.parameterStructures, params[0]);
		                break;
		            default:
		                result = [];
		                for (let i = 0; i < params.length && i < numberOfParams; i++) {
		                    result.push(undefinedToNull(params[i]));
		                }
		                if (params.length < numberOfParams) {
		                    for (let i = params.length; i < numberOfParams; i++) {
		                        result.push(null);
		                    }
		                }
		                break;
		        }
		        return result;
		    }
		    const connection = {
		        sendNotification: (type, ...args) => {
		            throwIfClosedOrDisposed();
		            let method;
		            let messageParams;
		            if (Is.string(type)) {
		                method = type;
		                const first = args[0];
		                let paramStart = 0;
		                let parameterStructures = messages_1.ParameterStructures.auto;
		                if (messages_1.ParameterStructures.is(first)) {
		                    paramStart = 1;
		                    parameterStructures = first;
		                }
		                let paramEnd = args.length;
		                const numberOfParams = paramEnd - paramStart;
		                switch (numberOfParams) {
		                    case 0:
		                        messageParams = undefined;
		                        break;
		                    case 1:
		                        messageParams = computeSingleParam(parameterStructures, args[paramStart]);
		                        break;
		                    default:
		                        if (parameterStructures === messages_1.ParameterStructures.byName) {
		                            throw new Error(`Recevied ${numberOfParams} parameters for 'by Name' notification parameter structure.`);
		                        }
		                        messageParams = args.slice(paramStart, paramEnd).map(value => undefinedToNull(value));
		                        break;
		                }
		            }
		            else {
		                const params = args;
		                method = type.method;
		                messageParams = computeMessageParams(type, params);
		            }
		            const notificationMessage = {
		                jsonrpc: version,
		                method: method,
		                params: messageParams
		            };
		            traceSendingNotification(notificationMessage);
		            messageWriter.write(notificationMessage);
		        },
		        onNotification: (type, handler) => {
		            throwIfClosedOrDisposed();
		            let method;
		            if (Is.func(type)) {
		                starNotificationHandler = type;
		            }
		            else if (handler) {
		                if (Is.string(type)) {
		                    method = type;
		                    notificationHandlers[type] = { type: undefined, handler };
		                }
		                else {
		                    method = type.method;
		                    notificationHandlers[type.method] = { type, handler };
		                }
		            }
		            return {
		                dispose: () => {
		                    if (method !== undefined) {
		                        delete notificationHandlers[method];
		                    }
		                    else {
		                        starNotificationHandler = undefined;
		                    }
		                }
		            };
		        },
		        onProgress: (_type, token, handler) => {
		            if (progressHandlers.has(token)) {
		                throw new Error(`Progress handler for token ${token} already registered`);
		            }
		            progressHandlers.set(token, handler);
		            return {
		                dispose: () => {
		                    progressHandlers.delete(token);
		                }
		            };
		        },
		        sendProgress: (_type, token, value) => {
		            connection.sendNotification(ProgressNotification.type, { token, value });
		        },
		        onUnhandledProgress: unhandledProgressEmitter.event,
		        sendRequest: (type, ...args) => {
		            throwIfClosedOrDisposed();
		            throwIfNotListening();
		            let method;
		            let messageParams;
		            let token = undefined;
		            if (Is.string(type)) {
		                method = type;
		                const first = args[0];
		                const last = args[args.length - 1];
		                let paramStart = 0;
		                let parameterStructures = messages_1.ParameterStructures.auto;
		                if (messages_1.ParameterStructures.is(first)) {
		                    paramStart = 1;
		                    parameterStructures = first;
		                }
		                let paramEnd = args.length;
		                if (cancellation_1.CancellationToken.is(last)) {
		                    paramEnd = paramEnd - 1;
		                    token = last;
		                }
		                const numberOfParams = paramEnd - paramStart;
		                switch (numberOfParams) {
		                    case 0:
		                        messageParams = undefined;
		                        break;
		                    case 1:
		                        messageParams = computeSingleParam(parameterStructures, args[paramStart]);
		                        break;
		                    default:
		                        if (parameterStructures === messages_1.ParameterStructures.byName) {
		                            throw new Error(`Recevied ${numberOfParams} parameters for 'by Name' request parameter structure.`);
		                        }
		                        messageParams = args.slice(paramStart, paramEnd).map(value => undefinedToNull(value));
		                        break;
		                }
		            }
		            else {
		                const params = args;
		                method = type.method;
		                messageParams = computeMessageParams(type, params);
		                const numberOfParams = type.numberOfParams;
		                token = cancellation_1.CancellationToken.is(params[numberOfParams]) ? params[numberOfParams] : undefined;
		            }
		            const id = sequenceNumber++;
		            let disposable;
		            if (token) {
		                disposable = token.onCancellationRequested(() => {
		                    cancellationStrategy.sender.sendCancellation(connection, id);
		                });
		            }
		            const result = new Promise((resolve, reject) => {
		                const requestMessage = {
		                    jsonrpc: version,
		                    id: id,
		                    method: method,
		                    params: messageParams
		                };
		                const resolveWithCleanup = (r) => {
		                    resolve(r);
		                    cancellationStrategy.sender.cleanup(id);
		                    disposable === null || disposable === void 0 ? void 0 : disposable.dispose();
		                };
		                const rejectWithCleanup = (r) => {
		                    reject(r);
		                    cancellationStrategy.sender.cleanup(id);
		                    disposable === null || disposable === void 0 ? void 0 : disposable.dispose();
		                };
		                let responsePromise = { method: method, timerStart: Date.now(), resolve: resolveWithCleanup, reject: rejectWithCleanup };
		                traceSendingRequest(requestMessage);
		                try {
		                    messageWriter.write(requestMessage);
		                }
		                catch (e) {
		                    // Writing the message failed. So we need to reject the promise.
		                    responsePromise.reject(new messages_1.ResponseError(messages_1.ErrorCodes.MessageWriteError, e.message ? e.message : 'Unknown reason'));
		                    responsePromise = null;
		                }
		                if (responsePromise) {
		                    responsePromises[String(id)] = responsePromise;
		                }
		            });
		            return result;
		        },
		        onRequest: (type, handler) => {
		            throwIfClosedOrDisposed();
		            let method = null;
		            if (StarRequestHandler.is(type)) {
		                method = undefined;
		                starRequestHandler = type;
		            }
		            else if (Is.string(type)) {
		                method = null;
		                if (handler !== undefined) {
		                    method = type;
		                    requestHandlers[type] = { handler: handler, type: undefined };
		                }
		            }
		            else {
		                if (handler !== undefined) {
		                    method = type.method;
		                    requestHandlers[type.method] = { type, handler };
		                }
		            }
		            return {
		                dispose: () => {
		                    if (method === null) {
		                        return;
		                    }
		                    if (method !== undefined) {
		                        delete requestHandlers[method];
		                    }
		                    else {
		                        starRequestHandler = undefined;
		                    }
		                }
		            };
		        },
		        trace: (_value, _tracer, sendNotificationOrTraceOptions) => {
		            let _sendNotification = false;
		            let _traceFormat = TraceFormat.Text;
		            if (sendNotificationOrTraceOptions !== undefined) {
		                if (Is.boolean(sendNotificationOrTraceOptions)) {
		                    _sendNotification = sendNotificationOrTraceOptions;
		                }
		                else {
		                    _sendNotification = sendNotificationOrTraceOptions.sendNotification || false;
		                    _traceFormat = sendNotificationOrTraceOptions.traceFormat || TraceFormat.Text;
		                }
		            }
		            trace = _value;
		            traceFormat = _traceFormat;
		            if (trace === Trace.Off) {
		                tracer = undefined;
		            }
		            else {
		                tracer = _tracer;
		            }
		            if (_sendNotification && !isClosed() && !isDisposed()) {
		                connection.sendNotification(SetTraceNotification.type, { value: Trace.toString(_value) });
		            }
		        },
		        onError: errorEmitter.event,
		        onClose: closeEmitter.event,
		        onUnhandledNotification: unhandledNotificationEmitter.event,
		        onDispose: disposeEmitter.event,
		        end: () => {
		            messageWriter.end();
		        },
		        dispose: () => {
		            if (isDisposed()) {
		                return;
		            }
		            state = ConnectionState.Disposed;
		            disposeEmitter.fire(undefined);
		            const error = new Error('Connection got disposed.');
		            Object.keys(responsePromises).forEach((key) => {
		                responsePromises[key].reject(error);
		            });
		            responsePromises = Object.create(null);
		            requestTokens = Object.create(null);
		            messageQueue = new linkedMap_1.LinkedMap();
		            // Test for backwards compatibility
		            if (Is.func(messageWriter.dispose)) {
		                messageWriter.dispose();
		            }
		            if (Is.func(messageReader.dispose)) {
		                messageReader.dispose();
		            }
		        },
		        listen: () => {
		            throwIfClosedOrDisposed();
		            throwIfListening();
		            state = ConnectionState.Listening;
		            messageReader.listen(callback);
		        },
		        inspect: () => {
		            // eslint-disable-next-line no-console
		            ral_1.default().console.log('inspect');
		        }
		    };
		    connection.onNotification(LogTraceNotification.type, (params) => {
		        if (trace === Trace.Off || !tracer) {
		            return;
		        }
		        tracer.log(params.message, trace === Trace.Verbose ? params.verbose : undefined);
		    });
		    connection.onNotification(ProgressNotification.type, (params) => {
		        const handler = progressHandlers.get(params.token);
		        if (handler) {
		            handler(params.value);
		        }
		        else {
		            unhandledProgressEmitter.fire(params);
		        }
		    });
		    return connection;
		}
		exports.createMessageConnection = createMessageConnection;
		
} (connection$1));
	return connection$1;
}

var hasRequiredApi;

function requireApi () {
	if (hasRequiredApi) return api$1;
	hasRequiredApi = 1;
	(function (exports) {
		/* --------------------------------------------------------------------------------------------
		 * Copyright (c) Microsoft Corporation. All rights reserved.
		 * Licensed under the MIT License. See License.txt in the project root for license information.
		 * ------------------------------------------------------------------------------------------ */
		/// <reference path="../../typings/thenable.d.ts" />
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.CancellationSenderStrategy = exports.CancellationReceiverStrategy = exports.ConnectionError = exports.ConnectionErrors = exports.LogTraceNotification = exports.SetTraceNotification = exports.TraceFormat = exports.Trace = exports.ProgressType = exports.createMessageConnection = exports.NullLogger = exports.ConnectionOptions = exports.ConnectionStrategy = exports.WriteableStreamMessageWriter = exports.AbstractMessageWriter = exports.MessageWriter = exports.ReadableStreamMessageReader = exports.AbstractMessageReader = exports.MessageReader = exports.CancellationToken = exports.CancellationTokenSource = exports.Emitter = exports.Event = exports.Disposable = exports.ParameterStructures = exports.NotificationType9 = exports.NotificationType8 = exports.NotificationType7 = exports.NotificationType6 = exports.NotificationType5 = exports.NotificationType4 = exports.NotificationType3 = exports.NotificationType2 = exports.NotificationType1 = exports.NotificationType0 = exports.NotificationType = exports.ErrorCodes = exports.ResponseError = exports.RequestType9 = exports.RequestType8 = exports.RequestType7 = exports.RequestType6 = exports.RequestType5 = exports.RequestType4 = exports.RequestType3 = exports.RequestType2 = exports.RequestType1 = exports.RequestType0 = exports.RequestType = exports.RAL = void 0;
		exports.CancellationStrategy = void 0;
		const messages_1 = requireMessages();
		Object.defineProperty(exports, "RequestType", { enumerable: true, get: function () { return messages_1.RequestType; } });
		Object.defineProperty(exports, "RequestType0", { enumerable: true, get: function () { return messages_1.RequestType0; } });
		Object.defineProperty(exports, "RequestType1", { enumerable: true, get: function () { return messages_1.RequestType1; } });
		Object.defineProperty(exports, "RequestType2", { enumerable: true, get: function () { return messages_1.RequestType2; } });
		Object.defineProperty(exports, "RequestType3", { enumerable: true, get: function () { return messages_1.RequestType3; } });
		Object.defineProperty(exports, "RequestType4", { enumerable: true, get: function () { return messages_1.RequestType4; } });
		Object.defineProperty(exports, "RequestType5", { enumerable: true, get: function () { return messages_1.RequestType5; } });
		Object.defineProperty(exports, "RequestType6", { enumerable: true, get: function () { return messages_1.RequestType6; } });
		Object.defineProperty(exports, "RequestType7", { enumerable: true, get: function () { return messages_1.RequestType7; } });
		Object.defineProperty(exports, "RequestType8", { enumerable: true, get: function () { return messages_1.RequestType8; } });
		Object.defineProperty(exports, "RequestType9", { enumerable: true, get: function () { return messages_1.RequestType9; } });
		Object.defineProperty(exports, "ResponseError", { enumerable: true, get: function () { return messages_1.ResponseError; } });
		Object.defineProperty(exports, "ErrorCodes", { enumerable: true, get: function () { return messages_1.ErrorCodes; } });
		Object.defineProperty(exports, "NotificationType", { enumerable: true, get: function () { return messages_1.NotificationType; } });
		Object.defineProperty(exports, "NotificationType0", { enumerable: true, get: function () { return messages_1.NotificationType0; } });
		Object.defineProperty(exports, "NotificationType1", { enumerable: true, get: function () { return messages_1.NotificationType1; } });
		Object.defineProperty(exports, "NotificationType2", { enumerable: true, get: function () { return messages_1.NotificationType2; } });
		Object.defineProperty(exports, "NotificationType3", { enumerable: true, get: function () { return messages_1.NotificationType3; } });
		Object.defineProperty(exports, "NotificationType4", { enumerable: true, get: function () { return messages_1.NotificationType4; } });
		Object.defineProperty(exports, "NotificationType5", { enumerable: true, get: function () { return messages_1.NotificationType5; } });
		Object.defineProperty(exports, "NotificationType6", { enumerable: true, get: function () { return messages_1.NotificationType6; } });
		Object.defineProperty(exports, "NotificationType7", { enumerable: true, get: function () { return messages_1.NotificationType7; } });
		Object.defineProperty(exports, "NotificationType8", { enumerable: true, get: function () { return messages_1.NotificationType8; } });
		Object.defineProperty(exports, "NotificationType9", { enumerable: true, get: function () { return messages_1.NotificationType9; } });
		Object.defineProperty(exports, "ParameterStructures", { enumerable: true, get: function () { return messages_1.ParameterStructures; } });
		const disposable_1 = disposable;
		Object.defineProperty(exports, "Disposable", { enumerable: true, get: function () { return disposable_1.Disposable; } });
		const events_1 = events;
		Object.defineProperty(exports, "Event", { enumerable: true, get: function () { return events_1.Event; } });
		Object.defineProperty(exports, "Emitter", { enumerable: true, get: function () { return events_1.Emitter; } });
		const cancellation_1 = requireCancellation();
		Object.defineProperty(exports, "CancellationTokenSource", { enumerable: true, get: function () { return cancellation_1.CancellationTokenSource; } });
		Object.defineProperty(exports, "CancellationToken", { enumerable: true, get: function () { return cancellation_1.CancellationToken; } });
		const messageReader_1 = requireMessageReader();
		Object.defineProperty(exports, "MessageReader", { enumerable: true, get: function () { return messageReader_1.MessageReader; } });
		Object.defineProperty(exports, "AbstractMessageReader", { enumerable: true, get: function () { return messageReader_1.AbstractMessageReader; } });
		Object.defineProperty(exports, "ReadableStreamMessageReader", { enumerable: true, get: function () { return messageReader_1.ReadableStreamMessageReader; } });
		const messageWriter_1 = requireMessageWriter();
		Object.defineProperty(exports, "MessageWriter", { enumerable: true, get: function () { return messageWriter_1.MessageWriter; } });
		Object.defineProperty(exports, "AbstractMessageWriter", { enumerable: true, get: function () { return messageWriter_1.AbstractMessageWriter; } });
		Object.defineProperty(exports, "WriteableStreamMessageWriter", { enumerable: true, get: function () { return messageWriter_1.WriteableStreamMessageWriter; } });
		const connection_1 = requireConnection();
		Object.defineProperty(exports, "ConnectionStrategy", { enumerable: true, get: function () { return connection_1.ConnectionStrategy; } });
		Object.defineProperty(exports, "ConnectionOptions", { enumerable: true, get: function () { return connection_1.ConnectionOptions; } });
		Object.defineProperty(exports, "NullLogger", { enumerable: true, get: function () { return connection_1.NullLogger; } });
		Object.defineProperty(exports, "createMessageConnection", { enumerable: true, get: function () { return connection_1.createMessageConnection; } });
		Object.defineProperty(exports, "ProgressType", { enumerable: true, get: function () { return connection_1.ProgressType; } });
		Object.defineProperty(exports, "Trace", { enumerable: true, get: function () { return connection_1.Trace; } });
		Object.defineProperty(exports, "TraceFormat", { enumerable: true, get: function () { return connection_1.TraceFormat; } });
		Object.defineProperty(exports, "SetTraceNotification", { enumerable: true, get: function () { return connection_1.SetTraceNotification; } });
		Object.defineProperty(exports, "LogTraceNotification", { enumerable: true, get: function () { return connection_1.LogTraceNotification; } });
		Object.defineProperty(exports, "ConnectionErrors", { enumerable: true, get: function () { return connection_1.ConnectionErrors; } });
		Object.defineProperty(exports, "ConnectionError", { enumerable: true, get: function () { return connection_1.ConnectionError; } });
		Object.defineProperty(exports, "CancellationReceiverStrategy", { enumerable: true, get: function () { return connection_1.CancellationReceiverStrategy; } });
		Object.defineProperty(exports, "CancellationSenderStrategy", { enumerable: true, get: function () { return connection_1.CancellationSenderStrategy; } });
		Object.defineProperty(exports, "CancellationStrategy", { enumerable: true, get: function () { return connection_1.CancellationStrategy; } });
		const ral_1 = ral$1;
		exports.RAL = ral_1.default;
		
} (api$1));
	return api$1;
}

(function (exports) {
	/* --------------------------------------------------------------------------------------------
	 * Copyright (c) Microsoft Corporation. All rights reserved.
	 * Licensed under the MIT License. See License.txt in the project root for license information.
	 * ------------------------------------------------------------------------------------------ */
	var __createBinding = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __exportStar = (commonjsGlobal && commonjsGlobal.__exportStar) || function(m, exports) {
	    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.createMessageConnection = exports.BrowserMessageWriter = exports.BrowserMessageReader = void 0;
	const ril_1 = ril;
	// Install the browser runtime abstract.
	ril_1.default.install();
	const api_1 = requireApi();
	__exportStar(requireApi(), exports);
	class BrowserMessageReader extends api_1.AbstractMessageReader {
	    constructor(context) {
	        super();
	        this._onData = new api_1.Emitter();
	        this._messageListener = (event) => {
	            this._onData.fire(event.data);
	        };
	        context.addEventListener('error', (event) => this.fireError(event));
	        context.onmessage = this._messageListener;
	    }
	    listen(callback) {
	        return this._onData.event(callback);
	    }
	}
	exports.BrowserMessageReader = BrowserMessageReader;
	class BrowserMessageWriter extends api_1.AbstractMessageWriter {
	    constructor(context) {
	        super();
	        this.context = context;
	        this.errorCount = 0;
	        context.addEventListener('error', (event) => this.fireError(event));
	    }
	    write(msg) {
	        try {
	            this.context.postMessage(msg);
	            return Promise.resolve();
	        }
	        catch (error) {
	            this.handleError(error, msg);
	            return Promise.reject(error);
	        }
	    }
	    handleError(error, msg) {
	        this.errorCount++;
	        this.fireError(error, msg, this.errorCount);
	    }
	    end() {
	    }
	}
	exports.BrowserMessageWriter = BrowserMessageWriter;
	function createMessageConnection(reader, writer, logger, options) {
	    if (logger === undefined) {
	        logger = api_1.NullLogger;
	    }
	    if (api_1.ConnectionStrategy.is(options)) {
	        options = { connectionStrategy: options };
	    }
	    return api_1.createMessageConnection(reader, writer, logger, options);
	}
	exports.createMessageConnection = createMessageConnection;
	
} (main$2));

/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ----------------------------------------------------------------------------------------- */

(function (module) {

	module.exports = main$2;
} (browser));

var api = {};

/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
var integer$1;
(function (integer) {
    integer.MIN_VALUE = -2147483648;
    integer.MAX_VALUE = 2147483647;
})(integer$1 || (integer$1 = {}));
var uinteger$1;
(function (uinteger) {
    uinteger.MIN_VALUE = 0;
    uinteger.MAX_VALUE = 2147483647;
})(uinteger$1 || (uinteger$1 = {}));
/**
 * The Position namespace provides helper functions to work with
 * [Position](#Position) literals.
 */
var Position$1;
(function (Position) {
    /**
     * Creates a new Position literal from the given line and character.
     * @param line The position's line.
     * @param character The position's character.
     */
    function create(line, character) {
        if (line === Number.MAX_VALUE) {
            line = uinteger$1.MAX_VALUE;
        }
        if (character === Number.MAX_VALUE) {
            character = uinteger$1.MAX_VALUE;
        }
        return { line: line, character: character };
    }
    Position.create = create;
    /**
     * Checks whether the given literal conforms to the [Position](#Position) interface.
     */
    function is(value) {
        var candidate = value;
        return Is$1.objectLiteral(candidate) && Is$1.uinteger(candidate.line) && Is$1.uinteger(candidate.character);
    }
    Position.is = is;
})(Position$1 || (Position$1 = {}));
/**
 * The Range namespace provides helper functions to work with
 * [Range](#Range) literals.
 */
var Range$1;
(function (Range) {
    function create(one, two, three, four) {
        if (Is$1.uinteger(one) && Is$1.uinteger(two) && Is$1.uinteger(three) && Is$1.uinteger(four)) {
            return { start: Position$1.create(one, two), end: Position$1.create(three, four) };
        }
        else if (Position$1.is(one) && Position$1.is(two)) {
            return { start: one, end: two };
        }
        else {
            throw new Error("Range#create called with invalid arguments[" + one + ", " + two + ", " + three + ", " + four + "]");
        }
    }
    Range.create = create;
    /**
     * Checks whether the given literal conforms to the [Range](#Range) interface.
     */
    function is(value) {
        var candidate = value;
        return Is$1.objectLiteral(candidate) && Position$1.is(candidate.start) && Position$1.is(candidate.end);
    }
    Range.is = is;
})(Range$1 || (Range$1 = {}));
/**
 * The Location namespace provides helper functions to work with
 * [Location](#Location) literals.
 */
var Location$1;
(function (Location) {
    /**
     * Creates a Location literal.
     * @param uri The location's uri.
     * @param range The location's range.
     */
    function create(uri, range) {
        return { uri: uri, range: range };
    }
    Location.create = create;
    /**
     * Checks whether the given literal conforms to the [Location](#Location) interface.
     */
    function is(value) {
        var candidate = value;
        return Is$1.defined(candidate) && Range$1.is(candidate.range) && (Is$1.string(candidate.uri) || Is$1.undefined(candidate.uri));
    }
    Location.is = is;
})(Location$1 || (Location$1 = {}));
/**
 * The LocationLink namespace provides helper functions to work with
 * [LocationLink](#LocationLink) literals.
 */
var LocationLink$1;
(function (LocationLink) {
    /**
     * Creates a LocationLink literal.
     * @param targetUri The definition's uri.
     * @param targetRange The full range of the definition.
     * @param targetSelectionRange The span of the symbol definition at the target.
     * @param originSelectionRange The span of the symbol being defined in the originating source file.
     */
    function create(targetUri, targetRange, targetSelectionRange, originSelectionRange) {
        return { targetUri: targetUri, targetRange: targetRange, targetSelectionRange: targetSelectionRange, originSelectionRange: originSelectionRange };
    }
    LocationLink.create = create;
    /**
     * Checks whether the given literal conforms to the [LocationLink](#LocationLink) interface.
     */
    function is(value) {
        var candidate = value;
        return Is$1.defined(candidate) && Range$1.is(candidate.targetRange) && Is$1.string(candidate.targetUri)
            && (Range$1.is(candidate.targetSelectionRange) || Is$1.undefined(candidate.targetSelectionRange))
            && (Range$1.is(candidate.originSelectionRange) || Is$1.undefined(candidate.originSelectionRange));
    }
    LocationLink.is = is;
})(LocationLink$1 || (LocationLink$1 = {}));
/**
 * The Color namespace provides helper functions to work with
 * [Color](#Color) literals.
 */
var Color$1;
(function (Color) {
    /**
     * Creates a new Color literal.
     */
    function create(red, green, blue, alpha) {
        return {
            red: red,
            green: green,
            blue: blue,
            alpha: alpha,
        };
    }
    Color.create = create;
    /**
     * Checks whether the given literal conforms to the [Color](#Color) interface.
     */
    function is(value) {
        var candidate = value;
        return Is$1.numberRange(candidate.red, 0, 1)
            && Is$1.numberRange(candidate.green, 0, 1)
            && Is$1.numberRange(candidate.blue, 0, 1)
            && Is$1.numberRange(candidate.alpha, 0, 1);
    }
    Color.is = is;
})(Color$1 || (Color$1 = {}));
/**
 * The ColorInformation namespace provides helper functions to work with
 * [ColorInformation](#ColorInformation) literals.
 */
var ColorInformation$1;
(function (ColorInformation) {
    /**
     * Creates a new ColorInformation literal.
     */
    function create(range, color) {
        return {
            range: range,
            color: color,
        };
    }
    ColorInformation.create = create;
    /**
     * Checks whether the given literal conforms to the [ColorInformation](#ColorInformation) interface.
     */
    function is(value) {
        var candidate = value;
        return Range$1.is(candidate.range) && Color$1.is(candidate.color);
    }
    ColorInformation.is = is;
})(ColorInformation$1 || (ColorInformation$1 = {}));
/**
 * The Color namespace provides helper functions to work with
 * [ColorPresentation](#ColorPresentation) literals.
 */
var ColorPresentation$1;
(function (ColorPresentation) {
    /**
     * Creates a new ColorInformation literal.
     */
    function create(label, textEdit, additionalTextEdits) {
        return {
            label: label,
            textEdit: textEdit,
            additionalTextEdits: additionalTextEdits,
        };
    }
    ColorPresentation.create = create;
    /**
     * Checks whether the given literal conforms to the [ColorInformation](#ColorInformation) interface.
     */
    function is(value) {
        var candidate = value;
        return Is$1.string(candidate.label)
            && (Is$1.undefined(candidate.textEdit) || TextEdit$1.is(candidate))
            && (Is$1.undefined(candidate.additionalTextEdits) || Is$1.typedArray(candidate.additionalTextEdits, TextEdit$1.is));
    }
    ColorPresentation.is = is;
})(ColorPresentation$1 || (ColorPresentation$1 = {}));
/**
 * Enum of known range kinds
 */
var FoldingRangeKind$1;
(function (FoldingRangeKind) {
    /**
     * Folding range for a comment
     */
    FoldingRangeKind["Comment"] = "comment";
    /**
     * Folding range for a imports or includes
     */
    FoldingRangeKind["Imports"] = "imports";
    /**
     * Folding range for a region (e.g. `#region`)
     */
    FoldingRangeKind["Region"] = "region";
})(FoldingRangeKind$1 || (FoldingRangeKind$1 = {}));
/**
 * The folding range namespace provides helper functions to work with
 * [FoldingRange](#FoldingRange) literals.
 */
var FoldingRange$1;
(function (FoldingRange) {
    /**
     * Creates a new FoldingRange literal.
     */
    function create(startLine, endLine, startCharacter, endCharacter, kind) {
        var result = {
            startLine: startLine,
            endLine: endLine
        };
        if (Is$1.defined(startCharacter)) {
            result.startCharacter = startCharacter;
        }
        if (Is$1.defined(endCharacter)) {
            result.endCharacter = endCharacter;
        }
        if (Is$1.defined(kind)) {
            result.kind = kind;
        }
        return result;
    }
    FoldingRange.create = create;
    /**
     * Checks whether the given literal conforms to the [FoldingRange](#FoldingRange) interface.
     */
    function is(value) {
        var candidate = value;
        return Is$1.uinteger(candidate.startLine) && Is$1.uinteger(candidate.startLine)
            && (Is$1.undefined(candidate.startCharacter) || Is$1.uinteger(candidate.startCharacter))
            && (Is$1.undefined(candidate.endCharacter) || Is$1.uinteger(candidate.endCharacter))
            && (Is$1.undefined(candidate.kind) || Is$1.string(candidate.kind));
    }
    FoldingRange.is = is;
})(FoldingRange$1 || (FoldingRange$1 = {}));
/**
 * The DiagnosticRelatedInformation namespace provides helper functions to work with
 * [DiagnosticRelatedInformation](#DiagnosticRelatedInformation) literals.
 */
var DiagnosticRelatedInformation$1;
(function (DiagnosticRelatedInformation) {
    /**
     * Creates a new DiagnosticRelatedInformation literal.
     */
    function create(location, message) {
        return {
            location: location,
            message: message
        };
    }
    DiagnosticRelatedInformation.create = create;
    /**
     * Checks whether the given literal conforms to the [DiagnosticRelatedInformation](#DiagnosticRelatedInformation) interface.
     */
    function is(value) {
        var candidate = value;
        return Is$1.defined(candidate) && Location$1.is(candidate.location) && Is$1.string(candidate.message);
    }
    DiagnosticRelatedInformation.is = is;
})(DiagnosticRelatedInformation$1 || (DiagnosticRelatedInformation$1 = {}));
/**
 * The diagnostic's severity.
 */
var DiagnosticSeverity$1;
(function (DiagnosticSeverity) {
    /**
     * Reports an error.
     */
    DiagnosticSeverity.Error = 1;
    /**
     * Reports a warning.
     */
    DiagnosticSeverity.Warning = 2;
    /**
     * Reports an information.
     */
    DiagnosticSeverity.Information = 3;
    /**
     * Reports a hint.
     */
    DiagnosticSeverity.Hint = 4;
})(DiagnosticSeverity$1 || (DiagnosticSeverity$1 = {}));
/**
 * The diagnostic tags.
 *
 * @since 3.15.0
 */
var DiagnosticTag$1;
(function (DiagnosticTag) {
    /**
     * Unused or unnecessary code.
     *
     * Clients are allowed to render diagnostics with this tag faded out instead of having
     * an error squiggle.
     */
    DiagnosticTag.Unnecessary = 1;
    /**
     * Deprecated or obsolete code.
     *
     * Clients are allowed to rendered diagnostics with this tag strike through.
     */
    DiagnosticTag.Deprecated = 2;
})(DiagnosticTag$1 || (DiagnosticTag$1 = {}));
/**
 * The CodeDescription namespace provides functions to deal with descriptions for diagnostic codes.
 *
 * @since 3.16.0
 */
var CodeDescription$1;
(function (CodeDescription) {
    function is(value) {
        var candidate = value;
        return candidate !== undefined && candidate !== null && Is$1.string(candidate.href);
    }
    CodeDescription.is = is;
})(CodeDescription$1 || (CodeDescription$1 = {}));
/**
 * The Diagnostic namespace provides helper functions to work with
 * [Diagnostic](#Diagnostic) literals.
 */
var Diagnostic$1;
(function (Diagnostic) {
    /**
     * Creates a new Diagnostic literal.
     */
    function create(range, message, severity, code, source, relatedInformation) {
        var result = { range: range, message: message };
        if (Is$1.defined(severity)) {
            result.severity = severity;
        }
        if (Is$1.defined(code)) {
            result.code = code;
        }
        if (Is$1.defined(source)) {
            result.source = source;
        }
        if (Is$1.defined(relatedInformation)) {
            result.relatedInformation = relatedInformation;
        }
        return result;
    }
    Diagnostic.create = create;
    /**
     * Checks whether the given literal conforms to the [Diagnostic](#Diagnostic) interface.
     */
    function is(value) {
        var _a;
        var candidate = value;
        return Is$1.defined(candidate)
            && Range$1.is(candidate.range)
            && Is$1.string(candidate.message)
            && (Is$1.number(candidate.severity) || Is$1.undefined(candidate.severity))
            && (Is$1.integer(candidate.code) || Is$1.string(candidate.code) || Is$1.undefined(candidate.code))
            && (Is$1.undefined(candidate.codeDescription) || (Is$1.string((_a = candidate.codeDescription) === null || _a === void 0 ? void 0 : _a.href)))
            && (Is$1.string(candidate.source) || Is$1.undefined(candidate.source))
            && (Is$1.undefined(candidate.relatedInformation) || Is$1.typedArray(candidate.relatedInformation, DiagnosticRelatedInformation$1.is));
    }
    Diagnostic.is = is;
})(Diagnostic$1 || (Diagnostic$1 = {}));
/**
 * The Command namespace provides helper functions to work with
 * [Command](#Command) literals.
 */
var Command$1;
(function (Command) {
    /**
     * Creates a new Command literal.
     */
    function create(title, command) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        var result = { title: title, command: command };
        if (Is$1.defined(args) && args.length > 0) {
            result.arguments = args;
        }
        return result;
    }
    Command.create = create;
    /**
     * Checks whether the given literal conforms to the [Command](#Command) interface.
     */
    function is(value) {
        var candidate = value;
        return Is$1.defined(candidate) && Is$1.string(candidate.title) && Is$1.string(candidate.command);
    }
    Command.is = is;
})(Command$1 || (Command$1 = {}));
/**
 * The TextEdit namespace provides helper function to create replace,
 * insert and delete edits more easily.
 */
var TextEdit$1;
(function (TextEdit) {
    /**
     * Creates a replace text edit.
     * @param range The range of text to be replaced.
     * @param newText The new text.
     */
    function replace(range, newText) {
        return { range: range, newText: newText };
    }
    TextEdit.replace = replace;
    /**
     * Creates a insert text edit.
     * @param position The position to insert the text at.
     * @param newText The text to be inserted.
     */
    function insert(position, newText) {
        return { range: { start: position, end: position }, newText: newText };
    }
    TextEdit.insert = insert;
    /**
     * Creates a delete text edit.
     * @param range The range of text to be deleted.
     */
    function del(range) {
        return { range: range, newText: '' };
    }
    TextEdit.del = del;
    function is(value) {
        var candidate = value;
        return Is$1.objectLiteral(candidate)
            && Is$1.string(candidate.newText)
            && Range$1.is(candidate.range);
    }
    TextEdit.is = is;
})(TextEdit$1 || (TextEdit$1 = {}));
var ChangeAnnotation$1;
(function (ChangeAnnotation) {
    function create(label, needsConfirmation, description) {
        var result = { label: label };
        if (needsConfirmation !== undefined) {
            result.needsConfirmation = needsConfirmation;
        }
        if (description !== undefined) {
            result.description = description;
        }
        return result;
    }
    ChangeAnnotation.create = create;
    function is(value) {
        var candidate = value;
        return candidate !== undefined && Is$1.objectLiteral(candidate) && Is$1.string(candidate.label) &&
            (Is$1.boolean(candidate.needsConfirmation) || candidate.needsConfirmation === undefined) &&
            (Is$1.string(candidate.description) || candidate.description === undefined);
    }
    ChangeAnnotation.is = is;
})(ChangeAnnotation$1 || (ChangeAnnotation$1 = {}));
var ChangeAnnotationIdentifier$1;
(function (ChangeAnnotationIdentifier) {
    function is(value) {
        var candidate = value;
        return typeof candidate === 'string';
    }
    ChangeAnnotationIdentifier.is = is;
})(ChangeAnnotationIdentifier$1 || (ChangeAnnotationIdentifier$1 = {}));
var AnnotatedTextEdit$1;
(function (AnnotatedTextEdit) {
    /**
     * Creates an annotated replace text edit.
     *
     * @param range The range of text to be replaced.
     * @param newText The new text.
     * @param annotation The annotation.
     */
    function replace(range, newText, annotation) {
        return { range: range, newText: newText, annotationId: annotation };
    }
    AnnotatedTextEdit.replace = replace;
    /**
     * Creates an annotated insert text edit.
     *
     * @param position The position to insert the text at.
     * @param newText The text to be inserted.
     * @param annotation The annotation.
     */
    function insert(position, newText, annotation) {
        return { range: { start: position, end: position }, newText: newText, annotationId: annotation };
    }
    AnnotatedTextEdit.insert = insert;
    /**
     * Creates an annotated delete text edit.
     *
     * @param range The range of text to be deleted.
     * @param annotation The annotation.
     */
    function del(range, annotation) {
        return { range: range, newText: '', annotationId: annotation };
    }
    AnnotatedTextEdit.del = del;
    function is(value) {
        var candidate = value;
        return TextEdit$1.is(candidate) && (ChangeAnnotation$1.is(candidate.annotationId) || ChangeAnnotationIdentifier$1.is(candidate.annotationId));
    }
    AnnotatedTextEdit.is = is;
})(AnnotatedTextEdit$1 || (AnnotatedTextEdit$1 = {}));
/**
 * The TextDocumentEdit namespace provides helper function to create
 * an edit that manipulates a text document.
 */
var TextDocumentEdit$1;
(function (TextDocumentEdit) {
    /**
     * Creates a new `TextDocumentEdit`
     */
    function create(textDocument, edits) {
        return { textDocument: textDocument, edits: edits };
    }
    TextDocumentEdit.create = create;
    function is(value) {
        var candidate = value;
        return Is$1.defined(candidate)
            && OptionalVersionedTextDocumentIdentifier$1.is(candidate.textDocument)
            && Array.isArray(candidate.edits);
    }
    TextDocumentEdit.is = is;
})(TextDocumentEdit$1 || (TextDocumentEdit$1 = {}));
var CreateFile$1;
(function (CreateFile) {
    function create(uri, options, annotation) {
        var result = {
            kind: 'create',
            uri: uri
        };
        if (options !== undefined && (options.overwrite !== undefined || options.ignoreIfExists !== undefined)) {
            result.options = options;
        }
        if (annotation !== undefined) {
            result.annotationId = annotation;
        }
        return result;
    }
    CreateFile.create = create;
    function is(value) {
        var candidate = value;
        return candidate && candidate.kind === 'create' && Is$1.string(candidate.uri) && (candidate.options === undefined ||
            ((candidate.options.overwrite === undefined || Is$1.boolean(candidate.options.overwrite)) && (candidate.options.ignoreIfExists === undefined || Is$1.boolean(candidate.options.ignoreIfExists)))) && (candidate.annotationId === undefined || ChangeAnnotationIdentifier$1.is(candidate.annotationId));
    }
    CreateFile.is = is;
})(CreateFile$1 || (CreateFile$1 = {}));
var RenameFile$1;
(function (RenameFile) {
    function create(oldUri, newUri, options, annotation) {
        var result = {
            kind: 'rename',
            oldUri: oldUri,
            newUri: newUri
        };
        if (options !== undefined && (options.overwrite !== undefined || options.ignoreIfExists !== undefined)) {
            result.options = options;
        }
        if (annotation !== undefined) {
            result.annotationId = annotation;
        }
        return result;
    }
    RenameFile.create = create;
    function is(value) {
        var candidate = value;
        return candidate && candidate.kind === 'rename' && Is$1.string(candidate.oldUri) && Is$1.string(candidate.newUri) && (candidate.options === undefined ||
            ((candidate.options.overwrite === undefined || Is$1.boolean(candidate.options.overwrite)) && (candidate.options.ignoreIfExists === undefined || Is$1.boolean(candidate.options.ignoreIfExists)))) && (candidate.annotationId === undefined || ChangeAnnotationIdentifier$1.is(candidate.annotationId));
    }
    RenameFile.is = is;
})(RenameFile$1 || (RenameFile$1 = {}));
var DeleteFile$1;
(function (DeleteFile) {
    function create(uri, options, annotation) {
        var result = {
            kind: 'delete',
            uri: uri
        };
        if (options !== undefined && (options.recursive !== undefined || options.ignoreIfNotExists !== undefined)) {
            result.options = options;
        }
        if (annotation !== undefined) {
            result.annotationId = annotation;
        }
        return result;
    }
    DeleteFile.create = create;
    function is(value) {
        var candidate = value;
        return candidate && candidate.kind === 'delete' && Is$1.string(candidate.uri) && (candidate.options === undefined ||
            ((candidate.options.recursive === undefined || Is$1.boolean(candidate.options.recursive)) && (candidate.options.ignoreIfNotExists === undefined || Is$1.boolean(candidate.options.ignoreIfNotExists)))) && (candidate.annotationId === undefined || ChangeAnnotationIdentifier$1.is(candidate.annotationId));
    }
    DeleteFile.is = is;
})(DeleteFile$1 || (DeleteFile$1 = {}));
var WorkspaceEdit$1;
(function (WorkspaceEdit) {
    function is(value) {
        var candidate = value;
        return candidate &&
            (candidate.changes !== undefined || candidate.documentChanges !== undefined) &&
            (candidate.documentChanges === undefined || candidate.documentChanges.every(function (change) {
                if (Is$1.string(change.kind)) {
                    return CreateFile$1.is(change) || RenameFile$1.is(change) || DeleteFile$1.is(change);
                }
                else {
                    return TextDocumentEdit$1.is(change);
                }
            }));
    }
    WorkspaceEdit.is = is;
})(WorkspaceEdit$1 || (WorkspaceEdit$1 = {}));
var TextEditChangeImpl$1 = /** @class */ (function () {
    function TextEditChangeImpl(edits, changeAnnotations) {
        this.edits = edits;
        this.changeAnnotations = changeAnnotations;
    }
    TextEditChangeImpl.prototype.insert = function (position, newText, annotation) {
        var edit;
        var id;
        if (annotation === undefined) {
            edit = TextEdit$1.insert(position, newText);
        }
        else if (ChangeAnnotationIdentifier$1.is(annotation)) {
            id = annotation;
            edit = AnnotatedTextEdit$1.insert(position, newText, annotation);
        }
        else {
            this.assertChangeAnnotations(this.changeAnnotations);
            id = this.changeAnnotations.manage(annotation);
            edit = AnnotatedTextEdit$1.insert(position, newText, id);
        }
        this.edits.push(edit);
        if (id !== undefined) {
            return id;
        }
    };
    TextEditChangeImpl.prototype.replace = function (range, newText, annotation) {
        var edit;
        var id;
        if (annotation === undefined) {
            edit = TextEdit$1.replace(range, newText);
        }
        else if (ChangeAnnotationIdentifier$1.is(annotation)) {
            id = annotation;
            edit = AnnotatedTextEdit$1.replace(range, newText, annotation);
        }
        else {
            this.assertChangeAnnotations(this.changeAnnotations);
            id = this.changeAnnotations.manage(annotation);
            edit = AnnotatedTextEdit$1.replace(range, newText, id);
        }
        this.edits.push(edit);
        if (id !== undefined) {
            return id;
        }
    };
    TextEditChangeImpl.prototype.delete = function (range, annotation) {
        var edit;
        var id;
        if (annotation === undefined) {
            edit = TextEdit$1.del(range);
        }
        else if (ChangeAnnotationIdentifier$1.is(annotation)) {
            id = annotation;
            edit = AnnotatedTextEdit$1.del(range, annotation);
        }
        else {
            this.assertChangeAnnotations(this.changeAnnotations);
            id = this.changeAnnotations.manage(annotation);
            edit = AnnotatedTextEdit$1.del(range, id);
        }
        this.edits.push(edit);
        if (id !== undefined) {
            return id;
        }
    };
    TextEditChangeImpl.prototype.add = function (edit) {
        this.edits.push(edit);
    };
    TextEditChangeImpl.prototype.all = function () {
        return this.edits;
    };
    TextEditChangeImpl.prototype.clear = function () {
        this.edits.splice(0, this.edits.length);
    };
    TextEditChangeImpl.prototype.assertChangeAnnotations = function (value) {
        if (value === undefined) {
            throw new Error("Text edit change is not configured to manage change annotations.");
        }
    };
    return TextEditChangeImpl;
}());
/**
 * A helper class
 */
var ChangeAnnotations$1 = /** @class */ (function () {
    function ChangeAnnotations(annotations) {
        this._annotations = annotations === undefined ? Object.create(null) : annotations;
        this._counter = 0;
        this._size = 0;
    }
    ChangeAnnotations.prototype.all = function () {
        return this._annotations;
    };
    Object.defineProperty(ChangeAnnotations.prototype, "size", {
        get: function () {
            return this._size;
        },
        enumerable: false,
        configurable: true
    });
    ChangeAnnotations.prototype.manage = function (idOrAnnotation, annotation) {
        var id;
        if (ChangeAnnotationIdentifier$1.is(idOrAnnotation)) {
            id = idOrAnnotation;
        }
        else {
            id = this.nextId();
            annotation = idOrAnnotation;
        }
        if (this._annotations[id] !== undefined) {
            throw new Error("Id " + id + " is already in use.");
        }
        if (annotation === undefined) {
            throw new Error("No annotation provided for id " + id);
        }
        this._annotations[id] = annotation;
        this._size++;
        return id;
    };
    ChangeAnnotations.prototype.nextId = function () {
        this._counter++;
        return this._counter.toString();
    };
    return ChangeAnnotations;
}());
/**
 * A workspace change helps constructing changes to a workspace.
 */
var WorkspaceChange = /** @class */ (function () {
    function WorkspaceChange(workspaceEdit) {
        var _this = this;
        this._textEditChanges = Object.create(null);
        if (workspaceEdit !== undefined) {
            this._workspaceEdit = workspaceEdit;
            if (workspaceEdit.documentChanges) {
                this._changeAnnotations = new ChangeAnnotations$1(workspaceEdit.changeAnnotations);
                workspaceEdit.changeAnnotations = this._changeAnnotations.all();
                workspaceEdit.documentChanges.forEach(function (change) {
                    if (TextDocumentEdit$1.is(change)) {
                        var textEditChange = new TextEditChangeImpl$1(change.edits, _this._changeAnnotations);
                        _this._textEditChanges[change.textDocument.uri] = textEditChange;
                    }
                });
            }
            else if (workspaceEdit.changes) {
                Object.keys(workspaceEdit.changes).forEach(function (key) {
                    var textEditChange = new TextEditChangeImpl$1(workspaceEdit.changes[key]);
                    _this._textEditChanges[key] = textEditChange;
                });
            }
        }
        else {
            this._workspaceEdit = {};
        }
    }
    Object.defineProperty(WorkspaceChange.prototype, "edit", {
        /**
         * Returns the underlying [WorkspaceEdit](#WorkspaceEdit) literal
         * use to be returned from a workspace edit operation like rename.
         */
        get: function () {
            this.initDocumentChanges();
            if (this._changeAnnotations !== undefined) {
                if (this._changeAnnotations.size === 0) {
                    this._workspaceEdit.changeAnnotations = undefined;
                }
                else {
                    this._workspaceEdit.changeAnnotations = this._changeAnnotations.all();
                }
            }
            return this._workspaceEdit;
        },
        enumerable: false,
        configurable: true
    });
    WorkspaceChange.prototype.getTextEditChange = function (key) {
        if (OptionalVersionedTextDocumentIdentifier$1.is(key)) {
            this.initDocumentChanges();
            if (this._workspaceEdit.documentChanges === undefined) {
                throw new Error('Workspace edit is not configured for document changes.');
            }
            var textDocument = { uri: key.uri, version: key.version };
            var result = this._textEditChanges[textDocument.uri];
            if (!result) {
                var edits = [];
                var textDocumentEdit = {
                    textDocument: textDocument,
                    edits: edits
                };
                this._workspaceEdit.documentChanges.push(textDocumentEdit);
                result = new TextEditChangeImpl$1(edits, this._changeAnnotations);
                this._textEditChanges[textDocument.uri] = result;
            }
            return result;
        }
        else {
            this.initChanges();
            if (this._workspaceEdit.changes === undefined) {
                throw new Error('Workspace edit is not configured for normal text edit changes.');
            }
            var result = this._textEditChanges[key];
            if (!result) {
                var edits = [];
                this._workspaceEdit.changes[key] = edits;
                result = new TextEditChangeImpl$1(edits);
                this._textEditChanges[key] = result;
            }
            return result;
        }
    };
    WorkspaceChange.prototype.initDocumentChanges = function () {
        if (this._workspaceEdit.documentChanges === undefined && this._workspaceEdit.changes === undefined) {
            this._changeAnnotations = new ChangeAnnotations$1();
            this._workspaceEdit.documentChanges = [];
            this._workspaceEdit.changeAnnotations = this._changeAnnotations.all();
        }
    };
    WorkspaceChange.prototype.initChanges = function () {
        if (this._workspaceEdit.documentChanges === undefined && this._workspaceEdit.changes === undefined) {
            this._workspaceEdit.changes = Object.create(null);
        }
    };
    WorkspaceChange.prototype.createFile = function (uri, optionsOrAnnotation, options) {
        this.initDocumentChanges();
        if (this._workspaceEdit.documentChanges === undefined) {
            throw new Error('Workspace edit is not configured for document changes.');
        }
        var annotation;
        if (ChangeAnnotation$1.is(optionsOrAnnotation) || ChangeAnnotationIdentifier$1.is(optionsOrAnnotation)) {
            annotation = optionsOrAnnotation;
        }
        else {
            options = optionsOrAnnotation;
        }
        var operation;
        var id;
        if (annotation === undefined) {
            operation = CreateFile$1.create(uri, options);
        }
        else {
            id = ChangeAnnotationIdentifier$1.is(annotation) ? annotation : this._changeAnnotations.manage(annotation);
            operation = CreateFile$1.create(uri, options, id);
        }
        this._workspaceEdit.documentChanges.push(operation);
        if (id !== undefined) {
            return id;
        }
    };
    WorkspaceChange.prototype.renameFile = function (oldUri, newUri, optionsOrAnnotation, options) {
        this.initDocumentChanges();
        if (this._workspaceEdit.documentChanges === undefined) {
            throw new Error('Workspace edit is not configured for document changes.');
        }
        var annotation;
        if (ChangeAnnotation$1.is(optionsOrAnnotation) || ChangeAnnotationIdentifier$1.is(optionsOrAnnotation)) {
            annotation = optionsOrAnnotation;
        }
        else {
            options = optionsOrAnnotation;
        }
        var operation;
        var id;
        if (annotation === undefined) {
            operation = RenameFile$1.create(oldUri, newUri, options);
        }
        else {
            id = ChangeAnnotationIdentifier$1.is(annotation) ? annotation : this._changeAnnotations.manage(annotation);
            operation = RenameFile$1.create(oldUri, newUri, options, id);
        }
        this._workspaceEdit.documentChanges.push(operation);
        if (id !== undefined) {
            return id;
        }
    };
    WorkspaceChange.prototype.deleteFile = function (uri, optionsOrAnnotation, options) {
        this.initDocumentChanges();
        if (this._workspaceEdit.documentChanges === undefined) {
            throw new Error('Workspace edit is not configured for document changes.');
        }
        var annotation;
        if (ChangeAnnotation$1.is(optionsOrAnnotation) || ChangeAnnotationIdentifier$1.is(optionsOrAnnotation)) {
            annotation = optionsOrAnnotation;
        }
        else {
            options = optionsOrAnnotation;
        }
        var operation;
        var id;
        if (annotation === undefined) {
            operation = DeleteFile$1.create(uri, options);
        }
        else {
            id = ChangeAnnotationIdentifier$1.is(annotation) ? annotation : this._changeAnnotations.manage(annotation);
            operation = DeleteFile$1.create(uri, options, id);
        }
        this._workspaceEdit.documentChanges.push(operation);
        if (id !== undefined) {
            return id;
        }
    };
    return WorkspaceChange;
}());
/**
 * The TextDocumentIdentifier namespace provides helper functions to work with
 * [TextDocumentIdentifier](#TextDocumentIdentifier) literals.
 */
var TextDocumentIdentifier$1;
(function (TextDocumentIdentifier) {
    /**
     * Creates a new TextDocumentIdentifier literal.
     * @param uri The document's uri.
     */
    function create(uri) {
        return { uri: uri };
    }
    TextDocumentIdentifier.create = create;
    /**
     * Checks whether the given literal conforms to the [TextDocumentIdentifier](#TextDocumentIdentifier) interface.
     */
    function is(value) {
        var candidate = value;
        return Is$1.defined(candidate) && Is$1.string(candidate.uri);
    }
    TextDocumentIdentifier.is = is;
})(TextDocumentIdentifier$1 || (TextDocumentIdentifier$1 = {}));
/**
 * The VersionedTextDocumentIdentifier namespace provides helper functions to work with
 * [VersionedTextDocumentIdentifier](#VersionedTextDocumentIdentifier) literals.
 */
var VersionedTextDocumentIdentifier$1;
(function (VersionedTextDocumentIdentifier) {
    /**
     * Creates a new VersionedTextDocumentIdentifier literal.
     * @param uri The document's uri.
     * @param uri The document's text.
     */
    function create(uri, version) {
        return { uri: uri, version: version };
    }
    VersionedTextDocumentIdentifier.create = create;
    /**
     * Checks whether the given literal conforms to the [VersionedTextDocumentIdentifier](#VersionedTextDocumentIdentifier) interface.
     */
    function is(value) {
        var candidate = value;
        return Is$1.defined(candidate) && Is$1.string(candidate.uri) && Is$1.integer(candidate.version);
    }
    VersionedTextDocumentIdentifier.is = is;
})(VersionedTextDocumentIdentifier$1 || (VersionedTextDocumentIdentifier$1 = {}));
/**
 * The OptionalVersionedTextDocumentIdentifier namespace provides helper functions to work with
 * [OptionalVersionedTextDocumentIdentifier](#OptionalVersionedTextDocumentIdentifier) literals.
 */
var OptionalVersionedTextDocumentIdentifier$1;
(function (OptionalVersionedTextDocumentIdentifier) {
    /**
     * Creates a new OptionalVersionedTextDocumentIdentifier literal.
     * @param uri The document's uri.
     * @param uri The document's text.
     */
    function create(uri, version) {
        return { uri: uri, version: version };
    }
    OptionalVersionedTextDocumentIdentifier.create = create;
    /**
     * Checks whether the given literal conforms to the [OptionalVersionedTextDocumentIdentifier](#OptionalVersionedTextDocumentIdentifier) interface.
     */
    function is(value) {
        var candidate = value;
        return Is$1.defined(candidate) && Is$1.string(candidate.uri) && (candidate.version === null || Is$1.integer(candidate.version));
    }
    OptionalVersionedTextDocumentIdentifier.is = is;
})(OptionalVersionedTextDocumentIdentifier$1 || (OptionalVersionedTextDocumentIdentifier$1 = {}));
/**
 * The TextDocumentItem namespace provides helper functions to work with
 * [TextDocumentItem](#TextDocumentItem) literals.
 */
var TextDocumentItem$1;
(function (TextDocumentItem) {
    /**
     * Creates a new TextDocumentItem literal.
     * @param uri The document's uri.
     * @param languageId The document's language identifier.
     * @param version The document's version number.
     * @param text The document's text.
     */
    function create(uri, languageId, version, text) {
        return { uri: uri, languageId: languageId, version: version, text: text };
    }
    TextDocumentItem.create = create;
    /**
     * Checks whether the given literal conforms to the [TextDocumentItem](#TextDocumentItem) interface.
     */
    function is(value) {
        var candidate = value;
        return Is$1.defined(candidate) && Is$1.string(candidate.uri) && Is$1.string(candidate.languageId) && Is$1.integer(candidate.version) && Is$1.string(candidate.text);
    }
    TextDocumentItem.is = is;
})(TextDocumentItem$1 || (TextDocumentItem$1 = {}));
/**
 * Describes the content type that a client supports in various
 * result literals like `Hover`, `ParameterInfo` or `CompletionItem`.
 *
 * Please note that `MarkupKinds` must not start with a `$`. This kinds
 * are reserved for internal usage.
 */
var MarkupKind$1;
(function (MarkupKind) {
    /**
     * Plain text is supported as a content format
     */
    MarkupKind.PlainText = 'plaintext';
    /**
     * Markdown is supported as a content format
     */
    MarkupKind.Markdown = 'markdown';
})(MarkupKind$1 || (MarkupKind$1 = {}));
(function (MarkupKind) {
    /**
     * Checks whether the given value is a value of the [MarkupKind](#MarkupKind) type.
     */
    function is(value) {
        var candidate = value;
        return candidate === MarkupKind.PlainText || candidate === MarkupKind.Markdown;
    }
    MarkupKind.is = is;
})(MarkupKind$1 || (MarkupKind$1 = {}));
var MarkupContent$1;
(function (MarkupContent) {
    /**
     * Checks whether the given value conforms to the [MarkupContent](#MarkupContent) interface.
     */
    function is(value) {
        var candidate = value;
        return Is$1.objectLiteral(value) && MarkupKind$1.is(candidate.kind) && Is$1.string(candidate.value);
    }
    MarkupContent.is = is;
})(MarkupContent$1 || (MarkupContent$1 = {}));
/**
 * The kind of a completion entry.
 */
var CompletionItemKind$1;
(function (CompletionItemKind) {
    CompletionItemKind.Text = 1;
    CompletionItemKind.Method = 2;
    CompletionItemKind.Function = 3;
    CompletionItemKind.Constructor = 4;
    CompletionItemKind.Field = 5;
    CompletionItemKind.Variable = 6;
    CompletionItemKind.Class = 7;
    CompletionItemKind.Interface = 8;
    CompletionItemKind.Module = 9;
    CompletionItemKind.Property = 10;
    CompletionItemKind.Unit = 11;
    CompletionItemKind.Value = 12;
    CompletionItemKind.Enum = 13;
    CompletionItemKind.Keyword = 14;
    CompletionItemKind.Snippet = 15;
    CompletionItemKind.Color = 16;
    CompletionItemKind.File = 17;
    CompletionItemKind.Reference = 18;
    CompletionItemKind.Folder = 19;
    CompletionItemKind.EnumMember = 20;
    CompletionItemKind.Constant = 21;
    CompletionItemKind.Struct = 22;
    CompletionItemKind.Event = 23;
    CompletionItemKind.Operator = 24;
    CompletionItemKind.TypeParameter = 25;
})(CompletionItemKind$1 || (CompletionItemKind$1 = {}));
/**
 * Defines whether the insert text in a completion item should be interpreted as
 * plain text or a snippet.
 */
var InsertTextFormat$1;
(function (InsertTextFormat) {
    /**
     * The primary text to be inserted is treated as a plain string.
     */
    InsertTextFormat.PlainText = 1;
    /**
     * The primary text to be inserted is treated as a snippet.
     *
     * A snippet can define tab stops and placeholders with `$1`, `$2`
     * and `${3:foo}`. `$0` defines the final tab stop, it defaults to
     * the end of the snippet. Placeholders with equal identifiers are linked,
     * that is typing in one will update others too.
     *
     * See also: https://microsoft.github.io/language-server-protocol/specifications/specification-current/#snippet_syntax
     */
    InsertTextFormat.Snippet = 2;
})(InsertTextFormat$1 || (InsertTextFormat$1 = {}));
/**
 * Completion item tags are extra annotations that tweak the rendering of a completion
 * item.
 *
 * @since 3.15.0
 */
var CompletionItemTag$1;
(function (CompletionItemTag) {
    /**
     * Render a completion as obsolete, usually using a strike-out.
     */
    CompletionItemTag.Deprecated = 1;
})(CompletionItemTag$1 || (CompletionItemTag$1 = {}));
/**
 * The InsertReplaceEdit namespace provides functions to deal with insert / replace edits.
 *
 * @since 3.16.0
 */
var InsertReplaceEdit$1;
(function (InsertReplaceEdit) {
    /**
     * Creates a new insert / replace edit
     */
    function create(newText, insert, replace) {
        return { newText: newText, insert: insert, replace: replace };
    }
    InsertReplaceEdit.create = create;
    /**
     * Checks whether the given literal conforms to the [InsertReplaceEdit](#InsertReplaceEdit) interface.
     */
    function is(value) {
        var candidate = value;
        return candidate && Is$1.string(candidate.newText) && Range$1.is(candidate.insert) && Range$1.is(candidate.replace);
    }
    InsertReplaceEdit.is = is;
})(InsertReplaceEdit$1 || (InsertReplaceEdit$1 = {}));
/**
 * How whitespace and indentation is handled during completion
 * item insertion.
 *
 * @since 3.16.0
 */
var InsertTextMode$1;
(function (InsertTextMode) {
    /**
     * The insertion or replace strings is taken as it is. If the
     * value is multi line the lines below the cursor will be
     * inserted using the indentation defined in the string value.
     * The client will not apply any kind of adjustments to the
     * string.
     */
    InsertTextMode.asIs = 1;
    /**
     * The editor adjusts leading whitespace of new lines so that
     * they match the indentation up to the cursor of the line for
     * which the item is accepted.
     *
     * Consider a line like this: <2tabs><cursor><3tabs>foo. Accepting a
     * multi line completion item is indented using 2 tabs and all
     * following lines inserted will be indented using 2 tabs as well.
     */
    InsertTextMode.adjustIndentation = 2;
})(InsertTextMode$1 || (InsertTextMode$1 = {}));
/**
 * The CompletionItem namespace provides functions to deal with
 * completion items.
 */
var CompletionItem$1;
(function (CompletionItem) {
    /**
     * Create a completion item and seed it with a label.
     * @param label The completion item's label
     */
    function create(label) {
        return { label: label };
    }
    CompletionItem.create = create;
})(CompletionItem$1 || (CompletionItem$1 = {}));
/**
 * The CompletionList namespace provides functions to deal with
 * completion lists.
 */
var CompletionList$1;
(function (CompletionList) {
    /**
     * Creates a new completion list.
     *
     * @param items The completion items.
     * @param isIncomplete The list is not complete.
     */
    function create(items, isIncomplete) {
        return { items: items ? items : [], isIncomplete: !!isIncomplete };
    }
    CompletionList.create = create;
})(CompletionList$1 || (CompletionList$1 = {}));
var MarkedString$1;
(function (MarkedString) {
    /**
     * Creates a marked string from plain text.
     *
     * @param plainText The plain text.
     */
    function fromPlainText(plainText) {
        return plainText.replace(/[\\`*_{}[\]()#+\-.!]/g, '\\$&'); // escape markdown syntax tokens: http://daringfireball.net/projects/markdown/syntax#backslash
    }
    MarkedString.fromPlainText = fromPlainText;
    /**
     * Checks whether the given value conforms to the [MarkedString](#MarkedString) type.
     */
    function is(value) {
        var candidate = value;
        return Is$1.string(candidate) || (Is$1.objectLiteral(candidate) && Is$1.string(candidate.language) && Is$1.string(candidate.value));
    }
    MarkedString.is = is;
})(MarkedString$1 || (MarkedString$1 = {}));
var Hover$1;
(function (Hover) {
    /**
     * Checks whether the given value conforms to the [Hover](#Hover) interface.
     */
    function is(value) {
        var candidate = value;
        return !!candidate && Is$1.objectLiteral(candidate) && (MarkupContent$1.is(candidate.contents) ||
            MarkedString$1.is(candidate.contents) ||
            Is$1.typedArray(candidate.contents, MarkedString$1.is)) && (value.range === undefined || Range$1.is(value.range));
    }
    Hover.is = is;
})(Hover$1 || (Hover$1 = {}));
/**
 * The ParameterInformation namespace provides helper functions to work with
 * [ParameterInformation](#ParameterInformation) literals.
 */
var ParameterInformation$1;
(function (ParameterInformation) {
    /**
     * Creates a new parameter information literal.
     *
     * @param label A label string.
     * @param documentation A doc string.
     */
    function create(label, documentation) {
        return documentation ? { label: label, documentation: documentation } : { label: label };
    }
    ParameterInformation.create = create;
})(ParameterInformation$1 || (ParameterInformation$1 = {}));
/**
 * The SignatureInformation namespace provides helper functions to work with
 * [SignatureInformation](#SignatureInformation) literals.
 */
var SignatureInformation$1;
(function (SignatureInformation) {
    function create(label, documentation) {
        var parameters = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            parameters[_i - 2] = arguments[_i];
        }
        var result = { label: label };
        if (Is$1.defined(documentation)) {
            result.documentation = documentation;
        }
        if (Is$1.defined(parameters)) {
            result.parameters = parameters;
        }
        else {
            result.parameters = [];
        }
        return result;
    }
    SignatureInformation.create = create;
})(SignatureInformation$1 || (SignatureInformation$1 = {}));
/**
 * A document highlight kind.
 */
var DocumentHighlightKind$1;
(function (DocumentHighlightKind) {
    /**
     * A textual occurrence.
     */
    DocumentHighlightKind.Text = 1;
    /**
     * Read-access of a symbol, like reading a variable.
     */
    DocumentHighlightKind.Read = 2;
    /**
     * Write-access of a symbol, like writing to a variable.
     */
    DocumentHighlightKind.Write = 3;
})(DocumentHighlightKind$1 || (DocumentHighlightKind$1 = {}));
/**
 * DocumentHighlight namespace to provide helper functions to work with
 * [DocumentHighlight](#DocumentHighlight) literals.
 */
var DocumentHighlight$1;
(function (DocumentHighlight) {
    /**
     * Create a DocumentHighlight object.
     * @param range The range the highlight applies to.
     */
    function create(range, kind) {
        var result = { range: range };
        if (Is$1.number(kind)) {
            result.kind = kind;
        }
        return result;
    }
    DocumentHighlight.create = create;
})(DocumentHighlight$1 || (DocumentHighlight$1 = {}));
/**
 * A symbol kind.
 */
var SymbolKind$1;
(function (SymbolKind) {
    SymbolKind.File = 1;
    SymbolKind.Module = 2;
    SymbolKind.Namespace = 3;
    SymbolKind.Package = 4;
    SymbolKind.Class = 5;
    SymbolKind.Method = 6;
    SymbolKind.Property = 7;
    SymbolKind.Field = 8;
    SymbolKind.Constructor = 9;
    SymbolKind.Enum = 10;
    SymbolKind.Interface = 11;
    SymbolKind.Function = 12;
    SymbolKind.Variable = 13;
    SymbolKind.Constant = 14;
    SymbolKind.String = 15;
    SymbolKind.Number = 16;
    SymbolKind.Boolean = 17;
    SymbolKind.Array = 18;
    SymbolKind.Object = 19;
    SymbolKind.Key = 20;
    SymbolKind.Null = 21;
    SymbolKind.EnumMember = 22;
    SymbolKind.Struct = 23;
    SymbolKind.Event = 24;
    SymbolKind.Operator = 25;
    SymbolKind.TypeParameter = 26;
})(SymbolKind$1 || (SymbolKind$1 = {}));
/**
 * Symbol tags are extra annotations that tweak the rendering of a symbol.
 * @since 3.16
 */
var SymbolTag$1;
(function (SymbolTag) {
    /**
     * Render a symbol as obsolete, usually using a strike-out.
     */
    SymbolTag.Deprecated = 1;
})(SymbolTag$1 || (SymbolTag$1 = {}));
var SymbolInformation$1;
(function (SymbolInformation) {
    /**
     * Creates a new symbol information literal.
     *
     * @param name The name of the symbol.
     * @param kind The kind of the symbol.
     * @param range The range of the location of the symbol.
     * @param uri The resource of the location of symbol, defaults to the current document.
     * @param containerName The name of the symbol containing the symbol.
     */
    function create(name, kind, range, uri, containerName) {
        var result = {
            name: name,
            kind: kind,
            location: { uri: uri, range: range }
        };
        if (containerName) {
            result.containerName = containerName;
        }
        return result;
    }
    SymbolInformation.create = create;
})(SymbolInformation$1 || (SymbolInformation$1 = {}));
var DocumentSymbol$1;
(function (DocumentSymbol) {
    /**
     * Creates a new symbol information literal.
     *
     * @param name The name of the symbol.
     * @param detail The detail of the symbol.
     * @param kind The kind of the symbol.
     * @param range The range of the symbol.
     * @param selectionRange The selectionRange of the symbol.
     * @param children Children of the symbol.
     */
    function create(name, detail, kind, range, selectionRange, children) {
        var result = {
            name: name,
            detail: detail,
            kind: kind,
            range: range,
            selectionRange: selectionRange
        };
        if (children !== undefined) {
            result.children = children;
        }
        return result;
    }
    DocumentSymbol.create = create;
    /**
     * Checks whether the given literal conforms to the [DocumentSymbol](#DocumentSymbol) interface.
     */
    function is(value) {
        var candidate = value;
        return candidate &&
            Is$1.string(candidate.name) && Is$1.number(candidate.kind) &&
            Range$1.is(candidate.range) && Range$1.is(candidate.selectionRange) &&
            (candidate.detail === undefined || Is$1.string(candidate.detail)) &&
            (candidate.deprecated === undefined || Is$1.boolean(candidate.deprecated)) &&
            (candidate.children === undefined || Array.isArray(candidate.children)) &&
            (candidate.tags === undefined || Array.isArray(candidate.tags));
    }
    DocumentSymbol.is = is;
})(DocumentSymbol$1 || (DocumentSymbol$1 = {}));
/**
 * A set of predefined code action kinds
 */
var CodeActionKind$1;
(function (CodeActionKind) {
    /**
     * Empty kind.
     */
    CodeActionKind.Empty = '';
    /**
     * Base kind for quickfix actions: 'quickfix'
     */
    CodeActionKind.QuickFix = 'quickfix';
    /**
     * Base kind for refactoring actions: 'refactor'
     */
    CodeActionKind.Refactor = 'refactor';
    /**
     * Base kind for refactoring extraction actions: 'refactor.extract'
     *
     * Example extract actions:
     *
     * - Extract method
     * - Extract function
     * - Extract variable
     * - Extract interface from class
     * - ...
     */
    CodeActionKind.RefactorExtract = 'refactor.extract';
    /**
     * Base kind for refactoring inline actions: 'refactor.inline'
     *
     * Example inline actions:
     *
     * - Inline function
     * - Inline variable
     * - Inline constant
     * - ...
     */
    CodeActionKind.RefactorInline = 'refactor.inline';
    /**
     * Base kind for refactoring rewrite actions: 'refactor.rewrite'
     *
     * Example rewrite actions:
     *
     * - Convert JavaScript function to class
     * - Add or remove parameter
     * - Encapsulate field
     * - Make method static
     * - Move method to base class
     * - ...
     */
    CodeActionKind.RefactorRewrite = 'refactor.rewrite';
    /**
     * Base kind for source actions: `source`
     *
     * Source code actions apply to the entire file.
     */
    CodeActionKind.Source = 'source';
    /**
     * Base kind for an organize imports source action: `source.organizeImports`
     */
    CodeActionKind.SourceOrganizeImports = 'source.organizeImports';
    /**
     * Base kind for auto-fix source actions: `source.fixAll`.
     *
     * Fix all actions automatically fix errors that have a clear fix that do not require user input.
     * They should not suppress errors or perform unsafe fixes such as generating new types or classes.
     *
     * @since 3.15.0
     */
    CodeActionKind.SourceFixAll = 'source.fixAll';
})(CodeActionKind$1 || (CodeActionKind$1 = {}));
/**
 * The CodeActionContext namespace provides helper functions to work with
 * [CodeActionContext](#CodeActionContext) literals.
 */
var CodeActionContext$1;
(function (CodeActionContext) {
    /**
     * Creates a new CodeActionContext literal.
     */
    function create(diagnostics, only) {
        var result = { diagnostics: diagnostics };
        if (only !== undefined && only !== null) {
            result.only = only;
        }
        return result;
    }
    CodeActionContext.create = create;
    /**
     * Checks whether the given literal conforms to the [CodeActionContext](#CodeActionContext) interface.
     */
    function is(value) {
        var candidate = value;
        return Is$1.defined(candidate) && Is$1.typedArray(candidate.diagnostics, Diagnostic$1.is) && (candidate.only === undefined || Is$1.typedArray(candidate.only, Is$1.string));
    }
    CodeActionContext.is = is;
})(CodeActionContext$1 || (CodeActionContext$1 = {}));
var CodeAction$1;
(function (CodeAction) {
    function create(title, kindOrCommandOrEdit, kind) {
        var result = { title: title };
        var checkKind = true;
        if (typeof kindOrCommandOrEdit === 'string') {
            checkKind = false;
            result.kind = kindOrCommandOrEdit;
        }
        else if (Command$1.is(kindOrCommandOrEdit)) {
            result.command = kindOrCommandOrEdit;
        }
        else {
            result.edit = kindOrCommandOrEdit;
        }
        if (checkKind && kind !== undefined) {
            result.kind = kind;
        }
        return result;
    }
    CodeAction.create = create;
    function is(value) {
        var candidate = value;
        return candidate && Is$1.string(candidate.title) &&
            (candidate.diagnostics === undefined || Is$1.typedArray(candidate.diagnostics, Diagnostic$1.is)) &&
            (candidate.kind === undefined || Is$1.string(candidate.kind)) &&
            (candidate.edit !== undefined || candidate.command !== undefined) &&
            (candidate.command === undefined || Command$1.is(candidate.command)) &&
            (candidate.isPreferred === undefined || Is$1.boolean(candidate.isPreferred)) &&
            (candidate.edit === undefined || WorkspaceEdit$1.is(candidate.edit));
    }
    CodeAction.is = is;
})(CodeAction$1 || (CodeAction$1 = {}));
/**
 * The CodeLens namespace provides helper functions to work with
 * [CodeLens](#CodeLens) literals.
 */
var CodeLens$1;
(function (CodeLens) {
    /**
     * Creates a new CodeLens literal.
     */
    function create(range, data) {
        var result = { range: range };
        if (Is$1.defined(data)) {
            result.data = data;
        }
        return result;
    }
    CodeLens.create = create;
    /**
     * Checks whether the given literal conforms to the [CodeLens](#CodeLens) interface.
     */
    function is(value) {
        var candidate = value;
        return Is$1.defined(candidate) && Range$1.is(candidate.range) && (Is$1.undefined(candidate.command) || Command$1.is(candidate.command));
    }
    CodeLens.is = is;
})(CodeLens$1 || (CodeLens$1 = {}));
/**
 * The FormattingOptions namespace provides helper functions to work with
 * [FormattingOptions](#FormattingOptions) literals.
 */
var FormattingOptions$1;
(function (FormattingOptions) {
    /**
     * Creates a new FormattingOptions literal.
     */
    function create(tabSize, insertSpaces) {
        return { tabSize: tabSize, insertSpaces: insertSpaces };
    }
    FormattingOptions.create = create;
    /**
     * Checks whether the given literal conforms to the [FormattingOptions](#FormattingOptions) interface.
     */
    function is(value) {
        var candidate = value;
        return Is$1.defined(candidate) && Is$1.uinteger(candidate.tabSize) && Is$1.boolean(candidate.insertSpaces);
    }
    FormattingOptions.is = is;
})(FormattingOptions$1 || (FormattingOptions$1 = {}));
/**
 * The DocumentLink namespace provides helper functions to work with
 * [DocumentLink](#DocumentLink) literals.
 */
var DocumentLink$1;
(function (DocumentLink) {
    /**
     * Creates a new DocumentLink literal.
     */
    function create(range, target, data) {
        return { range: range, target: target, data: data };
    }
    DocumentLink.create = create;
    /**
     * Checks whether the given literal conforms to the [DocumentLink](#DocumentLink) interface.
     */
    function is(value) {
        var candidate = value;
        return Is$1.defined(candidate) && Range$1.is(candidate.range) && (Is$1.undefined(candidate.target) || Is$1.string(candidate.target));
    }
    DocumentLink.is = is;
})(DocumentLink$1 || (DocumentLink$1 = {}));
/**
 * The SelectionRange namespace provides helper function to work with
 * SelectionRange literals.
 */
var SelectionRange$1;
(function (SelectionRange) {
    /**
     * Creates a new SelectionRange
     * @param range the range.
     * @param parent an optional parent.
     */
    function create(range, parent) {
        return { range: range, parent: parent };
    }
    SelectionRange.create = create;
    function is(value) {
        var candidate = value;
        return candidate !== undefined && Range$1.is(candidate.range) && (candidate.parent === undefined || SelectionRange.is(candidate.parent));
    }
    SelectionRange.is = is;
})(SelectionRange$1 || (SelectionRange$1 = {}));
var EOL = ['\n', '\r\n', '\r'];
/**
 * @deprecated Use the text document from the new vscode-languageserver-textdocument package.
 */
var TextDocument$2;
(function (TextDocument) {
    /**
     * Creates a new ITextDocument literal from the given uri and content.
     * @param uri The document's uri.
     * @param languageId  The document's language Id.
     * @param content The document's content.
     */
    function create(uri, languageId, version, content) {
        return new FullTextDocument$2(uri, languageId, version, content);
    }
    TextDocument.create = create;
    /**
     * Checks whether the given literal conforms to the [ITextDocument](#ITextDocument) interface.
     */
    function is(value) {
        var candidate = value;
        return Is$1.defined(candidate) && Is$1.string(candidate.uri) && (Is$1.undefined(candidate.languageId) || Is$1.string(candidate.languageId)) && Is$1.uinteger(candidate.lineCount)
            && Is$1.func(candidate.getText) && Is$1.func(candidate.positionAt) && Is$1.func(candidate.offsetAt) ? true : false;
    }
    TextDocument.is = is;
    function applyEdits(document, edits) {
        var text = document.getText();
        var sortedEdits = mergeSort(edits, function (a, b) {
            var diff = a.range.start.line - b.range.start.line;
            if (diff === 0) {
                return a.range.start.character - b.range.start.character;
            }
            return diff;
        });
        var lastModifiedOffset = text.length;
        for (var i = sortedEdits.length - 1; i >= 0; i--) {
            var e = sortedEdits[i];
            var startOffset = document.offsetAt(e.range.start);
            var endOffset = document.offsetAt(e.range.end);
            if (endOffset <= lastModifiedOffset) {
                text = text.substring(0, startOffset) + e.newText + text.substring(endOffset, text.length);
            }
            else {
                throw new Error('Overlapping edit');
            }
            lastModifiedOffset = startOffset;
        }
        return text;
    }
    TextDocument.applyEdits = applyEdits;
    function mergeSort(data, compare) {
        if (data.length <= 1) {
            // sorted
            return data;
        }
        var p = (data.length / 2) | 0;
        var left = data.slice(0, p);
        var right = data.slice(p);
        mergeSort(left, compare);
        mergeSort(right, compare);
        var leftIdx = 0;
        var rightIdx = 0;
        var i = 0;
        while (leftIdx < left.length && rightIdx < right.length) {
            var ret = compare(left[leftIdx], right[rightIdx]);
            if (ret <= 0) {
                // smaller_equal -> take left to preserve order
                data[i++] = left[leftIdx++];
            }
            else {
                // greater -> take right
                data[i++] = right[rightIdx++];
            }
        }
        while (leftIdx < left.length) {
            data[i++] = left[leftIdx++];
        }
        while (rightIdx < right.length) {
            data[i++] = right[rightIdx++];
        }
        return data;
    }
})(TextDocument$2 || (TextDocument$2 = {}));
/**
 * @deprecated Use the text document from the new vscode-languageserver-textdocument package.
 */
var FullTextDocument$2 = /** @class */ (function () {
    function FullTextDocument(uri, languageId, version, content) {
        this._uri = uri;
        this._languageId = languageId;
        this._version = version;
        this._content = content;
        this._lineOffsets = undefined;
    }
    Object.defineProperty(FullTextDocument.prototype, "uri", {
        get: function () {
            return this._uri;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FullTextDocument.prototype, "languageId", {
        get: function () {
            return this._languageId;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FullTextDocument.prototype, "version", {
        get: function () {
            return this._version;
        },
        enumerable: false,
        configurable: true
    });
    FullTextDocument.prototype.getText = function (range) {
        if (range) {
            var start = this.offsetAt(range.start);
            var end = this.offsetAt(range.end);
            return this._content.substring(start, end);
        }
        return this._content;
    };
    FullTextDocument.prototype.update = function (event, version) {
        this._content = event.text;
        this._version = version;
        this._lineOffsets = undefined;
    };
    FullTextDocument.prototype.getLineOffsets = function () {
        if (this._lineOffsets === undefined) {
            var lineOffsets = [];
            var text = this._content;
            var isLineStart = true;
            for (var i = 0; i < text.length; i++) {
                if (isLineStart) {
                    lineOffsets.push(i);
                    isLineStart = false;
                }
                var ch = text.charAt(i);
                isLineStart = (ch === '\r' || ch === '\n');
                if (ch === '\r' && i + 1 < text.length && text.charAt(i + 1) === '\n') {
                    i++;
                }
            }
            if (isLineStart && text.length > 0) {
                lineOffsets.push(text.length);
            }
            this._lineOffsets = lineOffsets;
        }
        return this._lineOffsets;
    };
    FullTextDocument.prototype.positionAt = function (offset) {
        offset = Math.max(Math.min(offset, this._content.length), 0);
        var lineOffsets = this.getLineOffsets();
        var low = 0, high = lineOffsets.length;
        if (high === 0) {
            return Position$1.create(0, offset);
        }
        while (low < high) {
            var mid = Math.floor((low + high) / 2);
            if (lineOffsets[mid] > offset) {
                high = mid;
            }
            else {
                low = mid + 1;
            }
        }
        // low is the least x for which the line offset is larger than the current offset
        // or array.length if no line offset is larger than the current offset
        var line = low - 1;
        return Position$1.create(line, offset - lineOffsets[line]);
    };
    FullTextDocument.prototype.offsetAt = function (position) {
        var lineOffsets = this.getLineOffsets();
        if (position.line >= lineOffsets.length) {
            return this._content.length;
        }
        else if (position.line < 0) {
            return 0;
        }
        var lineOffset = lineOffsets[position.line];
        var nextLineOffset = (position.line + 1 < lineOffsets.length) ? lineOffsets[position.line + 1] : this._content.length;
        return Math.max(Math.min(lineOffset + position.character, nextLineOffset), lineOffset);
    };
    Object.defineProperty(FullTextDocument.prototype, "lineCount", {
        get: function () {
            return this.getLineOffsets().length;
        },
        enumerable: false,
        configurable: true
    });
    return FullTextDocument;
}());
var Is$1;
(function (Is) {
    var toString = Object.prototype.toString;
    function defined(value) {
        return typeof value !== 'undefined';
    }
    Is.defined = defined;
    function undefined$1(value) {
        return typeof value === 'undefined';
    }
    Is.undefined = undefined$1;
    function boolean(value) {
        return value === true || value === false;
    }
    Is.boolean = boolean;
    function string(value) {
        return toString.call(value) === '[object String]';
    }
    Is.string = string;
    function number(value) {
        return toString.call(value) === '[object Number]';
    }
    Is.number = number;
    function numberRange(value, min, max) {
        return toString.call(value) === '[object Number]' && min <= value && value <= max;
    }
    Is.numberRange = numberRange;
    function integer(value) {
        return toString.call(value) === '[object Number]' && -2147483648 <= value && value <= 2147483647;
    }
    Is.integer = integer;
    function uinteger(value) {
        return toString.call(value) === '[object Number]' && 0 <= value && value <= 2147483647;
    }
    Is.uinteger = uinteger;
    function func(value) {
        return toString.call(value) === '[object Function]';
    }
    Is.func = func;
    function objectLiteral(value) {
        // Strictly speaking class instances pass this check as well. Since the LSP
        // doesn't use classes we ignore this for now. If we do we need to add something
        // like this: `Object.getPrototypeOf(Object.getPrototypeOf(x)) === null`
        return value !== null && typeof value === 'object';
    }
    Is.objectLiteral = objectLiteral;
    function typedArray(value, check) {
        return Array.isArray(value) && value.every(check);
    }
    Is.typedArray = typedArray;
})(Is$1 || (Is$1 = {}));

var main$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	get integer () { return integer$1; },
	get uinteger () { return uinteger$1; },
	get Position () { return Position$1; },
	get Range () { return Range$1; },
	get Location () { return Location$1; },
	get LocationLink () { return LocationLink$1; },
	get Color () { return Color$1; },
	get ColorInformation () { return ColorInformation$1; },
	get ColorPresentation () { return ColorPresentation$1; },
	get FoldingRangeKind () { return FoldingRangeKind$1; },
	get FoldingRange () { return FoldingRange$1; },
	get DiagnosticRelatedInformation () { return DiagnosticRelatedInformation$1; },
	get DiagnosticSeverity () { return DiagnosticSeverity$1; },
	get DiagnosticTag () { return DiagnosticTag$1; },
	get CodeDescription () { return CodeDescription$1; },
	get Diagnostic () { return Diagnostic$1; },
	get Command () { return Command$1; },
	get TextEdit () { return TextEdit$1; },
	get ChangeAnnotation () { return ChangeAnnotation$1; },
	get ChangeAnnotationIdentifier () { return ChangeAnnotationIdentifier$1; },
	get AnnotatedTextEdit () { return AnnotatedTextEdit$1; },
	get TextDocumentEdit () { return TextDocumentEdit$1; },
	get CreateFile () { return CreateFile$1; },
	get RenameFile () { return RenameFile$1; },
	get DeleteFile () { return DeleteFile$1; },
	get WorkspaceEdit () { return WorkspaceEdit$1; },
	WorkspaceChange: WorkspaceChange,
	get TextDocumentIdentifier () { return TextDocumentIdentifier$1; },
	get VersionedTextDocumentIdentifier () { return VersionedTextDocumentIdentifier$1; },
	get OptionalVersionedTextDocumentIdentifier () { return OptionalVersionedTextDocumentIdentifier$1; },
	get TextDocumentItem () { return TextDocumentItem$1; },
	get MarkupKind () { return MarkupKind$1; },
	get MarkupContent () { return MarkupContent$1; },
	get CompletionItemKind () { return CompletionItemKind$1; },
	get InsertTextFormat () { return InsertTextFormat$1; },
	get CompletionItemTag () { return CompletionItemTag$1; },
	get InsertReplaceEdit () { return InsertReplaceEdit$1; },
	get InsertTextMode () { return InsertTextMode$1; },
	get CompletionItem () { return CompletionItem$1; },
	get CompletionList () { return CompletionList$1; },
	get MarkedString () { return MarkedString$1; },
	get Hover () { return Hover$1; },
	get ParameterInformation () { return ParameterInformation$1; },
	get SignatureInformation () { return SignatureInformation$1; },
	get DocumentHighlightKind () { return DocumentHighlightKind$1; },
	get DocumentHighlight () { return DocumentHighlight$1; },
	get SymbolKind () { return SymbolKind$1; },
	get SymbolTag () { return SymbolTag$1; },
	get SymbolInformation () { return SymbolInformation$1; },
	get DocumentSymbol () { return DocumentSymbol$1; },
	get CodeActionKind () { return CodeActionKind$1; },
	get CodeActionContext () { return CodeActionContext$1; },
	get CodeAction () { return CodeAction$1; },
	get CodeLens () { return CodeLens$1; },
	get FormattingOptions () { return FormattingOptions$1; },
	get DocumentLink () { return DocumentLink$1; },
	get SelectionRange () { return SelectionRange$1; },
	EOL: EOL,
	get TextDocument () { return TextDocument$2; }
});

var require$$1 = /*@__PURE__*/getAugmentedNamespace(main$1);

var messages = {};

/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(messages, "__esModule", { value: true });
messages.ProtocolNotificationType = messages.ProtocolNotificationType0 = messages.ProtocolRequestType = messages.ProtocolRequestType0 = messages.RegistrationType = void 0;
const vscode_jsonrpc_1$1 = main$2;
class RegistrationType {
    constructor(method) {
        this.method = method;
    }
}
messages.RegistrationType = RegistrationType;
class ProtocolRequestType0 extends vscode_jsonrpc_1$1.RequestType0 {
    constructor(method) {
        super(method);
    }
}
messages.ProtocolRequestType0 = ProtocolRequestType0;
class ProtocolRequestType extends vscode_jsonrpc_1$1.RequestType {
    constructor(method) {
        super(method, vscode_jsonrpc_1$1.ParameterStructures.byName);
    }
}
messages.ProtocolRequestType = ProtocolRequestType;
class ProtocolNotificationType0 extends vscode_jsonrpc_1$1.NotificationType0 {
    constructor(method) {
        super(method);
    }
}
messages.ProtocolNotificationType0 = ProtocolNotificationType0;
class ProtocolNotificationType extends vscode_jsonrpc_1$1.NotificationType {
    constructor(method) {
        super(method, vscode_jsonrpc_1$1.ParameterStructures.byName);
    }
}
messages.ProtocolNotificationType = ProtocolNotificationType;

var protocol = {};

var is = {};

/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(is, "__esModule", { value: true });
is.objectLiteral = is.typedArray = is.stringArray = is.array = is.func = is.error = is.number = is.string = is.boolean = void 0;
function boolean(value) {
    return value === true || value === false;
}
is.boolean = boolean;
function string(value) {
    return typeof value === 'string' || value instanceof String;
}
is.string = string;
function number(value) {
    return typeof value === 'number' || value instanceof Number;
}
is.number = number;
function error(value) {
    return value instanceof Error;
}
is.error = error;
function func(value) {
    return typeof value === 'function';
}
is.func = func;
function array(value) {
    return Array.isArray(value);
}
is.array = array;
function stringArray(value) {
    return array(value) && value.every(elem => string(elem));
}
is.stringArray = stringArray;
function typedArray(value, check) {
    return Array.isArray(value) && value.every(check);
}
is.typedArray = typedArray;
function objectLiteral(value) {
    // Strictly speaking class instances pass this check as well. Since the LSP
    // doesn't use classes we ignore this for now. If we do we need to add something
    // like this: `Object.getPrototypeOf(Object.getPrototypeOf(x)) === null`
    return value !== null && typeof value === 'object';
}
is.objectLiteral = objectLiteral;

var protocol_implementation = {};

(function (exports) {
	/* --------------------------------------------------------------------------------------------
	 * Copyright (c) Microsoft Corporation. All rights reserved.
	 * Licensed under the MIT License. See License.txt in the project root for license information.
	 * ------------------------------------------------------------------------------------------ */
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ImplementationRequest = void 0;
	const messages_1 = messages;
	(function (ImplementationRequest) {
	    ImplementationRequest.method = 'textDocument/implementation';
	    ImplementationRequest.type = new messages_1.ProtocolRequestType(ImplementationRequest.method);
	})(exports.ImplementationRequest || (exports.ImplementationRequest = {}));
	
} (protocol_implementation));

var protocol_typeDefinition = {};

(function (exports) {
	/* --------------------------------------------------------------------------------------------
	 * Copyright (c) Microsoft Corporation. All rights reserved.
	 * Licensed under the MIT License. See License.txt in the project root for license information.
	 * ------------------------------------------------------------------------------------------ */
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.TypeDefinitionRequest = void 0;
	const messages_1 = messages;
	(function (TypeDefinitionRequest) {
	    TypeDefinitionRequest.method = 'textDocument/typeDefinition';
	    TypeDefinitionRequest.type = new messages_1.ProtocolRequestType(TypeDefinitionRequest.method);
	})(exports.TypeDefinitionRequest || (exports.TypeDefinitionRequest = {}));
	
} (protocol_typeDefinition));

var protocol_workspaceFolders = {};

(function (exports) {
	/* --------------------------------------------------------------------------------------------
	 * Copyright (c) Microsoft Corporation. All rights reserved.
	 * Licensed under the MIT License. See License.txt in the project root for license information.
	 * ------------------------------------------------------------------------------------------ */
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.DidChangeWorkspaceFoldersNotification = exports.WorkspaceFoldersRequest = void 0;
	const messages_1 = messages;
	(function (WorkspaceFoldersRequest) {
	    WorkspaceFoldersRequest.type = new messages_1.ProtocolRequestType0('workspace/workspaceFolders');
	})(exports.WorkspaceFoldersRequest || (exports.WorkspaceFoldersRequest = {}));
	(function (DidChangeWorkspaceFoldersNotification) {
	    DidChangeWorkspaceFoldersNotification.type = new messages_1.ProtocolNotificationType('workspace/didChangeWorkspaceFolders');
	})(exports.DidChangeWorkspaceFoldersNotification || (exports.DidChangeWorkspaceFoldersNotification = {}));
	
} (protocol_workspaceFolders));

var protocol_configuration = {};

(function (exports) {
	/* --------------------------------------------------------------------------------------------
	 * Copyright (c) Microsoft Corporation. All rights reserved.
	 * Licensed under the MIT License. See License.txt in the project root for license information.
	 * ------------------------------------------------------------------------------------------ */
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ConfigurationRequest = void 0;
	const messages_1 = messages;
	(function (ConfigurationRequest) {
	    ConfigurationRequest.type = new messages_1.ProtocolRequestType('workspace/configuration');
	})(exports.ConfigurationRequest || (exports.ConfigurationRequest = {}));
	
} (protocol_configuration));

var protocol_colorProvider = {};

(function (exports) {
	/* --------------------------------------------------------------------------------------------
	 * Copyright (c) Microsoft Corporation. All rights reserved.
	 * Licensed under the MIT License. See License.txt in the project root for license information.
	 * ------------------------------------------------------------------------------------------ */
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ColorPresentationRequest = exports.DocumentColorRequest = void 0;
	const messages_1 = messages;
	(function (DocumentColorRequest) {
	    DocumentColorRequest.method = 'textDocument/documentColor';
	    DocumentColorRequest.type = new messages_1.ProtocolRequestType(DocumentColorRequest.method);
	})(exports.DocumentColorRequest || (exports.DocumentColorRequest = {}));
	(function (ColorPresentationRequest) {
	    ColorPresentationRequest.type = new messages_1.ProtocolRequestType('textDocument/colorPresentation');
	})(exports.ColorPresentationRequest || (exports.ColorPresentationRequest = {}));
	
} (protocol_colorProvider));

var protocol_foldingRange = {};

(function (exports) {
	/*---------------------------------------------------------------------------------------------
	 *  Copyright (c) Microsoft Corporation. All rights reserved.
	 *  Licensed under the MIT License. See License.txt in the project root for license information.
	 *--------------------------------------------------------------------------------------------*/
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.FoldingRangeRequest = exports.FoldingRangeKind = void 0;
	const messages_1 = messages;
	(function (FoldingRangeKind) {
	    /**
	     * Folding range for a comment
	     */
	    FoldingRangeKind["Comment"] = "comment";
	    /**
	     * Folding range for a imports or includes
	     */
	    FoldingRangeKind["Imports"] = "imports";
	    /**
	     * Folding range for a region (e.g. `#region`)
	     */
	    FoldingRangeKind["Region"] = "region";
	})(exports.FoldingRangeKind || (exports.FoldingRangeKind = {}));
	(function (FoldingRangeRequest) {
	    FoldingRangeRequest.method = 'textDocument/foldingRange';
	    FoldingRangeRequest.type = new messages_1.ProtocolRequestType(FoldingRangeRequest.method);
	})(exports.FoldingRangeRequest || (exports.FoldingRangeRequest = {}));
	
} (protocol_foldingRange));

var protocol_declaration = {};

(function (exports) {
	/* --------------------------------------------------------------------------------------------
	 * Copyright (c) Microsoft Corporation. All rights reserved.
	 * Licensed under the MIT License. See License.txt in the project root for license information.
	 * ------------------------------------------------------------------------------------------ */
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.DeclarationRequest = void 0;
	const messages_1 = messages;
	(function (DeclarationRequest) {
	    DeclarationRequest.method = 'textDocument/declaration';
	    DeclarationRequest.type = new messages_1.ProtocolRequestType(DeclarationRequest.method);
	})(exports.DeclarationRequest || (exports.DeclarationRequest = {}));
	
} (protocol_declaration));

var protocol_selectionRange = {};

(function (exports) {
	/*---------------------------------------------------------------------------------------------
	 *  Copyright (c) Microsoft Corporation. All rights reserved.
	 *  Licensed under the MIT License. See License.txt in the project root for license information.
	 *--------------------------------------------------------------------------------------------*/
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.SelectionRangeRequest = void 0;
	const messages_1 = messages;
	(function (SelectionRangeRequest) {
	    SelectionRangeRequest.method = 'textDocument/selectionRange';
	    SelectionRangeRequest.type = new messages_1.ProtocolRequestType(SelectionRangeRequest.method);
	})(exports.SelectionRangeRequest || (exports.SelectionRangeRequest = {}));
	
} (protocol_selectionRange));

var protocol_progress = {};

(function (exports) {
	/* --------------------------------------------------------------------------------------------
	 * Copyright (c) Microsoft Corporation. All rights reserved.
	 * Licensed under the MIT License. See License.txt in the project root for license information.
	 * ------------------------------------------------------------------------------------------ */
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.WorkDoneProgressCancelNotification = exports.WorkDoneProgressCreateRequest = exports.WorkDoneProgress = void 0;
	const vscode_jsonrpc_1 = main$2;
	const messages_1 = messages;
	(function (WorkDoneProgress) {
	    WorkDoneProgress.type = new vscode_jsonrpc_1.ProgressType();
	    function is(value) {
	        return value === WorkDoneProgress.type;
	    }
	    WorkDoneProgress.is = is;
	})(exports.WorkDoneProgress || (exports.WorkDoneProgress = {}));
	(function (WorkDoneProgressCreateRequest) {
	    WorkDoneProgressCreateRequest.type = new messages_1.ProtocolRequestType('window/workDoneProgress/create');
	})(exports.WorkDoneProgressCreateRequest || (exports.WorkDoneProgressCreateRequest = {}));
	(function (WorkDoneProgressCancelNotification) {
	    WorkDoneProgressCancelNotification.type = new messages_1.ProtocolNotificationType('window/workDoneProgress/cancel');
	})(exports.WorkDoneProgressCancelNotification || (exports.WorkDoneProgressCancelNotification = {}));
	
} (protocol_progress));

var protocol_callHierarchy = {};

(function (exports) {
	/* --------------------------------------------------------------------------------------------
	 * Copyright (c) TypeFox and others. All rights reserved.
	 * Licensed under the MIT License. See License.txt in the project root for license information.
	 * ------------------------------------------------------------------------------------------ */
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.CallHierarchyOutgoingCallsRequest = exports.CallHierarchyIncomingCallsRequest = exports.CallHierarchyPrepareRequest = void 0;
	const messages_1 = messages;
	(function (CallHierarchyPrepareRequest) {
	    CallHierarchyPrepareRequest.method = 'textDocument/prepareCallHierarchy';
	    CallHierarchyPrepareRequest.type = new messages_1.ProtocolRequestType(CallHierarchyPrepareRequest.method);
	})(exports.CallHierarchyPrepareRequest || (exports.CallHierarchyPrepareRequest = {}));
	(function (CallHierarchyIncomingCallsRequest) {
	    CallHierarchyIncomingCallsRequest.method = 'callHierarchy/incomingCalls';
	    CallHierarchyIncomingCallsRequest.type = new messages_1.ProtocolRequestType(CallHierarchyIncomingCallsRequest.method);
	})(exports.CallHierarchyIncomingCallsRequest || (exports.CallHierarchyIncomingCallsRequest = {}));
	(function (CallHierarchyOutgoingCallsRequest) {
	    CallHierarchyOutgoingCallsRequest.method = 'callHierarchy/outgoingCalls';
	    CallHierarchyOutgoingCallsRequest.type = new messages_1.ProtocolRequestType(CallHierarchyOutgoingCallsRequest.method);
	})(exports.CallHierarchyOutgoingCallsRequest || (exports.CallHierarchyOutgoingCallsRequest = {}));
	
} (protocol_callHierarchy));

var protocol_semanticTokens = {};

(function (exports) {
	/* --------------------------------------------------------------------------------------------
	 * Copyright (c) Microsoft Corporation. All rights reserved.
	 * Licensed under the MIT License. See License.txt in the project root for license information.
	 * ------------------------------------------------------------------------------------------ */
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.SemanticTokensRefreshRequest = exports.SemanticTokensRangeRequest = exports.SemanticTokensDeltaRequest = exports.SemanticTokensRequest = exports.SemanticTokensRegistrationType = exports.TokenFormat = exports.SemanticTokens = exports.SemanticTokenModifiers = exports.SemanticTokenTypes = void 0;
	const messages_1 = messages;
	(function (SemanticTokenTypes) {
	    SemanticTokenTypes["namespace"] = "namespace";
	    /**
	     * Represents a generic type. Acts as a fallback for types which can't be mapped to
	     * a specific type like class or enum.
	     */
	    SemanticTokenTypes["type"] = "type";
	    SemanticTokenTypes["class"] = "class";
	    SemanticTokenTypes["enum"] = "enum";
	    SemanticTokenTypes["interface"] = "interface";
	    SemanticTokenTypes["struct"] = "struct";
	    SemanticTokenTypes["typeParameter"] = "typeParameter";
	    SemanticTokenTypes["parameter"] = "parameter";
	    SemanticTokenTypes["variable"] = "variable";
	    SemanticTokenTypes["property"] = "property";
	    SemanticTokenTypes["enumMember"] = "enumMember";
	    SemanticTokenTypes["event"] = "event";
	    SemanticTokenTypes["function"] = "function";
	    SemanticTokenTypes["method"] = "method";
	    SemanticTokenTypes["macro"] = "macro";
	    SemanticTokenTypes["keyword"] = "keyword";
	    SemanticTokenTypes["modifier"] = "modifier";
	    SemanticTokenTypes["comment"] = "comment";
	    SemanticTokenTypes["string"] = "string";
	    SemanticTokenTypes["number"] = "number";
	    SemanticTokenTypes["regexp"] = "regexp";
	    SemanticTokenTypes["operator"] = "operator";
	})(exports.SemanticTokenTypes || (exports.SemanticTokenTypes = {}));
	(function (SemanticTokenModifiers) {
	    SemanticTokenModifiers["declaration"] = "declaration";
	    SemanticTokenModifiers["definition"] = "definition";
	    SemanticTokenModifiers["readonly"] = "readonly";
	    SemanticTokenModifiers["static"] = "static";
	    SemanticTokenModifiers["deprecated"] = "deprecated";
	    SemanticTokenModifiers["abstract"] = "abstract";
	    SemanticTokenModifiers["async"] = "async";
	    SemanticTokenModifiers["modification"] = "modification";
	    SemanticTokenModifiers["documentation"] = "documentation";
	    SemanticTokenModifiers["defaultLibrary"] = "defaultLibrary";
	})(exports.SemanticTokenModifiers || (exports.SemanticTokenModifiers = {}));
	(function (SemanticTokens) {
	    function is(value) {
	        const candidate = value;
	        return candidate !== undefined && (candidate.resultId === undefined || typeof candidate.resultId === 'string') &&
	            Array.isArray(candidate.data) && (candidate.data.length === 0 || typeof candidate.data[0] === 'number');
	    }
	    SemanticTokens.is = is;
	})(exports.SemanticTokens || (exports.SemanticTokens = {}));
	(function (TokenFormat) {
	    TokenFormat.Relative = 'relative';
	})(exports.TokenFormat || (exports.TokenFormat = {}));
	(function (SemanticTokensRegistrationType) {
	    SemanticTokensRegistrationType.method = 'textDocument/semanticTokens';
	    SemanticTokensRegistrationType.type = new messages_1.RegistrationType(SemanticTokensRegistrationType.method);
	})(exports.SemanticTokensRegistrationType || (exports.SemanticTokensRegistrationType = {}));
	(function (SemanticTokensRequest) {
	    SemanticTokensRequest.method = 'textDocument/semanticTokens/full';
	    SemanticTokensRequest.type = new messages_1.ProtocolRequestType(SemanticTokensRequest.method);
	})(exports.SemanticTokensRequest || (exports.SemanticTokensRequest = {}));
	(function (SemanticTokensDeltaRequest) {
	    SemanticTokensDeltaRequest.method = 'textDocument/semanticTokens/full/delta';
	    SemanticTokensDeltaRequest.type = new messages_1.ProtocolRequestType(SemanticTokensDeltaRequest.method);
	})(exports.SemanticTokensDeltaRequest || (exports.SemanticTokensDeltaRequest = {}));
	(function (SemanticTokensRangeRequest) {
	    SemanticTokensRangeRequest.method = 'textDocument/semanticTokens/range';
	    SemanticTokensRangeRequest.type = new messages_1.ProtocolRequestType(SemanticTokensRangeRequest.method);
	})(exports.SemanticTokensRangeRequest || (exports.SemanticTokensRangeRequest = {}));
	(function (SemanticTokensRefreshRequest) {
	    SemanticTokensRefreshRequest.method = `workspace/semanticTokens/refresh`;
	    SemanticTokensRefreshRequest.type = new messages_1.ProtocolRequestType0(SemanticTokensRefreshRequest.method);
	})(exports.SemanticTokensRefreshRequest || (exports.SemanticTokensRefreshRequest = {}));
	
} (protocol_semanticTokens));

var protocol_showDocument = {};

(function (exports) {
	/* --------------------------------------------------------------------------------------------
	 * Copyright (c) Microsoft Corporation. All rights reserved.
	 * Licensed under the MIT License. See License.txt in the project root for license information.
	 * ------------------------------------------------------------------------------------------ */
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ShowDocumentRequest = void 0;
	const messages_1 = messages;
	(function (ShowDocumentRequest) {
	    ShowDocumentRequest.method = 'window/showDocument';
	    ShowDocumentRequest.type = new messages_1.ProtocolRequestType(ShowDocumentRequest.method);
	})(exports.ShowDocumentRequest || (exports.ShowDocumentRequest = {}));
	
} (protocol_showDocument));

var protocol_linkedEditingRange = {};

(function (exports) {
	/*---------------------------------------------------------------------------------------------
	 *  Copyright (c) Microsoft Corporation. All rights reserved.
	 *  Licensed under the MIT License. See License.txt in the project root for license information.
	 *--------------------------------------------------------------------------------------------*/
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.LinkedEditingRangeRequest = void 0;
	const messages_1 = messages;
	(function (LinkedEditingRangeRequest) {
	    LinkedEditingRangeRequest.method = 'textDocument/linkedEditingRange';
	    LinkedEditingRangeRequest.type = new messages_1.ProtocolRequestType(LinkedEditingRangeRequest.method);
	})(exports.LinkedEditingRangeRequest || (exports.LinkedEditingRangeRequest = {}));
	
} (protocol_linkedEditingRange));

var protocol_fileOperations = {};

(function (exports) {
	/* --------------------------------------------------------------------------------------------
	 * Copyright (c) Microsoft Corporation. All rights reserved.
	 * Licensed under the MIT License. See License.txt in the project root for license information.
	 * ------------------------------------------------------------------------------------------ */
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.WillDeleteFilesRequest = exports.DidDeleteFilesNotification = exports.DidRenameFilesNotification = exports.WillRenameFilesRequest = exports.DidCreateFilesNotification = exports.WillCreateFilesRequest = exports.FileOperationPatternKind = void 0;
	const messages_1 = messages;
	(function (FileOperationPatternKind) {
	    /**
	     * The pattern matches a file only.
	     */
	    FileOperationPatternKind.file = 'file';
	    /**
	     * The pattern matches a folder only.
	     */
	    FileOperationPatternKind.folder = 'folder';
	})(exports.FileOperationPatternKind || (exports.FileOperationPatternKind = {}));
	(function (WillCreateFilesRequest) {
	    WillCreateFilesRequest.method = 'workspace/willCreateFiles';
	    WillCreateFilesRequest.type = new messages_1.ProtocolRequestType(WillCreateFilesRequest.method);
	})(exports.WillCreateFilesRequest || (exports.WillCreateFilesRequest = {}));
	(function (DidCreateFilesNotification) {
	    DidCreateFilesNotification.method = 'workspace/didCreateFiles';
	    DidCreateFilesNotification.type = new messages_1.ProtocolNotificationType(DidCreateFilesNotification.method);
	})(exports.DidCreateFilesNotification || (exports.DidCreateFilesNotification = {}));
	(function (WillRenameFilesRequest) {
	    WillRenameFilesRequest.method = 'workspace/willRenameFiles';
	    WillRenameFilesRequest.type = new messages_1.ProtocolRequestType(WillRenameFilesRequest.method);
	})(exports.WillRenameFilesRequest || (exports.WillRenameFilesRequest = {}));
	(function (DidRenameFilesNotification) {
	    DidRenameFilesNotification.method = 'workspace/didRenameFiles';
	    DidRenameFilesNotification.type = new messages_1.ProtocolNotificationType(DidRenameFilesNotification.method);
	})(exports.DidRenameFilesNotification || (exports.DidRenameFilesNotification = {}));
	(function (DidDeleteFilesNotification) {
	    DidDeleteFilesNotification.method = 'workspace/didDeleteFiles';
	    DidDeleteFilesNotification.type = new messages_1.ProtocolNotificationType(DidDeleteFilesNotification.method);
	})(exports.DidDeleteFilesNotification || (exports.DidDeleteFilesNotification = {}));
	(function (WillDeleteFilesRequest) {
	    WillDeleteFilesRequest.method = 'workspace/willDeleteFiles';
	    WillDeleteFilesRequest.type = new messages_1.ProtocolRequestType(WillDeleteFilesRequest.method);
	})(exports.WillDeleteFilesRequest || (exports.WillDeleteFilesRequest = {}));
	
} (protocol_fileOperations));

var protocol_moniker = {};

(function (exports) {
	/* --------------------------------------------------------------------------------------------
	 * Copyright (c) Microsoft Corporation. All rights reserved.
	 * Licensed under the MIT License. See License.txt in the project root for license information.
	 * ------------------------------------------------------------------------------------------ */
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.MonikerRequest = exports.MonikerKind = exports.UniquenessLevel = void 0;
	const messages_1 = messages;
	(function (UniquenessLevel) {
	    /**
	     * The moniker is only unique inside a document
	     */
	    UniquenessLevel["document"] = "document";
	    /**
	     * The moniker is unique inside a project for which a dump got created
	     */
	    UniquenessLevel["project"] = "project";
	    /**
	     * The moniker is unique inside the group to which a project belongs
	     */
	    UniquenessLevel["group"] = "group";
	    /**
	     * The moniker is unique inside the moniker scheme.
	     */
	    UniquenessLevel["scheme"] = "scheme";
	    /**
	     * The moniker is globally unique
	     */
	    UniquenessLevel["global"] = "global";
	})(exports.UniquenessLevel || (exports.UniquenessLevel = {}));
	(function (MonikerKind) {
	    /**
	     * The moniker represent a symbol that is imported into a project
	     */
	    MonikerKind["import"] = "import";
	    /**
	     * The moniker represents a symbol that is exported from a project
	     */
	    MonikerKind["export"] = "export";
	    /**
	     * The moniker represents a symbol that is local to a project (e.g. a local
	     * variable of a function, a class not visible outside the project, ...)
	     */
	    MonikerKind["local"] = "local";
	})(exports.MonikerKind || (exports.MonikerKind = {}));
	(function (MonikerRequest) {
	    MonikerRequest.method = 'textDocument/moniker';
	    MonikerRequest.type = new messages_1.ProtocolRequestType(MonikerRequest.method);
	})(exports.MonikerRequest || (exports.MonikerRequest = {}));
	
} (protocol_moniker));

(function (exports) {
	/* --------------------------------------------------------------------------------------------
	 * Copyright (c) Microsoft Corporation. All rights reserved.
	 * Licensed under the MIT License. See License.txt in the project root for license information.
	 * ------------------------------------------------------------------------------------------ */
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.DocumentLinkRequest = exports.CodeLensRefreshRequest = exports.CodeLensResolveRequest = exports.CodeLensRequest = exports.WorkspaceSymbolRequest = exports.CodeActionResolveRequest = exports.CodeActionRequest = exports.DocumentSymbolRequest = exports.DocumentHighlightRequest = exports.ReferencesRequest = exports.DefinitionRequest = exports.SignatureHelpRequest = exports.SignatureHelpTriggerKind = exports.HoverRequest = exports.CompletionResolveRequest = exports.CompletionRequest = exports.CompletionTriggerKind = exports.PublishDiagnosticsNotification = exports.WatchKind = exports.FileChangeType = exports.DidChangeWatchedFilesNotification = exports.WillSaveTextDocumentWaitUntilRequest = exports.WillSaveTextDocumentNotification = exports.TextDocumentSaveReason = exports.DidSaveTextDocumentNotification = exports.DidCloseTextDocumentNotification = exports.DidChangeTextDocumentNotification = exports.TextDocumentContentChangeEvent = exports.DidOpenTextDocumentNotification = exports.TextDocumentSyncKind = exports.TelemetryEventNotification = exports.LogMessageNotification = exports.ShowMessageRequest = exports.ShowMessageNotification = exports.MessageType = exports.DidChangeConfigurationNotification = exports.ExitNotification = exports.ShutdownRequest = exports.InitializedNotification = exports.InitializeError = exports.InitializeRequest = exports.WorkDoneProgressOptions = exports.TextDocumentRegistrationOptions = exports.StaticRegistrationOptions = exports.FailureHandlingKind = exports.ResourceOperationKind = exports.UnregistrationRequest = exports.RegistrationRequest = exports.DocumentSelector = exports.DocumentFilter = void 0;
	exports.MonikerRequest = exports.MonikerKind = exports.UniquenessLevel = exports.WillDeleteFilesRequest = exports.DidDeleteFilesNotification = exports.WillRenameFilesRequest = exports.DidRenameFilesNotification = exports.WillCreateFilesRequest = exports.DidCreateFilesNotification = exports.FileOperationPatternKind = exports.LinkedEditingRangeRequest = exports.ShowDocumentRequest = exports.SemanticTokensRegistrationType = exports.SemanticTokensRefreshRequest = exports.SemanticTokensRangeRequest = exports.SemanticTokensDeltaRequest = exports.SemanticTokensRequest = exports.TokenFormat = exports.SemanticTokens = exports.SemanticTokenModifiers = exports.SemanticTokenTypes = exports.CallHierarchyPrepareRequest = exports.CallHierarchyOutgoingCallsRequest = exports.CallHierarchyIncomingCallsRequest = exports.WorkDoneProgressCancelNotification = exports.WorkDoneProgressCreateRequest = exports.WorkDoneProgress = exports.SelectionRangeRequest = exports.DeclarationRequest = exports.FoldingRangeRequest = exports.ColorPresentationRequest = exports.DocumentColorRequest = exports.ConfigurationRequest = exports.DidChangeWorkspaceFoldersNotification = exports.WorkspaceFoldersRequest = exports.TypeDefinitionRequest = exports.ImplementationRequest = exports.ApplyWorkspaceEditRequest = exports.ExecuteCommandRequest = exports.PrepareRenameRequest = exports.RenameRequest = exports.PrepareSupportDefaultBehavior = exports.DocumentOnTypeFormattingRequest = exports.DocumentRangeFormattingRequest = exports.DocumentFormattingRequest = exports.DocumentLinkResolveRequest = void 0;
	const Is = is;
	const messages_1 = messages;
	const protocol_implementation_1 = protocol_implementation;
	Object.defineProperty(exports, "ImplementationRequest", { enumerable: true, get: function () { return protocol_implementation_1.ImplementationRequest; } });
	const protocol_typeDefinition_1 = protocol_typeDefinition;
	Object.defineProperty(exports, "TypeDefinitionRequest", { enumerable: true, get: function () { return protocol_typeDefinition_1.TypeDefinitionRequest; } });
	const protocol_workspaceFolders_1 = protocol_workspaceFolders;
	Object.defineProperty(exports, "WorkspaceFoldersRequest", { enumerable: true, get: function () { return protocol_workspaceFolders_1.WorkspaceFoldersRequest; } });
	Object.defineProperty(exports, "DidChangeWorkspaceFoldersNotification", { enumerable: true, get: function () { return protocol_workspaceFolders_1.DidChangeWorkspaceFoldersNotification; } });
	const protocol_configuration_1 = protocol_configuration;
	Object.defineProperty(exports, "ConfigurationRequest", { enumerable: true, get: function () { return protocol_configuration_1.ConfigurationRequest; } });
	const protocol_colorProvider_1 = protocol_colorProvider;
	Object.defineProperty(exports, "DocumentColorRequest", { enumerable: true, get: function () { return protocol_colorProvider_1.DocumentColorRequest; } });
	Object.defineProperty(exports, "ColorPresentationRequest", { enumerable: true, get: function () { return protocol_colorProvider_1.ColorPresentationRequest; } });
	const protocol_foldingRange_1 = protocol_foldingRange;
	Object.defineProperty(exports, "FoldingRangeRequest", { enumerable: true, get: function () { return protocol_foldingRange_1.FoldingRangeRequest; } });
	const protocol_declaration_1 = protocol_declaration;
	Object.defineProperty(exports, "DeclarationRequest", { enumerable: true, get: function () { return protocol_declaration_1.DeclarationRequest; } });
	const protocol_selectionRange_1 = protocol_selectionRange;
	Object.defineProperty(exports, "SelectionRangeRequest", { enumerable: true, get: function () { return protocol_selectionRange_1.SelectionRangeRequest; } });
	const protocol_progress_1 = protocol_progress;
	Object.defineProperty(exports, "WorkDoneProgress", { enumerable: true, get: function () { return protocol_progress_1.WorkDoneProgress; } });
	Object.defineProperty(exports, "WorkDoneProgressCreateRequest", { enumerable: true, get: function () { return protocol_progress_1.WorkDoneProgressCreateRequest; } });
	Object.defineProperty(exports, "WorkDoneProgressCancelNotification", { enumerable: true, get: function () { return protocol_progress_1.WorkDoneProgressCancelNotification; } });
	const protocol_callHierarchy_1 = protocol_callHierarchy;
	Object.defineProperty(exports, "CallHierarchyIncomingCallsRequest", { enumerable: true, get: function () { return protocol_callHierarchy_1.CallHierarchyIncomingCallsRequest; } });
	Object.defineProperty(exports, "CallHierarchyOutgoingCallsRequest", { enumerable: true, get: function () { return protocol_callHierarchy_1.CallHierarchyOutgoingCallsRequest; } });
	Object.defineProperty(exports, "CallHierarchyPrepareRequest", { enumerable: true, get: function () { return protocol_callHierarchy_1.CallHierarchyPrepareRequest; } });
	const protocol_semanticTokens_1 = protocol_semanticTokens;
	Object.defineProperty(exports, "SemanticTokenTypes", { enumerable: true, get: function () { return protocol_semanticTokens_1.SemanticTokenTypes; } });
	Object.defineProperty(exports, "SemanticTokenModifiers", { enumerable: true, get: function () { return protocol_semanticTokens_1.SemanticTokenModifiers; } });
	Object.defineProperty(exports, "SemanticTokens", { enumerable: true, get: function () { return protocol_semanticTokens_1.SemanticTokens; } });
	Object.defineProperty(exports, "TokenFormat", { enumerable: true, get: function () { return protocol_semanticTokens_1.TokenFormat; } });
	Object.defineProperty(exports, "SemanticTokensRequest", { enumerable: true, get: function () { return protocol_semanticTokens_1.SemanticTokensRequest; } });
	Object.defineProperty(exports, "SemanticTokensDeltaRequest", { enumerable: true, get: function () { return protocol_semanticTokens_1.SemanticTokensDeltaRequest; } });
	Object.defineProperty(exports, "SemanticTokensRangeRequest", { enumerable: true, get: function () { return protocol_semanticTokens_1.SemanticTokensRangeRequest; } });
	Object.defineProperty(exports, "SemanticTokensRefreshRequest", { enumerable: true, get: function () { return protocol_semanticTokens_1.SemanticTokensRefreshRequest; } });
	Object.defineProperty(exports, "SemanticTokensRegistrationType", { enumerable: true, get: function () { return protocol_semanticTokens_1.SemanticTokensRegistrationType; } });
	const protocol_showDocument_1 = protocol_showDocument;
	Object.defineProperty(exports, "ShowDocumentRequest", { enumerable: true, get: function () { return protocol_showDocument_1.ShowDocumentRequest; } });
	const protocol_linkedEditingRange_1 = protocol_linkedEditingRange;
	Object.defineProperty(exports, "LinkedEditingRangeRequest", { enumerable: true, get: function () { return protocol_linkedEditingRange_1.LinkedEditingRangeRequest; } });
	const protocol_fileOperations_1 = protocol_fileOperations;
	Object.defineProperty(exports, "FileOperationPatternKind", { enumerable: true, get: function () { return protocol_fileOperations_1.FileOperationPatternKind; } });
	Object.defineProperty(exports, "DidCreateFilesNotification", { enumerable: true, get: function () { return protocol_fileOperations_1.DidCreateFilesNotification; } });
	Object.defineProperty(exports, "WillCreateFilesRequest", { enumerable: true, get: function () { return protocol_fileOperations_1.WillCreateFilesRequest; } });
	Object.defineProperty(exports, "DidRenameFilesNotification", { enumerable: true, get: function () { return protocol_fileOperations_1.DidRenameFilesNotification; } });
	Object.defineProperty(exports, "WillRenameFilesRequest", { enumerable: true, get: function () { return protocol_fileOperations_1.WillRenameFilesRequest; } });
	Object.defineProperty(exports, "DidDeleteFilesNotification", { enumerable: true, get: function () { return protocol_fileOperations_1.DidDeleteFilesNotification; } });
	Object.defineProperty(exports, "WillDeleteFilesRequest", { enumerable: true, get: function () { return protocol_fileOperations_1.WillDeleteFilesRequest; } });
	const protocol_moniker_1 = protocol_moniker;
	Object.defineProperty(exports, "UniquenessLevel", { enumerable: true, get: function () { return protocol_moniker_1.UniquenessLevel; } });
	Object.defineProperty(exports, "MonikerKind", { enumerable: true, get: function () { return protocol_moniker_1.MonikerKind; } });
	Object.defineProperty(exports, "MonikerRequest", { enumerable: true, get: function () { return protocol_moniker_1.MonikerRequest; } });
	/**
	 * The DocumentFilter namespace provides helper functions to work with
	 * [DocumentFilter](#DocumentFilter) literals.
	 */
	var DocumentFilter;
	(function (DocumentFilter) {
	    function is(value) {
	        const candidate = value;
	        return Is.string(candidate.language) || Is.string(candidate.scheme) || Is.string(candidate.pattern);
	    }
	    DocumentFilter.is = is;
	})(DocumentFilter = exports.DocumentFilter || (exports.DocumentFilter = {}));
	/**
	 * The DocumentSelector namespace provides helper functions to work with
	 * [DocumentSelector](#DocumentSelector)s.
	 */
	var DocumentSelector;
	(function (DocumentSelector) {
	    function is(value) {
	        if (!Array.isArray(value)) {
	            return false;
	        }
	        for (let elem of value) {
	            if (!Is.string(elem) && !DocumentFilter.is(elem)) {
	                return false;
	            }
	        }
	        return true;
	    }
	    DocumentSelector.is = is;
	})(DocumentSelector = exports.DocumentSelector || (exports.DocumentSelector = {}));
	(function (RegistrationRequest) {
	    RegistrationRequest.type = new messages_1.ProtocolRequestType('client/registerCapability');
	})(exports.RegistrationRequest || (exports.RegistrationRequest = {}));
	(function (UnregistrationRequest) {
	    UnregistrationRequest.type = new messages_1.ProtocolRequestType('client/unregisterCapability');
	})(exports.UnregistrationRequest || (exports.UnregistrationRequest = {}));
	(function (ResourceOperationKind) {
	    /**
	     * Supports creating new files and folders.
	     */
	    ResourceOperationKind.Create = 'create';
	    /**
	     * Supports renaming existing files and folders.
	     */
	    ResourceOperationKind.Rename = 'rename';
	    /**
	     * Supports deleting existing files and folders.
	     */
	    ResourceOperationKind.Delete = 'delete';
	})(exports.ResourceOperationKind || (exports.ResourceOperationKind = {}));
	(function (FailureHandlingKind) {
	    /**
	     * Applying the workspace change is simply aborted if one of the changes provided
	     * fails. All operations executed before the failing operation stay executed.
	     */
	    FailureHandlingKind.Abort = 'abort';
	    /**
	     * All operations are executed transactional. That means they either all
	     * succeed or no changes at all are applied to the workspace.
	     */
	    FailureHandlingKind.Transactional = 'transactional';
	    /**
	     * If the workspace edit contains only textual file changes they are executed transactional.
	     * If resource changes (create, rename or delete file) are part of the change the failure
	     * handling strategy is abort.
	     */
	    FailureHandlingKind.TextOnlyTransactional = 'textOnlyTransactional';
	    /**
	     * The client tries to undo the operations already executed. But there is no
	     * guarantee that this is succeeding.
	     */
	    FailureHandlingKind.Undo = 'undo';
	})(exports.FailureHandlingKind || (exports.FailureHandlingKind = {}));
	(function (StaticRegistrationOptions) {
	    function hasId(value) {
	        const candidate = value;
	        return candidate && Is.string(candidate.id) && candidate.id.length > 0;
	    }
	    StaticRegistrationOptions.hasId = hasId;
	})(exports.StaticRegistrationOptions || (exports.StaticRegistrationOptions = {}));
	(function (TextDocumentRegistrationOptions) {
	    function is(value) {
	        const candidate = value;
	        return candidate && (candidate.documentSelector === null || DocumentSelector.is(candidate.documentSelector));
	    }
	    TextDocumentRegistrationOptions.is = is;
	})(exports.TextDocumentRegistrationOptions || (exports.TextDocumentRegistrationOptions = {}));
	(function (WorkDoneProgressOptions) {
	    function is(value) {
	        const candidate = value;
	        return Is.objectLiteral(candidate) && (candidate.workDoneProgress === undefined || Is.boolean(candidate.workDoneProgress));
	    }
	    WorkDoneProgressOptions.is = is;
	    function hasWorkDoneProgress(value) {
	        const candidate = value;
	        return candidate && Is.boolean(candidate.workDoneProgress);
	    }
	    WorkDoneProgressOptions.hasWorkDoneProgress = hasWorkDoneProgress;
	})(exports.WorkDoneProgressOptions || (exports.WorkDoneProgressOptions = {}));
	(function (InitializeRequest) {
	    InitializeRequest.type = new messages_1.ProtocolRequestType('initialize');
	})(exports.InitializeRequest || (exports.InitializeRequest = {}));
	(function (InitializeError) {
	    /**
	     * If the protocol version provided by the client can't be handled by the server.
	     * @deprecated This initialize error got replaced by client capabilities. There is
	     * no version handshake in version 3.0x
	     */
	    InitializeError.unknownProtocolVersion = 1;
	})(exports.InitializeError || (exports.InitializeError = {}));
	(function (InitializedNotification) {
	    InitializedNotification.type = new messages_1.ProtocolNotificationType('initialized');
	})(exports.InitializedNotification || (exports.InitializedNotification = {}));
	(function (ShutdownRequest) {
	    ShutdownRequest.type = new messages_1.ProtocolRequestType0('shutdown');
	})(exports.ShutdownRequest || (exports.ShutdownRequest = {}));
	(function (ExitNotification) {
	    ExitNotification.type = new messages_1.ProtocolNotificationType0('exit');
	})(exports.ExitNotification || (exports.ExitNotification = {}));
	(function (DidChangeConfigurationNotification) {
	    DidChangeConfigurationNotification.type = new messages_1.ProtocolNotificationType('workspace/didChangeConfiguration');
	})(exports.DidChangeConfigurationNotification || (exports.DidChangeConfigurationNotification = {}));
	(function (MessageType) {
	    /**
	     * An error message.
	     */
	    MessageType.Error = 1;
	    /**
	     * A warning message.
	     */
	    MessageType.Warning = 2;
	    /**
	     * An information message.
	     */
	    MessageType.Info = 3;
	    /**
	     * A log message.
	     */
	    MessageType.Log = 4;
	})(exports.MessageType || (exports.MessageType = {}));
	(function (ShowMessageNotification) {
	    ShowMessageNotification.type = new messages_1.ProtocolNotificationType('window/showMessage');
	})(exports.ShowMessageNotification || (exports.ShowMessageNotification = {}));
	(function (ShowMessageRequest) {
	    ShowMessageRequest.type = new messages_1.ProtocolRequestType('window/showMessageRequest');
	})(exports.ShowMessageRequest || (exports.ShowMessageRequest = {}));
	(function (LogMessageNotification) {
	    LogMessageNotification.type = new messages_1.ProtocolNotificationType('window/logMessage');
	})(exports.LogMessageNotification || (exports.LogMessageNotification = {}));
	(function (TelemetryEventNotification) {
	    TelemetryEventNotification.type = new messages_1.ProtocolNotificationType('telemetry/event');
	})(exports.TelemetryEventNotification || (exports.TelemetryEventNotification = {}));
	(function (TextDocumentSyncKind) {
	    /**
	     * Documents should not be synced at all.
	     */
	    TextDocumentSyncKind.None = 0;
	    /**
	     * Documents are synced by always sending the full content
	     * of the document.
	     */
	    TextDocumentSyncKind.Full = 1;
	    /**
	     * Documents are synced by sending the full content on open.
	     * After that only incremental updates to the document are
	     * send.
	     */
	    TextDocumentSyncKind.Incremental = 2;
	})(exports.TextDocumentSyncKind || (exports.TextDocumentSyncKind = {}));
	(function (DidOpenTextDocumentNotification) {
	    DidOpenTextDocumentNotification.method = 'textDocument/didOpen';
	    DidOpenTextDocumentNotification.type = new messages_1.ProtocolNotificationType(DidOpenTextDocumentNotification.method);
	})(exports.DidOpenTextDocumentNotification || (exports.DidOpenTextDocumentNotification = {}));
	(function (TextDocumentContentChangeEvent) {
	    /**
	     * Checks whether the information describes a delta event.
	     */
	    function isIncremental(event) {
	        let candidate = event;
	        return candidate !== undefined && candidate !== null &&
	            typeof candidate.text === 'string' && candidate.range !== undefined &&
	            (candidate.rangeLength === undefined || typeof candidate.rangeLength === 'number');
	    }
	    TextDocumentContentChangeEvent.isIncremental = isIncremental;
	    /**
	     * Checks whether the information describes a full replacement event.
	     */
	    function isFull(event) {
	        let candidate = event;
	        return candidate !== undefined && candidate !== null &&
	            typeof candidate.text === 'string' && candidate.range === undefined && candidate.rangeLength === undefined;
	    }
	    TextDocumentContentChangeEvent.isFull = isFull;
	})(exports.TextDocumentContentChangeEvent || (exports.TextDocumentContentChangeEvent = {}));
	(function (DidChangeTextDocumentNotification) {
	    DidChangeTextDocumentNotification.method = 'textDocument/didChange';
	    DidChangeTextDocumentNotification.type = new messages_1.ProtocolNotificationType(DidChangeTextDocumentNotification.method);
	})(exports.DidChangeTextDocumentNotification || (exports.DidChangeTextDocumentNotification = {}));
	(function (DidCloseTextDocumentNotification) {
	    DidCloseTextDocumentNotification.method = 'textDocument/didClose';
	    DidCloseTextDocumentNotification.type = new messages_1.ProtocolNotificationType(DidCloseTextDocumentNotification.method);
	})(exports.DidCloseTextDocumentNotification || (exports.DidCloseTextDocumentNotification = {}));
	(function (DidSaveTextDocumentNotification) {
	    DidSaveTextDocumentNotification.method = 'textDocument/didSave';
	    DidSaveTextDocumentNotification.type = new messages_1.ProtocolNotificationType(DidSaveTextDocumentNotification.method);
	})(exports.DidSaveTextDocumentNotification || (exports.DidSaveTextDocumentNotification = {}));
	(function (TextDocumentSaveReason) {
	    /**
	     * Manually triggered, e.g. by the user pressing save, by starting debugging,
	     * or by an API call.
	     */
	    TextDocumentSaveReason.Manual = 1;
	    /**
	     * Automatic after a delay.
	     */
	    TextDocumentSaveReason.AfterDelay = 2;
	    /**
	     * When the editor lost focus.
	     */
	    TextDocumentSaveReason.FocusOut = 3;
	})(exports.TextDocumentSaveReason || (exports.TextDocumentSaveReason = {}));
	(function (WillSaveTextDocumentNotification) {
	    WillSaveTextDocumentNotification.method = 'textDocument/willSave';
	    WillSaveTextDocumentNotification.type = new messages_1.ProtocolNotificationType(WillSaveTextDocumentNotification.method);
	})(exports.WillSaveTextDocumentNotification || (exports.WillSaveTextDocumentNotification = {}));
	(function (WillSaveTextDocumentWaitUntilRequest) {
	    WillSaveTextDocumentWaitUntilRequest.method = 'textDocument/willSaveWaitUntil';
	    WillSaveTextDocumentWaitUntilRequest.type = new messages_1.ProtocolRequestType(WillSaveTextDocumentWaitUntilRequest.method);
	})(exports.WillSaveTextDocumentWaitUntilRequest || (exports.WillSaveTextDocumentWaitUntilRequest = {}));
	(function (DidChangeWatchedFilesNotification) {
	    DidChangeWatchedFilesNotification.type = new messages_1.ProtocolNotificationType('workspace/didChangeWatchedFiles');
	})(exports.DidChangeWatchedFilesNotification || (exports.DidChangeWatchedFilesNotification = {}));
	(function (FileChangeType) {
	    /**
	     * The file got created.
	     */
	    FileChangeType.Created = 1;
	    /**
	     * The file got changed.
	     */
	    FileChangeType.Changed = 2;
	    /**
	     * The file got deleted.
	     */
	    FileChangeType.Deleted = 3;
	})(exports.FileChangeType || (exports.FileChangeType = {}));
	(function (WatchKind) {
	    /**
	     * Interested in create events.
	     */
	    WatchKind.Create = 1;
	    /**
	     * Interested in change events
	     */
	    WatchKind.Change = 2;
	    /**
	     * Interested in delete events
	     */
	    WatchKind.Delete = 4;
	})(exports.WatchKind || (exports.WatchKind = {}));
	(function (PublishDiagnosticsNotification) {
	    PublishDiagnosticsNotification.type = new messages_1.ProtocolNotificationType('textDocument/publishDiagnostics');
	})(exports.PublishDiagnosticsNotification || (exports.PublishDiagnosticsNotification = {}));
	(function (CompletionTriggerKind) {
	    /**
	     * Completion was triggered by typing an identifier (24x7 code
	     * complete), manual invocation (e.g Ctrl+Space) or via API.
	     */
	    CompletionTriggerKind.Invoked = 1;
	    /**
	     * Completion was triggered by a trigger character specified by
	     * the `triggerCharacters` properties of the `CompletionRegistrationOptions`.
	     */
	    CompletionTriggerKind.TriggerCharacter = 2;
	    /**
	     * Completion was re-triggered as current completion list is incomplete
	     */
	    CompletionTriggerKind.TriggerForIncompleteCompletions = 3;
	})(exports.CompletionTriggerKind || (exports.CompletionTriggerKind = {}));
	(function (CompletionRequest) {
	    CompletionRequest.method = 'textDocument/completion';
	    CompletionRequest.type = new messages_1.ProtocolRequestType(CompletionRequest.method);
	})(exports.CompletionRequest || (exports.CompletionRequest = {}));
	(function (CompletionResolveRequest) {
	    CompletionResolveRequest.method = 'completionItem/resolve';
	    CompletionResolveRequest.type = new messages_1.ProtocolRequestType(CompletionResolveRequest.method);
	})(exports.CompletionResolveRequest || (exports.CompletionResolveRequest = {}));
	(function (HoverRequest) {
	    HoverRequest.method = 'textDocument/hover';
	    HoverRequest.type = new messages_1.ProtocolRequestType(HoverRequest.method);
	})(exports.HoverRequest || (exports.HoverRequest = {}));
	(function (SignatureHelpTriggerKind) {
	    /**
	     * Signature help was invoked manually by the user or by a command.
	     */
	    SignatureHelpTriggerKind.Invoked = 1;
	    /**
	     * Signature help was triggered by a trigger character.
	     */
	    SignatureHelpTriggerKind.TriggerCharacter = 2;
	    /**
	     * Signature help was triggered by the cursor moving or by the document content changing.
	     */
	    SignatureHelpTriggerKind.ContentChange = 3;
	})(exports.SignatureHelpTriggerKind || (exports.SignatureHelpTriggerKind = {}));
	(function (SignatureHelpRequest) {
	    SignatureHelpRequest.method = 'textDocument/signatureHelp';
	    SignatureHelpRequest.type = new messages_1.ProtocolRequestType(SignatureHelpRequest.method);
	})(exports.SignatureHelpRequest || (exports.SignatureHelpRequest = {}));
	(function (DefinitionRequest) {
	    DefinitionRequest.method = 'textDocument/definition';
	    DefinitionRequest.type = new messages_1.ProtocolRequestType(DefinitionRequest.method);
	})(exports.DefinitionRequest || (exports.DefinitionRequest = {}));
	(function (ReferencesRequest) {
	    ReferencesRequest.method = 'textDocument/references';
	    ReferencesRequest.type = new messages_1.ProtocolRequestType(ReferencesRequest.method);
	})(exports.ReferencesRequest || (exports.ReferencesRequest = {}));
	(function (DocumentHighlightRequest) {
	    DocumentHighlightRequest.method = 'textDocument/documentHighlight';
	    DocumentHighlightRequest.type = new messages_1.ProtocolRequestType(DocumentHighlightRequest.method);
	})(exports.DocumentHighlightRequest || (exports.DocumentHighlightRequest = {}));
	(function (DocumentSymbolRequest) {
	    DocumentSymbolRequest.method = 'textDocument/documentSymbol';
	    DocumentSymbolRequest.type = new messages_1.ProtocolRequestType(DocumentSymbolRequest.method);
	})(exports.DocumentSymbolRequest || (exports.DocumentSymbolRequest = {}));
	(function (CodeActionRequest) {
	    CodeActionRequest.method = 'textDocument/codeAction';
	    CodeActionRequest.type = new messages_1.ProtocolRequestType(CodeActionRequest.method);
	})(exports.CodeActionRequest || (exports.CodeActionRequest = {}));
	(function (CodeActionResolveRequest) {
	    CodeActionResolveRequest.method = 'codeAction/resolve';
	    CodeActionResolveRequest.type = new messages_1.ProtocolRequestType(CodeActionResolveRequest.method);
	})(exports.CodeActionResolveRequest || (exports.CodeActionResolveRequest = {}));
	(function (WorkspaceSymbolRequest) {
	    WorkspaceSymbolRequest.method = 'workspace/symbol';
	    WorkspaceSymbolRequest.type = new messages_1.ProtocolRequestType(WorkspaceSymbolRequest.method);
	})(exports.WorkspaceSymbolRequest || (exports.WorkspaceSymbolRequest = {}));
	(function (CodeLensRequest) {
	    CodeLensRequest.method = 'textDocument/codeLens';
	    CodeLensRequest.type = new messages_1.ProtocolRequestType(CodeLensRequest.method);
	})(exports.CodeLensRequest || (exports.CodeLensRequest = {}));
	(function (CodeLensResolveRequest) {
	    CodeLensResolveRequest.method = 'codeLens/resolve';
	    CodeLensResolveRequest.type = new messages_1.ProtocolRequestType(CodeLensResolveRequest.method);
	})(exports.CodeLensResolveRequest || (exports.CodeLensResolveRequest = {}));
	(function (CodeLensRefreshRequest) {
	    CodeLensRefreshRequest.method = `workspace/codeLens/refresh`;
	    CodeLensRefreshRequest.type = new messages_1.ProtocolRequestType0(CodeLensRefreshRequest.method);
	})(exports.CodeLensRefreshRequest || (exports.CodeLensRefreshRequest = {}));
	(function (DocumentLinkRequest) {
	    DocumentLinkRequest.method = 'textDocument/documentLink';
	    DocumentLinkRequest.type = new messages_1.ProtocolRequestType(DocumentLinkRequest.method);
	})(exports.DocumentLinkRequest || (exports.DocumentLinkRequest = {}));
	(function (DocumentLinkResolveRequest) {
	    DocumentLinkResolveRequest.method = 'documentLink/resolve';
	    DocumentLinkResolveRequest.type = new messages_1.ProtocolRequestType(DocumentLinkResolveRequest.method);
	})(exports.DocumentLinkResolveRequest || (exports.DocumentLinkResolveRequest = {}));
	(function (DocumentFormattingRequest) {
	    DocumentFormattingRequest.method = 'textDocument/formatting';
	    DocumentFormattingRequest.type = new messages_1.ProtocolRequestType(DocumentFormattingRequest.method);
	})(exports.DocumentFormattingRequest || (exports.DocumentFormattingRequest = {}));
	(function (DocumentRangeFormattingRequest) {
	    DocumentRangeFormattingRequest.method = 'textDocument/rangeFormatting';
	    DocumentRangeFormattingRequest.type = new messages_1.ProtocolRequestType(DocumentRangeFormattingRequest.method);
	})(exports.DocumentRangeFormattingRequest || (exports.DocumentRangeFormattingRequest = {}));
	(function (DocumentOnTypeFormattingRequest) {
	    DocumentOnTypeFormattingRequest.method = 'textDocument/onTypeFormatting';
	    DocumentOnTypeFormattingRequest.type = new messages_1.ProtocolRequestType(DocumentOnTypeFormattingRequest.method);
	})(exports.DocumentOnTypeFormattingRequest || (exports.DocumentOnTypeFormattingRequest = {}));
	(function (PrepareSupportDefaultBehavior) {
	    /**
	     * The client's default behavior is to select the identifier
	     * according the to language's syntax rule.
	     */
	    PrepareSupportDefaultBehavior.Identifier = 1;
	})(exports.PrepareSupportDefaultBehavior || (exports.PrepareSupportDefaultBehavior = {}));
	(function (RenameRequest) {
	    RenameRequest.method = 'textDocument/rename';
	    RenameRequest.type = new messages_1.ProtocolRequestType(RenameRequest.method);
	})(exports.RenameRequest || (exports.RenameRequest = {}));
	(function (PrepareRenameRequest) {
	    PrepareRenameRequest.method = 'textDocument/prepareRename';
	    PrepareRenameRequest.type = new messages_1.ProtocolRequestType(PrepareRenameRequest.method);
	})(exports.PrepareRenameRequest || (exports.PrepareRenameRequest = {}));
	(function (ExecuteCommandRequest) {
	    ExecuteCommandRequest.type = new messages_1.ProtocolRequestType('workspace/executeCommand');
	})(exports.ExecuteCommandRequest || (exports.ExecuteCommandRequest = {}));
	(function (ApplyWorkspaceEditRequest) {
	    ApplyWorkspaceEditRequest.type = new messages_1.ProtocolRequestType('workspace/applyEdit');
	})(exports.ApplyWorkspaceEditRequest || (exports.ApplyWorkspaceEditRequest = {}));
	
} (protocol));

var connection = {};

/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(connection, "__esModule", { value: true });
connection.createProtocolConnection = void 0;
const vscode_jsonrpc_1 = main$2;
function createProtocolConnection(input, output, logger, options) {
    if (vscode_jsonrpc_1.ConnectionStrategy.is(options)) {
        options = { connectionStrategy: options };
    }
    return vscode_jsonrpc_1.createMessageConnection(input, output, logger, options);
}
connection.createProtocolConnection = createProtocolConnection;

(function (exports) {
	/* --------------------------------------------------------------------------------------------
	 * Copyright (c) Microsoft Corporation. All rights reserved.
	 * Licensed under the MIT License. See License.txt in the project root for license information.
	 * ------------------------------------------------------------------------------------------ */
	var __createBinding = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __exportStar = (commonjsGlobal && commonjsGlobal.__exportStar) || function(m, exports) {
	    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.LSPErrorCodes = exports.createProtocolConnection = void 0;
	__exportStar(main$2, exports);
	__exportStar(require$$1, exports);
	__exportStar(messages, exports);
	__exportStar(protocol, exports);
	var connection_1 = connection;
	Object.defineProperty(exports, "createProtocolConnection", { enumerable: true, get: function () { return connection_1.createProtocolConnection; } });
	(function (LSPErrorCodes) {
	    /**
	    * This is the start range of LSP reserved error codes.
	    * It doesn't denote a real error code.
	    *
	    * @since 3.16.0
	    */
	    LSPErrorCodes.lspReservedErrorRangeStart = -32899;
	    LSPErrorCodes.ContentModified = -32801;
	    LSPErrorCodes.RequestCancelled = -32800;
	    /**
	    * This is the end range of LSP reserved error codes.
	    * It doesn't denote a real error code.
	    *
	    * @since 3.16.0
	    */
	    LSPErrorCodes.lspReservedErrorRangeEnd = -32800;
	})(exports.LSPErrorCodes || (exports.LSPErrorCodes = {}));
	
} (api));

(function (exports) {
	/* --------------------------------------------------------------------------------------------
	 * Copyright (c) Microsoft Corporation. All rights reserved.
	 * Licensed under the MIT License. See License.txt in the project root for license information.
	 * ------------------------------------------------------------------------------------------ */
	var __createBinding = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __exportStar = (commonjsGlobal && commonjsGlobal.__exportStar) || function(m, exports) {
	    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.createProtocolConnection = void 0;
	const browser_1 = browser.exports;
	__exportStar(browser.exports, exports);
	__exportStar(api, exports);
	function createProtocolConnection(reader, writer, logger, options) {
	    return browser_1.createMessageConnection(reader, writer, logger, options);
	}
	exports.createProtocolConnection = createProtocolConnection;
	
} (main$3));

/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ----------------------------------------------------------------------------------------- */

(function (module) {

	module.exports = main$3;
} (browser$1));

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/**
 * Creates a JSON scanner on the given text.
 * If ignoreTrivia is set, whitespaces or comments are ignored.
 */
function createScanner$1(text, ignoreTrivia) {
    if (ignoreTrivia === void 0) { ignoreTrivia = false; }
    var len = text.length;
    var pos = 0, value = '', tokenOffset = 0, token = 16 /* Unknown */, lineNumber = 0, lineStartOffset = 0, tokenLineStartOffset = 0, prevTokenLineStartOffset = 0, scanError = 0 /* None */;
    function scanHexDigits(count, exact) {
        var digits = 0;
        var value = 0;
        while (digits < count || !exact) {
            var ch = text.charCodeAt(pos);
            if (ch >= 48 /* _0 */ && ch <= 57 /* _9 */) {
                value = value * 16 + ch - 48 /* _0 */;
            }
            else if (ch >= 65 /* A */ && ch <= 70 /* F */) {
                value = value * 16 + ch - 65 /* A */ + 10;
            }
            else if (ch >= 97 /* a */ && ch <= 102 /* f */) {
                value = value * 16 + ch - 97 /* a */ + 10;
            }
            else {
                break;
            }
            pos++;
            digits++;
        }
        if (digits < count) {
            value = -1;
        }
        return value;
    }
    function setPosition(newPosition) {
        pos = newPosition;
        value = '';
        tokenOffset = 0;
        token = 16 /* Unknown */;
        scanError = 0 /* None */;
    }
    function scanNumber() {
        var start = pos;
        if (text.charCodeAt(pos) === 48 /* _0 */) {
            pos++;
        }
        else {
            pos++;
            while (pos < text.length && isDigit(text.charCodeAt(pos))) {
                pos++;
            }
        }
        if (pos < text.length && text.charCodeAt(pos) === 46 /* dot */) {
            pos++;
            if (pos < text.length && isDigit(text.charCodeAt(pos))) {
                pos++;
                while (pos < text.length && isDigit(text.charCodeAt(pos))) {
                    pos++;
                }
            }
            else {
                scanError = 3 /* UnexpectedEndOfNumber */;
                return text.substring(start, pos);
            }
        }
        var end = pos;
        if (pos < text.length && (text.charCodeAt(pos) === 69 /* E */ || text.charCodeAt(pos) === 101 /* e */)) {
            pos++;
            if (pos < text.length && text.charCodeAt(pos) === 43 /* plus */ || text.charCodeAt(pos) === 45 /* minus */) {
                pos++;
            }
            if (pos < text.length && isDigit(text.charCodeAt(pos))) {
                pos++;
                while (pos < text.length && isDigit(text.charCodeAt(pos))) {
                    pos++;
                }
                end = pos;
            }
            else {
                scanError = 3 /* UnexpectedEndOfNumber */;
            }
        }
        return text.substring(start, end);
    }
    function scanString() {
        var result = '', start = pos;
        while (true) {
            if (pos >= len) {
                result += text.substring(start, pos);
                scanError = 2 /* UnexpectedEndOfString */;
                break;
            }
            var ch = text.charCodeAt(pos);
            if (ch === 34 /* doubleQuote */) {
                result += text.substring(start, pos);
                pos++;
                break;
            }
            if (ch === 92 /* backslash */) {
                result += text.substring(start, pos);
                pos++;
                if (pos >= len) {
                    scanError = 2 /* UnexpectedEndOfString */;
                    break;
                }
                var ch2 = text.charCodeAt(pos++);
                switch (ch2) {
                    case 34 /* doubleQuote */:
                        result += '\"';
                        break;
                    case 92 /* backslash */:
                        result += '\\';
                        break;
                    case 47 /* slash */:
                        result += '/';
                        break;
                    case 98 /* b */:
                        result += '\b';
                        break;
                    case 102 /* f */:
                        result += '\f';
                        break;
                    case 110 /* n */:
                        result += '\n';
                        break;
                    case 114 /* r */:
                        result += '\r';
                        break;
                    case 116 /* t */:
                        result += '\t';
                        break;
                    case 117 /* u */:
                        var ch3 = scanHexDigits(4, true);
                        if (ch3 >= 0) {
                            result += String.fromCharCode(ch3);
                        }
                        else {
                            scanError = 4 /* InvalidUnicode */;
                        }
                        break;
                    default:
                        scanError = 5 /* InvalidEscapeCharacter */;
                }
                start = pos;
                continue;
            }
            if (ch >= 0 && ch <= 0x1f) {
                if (isLineBreak(ch)) {
                    result += text.substring(start, pos);
                    scanError = 2 /* UnexpectedEndOfString */;
                    break;
                }
                else {
                    scanError = 6 /* InvalidCharacter */;
                    // mark as error but continue with string
                }
            }
            pos++;
        }
        return result;
    }
    function scanNext() {
        value = '';
        scanError = 0 /* None */;
        tokenOffset = pos;
        lineStartOffset = lineNumber;
        prevTokenLineStartOffset = tokenLineStartOffset;
        if (pos >= len) {
            // at the end
            tokenOffset = len;
            return token = 17 /* EOF */;
        }
        var code = text.charCodeAt(pos);
        // trivia: whitespace
        if (isWhiteSpace(code)) {
            do {
                pos++;
                value += String.fromCharCode(code);
                code = text.charCodeAt(pos);
            } while (isWhiteSpace(code));
            return token = 15 /* Trivia */;
        }
        // trivia: newlines
        if (isLineBreak(code)) {
            pos++;
            value += String.fromCharCode(code);
            if (code === 13 /* carriageReturn */ && text.charCodeAt(pos) === 10 /* lineFeed */) {
                pos++;
                value += '\n';
            }
            lineNumber++;
            tokenLineStartOffset = pos;
            return token = 14 /* LineBreakTrivia */;
        }
        switch (code) {
            // tokens: []{}:,
            case 123 /* openBrace */:
                pos++;
                return token = 1 /* OpenBraceToken */;
            case 125 /* closeBrace */:
                pos++;
                return token = 2 /* CloseBraceToken */;
            case 91 /* openBracket */:
                pos++;
                return token = 3 /* OpenBracketToken */;
            case 93 /* closeBracket */:
                pos++;
                return token = 4 /* CloseBracketToken */;
            case 58 /* colon */:
                pos++;
                return token = 6 /* ColonToken */;
            case 44 /* comma */:
                pos++;
                return token = 5 /* CommaToken */;
            // strings
            case 34 /* doubleQuote */:
                pos++;
                value = scanString();
                return token = 10 /* StringLiteral */;
            // comments
            case 47 /* slash */:
                var start = pos - 1;
                // Single-line comment
                if (text.charCodeAt(pos + 1) === 47 /* slash */) {
                    pos += 2;
                    while (pos < len) {
                        if (isLineBreak(text.charCodeAt(pos))) {
                            break;
                        }
                        pos++;
                    }
                    value = text.substring(start, pos);
                    return token = 12 /* LineCommentTrivia */;
                }
                // Multi-line comment
                if (text.charCodeAt(pos + 1) === 42 /* asterisk */) {
                    pos += 2;
                    var safeLength = len - 1; // For lookahead.
                    var commentClosed = false;
                    while (pos < safeLength) {
                        var ch = text.charCodeAt(pos);
                        if (ch === 42 /* asterisk */ && text.charCodeAt(pos + 1) === 47 /* slash */) {
                            pos += 2;
                            commentClosed = true;
                            break;
                        }
                        pos++;
                        if (isLineBreak(ch)) {
                            if (ch === 13 /* carriageReturn */ && text.charCodeAt(pos) === 10 /* lineFeed */) {
                                pos++;
                            }
                            lineNumber++;
                            tokenLineStartOffset = pos;
                        }
                    }
                    if (!commentClosed) {
                        pos++;
                        scanError = 1 /* UnexpectedEndOfComment */;
                    }
                    value = text.substring(start, pos);
                    return token = 13 /* BlockCommentTrivia */;
                }
                // just a single slash
                value += String.fromCharCode(code);
                pos++;
                return token = 16 /* Unknown */;
            // numbers
            case 45 /* minus */:
                value += String.fromCharCode(code);
                pos++;
                if (pos === len || !isDigit(text.charCodeAt(pos))) {
                    return token = 16 /* Unknown */;
                }
            // found a minus, followed by a number so
            // we fall through to proceed with scanning
            // numbers
            case 48 /* _0 */:
            case 49 /* _1 */:
            case 50 /* _2 */:
            case 51 /* _3 */:
            case 52 /* _4 */:
            case 53 /* _5 */:
            case 54 /* _6 */:
            case 55 /* _7 */:
            case 56 /* _8 */:
            case 57 /* _9 */:
                value += scanNumber();
                return token = 11 /* NumericLiteral */;
            // literals and unknown symbols
            default:
                // is a literal? Read the full word.
                while (pos < len && isUnknownContentCharacter(code)) {
                    pos++;
                    code = text.charCodeAt(pos);
                }
                if (tokenOffset !== pos) {
                    value = text.substring(tokenOffset, pos);
                    // keywords: true, false, null
                    switch (value) {
                        case 'true': return token = 8 /* TrueKeyword */;
                        case 'false': return token = 9 /* FalseKeyword */;
                        case 'null': return token = 7 /* NullKeyword */;
                    }
                    return token = 16 /* Unknown */;
                }
                // some
                value += String.fromCharCode(code);
                pos++;
                return token = 16 /* Unknown */;
        }
    }
    function isUnknownContentCharacter(code) {
        if (isWhiteSpace(code) || isLineBreak(code)) {
            return false;
        }
        switch (code) {
            case 125 /* closeBrace */:
            case 93 /* closeBracket */:
            case 123 /* openBrace */:
            case 91 /* openBracket */:
            case 34 /* doubleQuote */:
            case 58 /* colon */:
            case 44 /* comma */:
            case 47 /* slash */:
                return false;
        }
        return true;
    }
    function scanNextNonTrivia() {
        var result;
        do {
            result = scanNext();
        } while (result >= 12 /* LineCommentTrivia */ && result <= 15 /* Trivia */);
        return result;
    }
    return {
        setPosition: setPosition,
        getPosition: function () { return pos; },
        scan: ignoreTrivia ? scanNextNonTrivia : scanNext,
        getToken: function () { return token; },
        getTokenValue: function () { return value; },
        getTokenOffset: function () { return tokenOffset; },
        getTokenLength: function () { return pos - tokenOffset; },
        getTokenStartLine: function () { return lineStartOffset; },
        getTokenStartCharacter: function () { return tokenOffset - prevTokenLineStartOffset; },
        getTokenError: function () { return scanError; },
    };
}
function isWhiteSpace(ch) {
    return ch === 32 /* space */ || ch === 9 /* tab */ || ch === 11 /* verticalTab */ || ch === 12 /* formFeed */ ||
        ch === 160 /* nonBreakingSpace */ || ch === 5760 /* ogham */ || ch >= 8192 /* enQuad */ && ch <= 8203 /* zeroWidthSpace */ ||
        ch === 8239 /* narrowNoBreakSpace */ || ch === 8287 /* mathematicalSpace */ || ch === 12288 /* ideographicSpace */ || ch === 65279 /* byteOrderMark */;
}
function isLineBreak(ch) {
    return ch === 10 /* lineFeed */ || ch === 13 /* carriageReturn */ || ch === 8232 /* lineSeparator */ || ch === 8233 /* paragraphSeparator */;
}
function isDigit(ch) {
    return ch >= 48 /* _0 */ && ch <= 57 /* _9 */;
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
function format$1(documentText, range, options) {
    var initialIndentLevel;
    var formatText;
    var formatTextStart;
    var rangeStart;
    var rangeEnd;
    if (range) {
        rangeStart = range.offset;
        rangeEnd = rangeStart + range.length;
        formatTextStart = rangeStart;
        while (formatTextStart > 0 && !isEOL(documentText, formatTextStart - 1)) {
            formatTextStart--;
        }
        var endOffset = rangeEnd;
        while (endOffset < documentText.length && !isEOL(documentText, endOffset)) {
            endOffset++;
        }
        formatText = documentText.substring(formatTextStart, endOffset);
        initialIndentLevel = computeIndentLevel(formatText, options);
    }
    else {
        formatText = documentText;
        initialIndentLevel = 0;
        formatTextStart = 0;
        rangeStart = 0;
        rangeEnd = documentText.length;
    }
    var eol = getEOL(options, documentText);
    var lineBreak = false;
    var indentLevel = 0;
    var indentValue;
    if (options.insertSpaces) {
        indentValue = repeat(' ', options.tabSize || 4);
    }
    else {
        indentValue = '\t';
    }
    var scanner = createScanner$1(formatText, false);
    var hasError = false;
    function newLineAndIndent() {
        return eol + repeat(indentValue, initialIndentLevel + indentLevel);
    }
    function scanNext() {
        var token = scanner.scan();
        lineBreak = false;
        while (token === 15 /* Trivia */ || token === 14 /* LineBreakTrivia */) {
            lineBreak = lineBreak || (token === 14 /* LineBreakTrivia */);
            token = scanner.scan();
        }
        hasError = token === 16 /* Unknown */ || scanner.getTokenError() !== 0 /* None */;
        return token;
    }
    var editOperations = [];
    function addEdit(text, startOffset, endOffset) {
        if (!hasError && (!range || (startOffset < rangeEnd && endOffset > rangeStart)) && documentText.substring(startOffset, endOffset) !== text) {
            editOperations.push({ offset: startOffset, length: endOffset - startOffset, content: text });
        }
    }
    var firstToken = scanNext();
    if (firstToken !== 17 /* EOF */) {
        var firstTokenStart = scanner.getTokenOffset() + formatTextStart;
        var initialIndent = repeat(indentValue, initialIndentLevel);
        addEdit(initialIndent, formatTextStart, firstTokenStart);
    }
    while (firstToken !== 17 /* EOF */) {
        var firstTokenEnd = scanner.getTokenOffset() + scanner.getTokenLength() + formatTextStart;
        var secondToken = scanNext();
        var replaceContent = '';
        var needsLineBreak = false;
        while (!lineBreak && (secondToken === 12 /* LineCommentTrivia */ || secondToken === 13 /* BlockCommentTrivia */)) {
            // comments on the same line: keep them on the same line, but ignore them otherwise
            var commentTokenStart = scanner.getTokenOffset() + formatTextStart;
            addEdit(' ', firstTokenEnd, commentTokenStart);
            firstTokenEnd = scanner.getTokenOffset() + scanner.getTokenLength() + formatTextStart;
            needsLineBreak = secondToken === 12 /* LineCommentTrivia */;
            replaceContent = needsLineBreak ? newLineAndIndent() : '';
            secondToken = scanNext();
        }
        if (secondToken === 2 /* CloseBraceToken */) {
            if (firstToken !== 1 /* OpenBraceToken */) {
                indentLevel--;
                replaceContent = newLineAndIndent();
            }
        }
        else if (secondToken === 4 /* CloseBracketToken */) {
            if (firstToken !== 3 /* OpenBracketToken */) {
                indentLevel--;
                replaceContent = newLineAndIndent();
            }
        }
        else {
            switch (firstToken) {
                case 3 /* OpenBracketToken */:
                case 1 /* OpenBraceToken */:
                    indentLevel++;
                    replaceContent = newLineAndIndent();
                    break;
                case 5 /* CommaToken */:
                case 12 /* LineCommentTrivia */:
                    replaceContent = newLineAndIndent();
                    break;
                case 13 /* BlockCommentTrivia */:
                    if (lineBreak) {
                        replaceContent = newLineAndIndent();
                    }
                    else if (!needsLineBreak) {
                        // symbol following comment on the same line: keep on same line, separate with ' '
                        replaceContent = ' ';
                    }
                    break;
                case 6 /* ColonToken */:
                    if (!needsLineBreak) {
                        replaceContent = ' ';
                    }
                    break;
                case 10 /* StringLiteral */:
                    if (secondToken === 6 /* ColonToken */) {
                        if (!needsLineBreak) {
                            replaceContent = '';
                        }
                        break;
                    }
                // fall through
                case 7 /* NullKeyword */:
                case 8 /* TrueKeyword */:
                case 9 /* FalseKeyword */:
                case 11 /* NumericLiteral */:
                case 2 /* CloseBraceToken */:
                case 4 /* CloseBracketToken */:
                    if (secondToken === 12 /* LineCommentTrivia */ || secondToken === 13 /* BlockCommentTrivia */) {
                        if (!needsLineBreak) {
                            replaceContent = ' ';
                        }
                    }
                    else if (secondToken !== 5 /* CommaToken */ && secondToken !== 17 /* EOF */) {
                        hasError = true;
                    }
                    break;
                case 16 /* Unknown */:
                    hasError = true;
                    break;
            }
            if (lineBreak && (secondToken === 12 /* LineCommentTrivia */ || secondToken === 13 /* BlockCommentTrivia */)) {
                replaceContent = newLineAndIndent();
            }
        }
        if (secondToken === 17 /* EOF */) {
            replaceContent = options.insertFinalNewline ? eol : '';
        }
        var secondTokenStart = scanner.getTokenOffset() + formatTextStart;
        addEdit(replaceContent, firstTokenEnd, secondTokenStart);
        firstToken = secondToken;
    }
    return editOperations;
}
function repeat(s, count) {
    var result = '';
    for (var i = 0; i < count; i++) {
        result += s;
    }
    return result;
}
function computeIndentLevel(content, options) {
    var i = 0;
    var nChars = 0;
    var tabSize = options.tabSize || 4;
    while (i < content.length) {
        var ch = content.charAt(i);
        if (ch === ' ') {
            nChars++;
        }
        else if (ch === '\t') {
            nChars += tabSize;
        }
        else {
            break;
        }
        i++;
    }
    return Math.floor(nChars / tabSize);
}
function getEOL(options, text) {
    for (var i = 0; i < text.length; i++) {
        var ch = text.charAt(i);
        if (ch === '\r') {
            if (i + 1 < text.length && text.charAt(i + 1) === '\n') {
                return '\r\n';
            }
            return '\r';
        }
        else if (ch === '\n') {
            return '\n';
        }
    }
    return (options && options.eol) || '\n';
}
function isEOL(text, offset) {
    return '\r\n'.indexOf(text.charAt(offset)) !== -1;
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var ParseOptions;
(function (ParseOptions) {
    ParseOptions.DEFAULT = {
        allowTrailingComma: false
    };
})(ParseOptions || (ParseOptions = {}));
/**
 * Parses the given text and returns the object the JSON content represents. On invalid input, the parser tries to be as fault tolerant as possible, but still return a result.
 * Therefore always check the errors list to find out if the input was valid.
 */
function parse$2(text, errors, options) {
    if (errors === void 0) { errors = []; }
    if (options === void 0) { options = ParseOptions.DEFAULT; }
    var currentProperty = null;
    var currentParent = [];
    var previousParents = [];
    function onValue(value) {
        if (Array.isArray(currentParent)) {
            currentParent.push(value);
        }
        else if (currentProperty !== null) {
            currentParent[currentProperty] = value;
        }
    }
    var visitor = {
        onObjectBegin: function () {
            var object = {};
            onValue(object);
            previousParents.push(currentParent);
            currentParent = object;
            currentProperty = null;
        },
        onObjectProperty: function (name) {
            currentProperty = name;
        },
        onObjectEnd: function () {
            currentParent = previousParents.pop();
        },
        onArrayBegin: function () {
            var array = [];
            onValue(array);
            previousParents.push(currentParent);
            currentParent = array;
            currentProperty = null;
        },
        onArrayEnd: function () {
            currentParent = previousParents.pop();
        },
        onLiteralValue: onValue,
        onError: function (error, offset, length) {
            errors.push({ error: error, offset: offset, length: length });
        }
    };
    visit(text, visitor, options);
    return currentParent[0];
}
/**
 * Gets the JSON path of the given JSON DOM node
 */
function getNodePath$2(node) {
    if (!node.parent || !node.parent.children) {
        return [];
    }
    var path = getNodePath$2(node.parent);
    if (node.parent.type === 'property') {
        var key = node.parent.children[0].value;
        path.push(key);
    }
    else if (node.parent.type === 'array') {
        var index = node.parent.children.indexOf(node);
        if (index !== -1) {
            path.push(index);
        }
    }
    return path;
}
/**
 * Evaluates the JavaScript object of the given JSON DOM node
 */
function getNodeValue$2(node) {
    switch (node.type) {
        case 'array':
            return node.children.map(getNodeValue$2);
        case 'object':
            var obj = Object.create(null);
            for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                var prop = _a[_i];
                var valueNode = prop.children[1];
                if (valueNode) {
                    obj[prop.children[0].value] = getNodeValue$2(valueNode);
                }
            }
            return obj;
        case 'null':
        case 'string':
        case 'number':
        case 'boolean':
            return node.value;
        default:
            return undefined;
    }
}
function contains$1(node, offset, includeRightBound) {
    if (includeRightBound === void 0) { includeRightBound = false; }
    return (offset >= node.offset && offset < (node.offset + node.length)) || includeRightBound && (offset === (node.offset + node.length));
}
/**
 * Finds the most inner node at the given offset. If includeRightBound is set, also finds nodes that end at the given offset.
 */
function findNodeAtOffset$1(node, offset, includeRightBound) {
    if (includeRightBound === void 0) { includeRightBound = false; }
    if (contains$1(node, offset, includeRightBound)) {
        var children = node.children;
        if (Array.isArray(children)) {
            for (var i = 0; i < children.length && children[i].offset <= offset; i++) {
                var item = findNodeAtOffset$1(children[i], offset, includeRightBound);
                if (item) {
                    return item;
                }
            }
        }
        return node;
    }
    return undefined;
}
/**
 * Parses the given text and invokes the visitor functions for each object, array and literal reached.
 */
function visit(text, visitor, options) {
    if (options === void 0) { options = ParseOptions.DEFAULT; }
    var _scanner = createScanner$1(text, false);
    function toNoArgVisit(visitFunction) {
        return visitFunction ? function () { return visitFunction(_scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter()); } : function () { return true; };
    }
    function toOneArgVisit(visitFunction) {
        return visitFunction ? function (arg) { return visitFunction(arg, _scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter()); } : function () { return true; };
    }
    var onObjectBegin = toNoArgVisit(visitor.onObjectBegin), onObjectProperty = toOneArgVisit(visitor.onObjectProperty), onObjectEnd = toNoArgVisit(visitor.onObjectEnd), onArrayBegin = toNoArgVisit(visitor.onArrayBegin), onArrayEnd = toNoArgVisit(visitor.onArrayEnd), onLiteralValue = toOneArgVisit(visitor.onLiteralValue), onSeparator = toOneArgVisit(visitor.onSeparator), onComment = toNoArgVisit(visitor.onComment), onError = toOneArgVisit(visitor.onError);
    var disallowComments = options && options.disallowComments;
    var allowTrailingComma = options && options.allowTrailingComma;
    function scanNext() {
        while (true) {
            var token = _scanner.scan();
            switch (_scanner.getTokenError()) {
                case 4 /* InvalidUnicode */:
                    handleError(14 /* InvalidUnicode */);
                    break;
                case 5 /* InvalidEscapeCharacter */:
                    handleError(15 /* InvalidEscapeCharacter */);
                    break;
                case 3 /* UnexpectedEndOfNumber */:
                    handleError(13 /* UnexpectedEndOfNumber */);
                    break;
                case 1 /* UnexpectedEndOfComment */:
                    if (!disallowComments) {
                        handleError(11 /* UnexpectedEndOfComment */);
                    }
                    break;
                case 2 /* UnexpectedEndOfString */:
                    handleError(12 /* UnexpectedEndOfString */);
                    break;
                case 6 /* InvalidCharacter */:
                    handleError(16 /* InvalidCharacter */);
                    break;
            }
            switch (token) {
                case 12 /* LineCommentTrivia */:
                case 13 /* BlockCommentTrivia */:
                    if (disallowComments) {
                        handleError(10 /* InvalidCommentToken */);
                    }
                    else {
                        onComment();
                    }
                    break;
                case 16 /* Unknown */:
                    handleError(1 /* InvalidSymbol */);
                    break;
                case 15 /* Trivia */:
                case 14 /* LineBreakTrivia */:
                    break;
                default:
                    return token;
            }
        }
    }
    function handleError(error, skipUntilAfter, skipUntil) {
        if (skipUntilAfter === void 0) { skipUntilAfter = []; }
        if (skipUntil === void 0) { skipUntil = []; }
        onError(error);
        if (skipUntilAfter.length + skipUntil.length > 0) {
            var token = _scanner.getToken();
            while (token !== 17 /* EOF */) {
                if (skipUntilAfter.indexOf(token) !== -1) {
                    scanNext();
                    break;
                }
                else if (skipUntil.indexOf(token) !== -1) {
                    break;
                }
                token = scanNext();
            }
        }
    }
    function parseString(isValue) {
        var value = _scanner.getTokenValue();
        if (isValue) {
            onLiteralValue(value);
        }
        else {
            onObjectProperty(value);
        }
        scanNext();
        return true;
    }
    function parseLiteral() {
        switch (_scanner.getToken()) {
            case 11 /* NumericLiteral */:
                var tokenValue = _scanner.getTokenValue();
                var value = Number(tokenValue);
                if (isNaN(value)) {
                    handleError(2 /* InvalidNumberFormat */);
                    value = 0;
                }
                onLiteralValue(value);
                break;
            case 7 /* NullKeyword */:
                onLiteralValue(null);
                break;
            case 8 /* TrueKeyword */:
                onLiteralValue(true);
                break;
            case 9 /* FalseKeyword */:
                onLiteralValue(false);
                break;
            default:
                return false;
        }
        scanNext();
        return true;
    }
    function parseProperty() {
        if (_scanner.getToken() !== 10 /* StringLiteral */) {
            handleError(3 /* PropertyNameExpected */, [], [2 /* CloseBraceToken */, 5 /* CommaToken */]);
            return false;
        }
        parseString(false);
        if (_scanner.getToken() === 6 /* ColonToken */) {
            onSeparator(':');
            scanNext(); // consume colon
            if (!parseValue()) {
                handleError(4 /* ValueExpected */, [], [2 /* CloseBraceToken */, 5 /* CommaToken */]);
            }
        }
        else {
            handleError(5 /* ColonExpected */, [], [2 /* CloseBraceToken */, 5 /* CommaToken */]);
        }
        return true;
    }
    function parseObject() {
        onObjectBegin();
        scanNext(); // consume open brace
        var needsComma = false;
        while (_scanner.getToken() !== 2 /* CloseBraceToken */ && _scanner.getToken() !== 17 /* EOF */) {
            if (_scanner.getToken() === 5 /* CommaToken */) {
                if (!needsComma) {
                    handleError(4 /* ValueExpected */, [], []);
                }
                onSeparator(',');
                scanNext(); // consume comma
                if (_scanner.getToken() === 2 /* CloseBraceToken */ && allowTrailingComma) {
                    break;
                }
            }
            else if (needsComma) {
                handleError(6 /* CommaExpected */, [], []);
            }
            if (!parseProperty()) {
                handleError(4 /* ValueExpected */, [], [2 /* CloseBraceToken */, 5 /* CommaToken */]);
            }
            needsComma = true;
        }
        onObjectEnd();
        if (_scanner.getToken() !== 2 /* CloseBraceToken */) {
            handleError(7 /* CloseBraceExpected */, [2 /* CloseBraceToken */], []);
        }
        else {
            scanNext(); // consume close brace
        }
        return true;
    }
    function parseArray() {
        onArrayBegin();
        scanNext(); // consume open bracket
        var needsComma = false;
        while (_scanner.getToken() !== 4 /* CloseBracketToken */ && _scanner.getToken() !== 17 /* EOF */) {
            if (_scanner.getToken() === 5 /* CommaToken */) {
                if (!needsComma) {
                    handleError(4 /* ValueExpected */, [], []);
                }
                onSeparator(',');
                scanNext(); // consume comma
                if (_scanner.getToken() === 4 /* CloseBracketToken */ && allowTrailingComma) {
                    break;
                }
            }
            else if (needsComma) {
                handleError(6 /* CommaExpected */, [], []);
            }
            if (!parseValue()) {
                handleError(4 /* ValueExpected */, [], [4 /* CloseBracketToken */, 5 /* CommaToken */]);
            }
            needsComma = true;
        }
        onArrayEnd();
        if (_scanner.getToken() !== 4 /* CloseBracketToken */) {
            handleError(8 /* CloseBracketExpected */, [4 /* CloseBracketToken */], []);
        }
        else {
            scanNext(); // consume close bracket
        }
        return true;
    }
    function parseValue() {
        switch (_scanner.getToken()) {
            case 3 /* OpenBracketToken */:
                return parseArray();
            case 1 /* OpenBraceToken */:
                return parseObject();
            case 10 /* StringLiteral */:
                return parseString(true);
            default:
                return parseLiteral();
        }
    }
    scanNext();
    if (_scanner.getToken() === 17 /* EOF */) {
        if (options.allowEmptyContent) {
            return true;
        }
        handleError(4 /* ValueExpected */, [], []);
        return false;
    }
    if (!parseValue()) {
        handleError(4 /* ValueExpected */, [], []);
        return false;
    }
    if (_scanner.getToken() !== 17 /* EOF */) {
        handleError(9 /* EndOfFileExpected */, [], []);
    }
    return true;
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/**
 * Creates a JSON scanner on the given text.
 * If ignoreTrivia is set, whitespaces or comments are ignored.
 */
var createScanner = createScanner$1;
/**
 * Parses the given text and returns the object the JSON content represents. On invalid input, the parser tries to be as fault tolerant as possible, but still return a result.
 * Therefore, always check the errors list to find out if the input was valid.
 */
var parse$1 = parse$2;
/**
 * Finds the innermost node at the given offset. If includeRightBound is set, also finds nodes that end at the given offset.
 */
var findNodeAtOffset = findNodeAtOffset$1;
/**
 * Gets the JSON path of the given JSON DOM node
 */
var getNodePath$1 = getNodePath$2;
/**
 * Evaluates the JavaScript object of the given JSON DOM node
 */
var getNodeValue$1 = getNodeValue$2;
/**
 * Computes the edits needed to format a JSON document.
 *
 * @param documentText The input text
 * @param range The range to format or `undefined` to format the full content
 * @param options The formatting options
 * @returns A list of edit operations describing the formatting changes to the original document. Edits can be either inserts, replacements or
 * removals of text segments. All offsets refer to the original state of the document. No two edits must change or remove the same range of
 * text in the original document. However, multiple edits can have
 * the same offset, for example multiple inserts, or an insert followed by a remove or replace. The order in the array defines which edit is applied first.
 * To apply edits to an input, you can use `applyEdits`.
 */
function format(documentText, range, options) {
    return format$1(documentText, range, options);
}

/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
function equals(one, other) {
    if (one === other) {
        return true;
    }
    if (one === null || one === undefined || other === null || other === undefined) {
        return false;
    }
    if (typeof one !== typeof other) {
        return false;
    }
    if (typeof one !== 'object') {
        return false;
    }
    if ((Array.isArray(one)) !== (Array.isArray(other))) {
        return false;
    }
    var i, key;
    if (Array.isArray(one)) {
        if (one.length !== other.length) {
            return false;
        }
        for (i = 0; i < one.length; i++) {
            if (!equals(one[i], other[i])) {
                return false;
            }
        }
    }
    else {
        var oneKeys = [];
        for (key in one) {
            oneKeys.push(key);
        }
        oneKeys.sort();
        var otherKeys = [];
        for (key in other) {
            otherKeys.push(key);
        }
        otherKeys.sort();
        if (!equals(oneKeys, otherKeys)) {
            return false;
        }
        for (i = 0; i < oneKeys.length; i++) {
            if (!equals(one[oneKeys[i]], other[oneKeys[i]])) {
                return false;
            }
        }
    }
    return true;
}
function isNumber(val) {
    return typeof val === 'number';
}
function isDefined(val) {
    return typeof val !== 'undefined';
}
function isBoolean(val) {
    return typeof val === 'boolean';
}
function isString(val) {
    return typeof val === 'string';
}
function isObject(val) {
    return typeof val === 'object' && val !== null && !Array.isArray(val);
}

/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
function startsWith(haystack, needle) {
    if (haystack.length < needle.length) {
        return false;
    }
    for (let i = 0; i < needle.length; i++) {
        if (haystack[i] !== needle[i]) {
            return false;
        }
    }
    return true;
}
/**
 * Determines if haystack ends with needle.
 */
function endsWith(haystack, needle) {
    const diff = haystack.length - needle.length;
    if (diff > 0) {
        return haystack.lastIndexOf(needle) === diff;
    }
    else if (diff === 0) {
        return haystack === needle;
    }
    else {
        return false;
    }
}
function extendedRegExp(pattern) {
    let flags = '';
    if (startsWith(pattern, '(?i)')) {
        pattern = pattern.substring(4);
        flags = 'i';
    }
    try {
        return new RegExp(pattern, flags + 'u');
    }
    catch (e) {
        // could be an exception due to the 'u ' flag
        try {
            return new RegExp(pattern, flags);
        }
        catch (e) {
            // invalid pattern
            return undefined;
        }
    }
}

/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
var DocumentUri;
(function (DocumentUri) {
    function is(value) {
        return typeof value === 'string';
    }
    DocumentUri.is = is;
})(DocumentUri || (DocumentUri = {}));
var URI$1;
(function (URI) {
    function is(value) {
        return typeof value === 'string';
    }
    URI.is = is;
})(URI$1 || (URI$1 = {}));
var integer;
(function (integer) {
    integer.MIN_VALUE = -2147483648;
    integer.MAX_VALUE = 2147483647;
    function is(value) {
        return typeof value === 'number' && integer.MIN_VALUE <= value && value <= integer.MAX_VALUE;
    }
    integer.is = is;
})(integer || (integer = {}));
var uinteger;
(function (uinteger) {
    uinteger.MIN_VALUE = 0;
    uinteger.MAX_VALUE = 2147483647;
    function is(value) {
        return typeof value === 'number' && uinteger.MIN_VALUE <= value && value <= uinteger.MAX_VALUE;
    }
    uinteger.is = is;
})(uinteger || (uinteger = {}));
/**
 * The Position namespace provides helper functions to work with
 * [Position](#Position) literals.
 */
var Position;
(function (Position) {
    /**
     * Creates a new Position literal from the given line and character.
     * @param line The position's line.
     * @param character The position's character.
     */
    function create(line, character) {
        if (line === Number.MAX_VALUE) {
            line = uinteger.MAX_VALUE;
        }
        if (character === Number.MAX_VALUE) {
            character = uinteger.MAX_VALUE;
        }
        return { line: line, character: character };
    }
    Position.create = create;
    /**
     * Checks whether the given literal conforms to the [Position](#Position) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.objectLiteral(candidate) && Is.uinteger(candidate.line) && Is.uinteger(candidate.character);
    }
    Position.is = is;
})(Position || (Position = {}));
/**
 * The Range namespace provides helper functions to work with
 * [Range](#Range) literals.
 */
var Range;
(function (Range) {
    function create(one, two, three, four) {
        if (Is.uinteger(one) && Is.uinteger(two) && Is.uinteger(three) && Is.uinteger(four)) {
            return { start: Position.create(one, two), end: Position.create(three, four) };
        }
        else if (Position.is(one) && Position.is(two)) {
            return { start: one, end: two };
        }
        else {
            throw new Error("Range#create called with invalid arguments[".concat(one, ", ").concat(two, ", ").concat(three, ", ").concat(four, "]"));
        }
    }
    Range.create = create;
    /**
     * Checks whether the given literal conforms to the [Range](#Range) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.objectLiteral(candidate) && Position.is(candidate.start) && Position.is(candidate.end);
    }
    Range.is = is;
})(Range || (Range = {}));
/**
 * The Location namespace provides helper functions to work with
 * [Location](#Location) literals.
 */
var Location;
(function (Location) {
    /**
     * Creates a Location literal.
     * @param uri The location's uri.
     * @param range The location's range.
     */
    function create(uri, range) {
        return { uri: uri, range: range };
    }
    Location.create = create;
    /**
     * Checks whether the given literal conforms to the [Location](#Location) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.defined(candidate) && Range.is(candidate.range) && (Is.string(candidate.uri) || Is.undefined(candidate.uri));
    }
    Location.is = is;
})(Location || (Location = {}));
/**
 * The LocationLink namespace provides helper functions to work with
 * [LocationLink](#LocationLink) literals.
 */
var LocationLink;
(function (LocationLink) {
    /**
     * Creates a LocationLink literal.
     * @param targetUri The definition's uri.
     * @param targetRange The full range of the definition.
     * @param targetSelectionRange The span of the symbol definition at the target.
     * @param originSelectionRange The span of the symbol being defined in the originating source file.
     */
    function create(targetUri, targetRange, targetSelectionRange, originSelectionRange) {
        return { targetUri: targetUri, targetRange: targetRange, targetSelectionRange: targetSelectionRange, originSelectionRange: originSelectionRange };
    }
    LocationLink.create = create;
    /**
     * Checks whether the given literal conforms to the [LocationLink](#LocationLink) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.defined(candidate) && Range.is(candidate.targetRange) && Is.string(candidate.targetUri)
            && Range.is(candidate.targetSelectionRange)
            && (Range.is(candidate.originSelectionRange) || Is.undefined(candidate.originSelectionRange));
    }
    LocationLink.is = is;
})(LocationLink || (LocationLink = {}));
/**
 * The Color namespace provides helper functions to work with
 * [Color](#Color) literals.
 */
var Color;
(function (Color) {
    /**
     * Creates a new Color literal.
     */
    function create(red, green, blue, alpha) {
        return {
            red: red,
            green: green,
            blue: blue,
            alpha: alpha,
        };
    }
    Color.create = create;
    /**
     * Checks whether the given literal conforms to the [Color](#Color) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.objectLiteral(candidate) && Is.numberRange(candidate.red, 0, 1)
            && Is.numberRange(candidate.green, 0, 1)
            && Is.numberRange(candidate.blue, 0, 1)
            && Is.numberRange(candidate.alpha, 0, 1);
    }
    Color.is = is;
})(Color || (Color = {}));
/**
 * The ColorInformation namespace provides helper functions to work with
 * [ColorInformation](#ColorInformation) literals.
 */
var ColorInformation;
(function (ColorInformation) {
    /**
     * Creates a new ColorInformation literal.
     */
    function create(range, color) {
        return {
            range: range,
            color: color,
        };
    }
    ColorInformation.create = create;
    /**
     * Checks whether the given literal conforms to the [ColorInformation](#ColorInformation) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.objectLiteral(candidate) && Range.is(candidate.range) && Color.is(candidate.color);
    }
    ColorInformation.is = is;
})(ColorInformation || (ColorInformation = {}));
/**
 * The Color namespace provides helper functions to work with
 * [ColorPresentation](#ColorPresentation) literals.
 */
var ColorPresentation;
(function (ColorPresentation) {
    /**
     * Creates a new ColorInformation literal.
     */
    function create(label, textEdit, additionalTextEdits) {
        return {
            label: label,
            textEdit: textEdit,
            additionalTextEdits: additionalTextEdits,
        };
    }
    ColorPresentation.create = create;
    /**
     * Checks whether the given literal conforms to the [ColorInformation](#ColorInformation) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.objectLiteral(candidate) && Is.string(candidate.label)
            && (Is.undefined(candidate.textEdit) || TextEdit.is(candidate))
            && (Is.undefined(candidate.additionalTextEdits) || Is.typedArray(candidate.additionalTextEdits, TextEdit.is));
    }
    ColorPresentation.is = is;
})(ColorPresentation || (ColorPresentation = {}));
/**
 * A set of predefined range kinds.
 */
var FoldingRangeKind;
(function (FoldingRangeKind) {
    /**
     * Folding range for a comment
     */
    FoldingRangeKind.Comment = 'comment';
    /**
     * Folding range for a imports or includes
     */
    FoldingRangeKind.Imports = 'imports';
    /**
     * Folding range for a region (e.g. `#region`)
     */
    FoldingRangeKind.Region = 'region';
})(FoldingRangeKind || (FoldingRangeKind = {}));
/**
 * The folding range namespace provides helper functions to work with
 * [FoldingRange](#FoldingRange) literals.
 */
var FoldingRange;
(function (FoldingRange) {
    /**
     * Creates a new FoldingRange literal.
     */
    function create(startLine, endLine, startCharacter, endCharacter, kind, collapsedText) {
        var result = {
            startLine: startLine,
            endLine: endLine
        };
        if (Is.defined(startCharacter)) {
            result.startCharacter = startCharacter;
        }
        if (Is.defined(endCharacter)) {
            result.endCharacter = endCharacter;
        }
        if (Is.defined(kind)) {
            result.kind = kind;
        }
        if (Is.defined(collapsedText)) {
            result.collapsedText = collapsedText;
        }
        return result;
    }
    FoldingRange.create = create;
    /**
     * Checks whether the given literal conforms to the [FoldingRange](#FoldingRange) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.objectLiteral(candidate) && Is.uinteger(candidate.startLine) && Is.uinteger(candidate.startLine)
            && (Is.undefined(candidate.startCharacter) || Is.uinteger(candidate.startCharacter))
            && (Is.undefined(candidate.endCharacter) || Is.uinteger(candidate.endCharacter))
            && (Is.undefined(candidate.kind) || Is.string(candidate.kind));
    }
    FoldingRange.is = is;
})(FoldingRange || (FoldingRange = {}));
/**
 * The DiagnosticRelatedInformation namespace provides helper functions to work with
 * [DiagnosticRelatedInformation](#DiagnosticRelatedInformation) literals.
 */
var DiagnosticRelatedInformation;
(function (DiagnosticRelatedInformation) {
    /**
     * Creates a new DiagnosticRelatedInformation literal.
     */
    function create(location, message) {
        return {
            location: location,
            message: message
        };
    }
    DiagnosticRelatedInformation.create = create;
    /**
     * Checks whether the given literal conforms to the [DiagnosticRelatedInformation](#DiagnosticRelatedInformation) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.defined(candidate) && Location.is(candidate.location) && Is.string(candidate.message);
    }
    DiagnosticRelatedInformation.is = is;
})(DiagnosticRelatedInformation || (DiagnosticRelatedInformation = {}));
/**
 * The diagnostic's severity.
 */
var DiagnosticSeverity;
(function (DiagnosticSeverity) {
    /**
     * Reports an error.
     */
    DiagnosticSeverity.Error = 1;
    /**
     * Reports a warning.
     */
    DiagnosticSeverity.Warning = 2;
    /**
     * Reports an information.
     */
    DiagnosticSeverity.Information = 3;
    /**
     * Reports a hint.
     */
    DiagnosticSeverity.Hint = 4;
})(DiagnosticSeverity || (DiagnosticSeverity = {}));
/**
 * The diagnostic tags.
 *
 * @since 3.15.0
 */
var DiagnosticTag;
(function (DiagnosticTag) {
    /**
     * Unused or unnecessary code.
     *
     * Clients are allowed to render diagnostics with this tag faded out instead of having
     * an error squiggle.
     */
    DiagnosticTag.Unnecessary = 1;
    /**
     * Deprecated or obsolete code.
     *
     * Clients are allowed to rendered diagnostics with this tag strike through.
     */
    DiagnosticTag.Deprecated = 2;
})(DiagnosticTag || (DiagnosticTag = {}));
/**
 * The CodeDescription namespace provides functions to deal with descriptions for diagnostic codes.
 *
 * @since 3.16.0
 */
var CodeDescription;
(function (CodeDescription) {
    function is(value) {
        var candidate = value;
        return Is.objectLiteral(candidate) && Is.string(candidate.href);
    }
    CodeDescription.is = is;
})(CodeDescription || (CodeDescription = {}));
/**
 * The Diagnostic namespace provides helper functions to work with
 * [Diagnostic](#Diagnostic) literals.
 */
var Diagnostic;
(function (Diagnostic) {
    /**
     * Creates a new Diagnostic literal.
     */
    function create(range, message, severity, code, source, relatedInformation) {
        var result = { range: range, message: message };
        if (Is.defined(severity)) {
            result.severity = severity;
        }
        if (Is.defined(code)) {
            result.code = code;
        }
        if (Is.defined(source)) {
            result.source = source;
        }
        if (Is.defined(relatedInformation)) {
            result.relatedInformation = relatedInformation;
        }
        return result;
    }
    Diagnostic.create = create;
    /**
     * Checks whether the given literal conforms to the [Diagnostic](#Diagnostic) interface.
     */
    function is(value) {
        var _a;
        var candidate = value;
        return Is.defined(candidate)
            && Range.is(candidate.range)
            && Is.string(candidate.message)
            && (Is.number(candidate.severity) || Is.undefined(candidate.severity))
            && (Is.integer(candidate.code) || Is.string(candidate.code) || Is.undefined(candidate.code))
            && (Is.undefined(candidate.codeDescription) || (Is.string((_a = candidate.codeDescription) === null || _a === void 0 ? void 0 : _a.href)))
            && (Is.string(candidate.source) || Is.undefined(candidate.source))
            && (Is.undefined(candidate.relatedInformation) || Is.typedArray(candidate.relatedInformation, DiagnosticRelatedInformation.is));
    }
    Diagnostic.is = is;
})(Diagnostic || (Diagnostic = {}));
/**
 * The Command namespace provides helper functions to work with
 * [Command](#Command) literals.
 */
var Command;
(function (Command) {
    /**
     * Creates a new Command literal.
     */
    function create(title, command) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        var result = { title: title, command: command };
        if (Is.defined(args) && args.length > 0) {
            result.arguments = args;
        }
        return result;
    }
    Command.create = create;
    /**
     * Checks whether the given literal conforms to the [Command](#Command) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.defined(candidate) && Is.string(candidate.title) && Is.string(candidate.command);
    }
    Command.is = is;
})(Command || (Command = {}));
/**
 * The TextEdit namespace provides helper function to create replace,
 * insert and delete edits more easily.
 */
var TextEdit;
(function (TextEdit) {
    /**
     * Creates a replace text edit.
     * @param range The range of text to be replaced.
     * @param newText The new text.
     */
    function replace(range, newText) {
        return { range: range, newText: newText };
    }
    TextEdit.replace = replace;
    /**
     * Creates a insert text edit.
     * @param position The position to insert the text at.
     * @param newText The text to be inserted.
     */
    function insert(position, newText) {
        return { range: { start: position, end: position }, newText: newText };
    }
    TextEdit.insert = insert;
    /**
     * Creates a delete text edit.
     * @param range The range of text to be deleted.
     */
    function del(range) {
        return { range: range, newText: '' };
    }
    TextEdit.del = del;
    function is(value) {
        var candidate = value;
        return Is.objectLiteral(candidate)
            && Is.string(candidate.newText)
            && Range.is(candidate.range);
    }
    TextEdit.is = is;
})(TextEdit || (TextEdit = {}));
var ChangeAnnotation;
(function (ChangeAnnotation) {
    function create(label, needsConfirmation, description) {
        var result = { label: label };
        if (needsConfirmation !== undefined) {
            result.needsConfirmation = needsConfirmation;
        }
        if (description !== undefined) {
            result.description = description;
        }
        return result;
    }
    ChangeAnnotation.create = create;
    function is(value) {
        var candidate = value;
        return Is.objectLiteral(candidate) && Is.string(candidate.label) &&
            (Is.boolean(candidate.needsConfirmation) || candidate.needsConfirmation === undefined) &&
            (Is.string(candidate.description) || candidate.description === undefined);
    }
    ChangeAnnotation.is = is;
})(ChangeAnnotation || (ChangeAnnotation = {}));
var ChangeAnnotationIdentifier;
(function (ChangeAnnotationIdentifier) {
    function is(value) {
        var candidate = value;
        return Is.string(candidate);
    }
    ChangeAnnotationIdentifier.is = is;
})(ChangeAnnotationIdentifier || (ChangeAnnotationIdentifier = {}));
var AnnotatedTextEdit;
(function (AnnotatedTextEdit) {
    /**
     * Creates an annotated replace text edit.
     *
     * @param range The range of text to be replaced.
     * @param newText The new text.
     * @param annotation The annotation.
     */
    function replace(range, newText, annotation) {
        return { range: range, newText: newText, annotationId: annotation };
    }
    AnnotatedTextEdit.replace = replace;
    /**
     * Creates an annotated insert text edit.
     *
     * @param position The position to insert the text at.
     * @param newText The text to be inserted.
     * @param annotation The annotation.
     */
    function insert(position, newText, annotation) {
        return { range: { start: position, end: position }, newText: newText, annotationId: annotation };
    }
    AnnotatedTextEdit.insert = insert;
    /**
     * Creates an annotated delete text edit.
     *
     * @param range The range of text to be deleted.
     * @param annotation The annotation.
     */
    function del(range, annotation) {
        return { range: range, newText: '', annotationId: annotation };
    }
    AnnotatedTextEdit.del = del;
    function is(value) {
        var candidate = value;
        return TextEdit.is(candidate) && (ChangeAnnotation.is(candidate.annotationId) || ChangeAnnotationIdentifier.is(candidate.annotationId));
    }
    AnnotatedTextEdit.is = is;
})(AnnotatedTextEdit || (AnnotatedTextEdit = {}));
/**
 * The TextDocumentEdit namespace provides helper function to create
 * an edit that manipulates a text document.
 */
var TextDocumentEdit;
(function (TextDocumentEdit) {
    /**
     * Creates a new `TextDocumentEdit`
     */
    function create(textDocument, edits) {
        return { textDocument: textDocument, edits: edits };
    }
    TextDocumentEdit.create = create;
    function is(value) {
        var candidate = value;
        return Is.defined(candidate)
            && OptionalVersionedTextDocumentIdentifier.is(candidate.textDocument)
            && Array.isArray(candidate.edits);
    }
    TextDocumentEdit.is = is;
})(TextDocumentEdit || (TextDocumentEdit = {}));
var CreateFile;
(function (CreateFile) {
    function create(uri, options, annotation) {
        var result = {
            kind: 'create',
            uri: uri
        };
        if (options !== undefined && (options.overwrite !== undefined || options.ignoreIfExists !== undefined)) {
            result.options = options;
        }
        if (annotation !== undefined) {
            result.annotationId = annotation;
        }
        return result;
    }
    CreateFile.create = create;
    function is(value) {
        var candidate = value;
        return candidate && candidate.kind === 'create' && Is.string(candidate.uri) && (candidate.options === undefined ||
            ((candidate.options.overwrite === undefined || Is.boolean(candidate.options.overwrite)) && (candidate.options.ignoreIfExists === undefined || Is.boolean(candidate.options.ignoreIfExists)))) && (candidate.annotationId === undefined || ChangeAnnotationIdentifier.is(candidate.annotationId));
    }
    CreateFile.is = is;
})(CreateFile || (CreateFile = {}));
var RenameFile;
(function (RenameFile) {
    function create(oldUri, newUri, options, annotation) {
        var result = {
            kind: 'rename',
            oldUri: oldUri,
            newUri: newUri
        };
        if (options !== undefined && (options.overwrite !== undefined || options.ignoreIfExists !== undefined)) {
            result.options = options;
        }
        if (annotation !== undefined) {
            result.annotationId = annotation;
        }
        return result;
    }
    RenameFile.create = create;
    function is(value) {
        var candidate = value;
        return candidate && candidate.kind === 'rename' && Is.string(candidate.oldUri) && Is.string(candidate.newUri) && (candidate.options === undefined ||
            ((candidate.options.overwrite === undefined || Is.boolean(candidate.options.overwrite)) && (candidate.options.ignoreIfExists === undefined || Is.boolean(candidate.options.ignoreIfExists)))) && (candidate.annotationId === undefined || ChangeAnnotationIdentifier.is(candidate.annotationId));
    }
    RenameFile.is = is;
})(RenameFile || (RenameFile = {}));
var DeleteFile;
(function (DeleteFile) {
    function create(uri, options, annotation) {
        var result = {
            kind: 'delete',
            uri: uri
        };
        if (options !== undefined && (options.recursive !== undefined || options.ignoreIfNotExists !== undefined)) {
            result.options = options;
        }
        if (annotation !== undefined) {
            result.annotationId = annotation;
        }
        return result;
    }
    DeleteFile.create = create;
    function is(value) {
        var candidate = value;
        return candidate && candidate.kind === 'delete' && Is.string(candidate.uri) && (candidate.options === undefined ||
            ((candidate.options.recursive === undefined || Is.boolean(candidate.options.recursive)) && (candidate.options.ignoreIfNotExists === undefined || Is.boolean(candidate.options.ignoreIfNotExists)))) && (candidate.annotationId === undefined || ChangeAnnotationIdentifier.is(candidate.annotationId));
    }
    DeleteFile.is = is;
})(DeleteFile || (DeleteFile = {}));
var WorkspaceEdit;
(function (WorkspaceEdit) {
    function is(value) {
        var candidate = value;
        return candidate &&
            (candidate.changes !== undefined || candidate.documentChanges !== undefined) &&
            (candidate.documentChanges === undefined || candidate.documentChanges.every(function (change) {
                if (Is.string(change.kind)) {
                    return CreateFile.is(change) || RenameFile.is(change) || DeleteFile.is(change);
                }
                else {
                    return TextDocumentEdit.is(change);
                }
            }));
    }
    WorkspaceEdit.is = is;
})(WorkspaceEdit || (WorkspaceEdit = {}));
var TextEditChangeImpl = /** @class */ (function () {
    function TextEditChangeImpl(edits, changeAnnotations) {
        this.edits = edits;
        this.changeAnnotations = changeAnnotations;
    }
    TextEditChangeImpl.prototype.insert = function (position, newText, annotation) {
        var edit;
        var id;
        if (annotation === undefined) {
            edit = TextEdit.insert(position, newText);
        }
        else if (ChangeAnnotationIdentifier.is(annotation)) {
            id = annotation;
            edit = AnnotatedTextEdit.insert(position, newText, annotation);
        }
        else {
            this.assertChangeAnnotations(this.changeAnnotations);
            id = this.changeAnnotations.manage(annotation);
            edit = AnnotatedTextEdit.insert(position, newText, id);
        }
        this.edits.push(edit);
        if (id !== undefined) {
            return id;
        }
    };
    TextEditChangeImpl.prototype.replace = function (range, newText, annotation) {
        var edit;
        var id;
        if (annotation === undefined) {
            edit = TextEdit.replace(range, newText);
        }
        else if (ChangeAnnotationIdentifier.is(annotation)) {
            id = annotation;
            edit = AnnotatedTextEdit.replace(range, newText, annotation);
        }
        else {
            this.assertChangeAnnotations(this.changeAnnotations);
            id = this.changeAnnotations.manage(annotation);
            edit = AnnotatedTextEdit.replace(range, newText, id);
        }
        this.edits.push(edit);
        if (id !== undefined) {
            return id;
        }
    };
    TextEditChangeImpl.prototype.delete = function (range, annotation) {
        var edit;
        var id;
        if (annotation === undefined) {
            edit = TextEdit.del(range);
        }
        else if (ChangeAnnotationIdentifier.is(annotation)) {
            id = annotation;
            edit = AnnotatedTextEdit.del(range, annotation);
        }
        else {
            this.assertChangeAnnotations(this.changeAnnotations);
            id = this.changeAnnotations.manage(annotation);
            edit = AnnotatedTextEdit.del(range, id);
        }
        this.edits.push(edit);
        if (id !== undefined) {
            return id;
        }
    };
    TextEditChangeImpl.prototype.add = function (edit) {
        this.edits.push(edit);
    };
    TextEditChangeImpl.prototype.all = function () {
        return this.edits;
    };
    TextEditChangeImpl.prototype.clear = function () {
        this.edits.splice(0, this.edits.length);
    };
    TextEditChangeImpl.prototype.assertChangeAnnotations = function (value) {
        if (value === undefined) {
            throw new Error("Text edit change is not configured to manage change annotations.");
        }
    };
    return TextEditChangeImpl;
}());
/**
 * A helper class
 */
var ChangeAnnotations = /** @class */ (function () {
    function ChangeAnnotations(annotations) {
        this._annotations = annotations === undefined ? Object.create(null) : annotations;
        this._counter = 0;
        this._size = 0;
    }
    ChangeAnnotations.prototype.all = function () {
        return this._annotations;
    };
    Object.defineProperty(ChangeAnnotations.prototype, "size", {
        get: function () {
            return this._size;
        },
        enumerable: false,
        configurable: true
    });
    ChangeAnnotations.prototype.manage = function (idOrAnnotation, annotation) {
        var id;
        if (ChangeAnnotationIdentifier.is(idOrAnnotation)) {
            id = idOrAnnotation;
        }
        else {
            id = this.nextId();
            annotation = idOrAnnotation;
        }
        if (this._annotations[id] !== undefined) {
            throw new Error("Id ".concat(id, " is already in use."));
        }
        if (annotation === undefined) {
            throw new Error("No annotation provided for id ".concat(id));
        }
        this._annotations[id] = annotation;
        this._size++;
        return id;
    };
    ChangeAnnotations.prototype.nextId = function () {
        this._counter++;
        return this._counter.toString();
    };
    return ChangeAnnotations;
}());
/**
 * A workspace change helps constructing changes to a workspace.
 */
/** @class */ ((function () {
    function WorkspaceChange(workspaceEdit) {
        var _this = this;
        this._textEditChanges = Object.create(null);
        if (workspaceEdit !== undefined) {
            this._workspaceEdit = workspaceEdit;
            if (workspaceEdit.documentChanges) {
                this._changeAnnotations = new ChangeAnnotations(workspaceEdit.changeAnnotations);
                workspaceEdit.changeAnnotations = this._changeAnnotations.all();
                workspaceEdit.documentChanges.forEach(function (change) {
                    if (TextDocumentEdit.is(change)) {
                        var textEditChange = new TextEditChangeImpl(change.edits, _this._changeAnnotations);
                        _this._textEditChanges[change.textDocument.uri] = textEditChange;
                    }
                });
            }
            else if (workspaceEdit.changes) {
                Object.keys(workspaceEdit.changes).forEach(function (key) {
                    var textEditChange = new TextEditChangeImpl(workspaceEdit.changes[key]);
                    _this._textEditChanges[key] = textEditChange;
                });
            }
        }
        else {
            this._workspaceEdit = {};
        }
    }
    Object.defineProperty(WorkspaceChange.prototype, "edit", {
        /**
         * Returns the underlying [WorkspaceEdit](#WorkspaceEdit) literal
         * use to be returned from a workspace edit operation like rename.
         */
        get: function () {
            this.initDocumentChanges();
            if (this._changeAnnotations !== undefined) {
                if (this._changeAnnotations.size === 0) {
                    this._workspaceEdit.changeAnnotations = undefined;
                }
                else {
                    this._workspaceEdit.changeAnnotations = this._changeAnnotations.all();
                }
            }
            return this._workspaceEdit;
        },
        enumerable: false,
        configurable: true
    });
    WorkspaceChange.prototype.getTextEditChange = function (key) {
        if (OptionalVersionedTextDocumentIdentifier.is(key)) {
            this.initDocumentChanges();
            if (this._workspaceEdit.documentChanges === undefined) {
                throw new Error('Workspace edit is not configured for document changes.');
            }
            var textDocument = { uri: key.uri, version: key.version };
            var result = this._textEditChanges[textDocument.uri];
            if (!result) {
                var edits = [];
                var textDocumentEdit = {
                    textDocument: textDocument,
                    edits: edits
                };
                this._workspaceEdit.documentChanges.push(textDocumentEdit);
                result = new TextEditChangeImpl(edits, this._changeAnnotations);
                this._textEditChanges[textDocument.uri] = result;
            }
            return result;
        }
        else {
            this.initChanges();
            if (this._workspaceEdit.changes === undefined) {
                throw new Error('Workspace edit is not configured for normal text edit changes.');
            }
            var result = this._textEditChanges[key];
            if (!result) {
                var edits = [];
                this._workspaceEdit.changes[key] = edits;
                result = new TextEditChangeImpl(edits);
                this._textEditChanges[key] = result;
            }
            return result;
        }
    };
    WorkspaceChange.prototype.initDocumentChanges = function () {
        if (this._workspaceEdit.documentChanges === undefined && this._workspaceEdit.changes === undefined) {
            this._changeAnnotations = new ChangeAnnotations();
            this._workspaceEdit.documentChanges = [];
            this._workspaceEdit.changeAnnotations = this._changeAnnotations.all();
        }
    };
    WorkspaceChange.prototype.initChanges = function () {
        if (this._workspaceEdit.documentChanges === undefined && this._workspaceEdit.changes === undefined) {
            this._workspaceEdit.changes = Object.create(null);
        }
    };
    WorkspaceChange.prototype.createFile = function (uri, optionsOrAnnotation, options) {
        this.initDocumentChanges();
        if (this._workspaceEdit.documentChanges === undefined) {
            throw new Error('Workspace edit is not configured for document changes.');
        }
        var annotation;
        if (ChangeAnnotation.is(optionsOrAnnotation) || ChangeAnnotationIdentifier.is(optionsOrAnnotation)) {
            annotation = optionsOrAnnotation;
        }
        else {
            options = optionsOrAnnotation;
        }
        var operation;
        var id;
        if (annotation === undefined) {
            operation = CreateFile.create(uri, options);
        }
        else {
            id = ChangeAnnotationIdentifier.is(annotation) ? annotation : this._changeAnnotations.manage(annotation);
            operation = CreateFile.create(uri, options, id);
        }
        this._workspaceEdit.documentChanges.push(operation);
        if (id !== undefined) {
            return id;
        }
    };
    WorkspaceChange.prototype.renameFile = function (oldUri, newUri, optionsOrAnnotation, options) {
        this.initDocumentChanges();
        if (this._workspaceEdit.documentChanges === undefined) {
            throw new Error('Workspace edit is not configured for document changes.');
        }
        var annotation;
        if (ChangeAnnotation.is(optionsOrAnnotation) || ChangeAnnotationIdentifier.is(optionsOrAnnotation)) {
            annotation = optionsOrAnnotation;
        }
        else {
            options = optionsOrAnnotation;
        }
        var operation;
        var id;
        if (annotation === undefined) {
            operation = RenameFile.create(oldUri, newUri, options);
        }
        else {
            id = ChangeAnnotationIdentifier.is(annotation) ? annotation : this._changeAnnotations.manage(annotation);
            operation = RenameFile.create(oldUri, newUri, options, id);
        }
        this._workspaceEdit.documentChanges.push(operation);
        if (id !== undefined) {
            return id;
        }
    };
    WorkspaceChange.prototype.deleteFile = function (uri, optionsOrAnnotation, options) {
        this.initDocumentChanges();
        if (this._workspaceEdit.documentChanges === undefined) {
            throw new Error('Workspace edit is not configured for document changes.');
        }
        var annotation;
        if (ChangeAnnotation.is(optionsOrAnnotation) || ChangeAnnotationIdentifier.is(optionsOrAnnotation)) {
            annotation = optionsOrAnnotation;
        }
        else {
            options = optionsOrAnnotation;
        }
        var operation;
        var id;
        if (annotation === undefined) {
            operation = DeleteFile.create(uri, options);
        }
        else {
            id = ChangeAnnotationIdentifier.is(annotation) ? annotation : this._changeAnnotations.manage(annotation);
            operation = DeleteFile.create(uri, options, id);
        }
        this._workspaceEdit.documentChanges.push(operation);
        if (id !== undefined) {
            return id;
        }
    };
    return WorkspaceChange;
})());
/**
 * The TextDocumentIdentifier namespace provides helper functions to work with
 * [TextDocumentIdentifier](#TextDocumentIdentifier) literals.
 */
var TextDocumentIdentifier;
(function (TextDocumentIdentifier) {
    /**
     * Creates a new TextDocumentIdentifier literal.
     * @param uri The document's uri.
     */
    function create(uri) {
        return { uri: uri };
    }
    TextDocumentIdentifier.create = create;
    /**
     * Checks whether the given literal conforms to the [TextDocumentIdentifier](#TextDocumentIdentifier) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.defined(candidate) && Is.string(candidate.uri);
    }
    TextDocumentIdentifier.is = is;
})(TextDocumentIdentifier || (TextDocumentIdentifier = {}));
/**
 * The VersionedTextDocumentIdentifier namespace provides helper functions to work with
 * [VersionedTextDocumentIdentifier](#VersionedTextDocumentIdentifier) literals.
 */
var VersionedTextDocumentIdentifier;
(function (VersionedTextDocumentIdentifier) {
    /**
     * Creates a new VersionedTextDocumentIdentifier literal.
     * @param uri The document's uri.
     * @param version The document's version.
     */
    function create(uri, version) {
        return { uri: uri, version: version };
    }
    VersionedTextDocumentIdentifier.create = create;
    /**
     * Checks whether the given literal conforms to the [VersionedTextDocumentIdentifier](#VersionedTextDocumentIdentifier) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.defined(candidate) && Is.string(candidate.uri) && Is.integer(candidate.version);
    }
    VersionedTextDocumentIdentifier.is = is;
})(VersionedTextDocumentIdentifier || (VersionedTextDocumentIdentifier = {}));
/**
 * The OptionalVersionedTextDocumentIdentifier namespace provides helper functions to work with
 * [OptionalVersionedTextDocumentIdentifier](#OptionalVersionedTextDocumentIdentifier) literals.
 */
var OptionalVersionedTextDocumentIdentifier;
(function (OptionalVersionedTextDocumentIdentifier) {
    /**
     * Creates a new OptionalVersionedTextDocumentIdentifier literal.
     * @param uri The document's uri.
     * @param version The document's version.
     */
    function create(uri, version) {
        return { uri: uri, version: version };
    }
    OptionalVersionedTextDocumentIdentifier.create = create;
    /**
     * Checks whether the given literal conforms to the [OptionalVersionedTextDocumentIdentifier](#OptionalVersionedTextDocumentIdentifier) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.defined(candidate) && Is.string(candidate.uri) && (candidate.version === null || Is.integer(candidate.version));
    }
    OptionalVersionedTextDocumentIdentifier.is = is;
})(OptionalVersionedTextDocumentIdentifier || (OptionalVersionedTextDocumentIdentifier = {}));
/**
 * The TextDocumentItem namespace provides helper functions to work with
 * [TextDocumentItem](#TextDocumentItem) literals.
 */
var TextDocumentItem;
(function (TextDocumentItem) {
    /**
     * Creates a new TextDocumentItem literal.
     * @param uri The document's uri.
     * @param languageId The document's language identifier.
     * @param version The document's version number.
     * @param text The document's text.
     */
    function create(uri, languageId, version, text) {
        return { uri: uri, languageId: languageId, version: version, text: text };
    }
    TextDocumentItem.create = create;
    /**
     * Checks whether the given literal conforms to the [TextDocumentItem](#TextDocumentItem) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.defined(candidate) && Is.string(candidate.uri) && Is.string(candidate.languageId) && Is.integer(candidate.version) && Is.string(candidate.text);
    }
    TextDocumentItem.is = is;
})(TextDocumentItem || (TextDocumentItem = {}));
/**
 * Describes the content type that a client supports in various
 * result literals like `Hover`, `ParameterInfo` or `CompletionItem`.
 *
 * Please note that `MarkupKinds` must not start with a `$`. This kinds
 * are reserved for internal usage.
 */
var MarkupKind;
(function (MarkupKind) {
    /**
     * Plain text is supported as a content format
     */
    MarkupKind.PlainText = 'plaintext';
    /**
     * Markdown is supported as a content format
     */
    MarkupKind.Markdown = 'markdown';
    /**
     * Checks whether the given value is a value of the [MarkupKind](#MarkupKind) type.
     */
    function is(value) {
        var candidate = value;
        return candidate === MarkupKind.PlainText || candidate === MarkupKind.Markdown;
    }
    MarkupKind.is = is;
})(MarkupKind || (MarkupKind = {}));
var MarkupContent;
(function (MarkupContent) {
    /**
     * Checks whether the given value conforms to the [MarkupContent](#MarkupContent) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.objectLiteral(value) && MarkupKind.is(candidate.kind) && Is.string(candidate.value);
    }
    MarkupContent.is = is;
})(MarkupContent || (MarkupContent = {}));
/**
 * The kind of a completion entry.
 */
var CompletionItemKind;
(function (CompletionItemKind) {
    CompletionItemKind.Text = 1;
    CompletionItemKind.Method = 2;
    CompletionItemKind.Function = 3;
    CompletionItemKind.Constructor = 4;
    CompletionItemKind.Field = 5;
    CompletionItemKind.Variable = 6;
    CompletionItemKind.Class = 7;
    CompletionItemKind.Interface = 8;
    CompletionItemKind.Module = 9;
    CompletionItemKind.Property = 10;
    CompletionItemKind.Unit = 11;
    CompletionItemKind.Value = 12;
    CompletionItemKind.Enum = 13;
    CompletionItemKind.Keyword = 14;
    CompletionItemKind.Snippet = 15;
    CompletionItemKind.Color = 16;
    CompletionItemKind.File = 17;
    CompletionItemKind.Reference = 18;
    CompletionItemKind.Folder = 19;
    CompletionItemKind.EnumMember = 20;
    CompletionItemKind.Constant = 21;
    CompletionItemKind.Struct = 22;
    CompletionItemKind.Event = 23;
    CompletionItemKind.Operator = 24;
    CompletionItemKind.TypeParameter = 25;
})(CompletionItemKind || (CompletionItemKind = {}));
/**
 * Defines whether the insert text in a completion item should be interpreted as
 * plain text or a snippet.
 */
var InsertTextFormat;
(function (InsertTextFormat) {
    /**
     * The primary text to be inserted is treated as a plain string.
     */
    InsertTextFormat.PlainText = 1;
    /**
     * The primary text to be inserted is treated as a snippet.
     *
     * A snippet can define tab stops and placeholders with `$1`, `$2`
     * and `${3:foo}`. `$0` defines the final tab stop, it defaults to
     * the end of the snippet. Placeholders with equal identifiers are linked,
     * that is typing in one will update others too.
     *
     * See also: https://microsoft.github.io/language-server-protocol/specifications/specification-current/#snippet_syntax
     */
    InsertTextFormat.Snippet = 2;
})(InsertTextFormat || (InsertTextFormat = {}));
/**
 * Completion item tags are extra annotations that tweak the rendering of a completion
 * item.
 *
 * @since 3.15.0
 */
var CompletionItemTag;
(function (CompletionItemTag) {
    /**
     * Render a completion as obsolete, usually using a strike-out.
     */
    CompletionItemTag.Deprecated = 1;
})(CompletionItemTag || (CompletionItemTag = {}));
/**
 * The InsertReplaceEdit namespace provides functions to deal with insert / replace edits.
 *
 * @since 3.16.0
 */
var InsertReplaceEdit;
(function (InsertReplaceEdit) {
    /**
     * Creates a new insert / replace edit
     */
    function create(newText, insert, replace) {
        return { newText: newText, insert: insert, replace: replace };
    }
    InsertReplaceEdit.create = create;
    /**
     * Checks whether the given literal conforms to the [InsertReplaceEdit](#InsertReplaceEdit) interface.
     */
    function is(value) {
        var candidate = value;
        return candidate && Is.string(candidate.newText) && Range.is(candidate.insert) && Range.is(candidate.replace);
    }
    InsertReplaceEdit.is = is;
})(InsertReplaceEdit || (InsertReplaceEdit = {}));
/**
 * How whitespace and indentation is handled during completion
 * item insertion.
 *
 * @since 3.16.0
 */
var InsertTextMode;
(function (InsertTextMode) {
    /**
     * The insertion or replace strings is taken as it is. If the
     * value is multi line the lines below the cursor will be
     * inserted using the indentation defined in the string value.
     * The client will not apply any kind of adjustments to the
     * string.
     */
    InsertTextMode.asIs = 1;
    /**
     * The editor adjusts leading whitespace of new lines so that
     * they match the indentation up to the cursor of the line for
     * which the item is accepted.
     *
     * Consider a line like this: <2tabs><cursor><3tabs>foo. Accepting a
     * multi line completion item is indented using 2 tabs and all
     * following lines inserted will be indented using 2 tabs as well.
     */
    InsertTextMode.adjustIndentation = 2;
})(InsertTextMode || (InsertTextMode = {}));
var CompletionItemLabelDetails;
(function (CompletionItemLabelDetails) {
    function is(value) {
        var candidate = value;
        return candidate && (Is.string(candidate.detail) || candidate.detail === undefined) &&
            (Is.string(candidate.description) || candidate.description === undefined);
    }
    CompletionItemLabelDetails.is = is;
})(CompletionItemLabelDetails || (CompletionItemLabelDetails = {}));
/**
 * The CompletionItem namespace provides functions to deal with
 * completion items.
 */
var CompletionItem;
(function (CompletionItem) {
    /**
     * Create a completion item and seed it with a label.
     * @param label The completion item's label
     */
    function create(label) {
        return { label: label };
    }
    CompletionItem.create = create;
})(CompletionItem || (CompletionItem = {}));
/**
 * The CompletionList namespace provides functions to deal with
 * completion lists.
 */
var CompletionList;
(function (CompletionList) {
    /**
     * Creates a new completion list.
     *
     * @param items The completion items.
     * @param isIncomplete The list is not complete.
     */
    function create(items, isIncomplete) {
        return { items: items ? items : [], isIncomplete: !!isIncomplete };
    }
    CompletionList.create = create;
})(CompletionList || (CompletionList = {}));
var MarkedString;
(function (MarkedString) {
    /**
     * Creates a marked string from plain text.
     *
     * @param plainText The plain text.
     */
    function fromPlainText(plainText) {
        return plainText.replace(/[\\`*_{}[\]()#+\-.!]/g, '\\$&'); // escape markdown syntax tokens: http://daringfireball.net/projects/markdown/syntax#backslash
    }
    MarkedString.fromPlainText = fromPlainText;
    /**
     * Checks whether the given value conforms to the [MarkedString](#MarkedString) type.
     */
    function is(value) {
        var candidate = value;
        return Is.string(candidate) || (Is.objectLiteral(candidate) && Is.string(candidate.language) && Is.string(candidate.value));
    }
    MarkedString.is = is;
})(MarkedString || (MarkedString = {}));
var Hover;
(function (Hover) {
    /**
     * Checks whether the given value conforms to the [Hover](#Hover) interface.
     */
    function is(value) {
        var candidate = value;
        return !!candidate && Is.objectLiteral(candidate) && (MarkupContent.is(candidate.contents) ||
            MarkedString.is(candidate.contents) ||
            Is.typedArray(candidate.contents, MarkedString.is)) && (value.range === undefined || Range.is(value.range));
    }
    Hover.is = is;
})(Hover || (Hover = {}));
/**
 * The ParameterInformation namespace provides helper functions to work with
 * [ParameterInformation](#ParameterInformation) literals.
 */
var ParameterInformation;
(function (ParameterInformation) {
    /**
     * Creates a new parameter information literal.
     *
     * @param label A label string.
     * @param documentation A doc string.
     */
    function create(label, documentation) {
        return documentation ? { label: label, documentation: documentation } : { label: label };
    }
    ParameterInformation.create = create;
})(ParameterInformation || (ParameterInformation = {}));
/**
 * The SignatureInformation namespace provides helper functions to work with
 * [SignatureInformation](#SignatureInformation) literals.
 */
var SignatureInformation;
(function (SignatureInformation) {
    function create(label, documentation) {
        var parameters = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            parameters[_i - 2] = arguments[_i];
        }
        var result = { label: label };
        if (Is.defined(documentation)) {
            result.documentation = documentation;
        }
        if (Is.defined(parameters)) {
            result.parameters = parameters;
        }
        else {
            result.parameters = [];
        }
        return result;
    }
    SignatureInformation.create = create;
})(SignatureInformation || (SignatureInformation = {}));
/**
 * A document highlight kind.
 */
var DocumentHighlightKind;
(function (DocumentHighlightKind) {
    /**
     * A textual occurrence.
     */
    DocumentHighlightKind.Text = 1;
    /**
     * Read-access of a symbol, like reading a variable.
     */
    DocumentHighlightKind.Read = 2;
    /**
     * Write-access of a symbol, like writing to a variable.
     */
    DocumentHighlightKind.Write = 3;
})(DocumentHighlightKind || (DocumentHighlightKind = {}));
/**
 * DocumentHighlight namespace to provide helper functions to work with
 * [DocumentHighlight](#DocumentHighlight) literals.
 */
var DocumentHighlight;
(function (DocumentHighlight) {
    /**
     * Create a DocumentHighlight object.
     * @param range The range the highlight applies to.
     * @param kind The highlight kind
     */
    function create(range, kind) {
        var result = { range: range };
        if (Is.number(kind)) {
            result.kind = kind;
        }
        return result;
    }
    DocumentHighlight.create = create;
})(DocumentHighlight || (DocumentHighlight = {}));
/**
 * A symbol kind.
 */
var SymbolKind;
(function (SymbolKind) {
    SymbolKind.File = 1;
    SymbolKind.Module = 2;
    SymbolKind.Namespace = 3;
    SymbolKind.Package = 4;
    SymbolKind.Class = 5;
    SymbolKind.Method = 6;
    SymbolKind.Property = 7;
    SymbolKind.Field = 8;
    SymbolKind.Constructor = 9;
    SymbolKind.Enum = 10;
    SymbolKind.Interface = 11;
    SymbolKind.Function = 12;
    SymbolKind.Variable = 13;
    SymbolKind.Constant = 14;
    SymbolKind.String = 15;
    SymbolKind.Number = 16;
    SymbolKind.Boolean = 17;
    SymbolKind.Array = 18;
    SymbolKind.Object = 19;
    SymbolKind.Key = 20;
    SymbolKind.Null = 21;
    SymbolKind.EnumMember = 22;
    SymbolKind.Struct = 23;
    SymbolKind.Event = 24;
    SymbolKind.Operator = 25;
    SymbolKind.TypeParameter = 26;
})(SymbolKind || (SymbolKind = {}));
/**
 * Symbol tags are extra annotations that tweak the rendering of a symbol.
 * @since 3.16
 */
var SymbolTag;
(function (SymbolTag) {
    /**
     * Render a symbol as obsolete, usually using a strike-out.
     */
    SymbolTag.Deprecated = 1;
})(SymbolTag || (SymbolTag = {}));
var SymbolInformation;
(function (SymbolInformation) {
    /**
     * Creates a new symbol information literal.
     *
     * @param name The name of the symbol.
     * @param kind The kind of the symbol.
     * @param range The range of the location of the symbol.
     * @param uri The resource of the location of symbol.
     * @param containerName The name of the symbol containing the symbol.
     */
    function create(name, kind, range, uri, containerName) {
        var result = {
            name: name,
            kind: kind,
            location: { uri: uri, range: range }
        };
        if (containerName) {
            result.containerName = containerName;
        }
        return result;
    }
    SymbolInformation.create = create;
})(SymbolInformation || (SymbolInformation = {}));
var WorkspaceSymbol;
(function (WorkspaceSymbol) {
    /**
     * Create a new workspace symbol.
     *
     * @param name The name of the symbol.
     * @param kind The kind of the symbol.
     * @param uri The resource of the location of the symbol.
     * @param range An options range of the location.
     * @returns A WorkspaceSymbol.
     */
    function create(name, kind, uri, range) {
        return range !== undefined
            ? { name: name, kind: kind, location: { uri: uri, range: range } }
            : { name: name, kind: kind, location: { uri: uri } };
    }
    WorkspaceSymbol.create = create;
})(WorkspaceSymbol || (WorkspaceSymbol = {}));
var DocumentSymbol;
(function (DocumentSymbol) {
    /**
     * Creates a new symbol information literal.
     *
     * @param name The name of the symbol.
     * @param detail The detail of the symbol.
     * @param kind The kind of the symbol.
     * @param range The range of the symbol.
     * @param selectionRange The selectionRange of the symbol.
     * @param children Children of the symbol.
     */
    function create(name, detail, kind, range, selectionRange, children) {
        var result = {
            name: name,
            detail: detail,
            kind: kind,
            range: range,
            selectionRange: selectionRange
        };
        if (children !== undefined) {
            result.children = children;
        }
        return result;
    }
    DocumentSymbol.create = create;
    /**
     * Checks whether the given literal conforms to the [DocumentSymbol](#DocumentSymbol) interface.
     */
    function is(value) {
        var candidate = value;
        return candidate &&
            Is.string(candidate.name) && Is.number(candidate.kind) &&
            Range.is(candidate.range) && Range.is(candidate.selectionRange) &&
            (candidate.detail === undefined || Is.string(candidate.detail)) &&
            (candidate.deprecated === undefined || Is.boolean(candidate.deprecated)) &&
            (candidate.children === undefined || Array.isArray(candidate.children)) &&
            (candidate.tags === undefined || Array.isArray(candidate.tags));
    }
    DocumentSymbol.is = is;
})(DocumentSymbol || (DocumentSymbol = {}));
/**
 * A set of predefined code action kinds
 */
var CodeActionKind;
(function (CodeActionKind) {
    /**
     * Empty kind.
     */
    CodeActionKind.Empty = '';
    /**
     * Base kind for quickfix actions: 'quickfix'
     */
    CodeActionKind.QuickFix = 'quickfix';
    /**
     * Base kind for refactoring actions: 'refactor'
     */
    CodeActionKind.Refactor = 'refactor';
    /**
     * Base kind for refactoring extraction actions: 'refactor.extract'
     *
     * Example extract actions:
     *
     * - Extract method
     * - Extract function
     * - Extract variable
     * - Extract interface from class
     * - ...
     */
    CodeActionKind.RefactorExtract = 'refactor.extract';
    /**
     * Base kind for refactoring inline actions: 'refactor.inline'
     *
     * Example inline actions:
     *
     * - Inline function
     * - Inline variable
     * - Inline constant
     * - ...
     */
    CodeActionKind.RefactorInline = 'refactor.inline';
    /**
     * Base kind for refactoring rewrite actions: 'refactor.rewrite'
     *
     * Example rewrite actions:
     *
     * - Convert JavaScript function to class
     * - Add or remove parameter
     * - Encapsulate field
     * - Make method static
     * - Move method to base class
     * - ...
     */
    CodeActionKind.RefactorRewrite = 'refactor.rewrite';
    /**
     * Base kind for source actions: `source`
     *
     * Source code actions apply to the entire file.
     */
    CodeActionKind.Source = 'source';
    /**
     * Base kind for an organize imports source action: `source.organizeImports`
     */
    CodeActionKind.SourceOrganizeImports = 'source.organizeImports';
    /**
     * Base kind for auto-fix source actions: `source.fixAll`.
     *
     * Fix all actions automatically fix errors that have a clear fix that do not require user input.
     * They should not suppress errors or perform unsafe fixes such as generating new types or classes.
     *
     * @since 3.15.0
     */
    CodeActionKind.SourceFixAll = 'source.fixAll';
})(CodeActionKind || (CodeActionKind = {}));
/**
 * The reason why code actions were requested.
 *
 * @since 3.17.0
 */
var CodeActionTriggerKind;
(function (CodeActionTriggerKind) {
    /**
     * Code actions were explicitly requested by the user or by an extension.
     */
    CodeActionTriggerKind.Invoked = 1;
    /**
     * Code actions were requested automatically.
     *
     * This typically happens when current selection in a file changes, but can
     * also be triggered when file content changes.
     */
    CodeActionTriggerKind.Automatic = 2;
})(CodeActionTriggerKind || (CodeActionTriggerKind = {}));
/**
 * The CodeActionContext namespace provides helper functions to work with
 * [CodeActionContext](#CodeActionContext) literals.
 */
var CodeActionContext;
(function (CodeActionContext) {
    /**
     * Creates a new CodeActionContext literal.
     */
    function create(diagnostics, only, triggerKind) {
        var result = { diagnostics: diagnostics };
        if (only !== undefined && only !== null) {
            result.only = only;
        }
        if (triggerKind !== undefined && triggerKind !== null) {
            result.triggerKind = triggerKind;
        }
        return result;
    }
    CodeActionContext.create = create;
    /**
     * Checks whether the given literal conforms to the [CodeActionContext](#CodeActionContext) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.defined(candidate) && Is.typedArray(candidate.diagnostics, Diagnostic.is)
            && (candidate.only === undefined || Is.typedArray(candidate.only, Is.string))
            && (candidate.triggerKind === undefined || candidate.triggerKind === CodeActionTriggerKind.Invoked || candidate.triggerKind === CodeActionTriggerKind.Automatic);
    }
    CodeActionContext.is = is;
})(CodeActionContext || (CodeActionContext = {}));
var CodeAction;
(function (CodeAction) {
    function create(title, kindOrCommandOrEdit, kind) {
        var result = { title: title };
        var checkKind = true;
        if (typeof kindOrCommandOrEdit === 'string') {
            checkKind = false;
            result.kind = kindOrCommandOrEdit;
        }
        else if (Command.is(kindOrCommandOrEdit)) {
            result.command = kindOrCommandOrEdit;
        }
        else {
            result.edit = kindOrCommandOrEdit;
        }
        if (checkKind && kind !== undefined) {
            result.kind = kind;
        }
        return result;
    }
    CodeAction.create = create;
    function is(value) {
        var candidate = value;
        return candidate && Is.string(candidate.title) &&
            (candidate.diagnostics === undefined || Is.typedArray(candidate.diagnostics, Diagnostic.is)) &&
            (candidate.kind === undefined || Is.string(candidate.kind)) &&
            (candidate.edit !== undefined || candidate.command !== undefined) &&
            (candidate.command === undefined || Command.is(candidate.command)) &&
            (candidate.isPreferred === undefined || Is.boolean(candidate.isPreferred)) &&
            (candidate.edit === undefined || WorkspaceEdit.is(candidate.edit));
    }
    CodeAction.is = is;
})(CodeAction || (CodeAction = {}));
/**
 * The CodeLens namespace provides helper functions to work with
 * [CodeLens](#CodeLens) literals.
 */
var CodeLens;
(function (CodeLens) {
    /**
     * Creates a new CodeLens literal.
     */
    function create(range, data) {
        var result = { range: range };
        if (Is.defined(data)) {
            result.data = data;
        }
        return result;
    }
    CodeLens.create = create;
    /**
     * Checks whether the given literal conforms to the [CodeLens](#CodeLens) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.defined(candidate) && Range.is(candidate.range) && (Is.undefined(candidate.command) || Command.is(candidate.command));
    }
    CodeLens.is = is;
})(CodeLens || (CodeLens = {}));
/**
 * The FormattingOptions namespace provides helper functions to work with
 * [FormattingOptions](#FormattingOptions) literals.
 */
var FormattingOptions;
(function (FormattingOptions) {
    /**
     * Creates a new FormattingOptions literal.
     */
    function create(tabSize, insertSpaces) {
        return { tabSize: tabSize, insertSpaces: insertSpaces };
    }
    FormattingOptions.create = create;
    /**
     * Checks whether the given literal conforms to the [FormattingOptions](#FormattingOptions) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.defined(candidate) && Is.uinteger(candidate.tabSize) && Is.boolean(candidate.insertSpaces);
    }
    FormattingOptions.is = is;
})(FormattingOptions || (FormattingOptions = {}));
/**
 * The DocumentLink namespace provides helper functions to work with
 * [DocumentLink](#DocumentLink) literals.
 */
var DocumentLink;
(function (DocumentLink) {
    /**
     * Creates a new DocumentLink literal.
     */
    function create(range, target, data) {
        return { range: range, target: target, data: data };
    }
    DocumentLink.create = create;
    /**
     * Checks whether the given literal conforms to the [DocumentLink](#DocumentLink) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.defined(candidate) && Range.is(candidate.range) && (Is.undefined(candidate.target) || Is.string(candidate.target));
    }
    DocumentLink.is = is;
})(DocumentLink || (DocumentLink = {}));
/**
 * The SelectionRange namespace provides helper function to work with
 * SelectionRange literals.
 */
var SelectionRange;
(function (SelectionRange) {
    /**
     * Creates a new SelectionRange
     * @param range the range.
     * @param parent an optional parent.
     */
    function create(range, parent) {
        return { range: range, parent: parent };
    }
    SelectionRange.create = create;
    function is(value) {
        var candidate = value;
        return Is.objectLiteral(candidate) && Range.is(candidate.range) && (candidate.parent === undefined || SelectionRange.is(candidate.parent));
    }
    SelectionRange.is = is;
})(SelectionRange || (SelectionRange = {}));
/**
 * A set of predefined token types. This set is not fixed
 * an clients can specify additional token types via the
 * corresponding client capabilities.
 *
 * @since 3.16.0
 */
var SemanticTokenTypes;
(function (SemanticTokenTypes) {
    SemanticTokenTypes["namespace"] = "namespace";
    /**
     * Represents a generic type. Acts as a fallback for types which can't be mapped to
     * a specific type like class or enum.
     */
    SemanticTokenTypes["type"] = "type";
    SemanticTokenTypes["class"] = "class";
    SemanticTokenTypes["enum"] = "enum";
    SemanticTokenTypes["interface"] = "interface";
    SemanticTokenTypes["struct"] = "struct";
    SemanticTokenTypes["typeParameter"] = "typeParameter";
    SemanticTokenTypes["parameter"] = "parameter";
    SemanticTokenTypes["variable"] = "variable";
    SemanticTokenTypes["property"] = "property";
    SemanticTokenTypes["enumMember"] = "enumMember";
    SemanticTokenTypes["event"] = "event";
    SemanticTokenTypes["function"] = "function";
    SemanticTokenTypes["method"] = "method";
    SemanticTokenTypes["macro"] = "macro";
    SemanticTokenTypes["keyword"] = "keyword";
    SemanticTokenTypes["modifier"] = "modifier";
    SemanticTokenTypes["comment"] = "comment";
    SemanticTokenTypes["string"] = "string";
    SemanticTokenTypes["number"] = "number";
    SemanticTokenTypes["regexp"] = "regexp";
    SemanticTokenTypes["operator"] = "operator";
    /**
     * @since 3.17.0
     */
    SemanticTokenTypes["decorator"] = "decorator";
})(SemanticTokenTypes || (SemanticTokenTypes = {}));
/**
 * A set of predefined token modifiers. This set is not fixed
 * an clients can specify additional token types via the
 * corresponding client capabilities.
 *
 * @since 3.16.0
 */
var SemanticTokenModifiers;
(function (SemanticTokenModifiers) {
    SemanticTokenModifiers["declaration"] = "declaration";
    SemanticTokenModifiers["definition"] = "definition";
    SemanticTokenModifiers["readonly"] = "readonly";
    SemanticTokenModifiers["static"] = "static";
    SemanticTokenModifiers["deprecated"] = "deprecated";
    SemanticTokenModifiers["abstract"] = "abstract";
    SemanticTokenModifiers["async"] = "async";
    SemanticTokenModifiers["modification"] = "modification";
    SemanticTokenModifiers["documentation"] = "documentation";
    SemanticTokenModifiers["defaultLibrary"] = "defaultLibrary";
})(SemanticTokenModifiers || (SemanticTokenModifiers = {}));
/**
 * @since 3.16.0
 */
var SemanticTokens;
(function (SemanticTokens) {
    function is(value) {
        var candidate = value;
        return Is.objectLiteral(candidate) && (candidate.resultId === undefined || typeof candidate.resultId === 'string') &&
            Array.isArray(candidate.data) && (candidate.data.length === 0 || typeof candidate.data[0] === 'number');
    }
    SemanticTokens.is = is;
})(SemanticTokens || (SemanticTokens = {}));
/**
 * The InlineValueText namespace provides functions to deal with InlineValueTexts.
 *
 * @since 3.17.0
 */
var InlineValueText;
(function (InlineValueText) {
    /**
     * Creates a new InlineValueText literal.
     */
    function create(range, text) {
        return { range: range, text: text };
    }
    InlineValueText.create = create;
    function is(value) {
        var candidate = value;
        return candidate !== undefined && candidate !== null && Range.is(candidate.range) && Is.string(candidate.text);
    }
    InlineValueText.is = is;
})(InlineValueText || (InlineValueText = {}));
/**
 * The InlineValueVariableLookup namespace provides functions to deal with InlineValueVariableLookups.
 *
 * @since 3.17.0
 */
var InlineValueVariableLookup;
(function (InlineValueVariableLookup) {
    /**
     * Creates a new InlineValueText literal.
     */
    function create(range, variableName, caseSensitiveLookup) {
        return { range: range, variableName: variableName, caseSensitiveLookup: caseSensitiveLookup };
    }
    InlineValueVariableLookup.create = create;
    function is(value) {
        var candidate = value;
        return candidate !== undefined && candidate !== null && Range.is(candidate.range) && Is.boolean(candidate.caseSensitiveLookup)
            && (Is.string(candidate.variableName) || candidate.variableName === undefined);
    }
    InlineValueVariableLookup.is = is;
})(InlineValueVariableLookup || (InlineValueVariableLookup = {}));
/**
 * The InlineValueEvaluatableExpression namespace provides functions to deal with InlineValueEvaluatableExpression.
 *
 * @since 3.17.0
 */
var InlineValueEvaluatableExpression;
(function (InlineValueEvaluatableExpression) {
    /**
     * Creates a new InlineValueEvaluatableExpression literal.
     */
    function create(range, expression) {
        return { range: range, expression: expression };
    }
    InlineValueEvaluatableExpression.create = create;
    function is(value) {
        var candidate = value;
        return candidate !== undefined && candidate !== null && Range.is(candidate.range)
            && (Is.string(candidate.expression) || candidate.expression === undefined);
    }
    InlineValueEvaluatableExpression.is = is;
})(InlineValueEvaluatableExpression || (InlineValueEvaluatableExpression = {}));
/**
 * The InlineValueContext namespace provides helper functions to work with
 * [InlineValueContext](#InlineValueContext) literals.
 *
 * @since 3.17.0
 */
var InlineValueContext;
(function (InlineValueContext) {
    /**
     * Creates a new InlineValueContext literal.
     */
    function create(frameId, stoppedLocation) {
        return { frameId: frameId, stoppedLocation: stoppedLocation };
    }
    InlineValueContext.create = create;
    /**
     * Checks whether the given literal conforms to the [InlineValueContext](#InlineValueContext) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.defined(candidate) && Range.is(value.stoppedLocation);
    }
    InlineValueContext.is = is;
})(InlineValueContext || (InlineValueContext = {}));
/**
 * Inlay hint kinds.
 *
 * @since 3.17.0
 */
var InlayHintKind;
(function (InlayHintKind) {
    /**
     * An inlay hint that for a type annotation.
     */
    InlayHintKind.Type = 1;
    /**
     * An inlay hint that is for a parameter.
     */
    InlayHintKind.Parameter = 2;
    function is(value) {
        return value === 1 || value === 2;
    }
    InlayHintKind.is = is;
})(InlayHintKind || (InlayHintKind = {}));
var InlayHintLabelPart;
(function (InlayHintLabelPart) {
    function create(value) {
        return { value: value };
    }
    InlayHintLabelPart.create = create;
    function is(value) {
        var candidate = value;
        return Is.objectLiteral(candidate)
            && (candidate.tooltip === undefined || Is.string(candidate.tooltip) || MarkupContent.is(candidate.tooltip))
            && (candidate.location === undefined || Location.is(candidate.location))
            && (candidate.command === undefined || Command.is(candidate.command));
    }
    InlayHintLabelPart.is = is;
})(InlayHintLabelPart || (InlayHintLabelPart = {}));
var InlayHint;
(function (InlayHint) {
    function create(position, label, kind) {
        var result = { position: position, label: label };
        if (kind !== undefined) {
            result.kind = kind;
        }
        return result;
    }
    InlayHint.create = create;
    function is(value) {
        var candidate = value;
        return Is.objectLiteral(candidate) && Position.is(candidate.position)
            && (Is.string(candidate.label) || Is.typedArray(candidate.label, InlayHintLabelPart.is))
            && (candidate.kind === undefined || InlayHintKind.is(candidate.kind))
            && (candidate.textEdits === undefined) || Is.typedArray(candidate.textEdits, TextEdit.is)
            && (candidate.tooltip === undefined || Is.string(candidate.tooltip) || MarkupContent.is(candidate.tooltip))
            && (candidate.paddingLeft === undefined || Is.boolean(candidate.paddingLeft))
            && (candidate.paddingRight === undefined || Is.boolean(candidate.paddingRight));
    }
    InlayHint.is = is;
})(InlayHint || (InlayHint = {}));
var WorkspaceFolder;
(function (WorkspaceFolder) {
    function is(value) {
        var candidate = value;
        return Is.objectLiteral(candidate) && URI$1.is(candidate.uri) && Is.string(candidate.name);
    }
    WorkspaceFolder.is = is;
})(WorkspaceFolder || (WorkspaceFolder = {}));
/**
 * @deprecated Use the text document from the new vscode-languageserver-textdocument package.
 */
var TextDocument$1;
(function (TextDocument) {
    /**
     * Creates a new ITextDocument literal from the given uri and content.
     * @param uri The document's uri.
     * @param languageId The document's language Id.
     * @param version The document's version.
     * @param content The document's content.
     */
    function create(uri, languageId, version, content) {
        return new FullTextDocument$1(uri, languageId, version, content);
    }
    TextDocument.create = create;
    /**
     * Checks whether the given literal conforms to the [ITextDocument](#ITextDocument) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.defined(candidate) && Is.string(candidate.uri) && (Is.undefined(candidate.languageId) || Is.string(candidate.languageId)) && Is.uinteger(candidate.lineCount)
            && Is.func(candidate.getText) && Is.func(candidate.positionAt) && Is.func(candidate.offsetAt) ? true : false;
    }
    TextDocument.is = is;
    function applyEdits(document, edits) {
        var text = document.getText();
        var sortedEdits = mergeSort(edits, function (a, b) {
            var diff = a.range.start.line - b.range.start.line;
            if (diff === 0) {
                return a.range.start.character - b.range.start.character;
            }
            return diff;
        });
        var lastModifiedOffset = text.length;
        for (var i = sortedEdits.length - 1; i >= 0; i--) {
            var e = sortedEdits[i];
            var startOffset = document.offsetAt(e.range.start);
            var endOffset = document.offsetAt(e.range.end);
            if (endOffset <= lastModifiedOffset) {
                text = text.substring(0, startOffset) + e.newText + text.substring(endOffset, text.length);
            }
            else {
                throw new Error('Overlapping edit');
            }
            lastModifiedOffset = startOffset;
        }
        return text;
    }
    TextDocument.applyEdits = applyEdits;
    function mergeSort(data, compare) {
        if (data.length <= 1) {
            // sorted
            return data;
        }
        var p = (data.length / 2) | 0;
        var left = data.slice(0, p);
        var right = data.slice(p);
        mergeSort(left, compare);
        mergeSort(right, compare);
        var leftIdx = 0;
        var rightIdx = 0;
        var i = 0;
        while (leftIdx < left.length && rightIdx < right.length) {
            var ret = compare(left[leftIdx], right[rightIdx]);
            if (ret <= 0) {
                // smaller_equal -> take left to preserve order
                data[i++] = left[leftIdx++];
            }
            else {
                // greater -> take right
                data[i++] = right[rightIdx++];
            }
        }
        while (leftIdx < left.length) {
            data[i++] = left[leftIdx++];
        }
        while (rightIdx < right.length) {
            data[i++] = right[rightIdx++];
        }
        return data;
    }
})(TextDocument$1 || (TextDocument$1 = {}));
/**
 * @deprecated Use the text document from the new vscode-languageserver-textdocument package.
 */
var FullTextDocument$1 = /** @class */ (function () {
    function FullTextDocument(uri, languageId, version, content) {
        this._uri = uri;
        this._languageId = languageId;
        this._version = version;
        this._content = content;
        this._lineOffsets = undefined;
    }
    Object.defineProperty(FullTextDocument.prototype, "uri", {
        get: function () {
            return this._uri;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FullTextDocument.prototype, "languageId", {
        get: function () {
            return this._languageId;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FullTextDocument.prototype, "version", {
        get: function () {
            return this._version;
        },
        enumerable: false,
        configurable: true
    });
    FullTextDocument.prototype.getText = function (range) {
        if (range) {
            var start = this.offsetAt(range.start);
            var end = this.offsetAt(range.end);
            return this._content.substring(start, end);
        }
        return this._content;
    };
    FullTextDocument.prototype.update = function (event, version) {
        this._content = event.text;
        this._version = version;
        this._lineOffsets = undefined;
    };
    FullTextDocument.prototype.getLineOffsets = function () {
        if (this._lineOffsets === undefined) {
            var lineOffsets = [];
            var text = this._content;
            var isLineStart = true;
            for (var i = 0; i < text.length; i++) {
                if (isLineStart) {
                    lineOffsets.push(i);
                    isLineStart = false;
                }
                var ch = text.charAt(i);
                isLineStart = (ch === '\r' || ch === '\n');
                if (ch === '\r' && i + 1 < text.length && text.charAt(i + 1) === '\n') {
                    i++;
                }
            }
            if (isLineStart && text.length > 0) {
                lineOffsets.push(text.length);
            }
            this._lineOffsets = lineOffsets;
        }
        return this._lineOffsets;
    };
    FullTextDocument.prototype.positionAt = function (offset) {
        offset = Math.max(Math.min(offset, this._content.length), 0);
        var lineOffsets = this.getLineOffsets();
        var low = 0, high = lineOffsets.length;
        if (high === 0) {
            return Position.create(0, offset);
        }
        while (low < high) {
            var mid = Math.floor((low + high) / 2);
            if (lineOffsets[mid] > offset) {
                high = mid;
            }
            else {
                low = mid + 1;
            }
        }
        // low is the least x for which the line offset is larger than the current offset
        // or array.length if no line offset is larger than the current offset
        var line = low - 1;
        return Position.create(line, offset - lineOffsets[line]);
    };
    FullTextDocument.prototype.offsetAt = function (position) {
        var lineOffsets = this.getLineOffsets();
        if (position.line >= lineOffsets.length) {
            return this._content.length;
        }
        else if (position.line < 0) {
            return 0;
        }
        var lineOffset = lineOffsets[position.line];
        var nextLineOffset = (position.line + 1 < lineOffsets.length) ? lineOffsets[position.line + 1] : this._content.length;
        return Math.max(Math.min(lineOffset + position.character, nextLineOffset), lineOffset);
    };
    Object.defineProperty(FullTextDocument.prototype, "lineCount", {
        get: function () {
            return this.getLineOffsets().length;
        },
        enumerable: false,
        configurable: true
    });
    return FullTextDocument;
}());
var Is;
(function (Is) {
    var toString = Object.prototype.toString;
    function defined(value) {
        return typeof value !== 'undefined';
    }
    Is.defined = defined;
    function undefined$1(value) {
        return typeof value === 'undefined';
    }
    Is.undefined = undefined$1;
    function boolean(value) {
        return value === true || value === false;
    }
    Is.boolean = boolean;
    function string(value) {
        return toString.call(value) === '[object String]';
    }
    Is.string = string;
    function number(value) {
        return toString.call(value) === '[object Number]';
    }
    Is.number = number;
    function numberRange(value, min, max) {
        return toString.call(value) === '[object Number]' && min <= value && value <= max;
    }
    Is.numberRange = numberRange;
    function integer(value) {
        return toString.call(value) === '[object Number]' && -2147483648 <= value && value <= 2147483647;
    }
    Is.integer = integer;
    function uinteger(value) {
        return toString.call(value) === '[object Number]' && 0 <= value && value <= 2147483647;
    }
    Is.uinteger = uinteger;
    function func(value) {
        return toString.call(value) === '[object Function]';
    }
    Is.func = func;
    function objectLiteral(value) {
        // Strictly speaking class instances pass this check as well. Since the LSP
        // doesn't use classes we ignore this for now. If we do we need to add something
        // like this: `Object.getPrototypeOf(Object.getPrototypeOf(x)) === null`
        return value !== null && typeof value === 'object';
    }
    Is.objectLiteral = objectLiteral;
    function typedArray(value, check) {
        return Array.isArray(value) && value.every(check);
    }
    Is.typedArray = typedArray;
})(Is || (Is = {}));

/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
class FullTextDocument {
    constructor(uri, languageId, version, content) {
        this._uri = uri;
        this._languageId = languageId;
        this._version = version;
        this._content = content;
        this._lineOffsets = undefined;
    }
    get uri() {
        return this._uri;
    }
    get languageId() {
        return this._languageId;
    }
    get version() {
        return this._version;
    }
    getText(range) {
        if (range) {
            const start = this.offsetAt(range.start);
            const end = this.offsetAt(range.end);
            return this._content.substring(start, end);
        }
        return this._content;
    }
    update(changes, version) {
        for (let change of changes) {
            if (FullTextDocument.isIncremental(change)) {
                // makes sure start is before end
                const range = getWellformedRange(change.range);
                // update content
                const startOffset = this.offsetAt(range.start);
                const endOffset = this.offsetAt(range.end);
                this._content = this._content.substring(0, startOffset) + change.text + this._content.substring(endOffset, this._content.length);
                // update the offsets
                const startLine = Math.max(range.start.line, 0);
                const endLine = Math.max(range.end.line, 0);
                let lineOffsets = this._lineOffsets;
                const addedLineOffsets = computeLineOffsets(change.text, false, startOffset);
                if (endLine - startLine === addedLineOffsets.length) {
                    for (let i = 0, len = addedLineOffsets.length; i < len; i++) {
                        lineOffsets[i + startLine + 1] = addedLineOffsets[i];
                    }
                }
                else {
                    if (addedLineOffsets.length < 10000) {
                        lineOffsets.splice(startLine + 1, endLine - startLine, ...addedLineOffsets);
                    }
                    else { // avoid too many arguments for splice
                        this._lineOffsets = lineOffsets = lineOffsets.slice(0, startLine + 1).concat(addedLineOffsets, lineOffsets.slice(endLine + 1));
                    }
                }
                const diff = change.text.length - (endOffset - startOffset);
                if (diff !== 0) {
                    for (let i = startLine + 1 + addedLineOffsets.length, len = lineOffsets.length; i < len; i++) {
                        lineOffsets[i] = lineOffsets[i] + diff;
                    }
                }
            }
            else if (FullTextDocument.isFull(change)) {
                this._content = change.text;
                this._lineOffsets = undefined;
            }
            else {
                throw new Error('Unknown change event received');
            }
        }
        this._version = version;
    }
    getLineOffsets() {
        if (this._lineOffsets === undefined) {
            this._lineOffsets = computeLineOffsets(this._content, true);
        }
        return this._lineOffsets;
    }
    positionAt(offset) {
        offset = Math.max(Math.min(offset, this._content.length), 0);
        let lineOffsets = this.getLineOffsets();
        let low = 0, high = lineOffsets.length;
        if (high === 0) {
            return { line: 0, character: offset };
        }
        while (low < high) {
            let mid = Math.floor((low + high) / 2);
            if (lineOffsets[mid] > offset) {
                high = mid;
            }
            else {
                low = mid + 1;
            }
        }
        // low is the least x for which the line offset is larger than the current offset
        // or array.length if no line offset is larger than the current offset
        let line = low - 1;
        return { line, character: offset - lineOffsets[line] };
    }
    offsetAt(position) {
        let lineOffsets = this.getLineOffsets();
        if (position.line >= lineOffsets.length) {
            return this._content.length;
        }
        else if (position.line < 0) {
            return 0;
        }
        let lineOffset = lineOffsets[position.line];
        let nextLineOffset = (position.line + 1 < lineOffsets.length) ? lineOffsets[position.line + 1] : this._content.length;
        return Math.max(Math.min(lineOffset + position.character, nextLineOffset), lineOffset);
    }
    get lineCount() {
        return this.getLineOffsets().length;
    }
    static isIncremental(event) {
        let candidate = event;
        return candidate !== undefined && candidate !== null &&
            typeof candidate.text === 'string' && candidate.range !== undefined &&
            (candidate.rangeLength === undefined || typeof candidate.rangeLength === 'number');
    }
    static isFull(event) {
        let candidate = event;
        return candidate !== undefined && candidate !== null &&
            typeof candidate.text === 'string' && candidate.range === undefined && candidate.rangeLength === undefined;
    }
}
var TextDocument;
(function (TextDocument) {
    /**
     * Creates a new text document.
     *
     * @param uri The document's uri.
     * @param languageId  The document's language Id.
     * @param version The document's initial version number.
     * @param content The document's content.
     */
    function create(uri, languageId, version, content) {
        return new FullTextDocument(uri, languageId, version, content);
    }
    TextDocument.create = create;
    /**
     * Updates a TextDocument by modifying its content.
     *
     * @param document the document to update. Only documents created by TextDocument.create are valid inputs.
     * @param changes the changes to apply to the document.
     * @param version the changes version for the document.
     * @returns The updated TextDocument. Note: That's the same document instance passed in as first parameter.
     *
     */
    function update(document, changes, version) {
        if (document instanceof FullTextDocument) {
            document.update(changes, version);
            return document;
        }
        else {
            throw new Error('TextDocument.update: document must be created by TextDocument.create');
        }
    }
    TextDocument.update = update;
    function applyEdits(document, edits) {
        let text = document.getText();
        let sortedEdits = mergeSort(edits.map(getWellformedEdit), (a, b) => {
            let diff = a.range.start.line - b.range.start.line;
            if (diff === 0) {
                return a.range.start.character - b.range.start.character;
            }
            return diff;
        });
        let lastModifiedOffset = 0;
        const spans = [];
        for (const e of sortedEdits) {
            let startOffset = document.offsetAt(e.range.start);
            if (startOffset < lastModifiedOffset) {
                throw new Error('Overlapping edit');
            }
            else if (startOffset > lastModifiedOffset) {
                spans.push(text.substring(lastModifiedOffset, startOffset));
            }
            if (e.newText.length) {
                spans.push(e.newText);
            }
            lastModifiedOffset = document.offsetAt(e.range.end);
        }
        spans.push(text.substr(lastModifiedOffset));
        return spans.join('');
    }
    TextDocument.applyEdits = applyEdits;
})(TextDocument || (TextDocument = {}));
function mergeSort(data, compare) {
    if (data.length <= 1) {
        // sorted
        return data;
    }
    const p = (data.length / 2) | 0;
    const left = data.slice(0, p);
    const right = data.slice(p);
    mergeSort(left, compare);
    mergeSort(right, compare);
    let leftIdx = 0;
    let rightIdx = 0;
    let i = 0;
    while (leftIdx < left.length && rightIdx < right.length) {
        let ret = compare(left[leftIdx], right[rightIdx]);
        if (ret <= 0) {
            // smaller_equal -> take left to preserve order
            data[i++] = left[leftIdx++];
        }
        else {
            // greater -> take right
            data[i++] = right[rightIdx++];
        }
    }
    while (leftIdx < left.length) {
        data[i++] = left[leftIdx++];
    }
    while (rightIdx < right.length) {
        data[i++] = right[rightIdx++];
    }
    return data;
}
function computeLineOffsets(text, isAtLineStart, textOffset = 0) {
    const result = isAtLineStart ? [textOffset] : [];
    for (let i = 0; i < text.length; i++) {
        let ch = text.charCodeAt(i);
        if (ch === 13 /* CarriageReturn */ || ch === 10 /* LineFeed */) {
            if (ch === 13 /* CarriageReturn */ && i + 1 < text.length && text.charCodeAt(i + 1) === 10 /* LineFeed */) {
                i++;
            }
            result.push(textOffset + i + 1);
        }
    }
    return result;
}
function getWellformedRange(range) {
    const start = range.start;
    const end = range.end;
    if (start.line > end.line || (start.line === end.line && start.character > end.character)) {
        return { start: end, end: start };
    }
    return range;
}
function getWellformedEdit(textEdit) {
    const range = getWellformedRange(textEdit.range);
    if (range !== textEdit.range) {
        return { newText: textEdit.newText, range };
    }
    return textEdit;
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/**
 * Error codes used by diagnostics
 */
var ErrorCode;
(function (ErrorCode) {
    ErrorCode[ErrorCode["Undefined"] = 0] = "Undefined";
    ErrorCode[ErrorCode["EnumValueMismatch"] = 1] = "EnumValueMismatch";
    ErrorCode[ErrorCode["Deprecated"] = 2] = "Deprecated";
    ErrorCode[ErrorCode["UnexpectedEndOfComment"] = 257] = "UnexpectedEndOfComment";
    ErrorCode[ErrorCode["UnexpectedEndOfString"] = 258] = "UnexpectedEndOfString";
    ErrorCode[ErrorCode["UnexpectedEndOfNumber"] = 259] = "UnexpectedEndOfNumber";
    ErrorCode[ErrorCode["InvalidUnicode"] = 260] = "InvalidUnicode";
    ErrorCode[ErrorCode["InvalidEscapeCharacter"] = 261] = "InvalidEscapeCharacter";
    ErrorCode[ErrorCode["InvalidCharacter"] = 262] = "InvalidCharacter";
    ErrorCode[ErrorCode["PropertyExpected"] = 513] = "PropertyExpected";
    ErrorCode[ErrorCode["CommaExpected"] = 514] = "CommaExpected";
    ErrorCode[ErrorCode["ColonExpected"] = 515] = "ColonExpected";
    ErrorCode[ErrorCode["ValueExpected"] = 516] = "ValueExpected";
    ErrorCode[ErrorCode["CommaOrCloseBacketExpected"] = 517] = "CommaOrCloseBacketExpected";
    ErrorCode[ErrorCode["CommaOrCloseBraceExpected"] = 518] = "CommaOrCloseBraceExpected";
    ErrorCode[ErrorCode["TrailingComma"] = 519] = "TrailingComma";
    ErrorCode[ErrorCode["DuplicateKey"] = 520] = "DuplicateKey";
    ErrorCode[ErrorCode["CommentNotPermitted"] = 521] = "CommentNotPermitted";
    ErrorCode[ErrorCode["SchemaResolveError"] = 768] = "SchemaResolveError";
    ErrorCode[ErrorCode["SchemaUnsupportedFeature"] = 769] = "SchemaUnsupportedFeature";
})(ErrorCode || (ErrorCode = {}));
var ClientCapabilities;
(function (ClientCapabilities) {
    ClientCapabilities.LATEST = {
        textDocument: {
            completion: {
                completionItem: {
                    documentationFormat: [MarkupKind.Markdown, MarkupKind.PlainText],
                    commitCharactersSupport: true
                }
            }
        }
    };
})(ClientCapabilities || (ClientCapabilities = {}));

var main = {};

var ral = {};

Object.defineProperty(ral, "__esModule", { value: true });
var _ral;
function RAL() {
    if (_ral === undefined) {
        throw new Error("No runtime abstraction layer installed");
    }
    return _ral;
}
(function (RAL) {
    function install(ral) {
        if (ral === undefined) {
            throw new Error("No runtime abstraction layer provided");
        }
        _ral = ral;
    }
    RAL.install = install;
})(RAL || (RAL = {}));
ral.default = RAL;

var common = {};

(function (exports) {
	/* --------------------------------------------------------------------------------------------
	 * Copyright (c) Microsoft Corporation. All rights reserved.
	 * Licensed under the MIT License. See License.txt in the project root for license information.
	 * ------------------------------------------------------------------------------------------ */
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.config = exports.loadMessageBundle = exports.localize = exports.format = exports.setPseudo = exports.isPseudo = exports.isDefined = exports.BundleFormat = exports.MessageFormat = void 0;
	var ral_1 = ral;
	(function (MessageFormat) {
	    MessageFormat["file"] = "file";
	    MessageFormat["bundle"] = "bundle";
	    MessageFormat["both"] = "both";
	})(exports.MessageFormat || (exports.MessageFormat = {}));
	(function (BundleFormat) {
	    // the nls.bundle format
	    BundleFormat["standalone"] = "standalone";
	    BundleFormat["languagePack"] = "languagePack";
	})(exports.BundleFormat || (exports.BundleFormat = {}));
	var LocalizeInfo;
	(function (LocalizeInfo) {
	    function is(value) {
	        var candidate = value;
	        return candidate && isDefined(candidate.key) && isDefined(candidate.comment);
	    }
	    LocalizeInfo.is = is;
	})(LocalizeInfo || (LocalizeInfo = {}));
	function isDefined(value) {
	    return typeof value !== 'undefined';
	}
	exports.isDefined = isDefined;
	exports.isPseudo = false;
	function setPseudo(pseudo) {
	    exports.isPseudo = pseudo;
	}
	exports.setPseudo = setPseudo;
	function format(message, args) {
	    var result;
	    if (exports.isPseudo) {
	        // FF3B and FF3D is the Unicode zenkaku representation for [ and ]
	        message = '\uFF3B' + message.replace(/[aouei]/g, '$&$&') + '\uFF3D';
	    }
	    if (args.length === 0) {
	        result = message;
	    }
	    else {
	        result = message.replace(/\{(\d+)\}/g, function (match, rest) {
	            var index = rest[0];
	            var arg = args[index];
	            var replacement = match;
	            if (typeof arg === 'string') {
	                replacement = arg;
	            }
	            else if (typeof arg === 'number' || typeof arg === 'boolean' || arg === void 0 || arg === null) {
	                replacement = String(arg);
	            }
	            return replacement;
	        });
	    }
	    return result;
	}
	exports.format = format;
	function localize(_key, message) {
	    var args = [];
	    for (var _i = 2; _i < arguments.length; _i++) {
	        args[_i - 2] = arguments[_i];
	    }
	    return format(message, args);
	}
	exports.localize = localize;
	function loadMessageBundle(file) {
	    return (0, ral_1.default)().loadMessageBundle(file);
	}
	exports.loadMessageBundle = loadMessageBundle;
	function config(opts) {
	    return (0, ral_1.default)().config(opts);
	}
	exports.config = config;
	
} (common));

(function (exports) {
	/* --------------------------------------------------------------------------------------------
	 * Copyright (c) Microsoft Corporation. All rights reserved.
	 * Licensed under the MIT License. See License.txt in the project root for license information.
	 * ------------------------------------------------------------------------------------------ */
	var __spreadArray = (commonjsGlobal && commonjsGlobal.__spreadArray) || function (to, from, pack) {
	    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
	        if (ar || !(i in from)) {
	            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
	            ar[i] = from[i];
	        }
	    }
	    return to.concat(ar || Array.prototype.slice.call(from));
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.config = exports.loadMessageBundle = exports.BundleFormat = exports.MessageFormat = void 0;
	var ral_1 = ral;
	var common_1 = common;
	var common_2 = common;
	Object.defineProperty(exports, "MessageFormat", { enumerable: true, get: function () { return common_2.MessageFormat; } });
	Object.defineProperty(exports, "BundleFormat", { enumerable: true, get: function () { return common_2.BundleFormat; } });
	function loadMessageBundle(_file) {
	    return function (key, message) {
	        var args = [];
	        for (var _i = 2; _i < arguments.length; _i++) {
	            args[_i - 2] = arguments[_i];
	        }
	        if (typeof key === 'number') {
	            throw new Error("Browser implementation does currently not support externalized strings.");
	        }
	        else {
	            return common_1.localize.apply(void 0, __spreadArray([key, message], args, false));
	        }
	    };
	}
	exports.loadMessageBundle = loadMessageBundle;
	function config(options) {
	    var _a;
	    (0, common_1.setPseudo)(((_a = options === null || options === void 0 ? void 0 : options.locale) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === 'pseudo');
	    return loadMessageBundle;
	}
	exports.config = config;
	ral_1.default.install(Object.freeze({
	    loadMessageBundle: loadMessageBundle,
	    config: config
	}));
	
} (main));

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const localize$4 = main.loadMessageBundle();
const formats = {
    'color-hex': { errorMessage: localize$4('colorHexFormatWarning', 'Invalid color format. Use #RGB, #RGBA, #RRGGBB or #RRGGBBAA.'), pattern: /^#([0-9A-Fa-f]{3,4}|([0-9A-Fa-f]{2}){3,4})$/ },
    'date-time': { errorMessage: localize$4('dateTimeFormatWarning', 'String is not a RFC3339 date-time.'), pattern: /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\.[0-9]+)?(Z|(\+|-)([01][0-9]|2[0-3]):([0-5][0-9]))$/i },
    'date': { errorMessage: localize$4('dateFormatWarning', 'String is not a RFC3339 date.'), pattern: /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/i },
    'time': { errorMessage: localize$4('timeFormatWarning', 'String is not a RFC3339 time.'), pattern: /^([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\.[0-9]+)?(Z|(\+|-)([01][0-9]|2[0-3]):([0-5][0-9]))$/i },
    'email': { errorMessage: localize$4('emailFormatWarning', 'String is not an e-mail address.'), pattern: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}))$/ },
    'hostname': { errorMessage: localize$4('hostnameFormatWarning', 'String is not a hostname.'), pattern: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i },
    'ipv4': { errorMessage: localize$4('ipv4FormatWarning', 'String is not an IPv4 address.'), pattern: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/ },
    'ipv6': { errorMessage: localize$4('ipv6FormatWarning', 'String is not an IPv6 address.'), pattern: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i },
};
class ASTNodeImpl {
    constructor(parent, offset, length = 0) {
        this.offset = offset;
        this.length = length;
        this.parent = parent;
    }
    get children() {
        return [];
    }
    toString() {
        return 'type: ' + this.type + ' (' + this.offset + '/' + this.length + ')' + (this.parent ? ' parent: {' + this.parent.toString() + '}' : '');
    }
}
class NullASTNodeImpl extends ASTNodeImpl {
    constructor(parent, offset) {
        super(parent, offset);
        this.type = 'null';
        this.value = null;
    }
}
class BooleanASTNodeImpl extends ASTNodeImpl {
    constructor(parent, boolValue, offset) {
        super(parent, offset);
        this.type = 'boolean';
        this.value = boolValue;
    }
}
class ArrayASTNodeImpl extends ASTNodeImpl {
    constructor(parent, offset) {
        super(parent, offset);
        this.type = 'array';
        this.items = [];
    }
    get children() {
        return this.items;
    }
}
class NumberASTNodeImpl extends ASTNodeImpl {
    constructor(parent, offset) {
        super(parent, offset);
        this.type = 'number';
        this.isInteger = true;
        this.value = Number.NaN;
    }
}
class StringASTNodeImpl extends ASTNodeImpl {
    constructor(parent, offset, length) {
        super(parent, offset, length);
        this.type = 'string';
        this.value = '';
    }
}
class PropertyASTNodeImpl extends ASTNodeImpl {
    constructor(parent, offset, keyNode) {
        super(parent, offset);
        this.type = 'property';
        this.colonOffset = -1;
        this.keyNode = keyNode;
    }
    get children() {
        return this.valueNode ? [this.keyNode, this.valueNode] : [this.keyNode];
    }
}
class ObjectASTNodeImpl extends ASTNodeImpl {
    constructor(parent, offset) {
        super(parent, offset);
        this.type = 'object';
        this.properties = [];
    }
    get children() {
        return this.properties;
    }
}
function asSchema(schema) {
    if (isBoolean(schema)) {
        return schema ? {} : { "not": {} };
    }
    return schema;
}
var EnumMatch;
(function (EnumMatch) {
    EnumMatch[EnumMatch["Key"] = 0] = "Key";
    EnumMatch[EnumMatch["Enum"] = 1] = "Enum";
})(EnumMatch || (EnumMatch = {}));
class SchemaCollector {
    constructor(focusOffset = -1, exclude) {
        this.focusOffset = focusOffset;
        this.exclude = exclude;
        this.schemas = [];
    }
    add(schema) {
        this.schemas.push(schema);
    }
    merge(other) {
        Array.prototype.push.apply(this.schemas, other.schemas);
    }
    include(node) {
        return (this.focusOffset === -1 || contains(node, this.focusOffset)) && (node !== this.exclude);
    }
    newSub() {
        return new SchemaCollector(-1, this.exclude);
    }
}
class NoOpSchemaCollector {
    constructor() { }
    get schemas() { return []; }
    add(schema) { }
    merge(other) { }
    include(node) { return true; }
    newSub() { return this; }
}
NoOpSchemaCollector.instance = new NoOpSchemaCollector();
class ValidationResult {
    constructor() {
        this.problems = [];
        this.propertiesMatches = 0;
        this.processedProperties = new Set();
        this.propertiesValueMatches = 0;
        this.primaryValueMatches = 0;
        this.enumValueMatch = false;
        this.enumValues = undefined;
    }
    hasProblems() {
        return !!this.problems.length;
    }
    mergeAll(validationResults) {
        for (const validationResult of validationResults) {
            this.merge(validationResult);
        }
    }
    merge(validationResult) {
        this.problems = this.problems.concat(validationResult.problems);
    }
    mergeEnumValues(validationResult) {
        if (!this.enumValueMatch && !validationResult.enumValueMatch && this.enumValues && validationResult.enumValues) {
            this.enumValues = this.enumValues.concat(validationResult.enumValues);
            for (const error of this.problems) {
                if (error.code === ErrorCode.EnumValueMismatch) {
                    error.message = localize$4('enumWarning', 'Value is not accepted. Valid values: {0}.', this.enumValues.map(v => JSON.stringify(v)).join(', '));
                }
            }
        }
    }
    mergePropertyMatch(propertyValidationResult) {
        this.merge(propertyValidationResult);
        this.propertiesMatches++;
        if (propertyValidationResult.enumValueMatch || !propertyValidationResult.hasProblems() && propertyValidationResult.propertiesMatches) {
            this.propertiesValueMatches++;
        }
        if (propertyValidationResult.enumValueMatch && propertyValidationResult.enumValues && propertyValidationResult.enumValues.length === 1) {
            this.primaryValueMatches++;
        }
    }
    mergeProcessedProperties(validationResult) {
        validationResult.processedProperties.forEach(p => this.processedProperties.add(p));
    }
    compare(other) {
        const hasProblems = this.hasProblems();
        if (hasProblems !== other.hasProblems()) {
            return hasProblems ? -1 : 1;
        }
        if (this.enumValueMatch !== other.enumValueMatch) {
            return other.enumValueMatch ? -1 : 1;
        }
        if (this.primaryValueMatches !== other.primaryValueMatches) {
            return this.primaryValueMatches - other.primaryValueMatches;
        }
        if (this.propertiesValueMatches !== other.propertiesValueMatches) {
            return this.propertiesValueMatches - other.propertiesValueMatches;
        }
        return this.propertiesMatches - other.propertiesMatches;
    }
}
function newJSONDocument(root, diagnostics = []) {
    return new JSONDocument(root, diagnostics, []);
}
function getNodeValue(node) {
    return getNodeValue$1(node);
}
function getNodePath(node) {
    return getNodePath$1(node);
}
function contains(node, offset, includeRightBound = false) {
    return offset >= node.offset && offset < (node.offset + node.length) || includeRightBound && offset === (node.offset + node.length);
}
class JSONDocument {
    constructor(root, syntaxErrors = [], comments = []) {
        this.root = root;
        this.syntaxErrors = syntaxErrors;
        this.comments = comments;
    }
    getNodeFromOffset(offset, includeRightBound = false) {
        if (this.root) {
            return findNodeAtOffset(this.root, offset, includeRightBound);
        }
        return undefined;
    }
    visit(visitor) {
        if (this.root) {
            const doVisit = (node) => {
                let ctn = visitor(node);
                const children = node.children;
                if (Array.isArray(children)) {
                    for (let i = 0; i < children.length && ctn; i++) {
                        ctn = doVisit(children[i]);
                    }
                }
                return ctn;
            };
            doVisit(this.root);
        }
    }
    validate(textDocument, schema, severity = DiagnosticSeverity.Warning) {
        if (this.root && schema) {
            const validationResult = new ValidationResult();
            validate(this.root, schema, validationResult, NoOpSchemaCollector.instance);
            return validationResult.problems.map(p => {
                const range = Range.create(textDocument.positionAt(p.location.offset), textDocument.positionAt(p.location.offset + p.location.length));
                return Diagnostic.create(range, p.message, p.severity ?? severity, p.code);
            });
        }
        return undefined;
    }
    getMatchingSchemas(schema, focusOffset = -1, exclude) {
        const matchingSchemas = new SchemaCollector(focusOffset, exclude);
        if (this.root && schema) {
            validate(this.root, schema, new ValidationResult(), matchingSchemas);
        }
        return matchingSchemas.schemas;
    }
}
function validate(n, schema, validationResult, matchingSchemas) {
    if (!n || !matchingSchemas.include(n)) {
        return;
    }
    if (n.type === 'property') {
        return validate(n.valueNode, schema, validationResult, matchingSchemas);
    }
    const node = n;
    _validateNode();
    switch (node.type) {
        case 'object':
            _validateObjectNode(node);
            break;
        case 'array':
            _validateArrayNode(node);
            break;
        case 'string':
            _validateStringNode(node);
            break;
        case 'number':
            _validateNumberNode(node);
            break;
    }
    matchingSchemas.add({ node: node, schema: schema });
    function _validateNode() {
        function matchesType(type) {
            return node.type === type || (type === 'integer' && node.type === 'number' && node.isInteger);
        }
        if (Array.isArray(schema.type)) {
            if (!schema.type.some(matchesType)) {
                validationResult.problems.push({
                    location: { offset: node.offset, length: node.length },
                    message: schema.errorMessage || localize$4('typeArrayMismatchWarning', 'Incorrect type. Expected one of {0}.', schema.type.join(', '))
                });
            }
        }
        else if (schema.type) {
            if (!matchesType(schema.type)) {
                validationResult.problems.push({
                    location: { offset: node.offset, length: node.length },
                    message: schema.errorMessage || localize$4('typeMismatchWarning', 'Incorrect type. Expected "{0}".', schema.type)
                });
            }
        }
        if (Array.isArray(schema.allOf)) {
            for (const subSchemaRef of schema.allOf) {
                validate(node, asSchema(subSchemaRef), validationResult, matchingSchemas);
            }
        }
        const notSchema = asSchema(schema.not);
        if (notSchema) {
            const subValidationResult = new ValidationResult();
            const subMatchingSchemas = matchingSchemas.newSub();
            validate(node, notSchema, subValidationResult, subMatchingSchemas);
            if (!subValidationResult.hasProblems()) {
                validationResult.problems.push({
                    location: { offset: node.offset, length: node.length },
                    message: localize$4('notSchemaWarning', "Matches a schema that is not allowed.")
                });
            }
            for (const ms of subMatchingSchemas.schemas) {
                ms.inverted = !ms.inverted;
                matchingSchemas.add(ms);
            }
        }
        const testAlternatives = (alternatives, maxOneMatch) => {
            const matches = [];
            // remember the best match that is used for error messages
            let bestMatch = undefined;
            for (const subSchemaRef of alternatives) {
                const subSchema = asSchema(subSchemaRef);
                const subValidationResult = new ValidationResult();
                const subMatchingSchemas = matchingSchemas.newSub();
                validate(node, subSchema, subValidationResult, subMatchingSchemas);
                if (!subValidationResult.hasProblems()) {
                    matches.push(subSchema);
                }
                if (!bestMatch) {
                    bestMatch = { schema: subSchema, validationResult: subValidationResult, matchingSchemas: subMatchingSchemas };
                }
                else {
                    if (!maxOneMatch && !subValidationResult.hasProblems() && !bestMatch.validationResult.hasProblems()) {
                        // no errors, both are equally good matches
                        bestMatch.matchingSchemas.merge(subMatchingSchemas);
                        bestMatch.validationResult.propertiesMatches += subValidationResult.propertiesMatches;
                        bestMatch.validationResult.propertiesValueMatches += subValidationResult.propertiesValueMatches;
                        bestMatch.validationResult.mergeProcessedProperties(subValidationResult);
                    }
                    else {
                        const compareResult = subValidationResult.compare(bestMatch.validationResult);
                        if (compareResult > 0) {
                            // our node is the best matching so far
                            bestMatch = { schema: subSchema, validationResult: subValidationResult, matchingSchemas: subMatchingSchemas };
                        }
                        else if (compareResult === 0) {
                            // there's already a best matching but we are as good
                            bestMatch.matchingSchemas.merge(subMatchingSchemas);
                            bestMatch.validationResult.mergeEnumValues(subValidationResult);
                        }
                    }
                }
            }
            if (matches.length > 1 && maxOneMatch) {
                validationResult.problems.push({
                    location: { offset: node.offset, length: 1 },
                    message: localize$4('oneOfWarning', "Matches multiple schemas when only one must validate.")
                });
            }
            if (bestMatch) {
                validationResult.merge(bestMatch.validationResult);
                validationResult.propertiesMatches += bestMatch.validationResult.propertiesMatches;
                validationResult.propertiesValueMatches += bestMatch.validationResult.propertiesValueMatches;
                validationResult.mergeProcessedProperties(bestMatch.validationResult);
                matchingSchemas.merge(bestMatch.matchingSchemas);
            }
            return matches.length;
        };
        if (Array.isArray(schema.anyOf)) {
            testAlternatives(schema.anyOf, false);
        }
        if (Array.isArray(schema.oneOf)) {
            testAlternatives(schema.oneOf, true);
        }
        const testBranch = (schema) => {
            const subValidationResult = new ValidationResult();
            const subMatchingSchemas = matchingSchemas.newSub();
            validate(node, asSchema(schema), subValidationResult, subMatchingSchemas);
            validationResult.merge(subValidationResult);
            validationResult.propertiesMatches += subValidationResult.propertiesMatches;
            validationResult.propertiesValueMatches += subValidationResult.propertiesValueMatches;
            validationResult.mergeProcessedProperties(subValidationResult);
            matchingSchemas.merge(subMatchingSchemas);
        };
        const testCondition = (ifSchema, thenSchema, elseSchema) => {
            const subSchema = asSchema(ifSchema);
            const subValidationResult = new ValidationResult();
            const subMatchingSchemas = matchingSchemas.newSub();
            validate(node, subSchema, subValidationResult, subMatchingSchemas);
            matchingSchemas.merge(subMatchingSchemas);
            validationResult.mergeProcessedProperties(subValidationResult);
            if (!subValidationResult.hasProblems()) {
                if (thenSchema) {
                    testBranch(thenSchema);
                }
            }
            else if (elseSchema) {
                testBranch(elseSchema);
            }
        };
        const ifSchema = asSchema(schema.if);
        if (ifSchema) {
            testCondition(ifSchema, asSchema(schema.then), asSchema(schema.else));
        }
        if (Array.isArray(schema.enum)) {
            const val = getNodeValue(node);
            let enumValueMatch = false;
            for (const e of schema.enum) {
                if (equals(val, e)) {
                    enumValueMatch = true;
                    break;
                }
            }
            validationResult.enumValues = schema.enum;
            validationResult.enumValueMatch = enumValueMatch;
            if (!enumValueMatch) {
                validationResult.problems.push({
                    location: { offset: node.offset, length: node.length },
                    code: ErrorCode.EnumValueMismatch,
                    message: schema.errorMessage || localize$4('enumWarning', 'Value is not accepted. Valid values: {0}.', schema.enum.map(v => JSON.stringify(v)).join(', '))
                });
            }
        }
        if (isDefined(schema.const)) {
            const val = getNodeValue(node);
            if (!equals(val, schema.const)) {
                validationResult.problems.push({
                    location: { offset: node.offset, length: node.length },
                    code: ErrorCode.EnumValueMismatch,
                    message: schema.errorMessage || localize$4('constWarning', 'Value must be {0}.', JSON.stringify(schema.const))
                });
                validationResult.enumValueMatch = false;
            }
            else {
                validationResult.enumValueMatch = true;
            }
            validationResult.enumValues = [schema.const];
        }
        let deprecationMessage = schema.deprecationMessage;
        if ((deprecationMessage || schema.deprecated) && node.parent) {
            deprecationMessage = deprecationMessage || localize$4('deprecated', 'Value is deprecated');
            validationResult.problems.push({
                location: { offset: node.parent.offset, length: node.parent.length },
                severity: DiagnosticSeverity.Warning,
                message: deprecationMessage,
                code: ErrorCode.Deprecated
            });
        }
    }
    function _validateNumberNode(node) {
        const val = node.value;
        function normalizeFloats(float) {
            const parts = /^(-?\d+)(?:\.(\d+))?(?:e([-+]\d+))?$/.exec(float.toString());
            return parts && {
                value: Number(parts[1] + (parts[2] || '')),
                multiplier: (parts[2]?.length || 0) - (parseInt(parts[3]) || 0)
            };
        }
        if (isNumber(schema.multipleOf)) {
            let remainder = -1;
            if (Number.isInteger(schema.multipleOf)) {
                remainder = val % schema.multipleOf;
            }
            else {
                let normMultipleOf = normalizeFloats(schema.multipleOf);
                let normValue = normalizeFloats(val);
                if (normMultipleOf && normValue) {
                    const multiplier = 10 ** Math.abs(normValue.multiplier - normMultipleOf.multiplier);
                    if (normValue.multiplier < normMultipleOf.multiplier) {
                        normValue.value *= multiplier;
                    }
                    else {
                        normMultipleOf.value *= multiplier;
                    }
                    remainder = normValue.value % normMultipleOf.value;
                }
            }
            if (remainder !== 0) {
                validationResult.problems.push({
                    location: { offset: node.offset, length: node.length },
                    message: localize$4('multipleOfWarning', 'Value is not divisible by {0}.', schema.multipleOf)
                });
            }
        }
        function getExclusiveLimit(limit, exclusive) {
            if (isNumber(exclusive)) {
                return exclusive;
            }
            if (isBoolean(exclusive) && exclusive) {
                return limit;
            }
            return undefined;
        }
        function getLimit(limit, exclusive) {
            if (!isBoolean(exclusive) || !exclusive) {
                return limit;
            }
            return undefined;
        }
        const exclusiveMinimum = getExclusiveLimit(schema.minimum, schema.exclusiveMinimum);
        if (isNumber(exclusiveMinimum) && val <= exclusiveMinimum) {
            validationResult.problems.push({
                location: { offset: node.offset, length: node.length },
                message: localize$4('exclusiveMinimumWarning', 'Value is below the exclusive minimum of {0}.', exclusiveMinimum)
            });
        }
        const exclusiveMaximum = getExclusiveLimit(schema.maximum, schema.exclusiveMaximum);
        if (isNumber(exclusiveMaximum) && val >= exclusiveMaximum) {
            validationResult.problems.push({
                location: { offset: node.offset, length: node.length },
                message: localize$4('exclusiveMaximumWarning', 'Value is above the exclusive maximum of {0}.', exclusiveMaximum)
            });
        }
        const minimum = getLimit(schema.minimum, schema.exclusiveMinimum);
        if (isNumber(minimum) && val < minimum) {
            validationResult.problems.push({
                location: { offset: node.offset, length: node.length },
                message: localize$4('minimumWarning', 'Value is below the minimum of {0}.', minimum)
            });
        }
        const maximum = getLimit(schema.maximum, schema.exclusiveMaximum);
        if (isNumber(maximum) && val > maximum) {
            validationResult.problems.push({
                location: { offset: node.offset, length: node.length },
                message: localize$4('maximumWarning', 'Value is above the maximum of {0}.', maximum)
            });
        }
    }
    function _validateStringNode(node) {
        if (isNumber(schema.minLength) && node.value.length < schema.minLength) {
            validationResult.problems.push({
                location: { offset: node.offset, length: node.length },
                message: localize$4('minLengthWarning', 'String is shorter than the minimum length of {0}.', schema.minLength)
            });
        }
        if (isNumber(schema.maxLength) && node.value.length > schema.maxLength) {
            validationResult.problems.push({
                location: { offset: node.offset, length: node.length },
                message: localize$4('maxLengthWarning', 'String is longer than the maximum length of {0}.', schema.maxLength)
            });
        }
        if (isString(schema.pattern)) {
            const regex = extendedRegExp(schema.pattern);
            if (!(regex?.test(node.value))) {
                validationResult.problems.push({
                    location: { offset: node.offset, length: node.length },
                    message: schema.patternErrorMessage || schema.errorMessage || localize$4('patternWarning', 'String does not match the pattern of "{0}".', schema.pattern)
                });
            }
        }
        if (schema.format) {
            switch (schema.format) {
                case 'uri':
                case 'uri-reference':
                    {
                        let errorMessage;
                        if (!node.value) {
                            errorMessage = localize$4('uriEmpty', 'URI expected.');
                        }
                        else {
                            const match = /^(([^:/?#]+?):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/.exec(node.value);
                            if (!match) {
                                errorMessage = localize$4('uriMissing', 'URI is expected.');
                            }
                            else if (!match[2] && schema.format === 'uri') {
                                errorMessage = localize$4('uriSchemeMissing', 'URI with a scheme is expected.');
                            }
                        }
                        if (errorMessage) {
                            validationResult.problems.push({
                                location: { offset: node.offset, length: node.length },
                                message: schema.patternErrorMessage || schema.errorMessage || localize$4('uriFormatWarning', 'String is not a URI: {0}', errorMessage)
                            });
                        }
                    }
                    break;
                case 'color-hex':
                case 'date-time':
                case 'date':
                case 'time':
                case 'email':
                case 'hostname':
                case 'ipv4':
                case 'ipv6':
                    const format = formats[schema.format];
                    if (!node.value || !format.pattern.exec(node.value)) {
                        validationResult.problems.push({
                            location: { offset: node.offset, length: node.length },
                            message: schema.patternErrorMessage || schema.errorMessage || format.errorMessage
                        });
                    }
            }
        }
    }
    function _validateArrayNode(node) {
        let prefixItemsSchemas;
        let additionalItemSchema;
        let isSchema_2020_12 = Array.isArray(schema.prefixItems) || (schema.items !== undefined && !Array.isArray(schema.items) && schema.additionalItems === undefined);
        if (isSchema_2020_12) {
            prefixItemsSchemas = schema.prefixItems;
            additionalItemSchema = !Array.isArray(schema.items) ? schema.items : undefined;
        }
        else {
            prefixItemsSchemas = Array.isArray(schema.items) ? schema.items : undefined;
            additionalItemSchema = !Array.isArray(schema.items) ? schema.items : schema.additionalItems;
        }
        let index = 0;
        if (prefixItemsSchemas !== undefined) {
            const max = Math.min(prefixItemsSchemas.length, node.items.length);
            for (; index < max; index++) {
                const subSchemaRef = prefixItemsSchemas[index];
                const subSchema = asSchema(subSchemaRef);
                const itemValidationResult = new ValidationResult();
                const item = node.items[index];
                if (item) {
                    validate(item, subSchema, itemValidationResult, matchingSchemas);
                    validationResult.mergePropertyMatch(itemValidationResult);
                }
                validationResult.processedProperties.add(String(index));
            }
        }
        if (additionalItemSchema !== undefined && index < node.items.length) {
            if (typeof additionalItemSchema === 'boolean') {
                if (additionalItemSchema === false) {
                    validationResult.problems.push({
                        location: { offset: node.offset, length: node.length },
                        message: localize$4('additionalItemsWarning', 'Array has too many items according to schema. Expected {0} or fewer.', index)
                    });
                }
                for (; index < node.items.length; index++) {
                    validationResult.processedProperties.add(String(index));
                    validationResult.propertiesValueMatches++;
                }
            }
            else {
                for (; index < node.items.length; index++) {
                    const itemValidationResult = new ValidationResult();
                    validate(node.items[index], additionalItemSchema, itemValidationResult, matchingSchemas);
                    validationResult.mergePropertyMatch(itemValidationResult);
                    validationResult.processedProperties.add(String(index));
                }
            }
        }
        const containsSchema = asSchema(schema.contains);
        if (containsSchema) {
            let containsCount = 0;
            for (let index = 0; index < node.items.length; index++) {
                const item = node.items[index];
                const itemValidationResult = new ValidationResult();
                validate(item, containsSchema, itemValidationResult, NoOpSchemaCollector.instance);
                if (!itemValidationResult.hasProblems()) {
                    containsCount++;
                    if (isSchema_2020_12) {
                        validationResult.processedProperties.add(String(index));
                    }
                }
            }
            if (containsCount === 0 && !isNumber(schema.minContains)) {
                validationResult.problems.push({
                    location: { offset: node.offset, length: node.length },
                    message: schema.errorMessage || localize$4('requiredItemMissingWarning', 'Array does not contain required item.')
                });
            }
            if (isNumber(schema.minContains) && containsCount < schema.minContains) {
                validationResult.problems.push({
                    location: { offset: node.offset, length: node.length },
                    message: localize$4('minContainsWarning', 'Array has too few items that match the contains contraint. Expected {0} or more.', schema.minContains)
                });
            }
            if (isNumber(schema.maxContains) && containsCount > schema.maxContains) {
                validationResult.problems.push({
                    location: { offset: node.offset, length: node.length },
                    message: localize$4('maxContainsWarning', 'Array has too many items that match the contains contraint. Expected {0} or less.', schema.maxContains)
                });
            }
        }
        const unevaluatedItems = schema.unevaluatedItems;
        if (unevaluatedItems !== undefined) {
            for (let i = 0; i < node.items.length; i++) {
                if (!validationResult.processedProperties.has(String(i))) {
                    if (unevaluatedItems === false) {
                        validationResult.problems.push({
                            location: { offset: node.offset, length: node.length },
                            message: localize$4('unevaluatedItemsWarning', 'Item does not match any validation rule from the array.')
                        });
                    }
                    else {
                        const itemValidationResult = new ValidationResult();
                        validate(node.items[i], schema.additionalItems, itemValidationResult, matchingSchemas);
                        validationResult.mergePropertyMatch(itemValidationResult);
                    }
                }
                validationResult.processedProperties.add(String(i));
                validationResult.propertiesValueMatches++;
            }
        }
        if (isNumber(schema.minItems) && node.items.length < schema.minItems) {
            validationResult.problems.push({
                location: { offset: node.offset, length: node.length },
                message: localize$4('minItemsWarning', 'Array has too few items. Expected {0} or more.', schema.minItems)
            });
        }
        if (isNumber(schema.maxItems) && node.items.length > schema.maxItems) {
            validationResult.problems.push({
                location: { offset: node.offset, length: node.length },
                message: localize$4('maxItemsWarning', 'Array has too many items. Expected {0} or fewer.', schema.maxItems)
            });
        }
        if (schema.uniqueItems === true) {
            const values = getNodeValue(node);
            const duplicates = values.some((value, index) => {
                return index !== values.lastIndexOf(value);
            });
            if (duplicates) {
                validationResult.problems.push({
                    location: { offset: node.offset, length: node.length },
                    message: localize$4('uniqueItemsWarning', 'Array has duplicate items.')
                });
            }
        }
    }
    function _validateObjectNode(node) {
        const seenKeys = Object.create(null);
        const unprocessedProperties = new Set();
        for (const propertyNode of node.properties) {
            const key = propertyNode.keyNode.value;
            seenKeys[key] = propertyNode.valueNode;
            unprocessedProperties.add(key);
        }
        if (Array.isArray(schema.required)) {
            for (const propertyName of schema.required) {
                if (!seenKeys[propertyName]) {
                    const keyNode = node.parent && node.parent.type === 'property' && node.parent.keyNode;
                    const location = keyNode ? { offset: keyNode.offset, length: keyNode.length } : { offset: node.offset, length: 1 };
                    validationResult.problems.push({
                        location: location,
                        message: localize$4('MissingRequiredPropWarning', 'Missing property "{0}".', propertyName)
                    });
                }
            }
        }
        const propertyProcessed = (prop) => {
            unprocessedProperties.delete(prop);
            validationResult.processedProperties.add(prop);
        };
        if (schema.properties) {
            for (const propertyName of Object.keys(schema.properties)) {
                propertyProcessed(propertyName);
                const propertySchema = schema.properties[propertyName];
                const child = seenKeys[propertyName];
                if (child) {
                    if (isBoolean(propertySchema)) {
                        if (!propertySchema) {
                            const propertyNode = child.parent;
                            validationResult.problems.push({
                                location: { offset: propertyNode.keyNode.offset, length: propertyNode.keyNode.length },
                                message: schema.errorMessage || localize$4('DisallowedExtraPropWarning', 'Property {0} is not allowed.', propertyName)
                            });
                        }
                        else {
                            validationResult.propertiesMatches++;
                            validationResult.propertiesValueMatches++;
                        }
                    }
                    else {
                        const propertyValidationResult = new ValidationResult();
                        validate(child, propertySchema, propertyValidationResult, matchingSchemas);
                        validationResult.mergePropertyMatch(propertyValidationResult);
                    }
                }
            }
        }
        if (schema.patternProperties) {
            for (const propertyPattern of Object.keys(schema.patternProperties)) {
                const regex = extendedRegExp(propertyPattern);
                if (regex) {
                    const processed = [];
                    for (const propertyName of unprocessedProperties) {
                        if (regex.test(propertyName)) {
                            processed.push(propertyName);
                            const child = seenKeys[propertyName];
                            if (child) {
                                const propertySchema = schema.patternProperties[propertyPattern];
                                if (isBoolean(propertySchema)) {
                                    if (!propertySchema) {
                                        const propertyNode = child.parent;
                                        validationResult.problems.push({
                                            location: { offset: propertyNode.keyNode.offset, length: propertyNode.keyNode.length },
                                            message: schema.errorMessage || localize$4('DisallowedExtraPropWarning', 'Property {0} is not allowed.', propertyName)
                                        });
                                    }
                                    else {
                                        validationResult.propertiesMatches++;
                                        validationResult.propertiesValueMatches++;
                                    }
                                }
                                else {
                                    const propertyValidationResult = new ValidationResult();
                                    validate(child, propertySchema, propertyValidationResult, matchingSchemas);
                                    validationResult.mergePropertyMatch(propertyValidationResult);
                                }
                            }
                        }
                    }
                    processed.forEach(propertyProcessed);
                }
            }
        }
        const additionalProperties = schema.additionalProperties;
        if (additionalProperties !== undefined && additionalProperties !== true) {
            for (const propertyName of unprocessedProperties) {
                propertyProcessed(propertyName);
                const child = seenKeys[propertyName];
                if (child) {
                    if (additionalProperties === false) {
                        const propertyNode = child.parent;
                        validationResult.problems.push({
                            location: { offset: propertyNode.keyNode.offset, length: propertyNode.keyNode.length },
                            message: schema.errorMessage || localize$4('DisallowedExtraPropWarning', 'Property {0} is not allowed.', propertyName)
                        });
                    }
                    else {
                        const propertyValidationResult = new ValidationResult();
                        validate(child, additionalProperties, propertyValidationResult, matchingSchemas);
                        validationResult.mergePropertyMatch(propertyValidationResult);
                    }
                }
            }
        }
        const unevaluatedProperties = schema.unevaluatedProperties;
        if (unevaluatedProperties !== undefined && unevaluatedProperties !== true) {
            const processed = [];
            for (const propertyName of unprocessedProperties) {
                if (!validationResult.processedProperties.has(propertyName)) {
                    processed.push(propertyName);
                    const child = seenKeys[propertyName];
                    if (child) {
                        if (unevaluatedProperties === false) {
                            const propertyNode = child.parent;
                            validationResult.problems.push({
                                location: { offset: propertyNode.keyNode.offset, length: propertyNode.keyNode.length },
                                message: schema.errorMessage || localize$4('DisallowedExtraPropWarning', 'Property {0} is not allowed.', propertyName)
                            });
                        }
                        else {
                            const propertyValidationResult = new ValidationResult();
                            validate(child, unevaluatedProperties, propertyValidationResult, matchingSchemas);
                            validationResult.mergePropertyMatch(propertyValidationResult);
                        }
                    }
                }
            }
            processed.forEach(propertyProcessed);
        }
        if (isNumber(schema.maxProperties)) {
            if (node.properties.length > schema.maxProperties) {
                validationResult.problems.push({
                    location: { offset: node.offset, length: node.length },
                    message: localize$4('MaxPropWarning', 'Object has more properties than limit of {0}.', schema.maxProperties)
                });
            }
        }
        if (isNumber(schema.minProperties)) {
            if (node.properties.length < schema.minProperties) {
                validationResult.problems.push({
                    location: { offset: node.offset, length: node.length },
                    message: localize$4('MinPropWarning', 'Object has fewer properties than the required number of {0}', schema.minProperties)
                });
            }
        }
        if (schema.dependentRequired) {
            for (const key in schema.dependentRequired) {
                const prop = seenKeys[key];
                const propertyDeps = schema.dependentRequired[key];
                if (prop && Array.isArray(propertyDeps)) {
                    _validatePropertyDependencies(key, propertyDeps);
                }
            }
        }
        if (schema.dependentSchemas) {
            for (const key in schema.dependentSchemas) {
                const prop = seenKeys[key];
                const propertyDeps = schema.dependentSchemas[key];
                if (prop && isObject(propertyDeps)) {
                    _validatePropertyDependencies(key, propertyDeps);
                }
            }
        }
        if (schema.dependencies) {
            for (const key in schema.dependencies) {
                const prop = seenKeys[key];
                if (prop) {
                    _validatePropertyDependencies(key, schema.dependencies[key]);
                }
            }
        }
        const propertyNames = asSchema(schema.propertyNames);
        if (propertyNames) {
            for (const f of node.properties) {
                const key = f.keyNode;
                if (key) {
                    validate(key, propertyNames, validationResult, NoOpSchemaCollector.instance);
                }
            }
        }
        function _validatePropertyDependencies(key, propertyDep) {
            if (Array.isArray(propertyDep)) {
                for (const requiredProp of propertyDep) {
                    if (!seenKeys[requiredProp]) {
                        validationResult.problems.push({
                            location: { offset: node.offset, length: node.length },
                            message: localize$4('RequiredDependentPropWarning', 'Object is missing property {0} required by property {1}.', requiredProp, key)
                        });
                    }
                    else {
                        validationResult.propertiesValueMatches++;
                    }
                }
            }
            else {
                const propertySchema = asSchema(propertyDep);
                if (propertySchema) {
                    const propertyValidationResult = new ValidationResult();
                    validate(node, propertySchema, propertyValidationResult, matchingSchemas);
                    validationResult.mergePropertyMatch(propertyValidationResult);
                }
            }
        }
    }
}
function parse(textDocument, config) {
    const problems = [];
    let lastProblemOffset = -1;
    const text = textDocument.getText();
    const scanner = createScanner(text, false);
    const commentRanges = config && config.collectComments ? [] : undefined;
    function _scanNext() {
        while (true) {
            const token = scanner.scan();
            _checkScanError();
            switch (token) {
                case 12 /* LineCommentTrivia */:
                case 13 /* BlockCommentTrivia */:
                    if (Array.isArray(commentRanges)) {
                        commentRanges.push(Range.create(textDocument.positionAt(scanner.getTokenOffset()), textDocument.positionAt(scanner.getTokenOffset() + scanner.getTokenLength())));
                    }
                    break;
                case 15 /* Trivia */:
                case 14 /* LineBreakTrivia */:
                    break;
                default:
                    return token;
            }
        }
    }
    function _errorAtRange(message, code, startOffset, endOffset, severity = DiagnosticSeverity.Error) {
        if (problems.length === 0 || startOffset !== lastProblemOffset) {
            const range = Range.create(textDocument.positionAt(startOffset), textDocument.positionAt(endOffset));
            problems.push(Diagnostic.create(range, message, severity, code, textDocument.languageId));
            lastProblemOffset = startOffset;
        }
    }
    function _error(message, code, node = undefined, skipUntilAfter = [], skipUntil = []) {
        let start = scanner.getTokenOffset();
        let end = scanner.getTokenOffset() + scanner.getTokenLength();
        if (start === end && start > 0) {
            start--;
            while (start > 0 && /\s/.test(text.charAt(start))) {
                start--;
            }
            end = start + 1;
        }
        _errorAtRange(message, code, start, end);
        if (node) {
            _finalize(node, false);
        }
        if (skipUntilAfter.length + skipUntil.length > 0) {
            let token = scanner.getToken();
            while (token !== 17 /* EOF */) {
                if (skipUntilAfter.indexOf(token) !== -1) {
                    _scanNext();
                    break;
                }
                else if (skipUntil.indexOf(token) !== -1) {
                    break;
                }
                token = _scanNext();
            }
        }
        return node;
    }
    function _checkScanError() {
        switch (scanner.getTokenError()) {
            case 4 /* InvalidUnicode */:
                _error(localize$4('InvalidUnicode', 'Invalid unicode sequence in string.'), ErrorCode.InvalidUnicode);
                return true;
            case 5 /* InvalidEscapeCharacter */:
                _error(localize$4('InvalidEscapeCharacter', 'Invalid escape character in string.'), ErrorCode.InvalidEscapeCharacter);
                return true;
            case 3 /* UnexpectedEndOfNumber */:
                _error(localize$4('UnexpectedEndOfNumber', 'Unexpected end of number.'), ErrorCode.UnexpectedEndOfNumber);
                return true;
            case 1 /* UnexpectedEndOfComment */:
                _error(localize$4('UnexpectedEndOfComment', 'Unexpected end of comment.'), ErrorCode.UnexpectedEndOfComment);
                return true;
            case 2 /* UnexpectedEndOfString */:
                _error(localize$4('UnexpectedEndOfString', 'Unexpected end of string.'), ErrorCode.UnexpectedEndOfString);
                return true;
            case 6 /* InvalidCharacter */:
                _error(localize$4('InvalidCharacter', 'Invalid characters in string. Control characters must be escaped.'), ErrorCode.InvalidCharacter);
                return true;
        }
        return false;
    }
    function _finalize(node, scanNext) {
        node.length = scanner.getTokenOffset() + scanner.getTokenLength() - node.offset;
        if (scanNext) {
            _scanNext();
        }
        return node;
    }
    function _parseArray(parent) {
        if (scanner.getToken() !== 3 /* OpenBracketToken */) {
            return undefined;
        }
        const node = new ArrayASTNodeImpl(parent, scanner.getTokenOffset());
        _scanNext(); // consume OpenBracketToken
        let needsComma = false;
        while (scanner.getToken() !== 4 /* CloseBracketToken */ && scanner.getToken() !== 17 /* EOF */) {
            if (scanner.getToken() === 5 /* CommaToken */) {
                if (!needsComma) {
                    _error(localize$4('ValueExpected', 'Value expected'), ErrorCode.ValueExpected);
                }
                const commaOffset = scanner.getTokenOffset();
                _scanNext(); // consume comma
                if (scanner.getToken() === 4 /* CloseBracketToken */) {
                    if (needsComma) {
                        _errorAtRange(localize$4('TrailingComma', 'Trailing comma'), ErrorCode.TrailingComma, commaOffset, commaOffset + 1);
                    }
                    continue;
                }
            }
            else if (needsComma) {
                _error(localize$4('ExpectedComma', 'Expected comma'), ErrorCode.CommaExpected);
            }
            const item = _parseValue(node);
            if (!item) {
                _error(localize$4('PropertyExpected', 'Value expected'), ErrorCode.ValueExpected, undefined, [], [4 /* CloseBracketToken */, 5 /* CommaToken */]);
            }
            else {
                node.items.push(item);
            }
            needsComma = true;
        }
        if (scanner.getToken() !== 4 /* CloseBracketToken */) {
            return _error(localize$4('ExpectedCloseBracket', 'Expected comma or closing bracket'), ErrorCode.CommaOrCloseBacketExpected, node);
        }
        return _finalize(node, true);
    }
    const keyPlaceholder = new StringASTNodeImpl(undefined, 0, 0);
    function _parseProperty(parent, keysSeen) {
        const node = new PropertyASTNodeImpl(parent, scanner.getTokenOffset(), keyPlaceholder);
        let key = _parseString(node);
        if (!key) {
            if (scanner.getToken() === 16 /* Unknown */) {
                // give a more helpful error message
                _error(localize$4('DoubleQuotesExpected', 'Property keys must be doublequoted'), ErrorCode.Undefined);
                const keyNode = new StringASTNodeImpl(node, scanner.getTokenOffset(), scanner.getTokenLength());
                keyNode.value = scanner.getTokenValue();
                key = keyNode;
                _scanNext(); // consume Unknown
            }
            else {
                return undefined;
            }
        }
        node.keyNode = key;
        const seen = keysSeen[key.value];
        if (seen) {
            _errorAtRange(localize$4('DuplicateKeyWarning', "Duplicate object key"), ErrorCode.DuplicateKey, node.keyNode.offset, node.keyNode.offset + node.keyNode.length, DiagnosticSeverity.Warning);
            if (isObject(seen)) {
                _errorAtRange(localize$4('DuplicateKeyWarning', "Duplicate object key"), ErrorCode.DuplicateKey, seen.keyNode.offset, seen.keyNode.offset + seen.keyNode.length, DiagnosticSeverity.Warning);
            }
            keysSeen[key.value] = true; // if the same key is duplicate again, avoid duplicate error reporting
        }
        else {
            keysSeen[key.value] = node;
        }
        if (scanner.getToken() === 6 /* ColonToken */) {
            node.colonOffset = scanner.getTokenOffset();
            _scanNext(); // consume ColonToken
        }
        else {
            _error(localize$4('ColonExpected', 'Colon expected'), ErrorCode.ColonExpected);
            if (scanner.getToken() === 10 /* StringLiteral */ && textDocument.positionAt(key.offset + key.length).line < textDocument.positionAt(scanner.getTokenOffset()).line) {
                node.length = key.length;
                return node;
            }
        }
        const value = _parseValue(node);
        if (!value) {
            return _error(localize$4('ValueExpected', 'Value expected'), ErrorCode.ValueExpected, node, [], [2 /* CloseBraceToken */, 5 /* CommaToken */]);
        }
        node.valueNode = value;
        node.length = value.offset + value.length - node.offset;
        return node;
    }
    function _parseObject(parent) {
        if (scanner.getToken() !== 1 /* OpenBraceToken */) {
            return undefined;
        }
        const node = new ObjectASTNodeImpl(parent, scanner.getTokenOffset());
        const keysSeen = Object.create(null);
        _scanNext(); // consume OpenBraceToken
        let needsComma = false;
        while (scanner.getToken() !== 2 /* CloseBraceToken */ && scanner.getToken() !== 17 /* EOF */) {
            if (scanner.getToken() === 5 /* CommaToken */) {
                if (!needsComma) {
                    _error(localize$4('PropertyExpected', 'Property expected'), ErrorCode.PropertyExpected);
                }
                const commaOffset = scanner.getTokenOffset();
                _scanNext(); // consume comma
                if (scanner.getToken() === 2 /* CloseBraceToken */) {
                    if (needsComma) {
                        _errorAtRange(localize$4('TrailingComma', 'Trailing comma'), ErrorCode.TrailingComma, commaOffset, commaOffset + 1);
                    }
                    continue;
                }
            }
            else if (needsComma) {
                _error(localize$4('ExpectedComma', 'Expected comma'), ErrorCode.CommaExpected);
            }
            const property = _parseProperty(node, keysSeen);
            if (!property) {
                _error(localize$4('PropertyExpected', 'Property expected'), ErrorCode.PropertyExpected, undefined, [], [2 /* CloseBraceToken */, 5 /* CommaToken */]);
            }
            else {
                node.properties.push(property);
            }
            needsComma = true;
        }
        if (scanner.getToken() !== 2 /* CloseBraceToken */) {
            return _error(localize$4('ExpectedCloseBrace', 'Expected comma or closing brace'), ErrorCode.CommaOrCloseBraceExpected, node);
        }
        return _finalize(node, true);
    }
    function _parseString(parent) {
        if (scanner.getToken() !== 10 /* StringLiteral */) {
            return undefined;
        }
        const node = new StringASTNodeImpl(parent, scanner.getTokenOffset());
        node.value = scanner.getTokenValue();
        return _finalize(node, true);
    }
    function _parseNumber(parent) {
        if (scanner.getToken() !== 11 /* NumericLiteral */) {
            return undefined;
        }
        const node = new NumberASTNodeImpl(parent, scanner.getTokenOffset());
        if (scanner.getTokenError() === 0 /* None */) {
            const tokenValue = scanner.getTokenValue();
            try {
                const numberValue = JSON.parse(tokenValue);
                if (!isNumber(numberValue)) {
                    return _error(localize$4('InvalidNumberFormat', 'Invalid number format.'), ErrorCode.Undefined, node);
                }
                node.value = numberValue;
            }
            catch (e) {
                return _error(localize$4('InvalidNumberFormat', 'Invalid number format.'), ErrorCode.Undefined, node);
            }
            node.isInteger = tokenValue.indexOf('.') === -1;
        }
        return _finalize(node, true);
    }
    function _parseLiteral(parent) {
        switch (scanner.getToken()) {
            case 7 /* NullKeyword */:
                return _finalize(new NullASTNodeImpl(parent, scanner.getTokenOffset()), true);
            case 8 /* TrueKeyword */:
                return _finalize(new BooleanASTNodeImpl(parent, true, scanner.getTokenOffset()), true);
            case 9 /* FalseKeyword */:
                return _finalize(new BooleanASTNodeImpl(parent, false, scanner.getTokenOffset()), true);
            default:
                return undefined;
        }
    }
    function _parseValue(parent) {
        return _parseArray(parent) || _parseObject(parent) || _parseString(parent) || _parseNumber(parent) || _parseLiteral(parent);
    }
    let _root = undefined;
    const token = _scanNext();
    if (token !== 17 /* EOF */) {
        _root = _parseValue(_root);
        if (!_root) {
            _error(localize$4('Invalid symbol', 'Expected a JSON object, array or literal.'), ErrorCode.Undefined);
        }
        else if (scanner.getToken() !== 17 /* EOF */) {
            _error(localize$4('End of file expected', 'End of file expected.'), ErrorCode.Undefined);
        }
    }
    return new JSONDocument(_root, problems, commentRanges);
}

/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
function stringifyObject(obj, indent, stringifyLiteral) {
    if (obj !== null && typeof obj === 'object') {
        const newIndent = indent + '\t';
        if (Array.isArray(obj)) {
            if (obj.length === 0) {
                return '[]';
            }
            let result = '[\n';
            for (let i = 0; i < obj.length; i++) {
                result += newIndent + stringifyObject(obj[i], newIndent, stringifyLiteral);
                if (i < obj.length - 1) {
                    result += ',';
                }
                result += '\n';
            }
            result += indent + ']';
            return result;
        }
        else {
            const keys = Object.keys(obj);
            if (keys.length === 0) {
                return '{}';
            }
            let result = '{\n';
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                result += newIndent + JSON.stringify(key) + ': ' + stringifyObject(obj[key], newIndent, stringifyLiteral);
                if (i < keys.length - 1) {
                    result += ',';
                }
                result += '\n';
            }
            result += indent + '}';
            return result;
        }
    }
    return stringifyLiteral(obj);
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const localize$3 = main.loadMessageBundle();
class JSONCompletion {
    constructor(schemaService, contributions = [], promiseConstructor = Promise, clientCapabilities = {}) {
        this.schemaService = schemaService;
        this.contributions = contributions;
        this.promiseConstructor = promiseConstructor;
        this.clientCapabilities = clientCapabilities;
    }
    doResolve(item) {
        for (let i = this.contributions.length - 1; i >= 0; i--) {
            const resolveCompletion = this.contributions[i].resolveCompletion;
            if (resolveCompletion) {
                const resolver = resolveCompletion(item);
                if (resolver) {
                    return resolver;
                }
            }
        }
        return this.promiseConstructor.resolve(item);
    }
    doComplete(document, position, doc) {
        const result = {
            items: [],
            isIncomplete: false
        };
        const text = document.getText();
        const offset = document.offsetAt(position);
        let node = doc.getNodeFromOffset(offset, true);
        if (this.isInComment(document, node ? node.offset : 0, offset)) {
            return Promise.resolve(result);
        }
        if (node && (offset === node.offset + node.length) && offset > 0) {
            const ch = text[offset - 1];
            if (node.type === 'object' && ch === '}' || node.type === 'array' && ch === ']') {
                // after ] or }
                node = node.parent;
            }
        }
        const currentWord = this.getCurrentWord(document, offset);
        let overwriteRange;
        if (node && (node.type === 'string' || node.type === 'number' || node.type === 'boolean' || node.type === 'null')) {
            overwriteRange = Range.create(document.positionAt(node.offset), document.positionAt(node.offset + node.length));
        }
        else {
            let overwriteStart = offset - currentWord.length;
            if (overwriteStart > 0 && text[overwriteStart - 1] === '"') {
                overwriteStart--;
            }
            overwriteRange = Range.create(document.positionAt(overwriteStart), position);
        }
        const proposed = {};
        const collector = {
            add: (suggestion) => {
                let label = suggestion.label;
                const existing = proposed[label];
                if (!existing) {
                    label = label.replace(/[\n]/g, '↵');
                    if (label.length > 60) {
                        const shortendedLabel = label.substr(0, 57).trim() + '...';
                        if (!proposed[shortendedLabel]) {
                            label = shortendedLabel;
                        }
                    }
                    if (overwriteRange && suggestion.insertText !== undefined) {
                        suggestion.textEdit = TextEdit.replace(overwriteRange, suggestion.insertText);
                    }
                    suggestion.label = label;
                    proposed[label] = suggestion;
                    result.items.push(suggestion);
                }
                else {
                    if (!existing.documentation) {
                        existing.documentation = suggestion.documentation;
                    }
                    if (!existing.detail) {
                        existing.detail = suggestion.detail;
                    }
                }
            },
            setAsIncomplete: () => {
                result.isIncomplete = true;
            },
            error: (message) => {
                console.error(message);
            },
            log: (message) => {
                console.log(message);
            },
            getNumberOfProposals: () => {
                return result.items.length;
            }
        };
        return this.schemaService.getSchemaForResource(document.uri, doc).then((schema) => {
            const collectionPromises = [];
            let addValue = true;
            let currentKey = '';
            let currentProperty = undefined;
            if (node) {
                if (node.type === 'string') {
                    const parent = node.parent;
                    if (parent && parent.type === 'property' && parent.keyNode === node) {
                        addValue = !parent.valueNode;
                        currentProperty = parent;
                        currentKey = text.substr(node.offset + 1, node.length - 2);
                        if (parent) {
                            node = parent.parent;
                        }
                    }
                }
            }
            // proposals for properties
            if (node && node.type === 'object') {
                // don't suggest keys when the cursor is just before the opening curly brace
                if (node.offset === offset) {
                    return result;
                }
                // don't suggest properties that are already present
                const properties = node.properties;
                properties.forEach(p => {
                    if (!currentProperty || currentProperty !== p) {
                        proposed[p.keyNode.value] = CompletionItem.create('__');
                    }
                });
                let separatorAfter = '';
                if (addValue) {
                    separatorAfter = this.evaluateSeparatorAfter(document, document.offsetAt(overwriteRange.end));
                }
                if (schema) {
                    // property proposals with schema
                    this.getPropertyCompletions(schema, doc, node, addValue, separatorAfter, collector);
                }
                else {
                    // property proposals without schema
                    this.getSchemaLessPropertyCompletions(doc, node, currentKey, collector);
                }
                const location = getNodePath(node);
                this.contributions.forEach((contribution) => {
                    const collectPromise = contribution.collectPropertyCompletions(document.uri, location, currentWord, addValue, separatorAfter === '', collector);
                    if (collectPromise) {
                        collectionPromises.push(collectPromise);
                    }
                });
                if ((!schema && currentWord.length > 0 && text.charAt(offset - currentWord.length - 1) !== '"')) {
                    collector.add({
                        kind: CompletionItemKind.Property,
                        label: this.getLabelForValue(currentWord),
                        insertText: this.getInsertTextForProperty(currentWord, undefined, false, separatorAfter),
                        insertTextFormat: InsertTextFormat.Snippet, documentation: '',
                    });
                    collector.setAsIncomplete();
                }
            }
            // proposals for values
            const types = {};
            if (schema) {
                // value proposals with schema
                this.getValueCompletions(schema, doc, node, offset, document, collector, types);
            }
            else {
                // value proposals without schema
                this.getSchemaLessValueCompletions(doc, node, offset, document, collector);
            }
            if (this.contributions.length > 0) {
                this.getContributedValueCompletions(doc, node, offset, document, collector, collectionPromises);
            }
            return this.promiseConstructor.all(collectionPromises).then(() => {
                if (collector.getNumberOfProposals() === 0) {
                    let offsetForSeparator = offset;
                    if (node && (node.type === 'string' || node.type === 'number' || node.type === 'boolean' || node.type === 'null')) {
                        offsetForSeparator = node.offset + node.length;
                    }
                    const separatorAfter = this.evaluateSeparatorAfter(document, offsetForSeparator);
                    this.addFillerValueCompletions(types, separatorAfter, collector);
                }
                return result;
            });
        });
    }
    getPropertyCompletions(schema, doc, node, addValue, separatorAfter, collector) {
        const matchingSchemas = doc.getMatchingSchemas(schema.schema, node.offset);
        matchingSchemas.forEach((s) => {
            if (s.node === node && !s.inverted) {
                const schemaProperties = s.schema.properties;
                if (schemaProperties) {
                    Object.keys(schemaProperties).forEach((key) => {
                        const propertySchema = schemaProperties[key];
                        if (typeof propertySchema === 'object' && !propertySchema.deprecationMessage && !propertySchema.doNotSuggest) {
                            const proposal = {
                                kind: CompletionItemKind.Property,
                                label: key,
                                insertText: this.getInsertTextForProperty(key, propertySchema, addValue, separatorAfter),
                                insertTextFormat: InsertTextFormat.Snippet,
                                filterText: this.getFilterTextForValue(key),
                                documentation: this.fromMarkup(propertySchema.markdownDescription) || propertySchema.description || '',
                            };
                            if (propertySchema.suggestSortText !== undefined) {
                                proposal.sortText = propertySchema.suggestSortText;
                            }
                            if (proposal.insertText && endsWith(proposal.insertText, `$1${separatorAfter}`)) {
                                proposal.command = {
                                    title: 'Suggest',
                                    command: 'editor.action.triggerSuggest'
                                };
                            }
                            collector.add(proposal);
                        }
                    });
                }
                const schemaPropertyNames = s.schema.propertyNames;
                if (typeof schemaPropertyNames === 'object' && !schemaPropertyNames.deprecationMessage && !schemaPropertyNames.doNotSuggest) {
                    const propertyNameCompletionItem = (name, enumDescription = undefined) => {
                        const proposal = {
                            kind: CompletionItemKind.Property,
                            label: name,
                            insertText: this.getInsertTextForProperty(name, undefined, addValue, separatorAfter),
                            insertTextFormat: InsertTextFormat.Snippet,
                            filterText: this.getFilterTextForValue(name),
                            documentation: enumDescription || this.fromMarkup(schemaPropertyNames.markdownDescription) || schemaPropertyNames.description || '',
                        };
                        if (schemaPropertyNames.suggestSortText !== undefined) {
                            proposal.sortText = schemaPropertyNames.suggestSortText;
                        }
                        if (proposal.insertText && endsWith(proposal.insertText, `$1${separatorAfter}`)) {
                            proposal.command = {
                                title: 'Suggest',
                                command: 'editor.action.triggerSuggest'
                            };
                        }
                        collector.add(proposal);
                    };
                    if (schemaPropertyNames.enum) {
                        for (let i = 0; i < schemaPropertyNames.enum.length; i++) {
                            let enumDescription = undefined;
                            if (schemaPropertyNames.markdownEnumDescriptions && i < schemaPropertyNames.markdownEnumDescriptions.length) {
                                enumDescription = this.fromMarkup(schemaPropertyNames.markdownEnumDescriptions[i]);
                            }
                            else if (schemaPropertyNames.enumDescriptions && i < schemaPropertyNames.enumDescriptions.length) {
                                enumDescription = schemaPropertyNames.enumDescriptions[i];
                            }
                            propertyNameCompletionItem(schemaPropertyNames.enum[i], enumDescription);
                        }
                    }
                    if (schemaPropertyNames.const) {
                        propertyNameCompletionItem(schemaPropertyNames.const);
                    }
                }
            }
        });
    }
    getSchemaLessPropertyCompletions(doc, node, currentKey, collector) {
        const collectCompletionsForSimilarObject = (obj) => {
            obj.properties.forEach((p) => {
                const key = p.keyNode.value;
                collector.add({
                    kind: CompletionItemKind.Property,
                    label: key,
                    insertText: this.getInsertTextForValue(key, ''),
                    insertTextFormat: InsertTextFormat.Snippet,
                    filterText: this.getFilterTextForValue(key),
                    documentation: ''
                });
            });
        };
        if (node.parent) {
            if (node.parent.type === 'property') {
                // if the object is a property value, check the tree for other objects that hang under a property of the same name
                const parentKey = node.parent.keyNode.value;
                doc.visit(n => {
                    if (n.type === 'property' && n !== node.parent && n.keyNode.value === parentKey && n.valueNode && n.valueNode.type === 'object') {
                        collectCompletionsForSimilarObject(n.valueNode);
                    }
                    return true;
                });
            }
            else if (node.parent.type === 'array') {
                // if the object is in an array, use all other array elements as similar objects
                node.parent.items.forEach(n => {
                    if (n.type === 'object' && n !== node) {
                        collectCompletionsForSimilarObject(n);
                    }
                });
            }
        }
        else if (node.type === 'object') {
            collector.add({
                kind: CompletionItemKind.Property,
                label: '$schema',
                insertText: this.getInsertTextForProperty('$schema', undefined, true, ''),
                insertTextFormat: InsertTextFormat.Snippet, documentation: '',
                filterText: this.getFilterTextForValue("$schema")
            });
        }
    }
    getSchemaLessValueCompletions(doc, node, offset, document, collector) {
        let offsetForSeparator = offset;
        if (node && (node.type === 'string' || node.type === 'number' || node.type === 'boolean' || node.type === 'null')) {
            offsetForSeparator = node.offset + node.length;
            node = node.parent;
        }
        if (!node) {
            collector.add({
                kind: this.getSuggestionKind('object'),
                label: 'Empty object',
                insertText: this.getInsertTextForValue({}, ''),
                insertTextFormat: InsertTextFormat.Snippet,
                documentation: ''
            });
            collector.add({
                kind: this.getSuggestionKind('array'),
                label: 'Empty array',
                insertText: this.getInsertTextForValue([], ''),
                insertTextFormat: InsertTextFormat.Snippet,
                documentation: ''
            });
            return;
        }
        const separatorAfter = this.evaluateSeparatorAfter(document, offsetForSeparator);
        const collectSuggestionsForValues = (value) => {
            if (value.parent && !contains(value.parent, offset, true)) {
                collector.add({
                    kind: this.getSuggestionKind(value.type),
                    label: this.getLabelTextForMatchingNode(value, document),
                    insertText: this.getInsertTextForMatchingNode(value, document, separatorAfter),
                    insertTextFormat: InsertTextFormat.Snippet, documentation: ''
                });
            }
            if (value.type === 'boolean') {
                this.addBooleanValueCompletion(!value.value, separatorAfter, collector);
            }
        };
        if (node.type === 'property') {
            if (offset > (node.colonOffset || 0)) {
                const valueNode = node.valueNode;
                if (valueNode && (offset > (valueNode.offset + valueNode.length) || valueNode.type === 'object' || valueNode.type === 'array')) {
                    return;
                }
                // suggest values at the same key
                const parentKey = node.keyNode.value;
                doc.visit(n => {
                    if (n.type === 'property' && n.keyNode.value === parentKey && n.valueNode) {
                        collectSuggestionsForValues(n.valueNode);
                    }
                    return true;
                });
                if (parentKey === '$schema' && node.parent && !node.parent.parent) {
                    this.addDollarSchemaCompletions(separatorAfter, collector);
                }
            }
        }
        if (node.type === 'array') {
            if (node.parent && node.parent.type === 'property') {
                // suggest items of an array at the same key
                const parentKey = node.parent.keyNode.value;
                doc.visit((n) => {
                    if (n.type === 'property' && n.keyNode.value === parentKey && n.valueNode && n.valueNode.type === 'array') {
                        n.valueNode.items.forEach(collectSuggestionsForValues);
                    }
                    return true;
                });
            }
            else {
                // suggest items in the same array
                node.items.forEach(collectSuggestionsForValues);
            }
        }
    }
    getValueCompletions(schema, doc, node, offset, document, collector, types) {
        let offsetForSeparator = offset;
        let parentKey = undefined;
        let valueNode = undefined;
        if (node && (node.type === 'string' || node.type === 'number' || node.type === 'boolean' || node.type === 'null')) {
            offsetForSeparator = node.offset + node.length;
            valueNode = node;
            node = node.parent;
        }
        if (!node) {
            this.addSchemaValueCompletions(schema.schema, '', collector, types);
            return;
        }
        if ((node.type === 'property') && offset > (node.colonOffset || 0)) {
            const valueNode = node.valueNode;
            if (valueNode && offset > (valueNode.offset + valueNode.length)) {
                return; // we are past the value node
            }
            parentKey = node.keyNode.value;
            node = node.parent;
        }
        if (node && (parentKey !== undefined || node.type === 'array')) {
            const separatorAfter = this.evaluateSeparatorAfter(document, offsetForSeparator);
            const matchingSchemas = doc.getMatchingSchemas(schema.schema, node.offset, valueNode);
            for (const s of matchingSchemas) {
                if (s.node === node && !s.inverted && s.schema) {
                    if (node.type === 'array' && s.schema.items) {
                        if (Array.isArray(s.schema.items)) {
                            const index = this.findItemAtOffset(node, document, offset);
                            if (index < s.schema.items.length) {
                                this.addSchemaValueCompletions(s.schema.items[index], separatorAfter, collector, types);
                            }
                        }
                        else {
                            this.addSchemaValueCompletions(s.schema.items, separatorAfter, collector, types);
                        }
                    }
                    if (parentKey !== undefined) {
                        let propertyMatched = false;
                        if (s.schema.properties) {
                            const propertySchema = s.schema.properties[parentKey];
                            if (propertySchema) {
                                propertyMatched = true;
                                this.addSchemaValueCompletions(propertySchema, separatorAfter, collector, types);
                            }
                        }
                        if (s.schema.patternProperties && !propertyMatched) {
                            for (const pattern of Object.keys(s.schema.patternProperties)) {
                                const regex = extendedRegExp(pattern);
                                if (regex?.test(parentKey)) {
                                    propertyMatched = true;
                                    const propertySchema = s.schema.patternProperties[pattern];
                                    this.addSchemaValueCompletions(propertySchema, separatorAfter, collector, types);
                                }
                            }
                        }
                        if (s.schema.additionalProperties && !propertyMatched) {
                            const propertySchema = s.schema.additionalProperties;
                            this.addSchemaValueCompletions(propertySchema, separatorAfter, collector, types);
                        }
                    }
                }
            }
            if (parentKey === '$schema' && !node.parent) {
                this.addDollarSchemaCompletions(separatorAfter, collector);
            }
            if (types['boolean']) {
                this.addBooleanValueCompletion(true, separatorAfter, collector);
                this.addBooleanValueCompletion(false, separatorAfter, collector);
            }
            if (types['null']) {
                this.addNullValueCompletion(separatorAfter, collector);
            }
        }
    }
    getContributedValueCompletions(doc, node, offset, document, collector, collectionPromises) {
        if (!node) {
            this.contributions.forEach((contribution) => {
                const collectPromise = contribution.collectDefaultCompletions(document.uri, collector);
                if (collectPromise) {
                    collectionPromises.push(collectPromise);
                }
            });
        }
        else {
            if (node.type === 'string' || node.type === 'number' || node.type === 'boolean' || node.type === 'null') {
                node = node.parent;
            }
            if (node && (node.type === 'property') && offset > (node.colonOffset || 0)) {
                const parentKey = node.keyNode.value;
                const valueNode = node.valueNode;
                if ((!valueNode || offset <= (valueNode.offset + valueNode.length)) && node.parent) {
                    const location = getNodePath(node.parent);
                    this.contributions.forEach((contribution) => {
                        const collectPromise = contribution.collectValueCompletions(document.uri, location, parentKey, collector);
                        if (collectPromise) {
                            collectionPromises.push(collectPromise);
                        }
                    });
                }
            }
        }
    }
    addSchemaValueCompletions(schema, separatorAfter, collector, types) {
        if (typeof schema === 'object') {
            this.addEnumValueCompletions(schema, separatorAfter, collector);
            this.addDefaultValueCompletions(schema, separatorAfter, collector);
            this.collectTypes(schema, types);
            if (Array.isArray(schema.allOf)) {
                schema.allOf.forEach(s => this.addSchemaValueCompletions(s, separatorAfter, collector, types));
            }
            if (Array.isArray(schema.anyOf)) {
                schema.anyOf.forEach(s => this.addSchemaValueCompletions(s, separatorAfter, collector, types));
            }
            if (Array.isArray(schema.oneOf)) {
                schema.oneOf.forEach(s => this.addSchemaValueCompletions(s, separatorAfter, collector, types));
            }
        }
    }
    addDefaultValueCompletions(schema, separatorAfter, collector, arrayDepth = 0) {
        let hasProposals = false;
        if (isDefined(schema.default)) {
            let type = schema.type;
            let value = schema.default;
            for (let i = arrayDepth; i > 0; i--) {
                value = [value];
                type = 'array';
            }
            collector.add({
                kind: this.getSuggestionKind(type),
                label: this.getLabelForValue(value),
                insertText: this.getInsertTextForValue(value, separatorAfter),
                insertTextFormat: InsertTextFormat.Snippet,
                detail: localize$3('json.suggest.default', 'Default value')
            });
            hasProposals = true;
        }
        if (Array.isArray(schema.examples)) {
            schema.examples.forEach(example => {
                let type = schema.type;
                let value = example;
                for (let i = arrayDepth; i > 0; i--) {
                    value = [value];
                    type = 'array';
                }
                collector.add({
                    kind: this.getSuggestionKind(type),
                    label: this.getLabelForValue(value),
                    insertText: this.getInsertTextForValue(value, separatorAfter),
                    insertTextFormat: InsertTextFormat.Snippet
                });
                hasProposals = true;
            });
        }
        if (Array.isArray(schema.defaultSnippets)) {
            schema.defaultSnippets.forEach(s => {
                let type = schema.type;
                let value = s.body;
                let label = s.label;
                let insertText;
                let filterText;
                if (isDefined(value)) {
                    schema.type;
                    for (let i = arrayDepth; i > 0; i--) {
                        value = [value];
                    }
                    insertText = this.getInsertTextForSnippetValue(value, separatorAfter);
                    filterText = this.getFilterTextForSnippetValue(value);
                    label = label || this.getLabelForSnippetValue(value);
                }
                else if (typeof s.bodyText === 'string') {
                    let prefix = '', suffix = '', indent = '';
                    for (let i = arrayDepth; i > 0; i--) {
                        prefix = prefix + indent + '[\n';
                        suffix = suffix + '\n' + indent + ']';
                        indent += '\t';
                        type = 'array';
                    }
                    insertText = prefix + indent + s.bodyText.split('\n').join('\n' + indent) + suffix + separatorAfter;
                    label = label || insertText,
                        filterText = insertText.replace(/[\n]/g, ''); // remove new lines
                }
                else {
                    return;
                }
                collector.add({
                    kind: this.getSuggestionKind(type),
                    label,
                    documentation: this.fromMarkup(s.markdownDescription) || s.description,
                    insertText,
                    insertTextFormat: InsertTextFormat.Snippet,
                    filterText
                });
                hasProposals = true;
            });
        }
        if (!hasProposals && typeof schema.items === 'object' && !Array.isArray(schema.items) && arrayDepth < 5 /* beware of recursion */) {
            this.addDefaultValueCompletions(schema.items, separatorAfter, collector, arrayDepth + 1);
        }
    }
    addEnumValueCompletions(schema, separatorAfter, collector) {
        if (isDefined(schema.const)) {
            collector.add({
                kind: this.getSuggestionKind(schema.type),
                label: this.getLabelForValue(schema.const),
                insertText: this.getInsertTextForValue(schema.const, separatorAfter),
                insertTextFormat: InsertTextFormat.Snippet,
                documentation: this.fromMarkup(schema.markdownDescription) || schema.description
            });
        }
        if (Array.isArray(schema.enum)) {
            for (let i = 0, length = schema.enum.length; i < length; i++) {
                const enm = schema.enum[i];
                let documentation = this.fromMarkup(schema.markdownDescription) || schema.description;
                if (schema.markdownEnumDescriptions && i < schema.markdownEnumDescriptions.length && this.doesSupportMarkdown()) {
                    documentation = this.fromMarkup(schema.markdownEnumDescriptions[i]);
                }
                else if (schema.enumDescriptions && i < schema.enumDescriptions.length) {
                    documentation = schema.enumDescriptions[i];
                }
                collector.add({
                    kind: this.getSuggestionKind(schema.type),
                    label: this.getLabelForValue(enm),
                    insertText: this.getInsertTextForValue(enm, separatorAfter),
                    insertTextFormat: InsertTextFormat.Snippet,
                    documentation
                });
            }
        }
    }
    collectTypes(schema, types) {
        if (Array.isArray(schema.enum) || isDefined(schema.const)) {
            return;
        }
        const type = schema.type;
        if (Array.isArray(type)) {
            type.forEach(t => types[t] = true);
        }
        else if (type) {
            types[type] = true;
        }
    }
    addFillerValueCompletions(types, separatorAfter, collector) {
        if (types['object']) {
            collector.add({
                kind: this.getSuggestionKind('object'),
                label: '{}',
                insertText: this.getInsertTextForGuessedValue({}, separatorAfter),
                insertTextFormat: InsertTextFormat.Snippet,
                detail: localize$3('defaults.object', 'New object'),
                documentation: ''
            });
        }
        if (types['array']) {
            collector.add({
                kind: this.getSuggestionKind('array'),
                label: '[]',
                insertText: this.getInsertTextForGuessedValue([], separatorAfter),
                insertTextFormat: InsertTextFormat.Snippet,
                detail: localize$3('defaults.array', 'New array'),
                documentation: ''
            });
        }
    }
    addBooleanValueCompletion(value, separatorAfter, collector) {
        collector.add({
            kind: this.getSuggestionKind('boolean'),
            label: value ? 'true' : 'false',
            insertText: this.getInsertTextForValue(value, separatorAfter),
            insertTextFormat: InsertTextFormat.Snippet,
            documentation: ''
        });
    }
    addNullValueCompletion(separatorAfter, collector) {
        collector.add({
            kind: this.getSuggestionKind('null'),
            label: 'null',
            insertText: 'null' + separatorAfter,
            insertTextFormat: InsertTextFormat.Snippet,
            documentation: ''
        });
    }
    addDollarSchemaCompletions(separatorAfter, collector) {
        const schemaIds = this.schemaService.getRegisteredSchemaIds(schema => schema === 'http' || schema === 'https');
        schemaIds.forEach(schemaId => collector.add({
            kind: CompletionItemKind.Module,
            label: this.getLabelForValue(schemaId),
            filterText: this.getFilterTextForValue(schemaId),
            insertText: this.getInsertTextForValue(schemaId, separatorAfter),
            insertTextFormat: InsertTextFormat.Snippet, documentation: ''
        }));
    }
    getLabelForValue(value) {
        return JSON.stringify(value);
    }
    getFilterTextForValue(value) {
        return JSON.stringify(value);
    }
    getFilterTextForSnippetValue(value) {
        return JSON.stringify(value).replace(/\$\{\d+:([^}]+)\}|\$\d+/g, '$1');
    }
    getLabelForSnippetValue(value) {
        const label = JSON.stringify(value);
        return label.replace(/\$\{\d+:([^}]+)\}|\$\d+/g, '$1');
    }
    getInsertTextForPlainText(text) {
        return text.replace(/[\\\$\}]/g, '\\$&'); // escape $, \ and } 
    }
    getInsertTextForValue(value, separatorAfter) {
        var text = JSON.stringify(value, null, '\t');
        if (text === '{}') {
            return '{$1}' + separatorAfter;
        }
        else if (text === '[]') {
            return '[$1]' + separatorAfter;
        }
        return this.getInsertTextForPlainText(text + separatorAfter);
    }
    getInsertTextForSnippetValue(value, separatorAfter) {
        const replacer = (value) => {
            if (typeof value === 'string') {
                if (value[0] === '^') {
                    return value.substr(1);
                }
            }
            return JSON.stringify(value);
        };
        return stringifyObject(value, '', replacer) + separatorAfter;
    }
    getInsertTextForGuessedValue(value, separatorAfter) {
        switch (typeof value) {
            case 'object':
                if (value === null) {
                    return '${1:null}' + separatorAfter;
                }
                return this.getInsertTextForValue(value, separatorAfter);
            case 'string':
                let snippetValue = JSON.stringify(value);
                snippetValue = snippetValue.substr(1, snippetValue.length - 2); // remove quotes
                snippetValue = this.getInsertTextForPlainText(snippetValue); // escape \ and }
                return '"${1:' + snippetValue + '}"' + separatorAfter;
            case 'number':
            case 'boolean':
                return '${1:' + JSON.stringify(value) + '}' + separatorAfter;
        }
        return this.getInsertTextForValue(value, separatorAfter);
    }
    getSuggestionKind(type) {
        if (Array.isArray(type)) {
            const array = type;
            type = array.length > 0 ? array[0] : undefined;
        }
        if (!type) {
            return CompletionItemKind.Value;
        }
        switch (type) {
            case 'string': return CompletionItemKind.Value;
            case 'object': return CompletionItemKind.Module;
            case 'property': return CompletionItemKind.Property;
            default: return CompletionItemKind.Value;
        }
    }
    getLabelTextForMatchingNode(node, document) {
        switch (node.type) {
            case 'array':
                return '[]';
            case 'object':
                return '{}';
            default:
                const content = document.getText().substr(node.offset, node.length);
                return content;
        }
    }
    getInsertTextForMatchingNode(node, document, separatorAfter) {
        switch (node.type) {
            case 'array':
                return this.getInsertTextForValue([], separatorAfter);
            case 'object':
                return this.getInsertTextForValue({}, separatorAfter);
            default:
                const content = document.getText().substr(node.offset, node.length) + separatorAfter;
                return this.getInsertTextForPlainText(content);
        }
    }
    getInsertTextForProperty(key, propertySchema, addValue, separatorAfter) {
        const propertyText = this.getInsertTextForValue(key, '');
        if (!addValue) {
            return propertyText;
        }
        const resultText = propertyText + ': ';
        let value;
        let nValueProposals = 0;
        if (propertySchema) {
            if (Array.isArray(propertySchema.defaultSnippets)) {
                if (propertySchema.defaultSnippets.length === 1) {
                    const body = propertySchema.defaultSnippets[0].body;
                    if (isDefined(body)) {
                        value = this.getInsertTextForSnippetValue(body, '');
                    }
                }
                nValueProposals += propertySchema.defaultSnippets.length;
            }
            if (propertySchema.enum) {
                if (!value && propertySchema.enum.length === 1) {
                    value = this.getInsertTextForGuessedValue(propertySchema.enum[0], '');
                }
                nValueProposals += propertySchema.enum.length;
            }
            if (isDefined(propertySchema.default)) {
                if (!value) {
                    value = this.getInsertTextForGuessedValue(propertySchema.default, '');
                }
                nValueProposals++;
            }
            if (Array.isArray(propertySchema.examples) && propertySchema.examples.length) {
                if (!value) {
                    value = this.getInsertTextForGuessedValue(propertySchema.examples[0], '');
                }
                nValueProposals += propertySchema.examples.length;
            }
            if (nValueProposals === 0) {
                var type = Array.isArray(propertySchema.type) ? propertySchema.type[0] : propertySchema.type;
                if (!type) {
                    if (propertySchema.properties) {
                        type = 'object';
                    }
                    else if (propertySchema.items) {
                        type = 'array';
                    }
                }
                switch (type) {
                    case 'boolean':
                        value = '$1';
                        break;
                    case 'string':
                        value = '"$1"';
                        break;
                    case 'object':
                        value = '{$1}';
                        break;
                    case 'array':
                        value = '[$1]';
                        break;
                    case 'number':
                    case 'integer':
                        value = '${1:0}';
                        break;
                    case 'null':
                        value = '${1:null}';
                        break;
                    default:
                        return propertyText;
                }
            }
        }
        if (!value || nValueProposals > 1) {
            value = '$1';
        }
        return resultText + value + separatorAfter;
    }
    getCurrentWord(document, offset) {
        var i = offset - 1;
        var text = document.getText();
        while (i >= 0 && ' \t\n\r\v":{[,]}'.indexOf(text.charAt(i)) === -1) {
            i--;
        }
        return text.substring(i + 1, offset);
    }
    evaluateSeparatorAfter(document, offset) {
        const scanner = createScanner(document.getText(), true);
        scanner.setPosition(offset);
        const token = scanner.scan();
        switch (token) {
            case 5 /* CommaToken */:
            case 2 /* CloseBraceToken */:
            case 4 /* CloseBracketToken */:
            case 17 /* EOF */:
                return '';
            default:
                return ',';
        }
    }
    findItemAtOffset(node, document, offset) {
        const scanner = createScanner(document.getText(), true);
        const children = node.items;
        for (let i = children.length - 1; i >= 0; i--) {
            const child = children[i];
            if (offset > child.offset + child.length) {
                scanner.setPosition(child.offset + child.length);
                const token = scanner.scan();
                if (token === 5 /* CommaToken */ && offset >= scanner.getTokenOffset() + scanner.getTokenLength()) {
                    return i + 1;
                }
                return i;
            }
            else if (offset >= child.offset) {
                return i;
            }
        }
        return 0;
    }
    isInComment(document, start, offset) {
        const scanner = createScanner(document.getText(), false);
        scanner.setPosition(start);
        let token = scanner.scan();
        while (token !== 17 /* EOF */ && (scanner.getTokenOffset() + scanner.getTokenLength() < offset)) {
            token = scanner.scan();
        }
        return (token === 12 /* LineCommentTrivia */ || token === 13 /* BlockCommentTrivia */) && scanner.getTokenOffset() <= offset;
    }
    fromMarkup(markupString) {
        if (markupString && this.doesSupportMarkdown()) {
            return {
                kind: MarkupKind.Markdown,
                value: markupString
            };
        }
        return undefined;
    }
    doesSupportMarkdown() {
        if (!isDefined(this.supportsMarkdown)) {
            const completion = this.clientCapabilities.textDocument && this.clientCapabilities.textDocument.completion;
            this.supportsMarkdown = completion && completion.completionItem && Array.isArray(completion.completionItem.documentationFormat) && completion.completionItem.documentationFormat.indexOf(MarkupKind.Markdown) !== -1;
        }
        return this.supportsMarkdown;
    }
    doesSupportsCommitCharacters() {
        if (!isDefined(this.supportsCommitCharacters)) {
            const completion = this.clientCapabilities.textDocument && this.clientCapabilities.textDocument.completion;
            this.supportsCommitCharacters = completion && completion.completionItem && !!completion.completionItem.commitCharactersSupport;
        }
        return this.supportsCommitCharacters;
    }
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
class JSONHover {
    constructor(schemaService, contributions = [], promiseConstructor) {
        this.schemaService = schemaService;
        this.contributions = contributions;
        this.promise = promiseConstructor || Promise;
    }
    doHover(document, position, doc) {
        const offset = document.offsetAt(position);
        let node = doc.getNodeFromOffset(offset);
        if (!node || (node.type === 'object' || node.type === 'array') && offset > node.offset + 1 && offset < node.offset + node.length - 1) {
            return this.promise.resolve(null);
        }
        const hoverRangeNode = node;
        // use the property description when hovering over an object key
        if (node.type === 'string') {
            const parent = node.parent;
            if (parent && parent.type === 'property' && parent.keyNode === node) {
                node = parent.valueNode;
                if (!node) {
                    return this.promise.resolve(null);
                }
            }
        }
        const hoverRange = Range.create(document.positionAt(hoverRangeNode.offset), document.positionAt(hoverRangeNode.offset + hoverRangeNode.length));
        var createHover = (contents) => {
            const result = {
                contents: contents,
                range: hoverRange
            };
            return result;
        };
        const location = getNodePath(node);
        for (let i = this.contributions.length - 1; i >= 0; i--) {
            const contribution = this.contributions[i];
            const promise = contribution.getInfoContribution(document.uri, location);
            if (promise) {
                return promise.then(htmlContent => createHover(htmlContent));
            }
        }
        return this.schemaService.getSchemaForResource(document.uri, doc).then((schema) => {
            if (schema && node) {
                const matchingSchemas = doc.getMatchingSchemas(schema.schema, node.offset);
                let title = undefined;
                let markdownDescription = undefined;
                let markdownEnumValueDescription = undefined, enumValue = undefined;
                matchingSchemas.every((s) => {
                    if (s.node === node && !s.inverted && s.schema) {
                        title = title || s.schema.title;
                        markdownDescription = markdownDescription || s.schema.markdownDescription || toMarkdown(s.schema.description);
                        if (s.schema.enum) {
                            const idx = s.schema.enum.indexOf(getNodeValue(node));
                            if (s.schema.markdownEnumDescriptions) {
                                markdownEnumValueDescription = s.schema.markdownEnumDescriptions[idx];
                            }
                            else if (s.schema.enumDescriptions) {
                                markdownEnumValueDescription = toMarkdown(s.schema.enumDescriptions[idx]);
                            }
                            if (markdownEnumValueDescription) {
                                enumValue = s.schema.enum[idx];
                                if (typeof enumValue !== 'string') {
                                    enumValue = JSON.stringify(enumValue);
                                }
                            }
                        }
                    }
                    return true;
                });
                let result = '';
                if (title) {
                    result = toMarkdown(title);
                }
                if (markdownDescription) {
                    if (result.length > 0) {
                        result += "\n\n";
                    }
                    result += markdownDescription;
                }
                if (markdownEnumValueDescription) {
                    if (result.length > 0) {
                        result += "\n\n";
                    }
                    result += `\`${toMarkdownCodeBlock(enumValue)}\`: ${markdownEnumValueDescription}`;
                }
                return createHover([result]);
            }
            return null;
        });
    }
}
function toMarkdown(plain) {
    if (plain) {
        const res = plain.replace(/([^\n\r])(\r?\n)([^\n\r])/gm, '$1\n\n$3'); // single new lines to \n\n (Markdown paragraph)
        return res.replace(/[\\`*_{}[\]()#+\-.!]/g, "\\$&"); // escape markdown syntax tokens: http://daringfireball.net/projects/markdown/syntax#backslash
    }
    return undefined;
}
function toMarkdownCodeBlock(content) {
    // see https://daringfireball.net/projects/markdown/syntax#precode
    if (content.indexOf('`') !== -1) {
        return '`` ' + content + ' ``';
    }
    return content;
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const localize$2 = main.loadMessageBundle();
class JSONValidation {
    constructor(jsonSchemaService, promiseConstructor) {
        this.jsonSchemaService = jsonSchemaService;
        this.promise = promiseConstructor;
        this.validationEnabled = true;
    }
    configure(raw) {
        if (raw) {
            this.validationEnabled = raw.validate !== false;
            this.commentSeverity = raw.allowComments ? undefined : DiagnosticSeverity.Error;
        }
    }
    doValidation(textDocument, jsonDocument, documentSettings, schema) {
        if (!this.validationEnabled) {
            return this.promise.resolve([]);
        }
        const diagnostics = [];
        const added = {};
        const addProblem = (problem) => {
            // remove duplicated messages
            const signature = problem.range.start.line + ' ' + problem.range.start.character + ' ' + problem.message;
            if (!added[signature]) {
                added[signature] = true;
                diagnostics.push(problem);
            }
        };
        const getDiagnostics = (schema) => {
            let trailingCommaSeverity = documentSettings?.trailingCommas ? toDiagnosticSeverity(documentSettings.trailingCommas) : DiagnosticSeverity.Error;
            let commentSeverity = documentSettings?.comments ? toDiagnosticSeverity(documentSettings.comments) : this.commentSeverity;
            let schemaValidation = documentSettings?.schemaValidation ? toDiagnosticSeverity(documentSettings.schemaValidation) : DiagnosticSeverity.Warning;
            let schemaRequest = documentSettings?.schemaRequest ? toDiagnosticSeverity(documentSettings.schemaRequest) : DiagnosticSeverity.Warning;
            if (schema) {
                const addSchemaProblem = (errorMessage, errorCode) => {
                    if (jsonDocument.root && schemaRequest) {
                        const astRoot = jsonDocument.root;
                        const property = astRoot.type === 'object' ? astRoot.properties[0] : undefined;
                        if (property && property.keyNode.value === '$schema') {
                            const node = property.valueNode || property;
                            const range = Range.create(textDocument.positionAt(node.offset), textDocument.positionAt(node.offset + node.length));
                            addProblem(Diagnostic.create(range, errorMessage, schemaRequest, errorCode));
                        }
                        else {
                            const range = Range.create(textDocument.positionAt(astRoot.offset), textDocument.positionAt(astRoot.offset + 1));
                            addProblem(Diagnostic.create(range, errorMessage, schemaRequest, errorCode));
                        }
                    }
                };
                if (schema.errors.length) {
                    addSchemaProblem(schema.errors[0], ErrorCode.SchemaResolveError);
                }
                else if (schemaValidation) {
                    for (const warning of schema.warnings) {
                        addSchemaProblem(warning, ErrorCode.SchemaUnsupportedFeature);
                    }
                    const semanticErrors = jsonDocument.validate(textDocument, schema.schema, schemaValidation);
                    if (semanticErrors) {
                        semanticErrors.forEach(addProblem);
                    }
                }
                if (schemaAllowsComments(schema.schema)) {
                    commentSeverity = undefined;
                }
                if (schemaAllowsTrailingCommas(schema.schema)) {
                    trailingCommaSeverity = undefined;
                }
            }
            for (const p of jsonDocument.syntaxErrors) {
                if (p.code === ErrorCode.TrailingComma) {
                    if (typeof trailingCommaSeverity !== 'number') {
                        continue;
                    }
                    p.severity = trailingCommaSeverity;
                }
                addProblem(p);
            }
            if (typeof commentSeverity === 'number') {
                const message = localize$2('InvalidCommentToken', 'Comments are not permitted in JSON.');
                jsonDocument.comments.forEach(c => {
                    addProblem(Diagnostic.create(c, message, commentSeverity, ErrorCode.CommentNotPermitted));
                });
            }
            return diagnostics;
        };
        if (schema) {
            const id = schema.id || ('schemaservice://untitled/' + idCounter$1++);
            const handle = this.jsonSchemaService.registerExternalSchema(id, [], schema);
            return handle.getResolvedSchema().then(resolvedSchema => {
                return getDiagnostics(resolvedSchema);
            });
        }
        return this.jsonSchemaService.getSchemaForResource(textDocument.uri, jsonDocument).then(schema => {
            return getDiagnostics(schema);
        });
    }
    getLanguageStatus(textDocument, jsonDocument) {
        return { schemas: this.jsonSchemaService.getSchemaURIsForResource(textDocument.uri, jsonDocument) };
    }
}
let idCounter$1 = 0;
function schemaAllowsComments(schemaRef) {
    if (schemaRef && typeof schemaRef === 'object') {
        if (isBoolean(schemaRef.allowComments)) {
            return schemaRef.allowComments;
        }
        if (schemaRef.allOf) {
            for (const schema of schemaRef.allOf) {
                const allow = schemaAllowsComments(schema);
                if (isBoolean(allow)) {
                    return allow;
                }
            }
        }
    }
    return undefined;
}
function schemaAllowsTrailingCommas(schemaRef) {
    if (schemaRef && typeof schemaRef === 'object') {
        if (isBoolean(schemaRef.allowTrailingCommas)) {
            return schemaRef.allowTrailingCommas;
        }
        const deprSchemaRef = schemaRef;
        if (isBoolean(deprSchemaRef['allowsTrailingCommas'])) { // deprecated
            return deprSchemaRef['allowsTrailingCommas'];
        }
        if (schemaRef.allOf) {
            for (const schema of schemaRef.allOf) {
                const allow = schemaAllowsTrailingCommas(schema);
                if (isBoolean(allow)) {
                    return allow;
                }
            }
        }
    }
    return undefined;
}
function toDiagnosticSeverity(severityLevel) {
    switch (severityLevel) {
        case 'error': return DiagnosticSeverity.Error;
        case 'warning': return DiagnosticSeverity.Warning;
        case 'ignore': return undefined;
    }
    return undefined;
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const Digit0 = 48;
const Digit9 = 57;
const A = 65;
const a = 97;
const f = 102;
function hexDigit(charCode) {
    if (charCode < Digit0) {
        return 0;
    }
    if (charCode <= Digit9) {
        return charCode - Digit0;
    }
    if (charCode < a) {
        charCode += (a - A);
    }
    if (charCode >= a && charCode <= f) {
        return charCode - a + 10;
    }
    return 0;
}
function colorFromHex(text) {
    if (text[0] !== '#') {
        return undefined;
    }
    switch (text.length) {
        case 4:
            return {
                red: (hexDigit(text.charCodeAt(1)) * 0x11) / 255.0,
                green: (hexDigit(text.charCodeAt(2)) * 0x11) / 255.0,
                blue: (hexDigit(text.charCodeAt(3)) * 0x11) / 255.0,
                alpha: 1
            };
        case 5:
            return {
                red: (hexDigit(text.charCodeAt(1)) * 0x11) / 255.0,
                green: (hexDigit(text.charCodeAt(2)) * 0x11) / 255.0,
                blue: (hexDigit(text.charCodeAt(3)) * 0x11) / 255.0,
                alpha: (hexDigit(text.charCodeAt(4)) * 0x11) / 255.0,
            };
        case 7:
            return {
                red: (hexDigit(text.charCodeAt(1)) * 0x10 + hexDigit(text.charCodeAt(2))) / 255.0,
                green: (hexDigit(text.charCodeAt(3)) * 0x10 + hexDigit(text.charCodeAt(4))) / 255.0,
                blue: (hexDigit(text.charCodeAt(5)) * 0x10 + hexDigit(text.charCodeAt(6))) / 255.0,
                alpha: 1
            };
        case 9:
            return {
                red: (hexDigit(text.charCodeAt(1)) * 0x10 + hexDigit(text.charCodeAt(2))) / 255.0,
                green: (hexDigit(text.charCodeAt(3)) * 0x10 + hexDigit(text.charCodeAt(4))) / 255.0,
                blue: (hexDigit(text.charCodeAt(5)) * 0x10 + hexDigit(text.charCodeAt(6))) / 255.0,
                alpha: (hexDigit(text.charCodeAt(7)) * 0x10 + hexDigit(text.charCodeAt(8))) / 255.0
            };
    }
    return undefined;
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
class JSONDocumentSymbols {
    constructor(schemaService) {
        this.schemaService = schemaService;
    }
    findDocumentSymbols(document, doc, context = { resultLimit: Number.MAX_VALUE }) {
        const root = doc.root;
        if (!root) {
            return [];
        }
        let limit = context.resultLimit || Number.MAX_VALUE;
        // special handling for key bindings
        const resourceString = document.uri;
        if ((resourceString === 'vscode://defaultsettings/keybindings.json') || endsWith(resourceString.toLowerCase(), '/user/keybindings.json')) {
            if (root.type === 'array') {
                const result = [];
                for (const item of root.items) {
                    if (item.type === 'object') {
                        for (const property of item.properties) {
                            if (property.keyNode.value === 'key' && property.valueNode) {
                                const location = Location.create(document.uri, getRange(document, item));
                                result.push({ name: getNodeValue(property.valueNode), kind: SymbolKind.Function, location: location });
                                limit--;
                                if (limit <= 0) {
                                    if (context && context.onResultLimitExceeded) {
                                        context.onResultLimitExceeded(resourceString);
                                    }
                                    return result;
                                }
                            }
                        }
                    }
                }
                return result;
            }
        }
        const toVisit = [
            { node: root, containerName: '' }
        ];
        let nextToVisit = 0;
        let limitExceeded = false;
        const result = [];
        const collectOutlineEntries = (node, containerName) => {
            if (node.type === 'array') {
                node.items.forEach(node => {
                    if (node) {
                        toVisit.push({ node, containerName });
                    }
                });
            }
            else if (node.type === 'object') {
                node.properties.forEach((property) => {
                    const valueNode = property.valueNode;
                    if (valueNode) {
                        if (limit > 0) {
                            limit--;
                            const location = Location.create(document.uri, getRange(document, property));
                            const childContainerName = containerName ? containerName + '.' + property.keyNode.value : property.keyNode.value;
                            result.push({ name: this.getKeyLabel(property), kind: this.getSymbolKind(valueNode.type), location: location, containerName: containerName });
                            toVisit.push({ node: valueNode, containerName: childContainerName });
                        }
                        else {
                            limitExceeded = true;
                        }
                    }
                });
            }
        };
        // breath first traversal
        while (nextToVisit < toVisit.length) {
            const next = toVisit[nextToVisit++];
            collectOutlineEntries(next.node, next.containerName);
        }
        if (limitExceeded && context && context.onResultLimitExceeded) {
            context.onResultLimitExceeded(resourceString);
        }
        return result;
    }
    findDocumentSymbols2(document, doc, context = { resultLimit: Number.MAX_VALUE }) {
        const root = doc.root;
        if (!root) {
            return [];
        }
        let limit = context.resultLimit || Number.MAX_VALUE;
        // special handling for key bindings
        const resourceString = document.uri;
        if ((resourceString === 'vscode://defaultsettings/keybindings.json') || endsWith(resourceString.toLowerCase(), '/user/keybindings.json')) {
            if (root.type === 'array') {
                const result = [];
                for (const item of root.items) {
                    if (item.type === 'object') {
                        for (const property of item.properties) {
                            if (property.keyNode.value === 'key' && property.valueNode) {
                                const range = getRange(document, item);
                                const selectionRange = getRange(document, property.keyNode);
                                result.push({ name: getNodeValue(property.valueNode), kind: SymbolKind.Function, range, selectionRange });
                                limit--;
                                if (limit <= 0) {
                                    if (context && context.onResultLimitExceeded) {
                                        context.onResultLimitExceeded(resourceString);
                                    }
                                    return result;
                                }
                            }
                        }
                    }
                }
                return result;
            }
        }
        const result = [];
        const toVisit = [
            { node: root, result }
        ];
        let nextToVisit = 0;
        let limitExceeded = false;
        const collectOutlineEntries = (node, result) => {
            if (node.type === 'array') {
                node.items.forEach((node, index) => {
                    if (node) {
                        if (limit > 0) {
                            limit--;
                            const range = getRange(document, node);
                            const selectionRange = range;
                            const name = String(index);
                            const symbol = { name, kind: this.getSymbolKind(node.type), range, selectionRange, children: [] };
                            result.push(symbol);
                            toVisit.push({ result: symbol.children, node });
                        }
                        else {
                            limitExceeded = true;
                        }
                    }
                });
            }
            else if (node.type === 'object') {
                node.properties.forEach((property) => {
                    const valueNode = property.valueNode;
                    if (valueNode) {
                        if (limit > 0) {
                            limit--;
                            const range = getRange(document, property);
                            const selectionRange = getRange(document, property.keyNode);
                            const children = [];
                            const symbol = { name: this.getKeyLabel(property), kind: this.getSymbolKind(valueNode.type), range, selectionRange, children, detail: this.getDetail(valueNode) };
                            result.push(symbol);
                            toVisit.push({ result: children, node: valueNode });
                        }
                        else {
                            limitExceeded = true;
                        }
                    }
                });
            }
        };
        // breath first traversal
        while (nextToVisit < toVisit.length) {
            const next = toVisit[nextToVisit++];
            collectOutlineEntries(next.node, next.result);
        }
        if (limitExceeded && context && context.onResultLimitExceeded) {
            context.onResultLimitExceeded(resourceString);
        }
        return result;
    }
    getSymbolKind(nodeType) {
        switch (nodeType) {
            case 'object':
                return SymbolKind.Module;
            case 'string':
                return SymbolKind.String;
            case 'number':
                return SymbolKind.Number;
            case 'array':
                return SymbolKind.Array;
            case 'boolean':
                return SymbolKind.Boolean;
            default: // 'null'
                return SymbolKind.Variable;
        }
    }
    getKeyLabel(property) {
        let name = property.keyNode.value;
        if (name) {
            name = name.replace(/[\n]/g, '↵');
        }
        if (name && name.trim()) {
            return name;
        }
        return `"${name}"`;
    }
    getDetail(node) {
        if (!node) {
            return undefined;
        }
        if (node.type === 'boolean' || node.type === 'number' || node.type === 'null' || node.type === 'string') {
            return String(node.value);
        }
        else {
            if (node.type === 'array') {
                return node.children.length ? undefined : '[]';
            }
            else if (node.type === 'object') {
                return node.children.length ? undefined : '{}';
            }
        }
        return undefined;
    }
    findDocumentColors(document, doc, context) {
        return this.schemaService.getSchemaForResource(document.uri, doc).then(schema => {
            const result = [];
            if (schema) {
                let limit = context && typeof context.resultLimit === 'number' ? context.resultLimit : Number.MAX_VALUE;
                const matchingSchemas = doc.getMatchingSchemas(schema.schema);
                const visitedNode = {};
                for (const s of matchingSchemas) {
                    if (!s.inverted && s.schema && (s.schema.format === 'color' || s.schema.format === 'color-hex') && s.node && s.node.type === 'string') {
                        const nodeId = String(s.node.offset);
                        if (!visitedNode[nodeId]) {
                            const color = colorFromHex(getNodeValue(s.node));
                            if (color) {
                                const range = getRange(document, s.node);
                                result.push({ color, range });
                            }
                            visitedNode[nodeId] = true;
                            limit--;
                            if (limit <= 0) {
                                if (context && context.onResultLimitExceeded) {
                                    context.onResultLimitExceeded(document.uri);
                                }
                                return result;
                            }
                        }
                    }
                }
            }
            return result;
        });
    }
    getColorPresentations(document, doc, color, range) {
        const result = [];
        const red256 = Math.round(color.red * 255), green256 = Math.round(color.green * 255), blue256 = Math.round(color.blue * 255);
        function toTwoDigitHex(n) {
            const r = n.toString(16);
            return r.length !== 2 ? '0' + r : r;
        }
        let label;
        if (color.alpha === 1) {
            label = `#${toTwoDigitHex(red256)}${toTwoDigitHex(green256)}${toTwoDigitHex(blue256)}`;
        }
        else {
            label = `#${toTwoDigitHex(red256)}${toTwoDigitHex(green256)}${toTwoDigitHex(blue256)}${toTwoDigitHex(Math.round(color.alpha * 255))}`;
        }
        result.push({ label: label, textEdit: TextEdit.replace(range, JSON.stringify(label)) });
        return result;
    }
}
function getRange(document, node) {
    return Range.create(document.positionAt(node.offset), document.positionAt(node.offset + node.length));
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const localize$1 = main.loadMessageBundle();
const schemaContributions = {
    schemaAssociations: [],
    schemas: {
        // refer to the latest schema
        'http://json-schema.org/schema#': {
            $ref: 'http://json-schema.org/draft-07/schema#'
        },
        // bundle the schema-schema to include (localized) descriptions
        'http://json-schema.org/draft-04/schema#': {
            '$schema': 'http://json-schema.org/draft-04/schema#',
            'definitions': {
                'schemaArray': {
                    'type': 'array',
                    'minItems': 1,
                    'items': {
                        '$ref': '#'
                    }
                },
                'positiveInteger': {
                    'type': 'integer',
                    'minimum': 0
                },
                'positiveIntegerDefault0': {
                    'allOf': [
                        {
                            '$ref': '#/definitions/positiveInteger'
                        },
                        {
                            'default': 0
                        }
                    ]
                },
                'simpleTypes': {
                    'type': 'string',
                    'enum': [
                        'array',
                        'boolean',
                        'integer',
                        'null',
                        'number',
                        'object',
                        'string'
                    ]
                },
                'stringArray': {
                    'type': 'array',
                    'items': {
                        'type': 'string'
                    },
                    'minItems': 1,
                    'uniqueItems': true
                }
            },
            'type': 'object',
            'properties': {
                'id': {
                    'type': 'string',
                    'format': 'uri'
                },
                '$schema': {
                    'type': 'string',
                    'format': 'uri'
                },
                'title': {
                    'type': 'string'
                },
                'description': {
                    'type': 'string'
                },
                'default': {},
                'multipleOf': {
                    'type': 'number',
                    'minimum': 0,
                    'exclusiveMinimum': true
                },
                'maximum': {
                    'type': 'number'
                },
                'exclusiveMaximum': {
                    'type': 'boolean',
                    'default': false
                },
                'minimum': {
                    'type': 'number'
                },
                'exclusiveMinimum': {
                    'type': 'boolean',
                    'default': false
                },
                'maxLength': {
                    'allOf': [
                        {
                            '$ref': '#/definitions/positiveInteger'
                        }
                    ]
                },
                'minLength': {
                    'allOf': [
                        {
                            '$ref': '#/definitions/positiveIntegerDefault0'
                        }
                    ]
                },
                'pattern': {
                    'type': 'string',
                    'format': 'regex'
                },
                'additionalItems': {
                    'anyOf': [
                        {
                            'type': 'boolean'
                        },
                        {
                            '$ref': '#'
                        }
                    ],
                    'default': {}
                },
                'items': {
                    'anyOf': [
                        {
                            '$ref': '#'
                        },
                        {
                            '$ref': '#/definitions/schemaArray'
                        }
                    ],
                    'default': {}
                },
                'maxItems': {
                    'allOf': [
                        {
                            '$ref': '#/definitions/positiveInteger'
                        }
                    ]
                },
                'minItems': {
                    'allOf': [
                        {
                            '$ref': '#/definitions/positiveIntegerDefault0'
                        }
                    ]
                },
                'uniqueItems': {
                    'type': 'boolean',
                    'default': false
                },
                'maxProperties': {
                    'allOf': [
                        {
                            '$ref': '#/definitions/positiveInteger'
                        }
                    ]
                },
                'minProperties': {
                    'allOf': [
                        {
                            '$ref': '#/definitions/positiveIntegerDefault0'
                        }
                    ]
                },
                'required': {
                    'allOf': [
                        {
                            '$ref': '#/definitions/stringArray'
                        }
                    ]
                },
                'additionalProperties': {
                    'anyOf': [
                        {
                            'type': 'boolean'
                        },
                        {
                            '$ref': '#'
                        }
                    ],
                    'default': {}
                },
                'definitions': {
                    'type': 'object',
                    'additionalProperties': {
                        '$ref': '#'
                    },
                    'default': {}
                },
                'properties': {
                    'type': 'object',
                    'additionalProperties': {
                        '$ref': '#'
                    },
                    'default': {}
                },
                'patternProperties': {
                    'type': 'object',
                    'additionalProperties': {
                        '$ref': '#'
                    },
                    'default': {}
                },
                'dependencies': {
                    'type': 'object',
                    'additionalProperties': {
                        'anyOf': [
                            {
                                '$ref': '#'
                            },
                            {
                                '$ref': '#/definitions/stringArray'
                            }
                        ]
                    }
                },
                'enum': {
                    'type': 'array',
                    'minItems': 1,
                    'uniqueItems': true
                },
                'type': {
                    'anyOf': [
                        {
                            '$ref': '#/definitions/simpleTypes'
                        },
                        {
                            'type': 'array',
                            'items': {
                                '$ref': '#/definitions/simpleTypes'
                            },
                            'minItems': 1,
                            'uniqueItems': true
                        }
                    ]
                },
                'format': {
                    'anyOf': [
                        {
                            'type': 'string',
                            'enum': [
                                'date-time',
                                'uri',
                                'email',
                                'hostname',
                                'ipv4',
                                'ipv6',
                                'regex'
                            ]
                        },
                        {
                            'type': 'string'
                        }
                    ]
                },
                'allOf': {
                    'allOf': [
                        {
                            '$ref': '#/definitions/schemaArray'
                        }
                    ]
                },
                'anyOf': {
                    'allOf': [
                        {
                            '$ref': '#/definitions/schemaArray'
                        }
                    ]
                },
                'oneOf': {
                    'allOf': [
                        {
                            '$ref': '#/definitions/schemaArray'
                        }
                    ]
                },
                'not': {
                    'allOf': [
                        {
                            '$ref': '#'
                        }
                    ]
                }
            },
            'dependencies': {
                'exclusiveMaximum': [
                    'maximum'
                ],
                'exclusiveMinimum': [
                    'minimum'
                ]
            },
            'default': {}
        },
        'http://json-schema.org/draft-07/schema#': {
            'definitions': {
                'schemaArray': {
                    'type': 'array',
                    'minItems': 1,
                    'items': { '$ref': '#' }
                },
                'nonNegativeInteger': {
                    'type': 'integer',
                    'minimum': 0
                },
                'nonNegativeIntegerDefault0': {
                    'allOf': [
                        { '$ref': '#/definitions/nonNegativeInteger' },
                        { 'default': 0 }
                    ]
                },
                'simpleTypes': {
                    'enum': [
                        'array',
                        'boolean',
                        'integer',
                        'null',
                        'number',
                        'object',
                        'string'
                    ]
                },
                'stringArray': {
                    'type': 'array',
                    'items': { 'type': 'string' },
                    'uniqueItems': true,
                    'default': []
                }
            },
            'type': ['object', 'boolean'],
            'properties': {
                '$id': {
                    'type': 'string',
                    'format': 'uri-reference'
                },
                '$schema': {
                    'type': 'string',
                    'format': 'uri'
                },
                '$ref': {
                    'type': 'string',
                    'format': 'uri-reference'
                },
                '$comment': {
                    'type': 'string'
                },
                'title': {
                    'type': 'string'
                },
                'description': {
                    'type': 'string'
                },
                'default': true,
                'readOnly': {
                    'type': 'boolean',
                    'default': false
                },
                'examples': {
                    'type': 'array',
                    'items': true
                },
                'multipleOf': {
                    'type': 'number',
                    'exclusiveMinimum': 0
                },
                'maximum': {
                    'type': 'number'
                },
                'exclusiveMaximum': {
                    'type': 'number'
                },
                'minimum': {
                    'type': 'number'
                },
                'exclusiveMinimum': {
                    'type': 'number'
                },
                'maxLength': { '$ref': '#/definitions/nonNegativeInteger' },
                'minLength': { '$ref': '#/definitions/nonNegativeIntegerDefault0' },
                'pattern': {
                    'type': 'string',
                    'format': 'regex'
                },
                'additionalItems': { '$ref': '#' },
                'items': {
                    'anyOf': [
                        { '$ref': '#' },
                        { '$ref': '#/definitions/schemaArray' }
                    ],
                    'default': true
                },
                'maxItems': { '$ref': '#/definitions/nonNegativeInteger' },
                'minItems': { '$ref': '#/definitions/nonNegativeIntegerDefault0' },
                'uniqueItems': {
                    'type': 'boolean',
                    'default': false
                },
                'contains': { '$ref': '#' },
                'maxProperties': { '$ref': '#/definitions/nonNegativeInteger' },
                'minProperties': { '$ref': '#/definitions/nonNegativeIntegerDefault0' },
                'required': { '$ref': '#/definitions/stringArray' },
                'additionalProperties': { '$ref': '#' },
                'definitions': {
                    'type': 'object',
                    'additionalProperties': { '$ref': '#' },
                    'default': {}
                },
                'properties': {
                    'type': 'object',
                    'additionalProperties': { '$ref': '#' },
                    'default': {}
                },
                'patternProperties': {
                    'type': 'object',
                    'additionalProperties': { '$ref': '#' },
                    'propertyNames': { 'format': 'regex' },
                    'default': {}
                },
                'dependencies': {
                    'type': 'object',
                    'additionalProperties': {
                        'anyOf': [
                            { '$ref': '#' },
                            { '$ref': '#/definitions/stringArray' }
                        ]
                    }
                },
                'propertyNames': { '$ref': '#' },
                'const': true,
                'enum': {
                    'type': 'array',
                    'items': true,
                    'minItems': 1,
                    'uniqueItems': true
                },
                'type': {
                    'anyOf': [
                        { '$ref': '#/definitions/simpleTypes' },
                        {
                            'type': 'array',
                            'items': { '$ref': '#/definitions/simpleTypes' },
                            'minItems': 1,
                            'uniqueItems': true
                        }
                    ]
                },
                'format': { 'type': 'string' },
                'contentMediaType': { 'type': 'string' },
                'contentEncoding': { 'type': 'string' },
                'if': { '$ref': '#' },
                'then': { '$ref': '#' },
                'else': { '$ref': '#' },
                'allOf': { '$ref': '#/definitions/schemaArray' },
                'anyOf': { '$ref': '#/definitions/schemaArray' },
                'oneOf': { '$ref': '#/definitions/schemaArray' },
                'not': { '$ref': '#' }
            },
            'default': true
        }
    }
};
const descriptions = {
    id: localize$1('schema.json.id', "A unique identifier for the schema."),
    $schema: localize$1('schema.json.$schema', "The schema to verify this document against."),
    title: localize$1('schema.json.title', "A descriptive title of the element."),
    description: localize$1('schema.json.description', "A long description of the element. Used in hover menus and suggestions."),
    default: localize$1('schema.json.default', "A default value. Used by suggestions."),
    multipleOf: localize$1('schema.json.multipleOf', "A number that should cleanly divide the current value (i.e. have no remainder)."),
    maximum: localize$1('schema.json.maximum', "The maximum numerical value, inclusive by default."),
    exclusiveMaximum: localize$1('schema.json.exclusiveMaximum', "Makes the maximum property exclusive."),
    minimum: localize$1('schema.json.minimum', "The minimum numerical value, inclusive by default."),
    exclusiveMinimum: localize$1('schema.json.exclusiveMininum', "Makes the minimum property exclusive."),
    maxLength: localize$1('schema.json.maxLength', "The maximum length of a string."),
    minLength: localize$1('schema.json.minLength', "The minimum length of a string."),
    pattern: localize$1('schema.json.pattern', "A regular expression to match the string against. It is not implicitly anchored."),
    additionalItems: localize$1('schema.json.additionalItems', "For arrays, only when items is set as an array. If it is a schema, then this schema validates items after the ones specified by the items array. If it is false, then additional items will cause validation to fail."),
    items: localize$1('schema.json.items', "For arrays. Can either be a schema to validate every element against or an array of schemas to validate each item against in order (the first schema will validate the first element, the second schema will validate the second element, and so on."),
    maxItems: localize$1('schema.json.maxItems', "The maximum number of items that can be inside an array. Inclusive."),
    minItems: localize$1('schema.json.minItems', "The minimum number of items that can be inside an array. Inclusive."),
    uniqueItems: localize$1('schema.json.uniqueItems', "If all of the items in the array must be unique. Defaults to false."),
    maxProperties: localize$1('schema.json.maxProperties', "The maximum number of properties an object can have. Inclusive."),
    minProperties: localize$1('schema.json.minProperties', "The minimum number of properties an object can have. Inclusive."),
    required: localize$1('schema.json.required', "An array of strings that lists the names of all properties required on this object."),
    additionalProperties: localize$1('schema.json.additionalProperties', "Either a schema or a boolean. If a schema, then used to validate all properties not matched by 'properties' or 'patternProperties'. If false, then any properties not matched by either will cause this schema to fail."),
    definitions: localize$1('schema.json.definitions', "Not used for validation. Place subschemas here that you wish to reference inline with $ref."),
    properties: localize$1('schema.json.properties', "A map of property names to schemas for each property."),
    patternProperties: localize$1('schema.json.patternProperties', "A map of regular expressions on property names to schemas for matching properties."),
    dependencies: localize$1('schema.json.dependencies', "A map of property names to either an array of property names or a schema. An array of property names means the property named in the key depends on the properties in the array being present in the object in order to be valid. If the value is a schema, then the schema is only applied to the object if the property in the key exists on the object."),
    enum: localize$1('schema.json.enum', "The set of literal values that are valid."),
    type: localize$1('schema.json.type', "Either a string of one of the basic schema types (number, integer, null, array, object, boolean, string) or an array of strings specifying a subset of those types."),
    format: localize$1('schema.json.format', "Describes the format expected for the value."),
    allOf: localize$1('schema.json.allOf', "An array of schemas, all of which must match."),
    anyOf: localize$1('schema.json.anyOf', "An array of schemas, where at least one must match."),
    oneOf: localize$1('schema.json.oneOf', "An array of schemas, exactly one of which must match."),
    not: localize$1('schema.json.not', "A schema which must not match."),
    $id: localize$1('schema.json.$id', "A unique identifier for the schema."),
    $ref: localize$1('schema.json.$ref', "Reference a definition hosted on any location."),
    $comment: localize$1('schema.json.$comment', "Comments from schema authors to readers or maintainers of the schema."),
    readOnly: localize$1('schema.json.readOnly', "Indicates that the value of the instance is managed exclusively by the owning authority."),
    examples: localize$1('schema.json.examples', "Sample JSON values associated with a particular schema, for the purpose of illustrating usage."),
    contains: localize$1('schema.json.contains', "An array instance is valid against \"contains\" if at least one of its elements is valid against the given schema."),
    propertyNames: localize$1('schema.json.propertyNames', "If the instance is an object, this keyword validates if every property name in the instance validates against the provided schema."),
    const: localize$1('schema.json.const', "An instance validates successfully against this keyword if its value is equal to the value of the keyword."),
    contentMediaType: localize$1('schema.json.contentMediaType', "Describes the media type of a string property."),
    contentEncoding: localize$1('schema.json.contentEncoding', "Describes the content encoding of a string property."),
    if: localize$1('schema.json.if', "The validation outcome of the \"if\" subschema controls which of the \"then\" or \"else\" keywords are evaluated."),
    then: localize$1('schema.json.then', "The \"if\" subschema is used for validation when the \"if\" subschema succeeds."),
    else: localize$1('schema.json.else', "The \"else\" subschema is used for validation when the \"if\" subschema fails.")
};
for (const schemaName in schemaContributions.schemas) {
    const schema = schemaContributions.schemas[schemaName];
    for (const property in schema.properties) {
        let propertyObject = schema.properties[property];
        if (typeof propertyObject === 'boolean') {
            propertyObject = schema.properties[property] = {};
        }
        const description = descriptions[property];
        if (description) {
            propertyObject['description'] = description;
        }
        else {
            console.log(`${property}: localize('schema.json.${property}', "")`);
        }
    }
}

var LIB;LIB=(()=>{var t={470:t=>{function e(t){if("string"!=typeof t)throw new TypeError("Path must be a string. Received "+JSON.stringify(t))}function r(t,e){for(var r,n="",o=0,i=-1,a=0,h=0;h<=t.length;++h){if(h<t.length)r=t.charCodeAt(h);else {if(47===r)break;r=47;}if(47===r){if(i===h-1||1===a);else if(i!==h-1&&2===a){if(n.length<2||2!==o||46!==n.charCodeAt(n.length-1)||46!==n.charCodeAt(n.length-2))if(n.length>2){var s=n.lastIndexOf("/");if(s!==n.length-1){-1===s?(n="",o=0):o=(n=n.slice(0,s)).length-1-n.lastIndexOf("/"),i=h,a=0;continue}}else if(2===n.length||1===n.length){n="",o=0,i=h,a=0;continue}e&&(n.length>0?n+="/..":n="..",o=2);}else n.length>0?n+="/"+t.slice(i+1,h):n=t.slice(i+1,h),o=h-i-1;i=h,a=0;}else 46===r&&-1!==a?++a:a=-1;}return n}var n={resolve:function(){for(var t,n="",o=!1,i=arguments.length-1;i>=-1&&!o;i--){var a;i>=0?a=arguments[i]:(void 0===t&&(t=process.cwd()),a=t),e(a),0!==a.length&&(n=a+"/"+n,o=47===a.charCodeAt(0));}return n=r(n,!o),o?n.length>0?"/"+n:"/":n.length>0?n:"."},normalize:function(t){if(e(t),0===t.length)return ".";var n=47===t.charCodeAt(0),o=47===t.charCodeAt(t.length-1);return 0!==(t=r(t,!n)).length||n||(t="."),t.length>0&&o&&(t+="/"),n?"/"+t:t},isAbsolute:function(t){return e(t),t.length>0&&47===t.charCodeAt(0)},join:function(){if(0===arguments.length)return ".";for(var t,r=0;r<arguments.length;++r){var o=arguments[r];e(o),o.length>0&&(void 0===t?t=o:t+="/"+o);}return void 0===t?".":n.normalize(t)},relative:function(t,r){if(e(t),e(r),t===r)return "";if((t=n.resolve(t))===(r=n.resolve(r)))return "";for(var o=1;o<t.length&&47===t.charCodeAt(o);++o);for(var i=t.length,a=i-o,h=1;h<r.length&&47===r.charCodeAt(h);++h);for(var s=r.length-h,c=a<s?a:s,f=-1,u=0;u<=c;++u){if(u===c){if(s>c){if(47===r.charCodeAt(h+u))return r.slice(h+u+1);if(0===u)return r.slice(h+u)}else a>c&&(47===t.charCodeAt(o+u)?f=u:0===u&&(f=0));break}var l=t.charCodeAt(o+u);if(l!==r.charCodeAt(h+u))break;47===l&&(f=u);}var p="";for(u=o+f+1;u<=i;++u)u!==i&&47!==t.charCodeAt(u)||(0===p.length?p+="..":p+="/..");return p.length>0?p+r.slice(h+f):(h+=f,47===r.charCodeAt(h)&&++h,r.slice(h))},_makeLong:function(t){return t},dirname:function(t){if(e(t),0===t.length)return ".";for(var r=t.charCodeAt(0),n=47===r,o=-1,i=!0,a=t.length-1;a>=1;--a)if(47===(r=t.charCodeAt(a))){if(!i){o=a;break}}else i=!1;return -1===o?n?"/":".":n&&1===o?"//":t.slice(0,o)},basename:function(t,r){if(void 0!==r&&"string"!=typeof r)throw new TypeError('"ext" argument must be a string');e(t);var n,o=0,i=-1,a=!0;if(void 0!==r&&r.length>0&&r.length<=t.length){if(r.length===t.length&&r===t)return "";var h=r.length-1,s=-1;for(n=t.length-1;n>=0;--n){var c=t.charCodeAt(n);if(47===c){if(!a){o=n+1;break}}else -1===s&&(a=!1,s=n+1),h>=0&&(c===r.charCodeAt(h)?-1==--h&&(i=n):(h=-1,i=s));}return o===i?i=s:-1===i&&(i=t.length),t.slice(o,i)}for(n=t.length-1;n>=0;--n)if(47===t.charCodeAt(n)){if(!a){o=n+1;break}}else -1===i&&(a=!1,i=n+1);return -1===i?"":t.slice(o,i)},extname:function(t){e(t);for(var r=-1,n=0,o=-1,i=!0,a=0,h=t.length-1;h>=0;--h){var s=t.charCodeAt(h);if(47!==s)-1===o&&(i=!1,o=h+1),46===s?-1===r?r=h:1!==a&&(a=1):-1!==r&&(a=-1);else if(!i){n=h+1;break}}return -1===r||-1===o||0===a||1===a&&r===o-1&&r===n+1?"":t.slice(r,o)},format:function(t){if(null===t||"object"!=typeof t)throw new TypeError('The "pathObject" argument must be of type Object. Received type '+typeof t);return function(t,e){var r=e.dir||e.root,n=e.base||(e.name||"")+(e.ext||"");return r?r===e.root?r+n:r+"/"+n:n}(0,t)},parse:function(t){e(t);var r={root:"",dir:"",base:"",ext:"",name:""};if(0===t.length)return r;var n,o=t.charCodeAt(0),i=47===o;i?(r.root="/",n=1):n=0;for(var a=-1,h=0,s=-1,c=!0,f=t.length-1,u=0;f>=n;--f)if(47!==(o=t.charCodeAt(f)))-1===s&&(c=!1,s=f+1),46===o?-1===a?a=f:1!==u&&(u=1):-1!==a&&(u=-1);else if(!c){h=f+1;break}return -1===a||-1===s||0===u||1===u&&a===s-1&&a===h+1?-1!==s&&(r.base=r.name=0===h&&i?t.slice(1,s):t.slice(h,s)):(0===h&&i?(r.name=t.slice(1,a),r.base=t.slice(1,s)):(r.name=t.slice(h,a),r.base=t.slice(h,s)),r.ext=t.slice(a,s)),h>0?r.dir=t.slice(0,h-1):i&&(r.dir="/"),r},sep:"/",delimiter:":",win32:null,posix:null};n.posix=n,t.exports=n;},447:(t,e,r)=>{var n;if(r.r(e),r.d(e,{URI:()=>d,Utils:()=>P}),"object"==typeof process)n="win32"===process.platform;else if("object"==typeof navigator){var o=navigator.userAgent;n=o.indexOf("Windows")>=0;}var i,a,h=(i=function(t,e){return (i=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e;}||function(t,e){for(var r in e)Object.prototype.hasOwnProperty.call(e,r)&&(t[r]=e[r]);})(t,e)},function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Class extends value "+String(e)+" is not a constructor or null");function r(){this.constructor=t;}i(t,e),t.prototype=null===e?Object.create(e):(r.prototype=e.prototype,new r);}),s=/^\w[\w\d+.-]*$/,c=/^\//,f=/^\/\//;function u(t,e){if(!t.scheme&&e)throw new Error('[UriError]: Scheme is missing: {scheme: "", authority: "'.concat(t.authority,'", path: "').concat(t.path,'", query: "').concat(t.query,'", fragment: "').concat(t.fragment,'"}'));if(t.scheme&&!s.test(t.scheme))throw new Error("[UriError]: Scheme contains illegal characters.");if(t.path)if(t.authority){if(!c.test(t.path))throw new Error('[UriError]: If a URI contains an authority component, then the path component must either be empty or begin with a slash ("/") character')}else if(f.test(t.path))throw new Error('[UriError]: If a URI does not contain an authority component, then the path cannot begin with two slash characters ("//")')}var l="",p="/",g=/^(([^:/?#]+?):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/,d=function(){function t(t,e,r,n,o,i){void 0===i&&(i=!1),"object"==typeof t?(this.scheme=t.scheme||l,this.authority=t.authority||l,this.path=t.path||l,this.query=t.query||l,this.fragment=t.fragment||l):(this.scheme=function(t,e){return t||e?t:"file"}(t,i),this.authority=e||l,this.path=function(t,e){switch(t){case"https":case"http":case"file":e?e[0]!==p&&(e=p+e):e=p;}return e}(this.scheme,r||l),this.query=n||l,this.fragment=o||l,u(this,i));}return t.isUri=function(e){return e instanceof t||!!e&&"string"==typeof e.authority&&"string"==typeof e.fragment&&"string"==typeof e.path&&"string"==typeof e.query&&"string"==typeof e.scheme&&"string"==typeof e.fsPath&&"function"==typeof e.with&&"function"==typeof e.toString},Object.defineProperty(t.prototype,"fsPath",{get:function(){return A(this,!1)},enumerable:!1,configurable:!0}),t.prototype.with=function(t){if(!t)return this;var e=t.scheme,r=t.authority,n=t.path,o=t.query,i=t.fragment;return void 0===e?e=this.scheme:null===e&&(e=l),void 0===r?r=this.authority:null===r&&(r=l),void 0===n?n=this.path:null===n&&(n=l),void 0===o?o=this.query:null===o&&(o=l),void 0===i?i=this.fragment:null===i&&(i=l),e===this.scheme&&r===this.authority&&n===this.path&&o===this.query&&i===this.fragment?this:new y(e,r,n,o,i)},t.parse=function(t,e){void 0===e&&(e=!1);var r=g.exec(t);return r?new y(r[2]||l,O(r[4]||l),O(r[5]||l),O(r[7]||l),O(r[9]||l),e):new y(l,l,l,l,l)},t.file=function(t){var e=l;if(n&&(t=t.replace(/\\/g,p)),t[0]===p&&t[1]===p){var r=t.indexOf(p,2);-1===r?(e=t.substring(2),t=p):(e=t.substring(2,r),t=t.substring(r)||p);}return new y("file",e,t,l,l)},t.from=function(t){var e=new y(t.scheme,t.authority,t.path,t.query,t.fragment);return u(e,!0),e},t.prototype.toString=function(t){return void 0===t&&(t=!1),w(this,t)},t.prototype.toJSON=function(){return this},t.revive=function(e){if(e){if(e instanceof t)return e;var r=new y(e);return r._formatted=e.external,r._fsPath=e._sep===v?e.fsPath:null,r}return e},t}(),v=n?1:void 0,y=function(t){function e(){var e=null!==t&&t.apply(this,arguments)||this;return e._formatted=null,e._fsPath=null,e}return h(e,t),Object.defineProperty(e.prototype,"fsPath",{get:function(){return this._fsPath||(this._fsPath=A(this,!1)),this._fsPath},enumerable:!1,configurable:!0}),e.prototype.toString=function(t){return void 0===t&&(t=!1),t?w(this,!0):(this._formatted||(this._formatted=w(this,!1)),this._formatted)},e.prototype.toJSON=function(){var t={$mid:1};return this._fsPath&&(t.fsPath=this._fsPath,t._sep=v),this._formatted&&(t.external=this._formatted),this.path&&(t.path=this.path),this.scheme&&(t.scheme=this.scheme),this.authority&&(t.authority=this.authority),this.query&&(t.query=this.query),this.fragment&&(t.fragment=this.fragment),t},e}(d),m=((a={})[58]="%3A",a[47]="%2F",a[63]="%3F",a[35]="%23",a[91]="%5B",a[93]="%5D",a[64]="%40",a[33]="%21",a[36]="%24",a[38]="%26",a[39]="%27",a[40]="%28",a[41]="%29",a[42]="%2A",a[43]="%2B",a[44]="%2C",a[59]="%3B",a[61]="%3D",a[32]="%20",a);function b(t,e){for(var r=void 0,n=-1,o=0;o<t.length;o++){var i=t.charCodeAt(o);if(i>=97&&i<=122||i>=65&&i<=90||i>=48&&i<=57||45===i||46===i||95===i||126===i||e&&47===i)-1!==n&&(r+=encodeURIComponent(t.substring(n,o)),n=-1),void 0!==r&&(r+=t.charAt(o));else {void 0===r&&(r=t.substr(0,o));var a=m[i];void 0!==a?(-1!==n&&(r+=encodeURIComponent(t.substring(n,o)),n=-1),r+=a):-1===n&&(n=o);}}return -1!==n&&(r+=encodeURIComponent(t.substring(n))),void 0!==r?r:t}function C(t){for(var e=void 0,r=0;r<t.length;r++){var n=t.charCodeAt(r);35===n||63===n?(void 0===e&&(e=t.substr(0,r)),e+=m[n]):void 0!==e&&(e+=t[r]);}return void 0!==e?e:t}function A(t,e){var r;return r=t.authority&&t.path.length>1&&"file"===t.scheme?"//".concat(t.authority).concat(t.path):47===t.path.charCodeAt(0)&&(t.path.charCodeAt(1)>=65&&t.path.charCodeAt(1)<=90||t.path.charCodeAt(1)>=97&&t.path.charCodeAt(1)<=122)&&58===t.path.charCodeAt(2)?e?t.path.substr(1):t.path[1].toLowerCase()+t.path.substr(2):t.path,n&&(r=r.replace(/\//g,"\\")),r}function w(t,e){var r=e?C:b,n="",o=t.scheme,i=t.authority,a=t.path,h=t.query,s=t.fragment;if(o&&(n+=o,n+=":"),(i||"file"===o)&&(n+=p,n+=p),i){var c=i.indexOf("@");if(-1!==c){var f=i.substr(0,c);i=i.substr(c+1),-1===(c=f.indexOf(":"))?n+=r(f,!1):(n+=r(f.substr(0,c),!1),n+=":",n+=r(f.substr(c+1),!1)),n+="@";}-1===(c=(i=i.toLowerCase()).indexOf(":"))?n+=r(i,!1):(n+=r(i.substr(0,c),!1),n+=i.substr(c));}if(a){if(a.length>=3&&47===a.charCodeAt(0)&&58===a.charCodeAt(2))(u=a.charCodeAt(1))>=65&&u<=90&&(a="/".concat(String.fromCharCode(u+32),":").concat(a.substr(3)));else if(a.length>=2&&58===a.charCodeAt(1)){var u;(u=a.charCodeAt(0))>=65&&u<=90&&(a="".concat(String.fromCharCode(u+32),":").concat(a.substr(2)));}n+=r(a,!0);}return h&&(n+="?",n+=r(h,!1)),s&&(n+="#",n+=e?s:b(s,!1)),n}function x(t){try{return decodeURIComponent(t)}catch(e){return t.length>3?t.substr(0,3)+x(t.substr(3)):t}}var _=/(%[0-9A-Za-z][0-9A-Za-z])+/g;function O(t){return t.match(_)?t.replace(_,(function(t){return x(t)})):t}var P,j=r(470),U=function(t,e,r){if(r||2===arguments.length)for(var n,o=0,i=e.length;o<i;o++)!n&&o in e||(n||(n=Array.prototype.slice.call(e,0,o)),n[o]=e[o]);return t.concat(n||Array.prototype.slice.call(e))},I=j.posix||j;!function(t){t.joinPath=function(t){for(var e=[],r=1;r<arguments.length;r++)e[r-1]=arguments[r];return t.with({path:I.join.apply(I,U([t.path],e,!1))})},t.resolvePath=function(t){for(var e=[],r=1;r<arguments.length;r++)e[r-1]=arguments[r];var n=t.path||"/";return t.with({path:I.resolve.apply(I,U([n],e,!1))})},t.dirname=function(t){var e=I.dirname(t.path);return 1===e.length&&46===e.charCodeAt(0)?t:t.with({path:e})},t.basename=function(t){return I.basename(t.path)},t.extname=function(t){return I.extname(t.path)};}(P||(P={}));}},e={};function r(n){if(e[n])return e[n].exports;var o=e[n]={exports:{}};return t[n](o,o.exports,r),o.exports}return r.d=(t,e)=>{for(var n in e)r.o(e,n)&&!r.o(t,n)&&Object.defineProperty(t,n,{enumerable:!0,get:e[n]});},r.o=(t,e)=>Object.prototype.hasOwnProperty.call(t,e),r.r=t=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0});},r(447)})();const{URI,Utils}=LIB;

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Copyright (c) 2013, Nick Fitzgerald
 *  Licensed under the MIT License. See LICENCE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
function createRegex(glob, opts) {
    if (typeof glob !== 'string') {
        throw new TypeError('Expected a string');
    }
    const str = String(glob);
    // The regexp we are building, as a string.
    let reStr = "";
    // Whether we are matching so called "extended" globs (like bash) and should
    // support single character matching, matching ranges of characters, group
    // matching, etc.
    const extended = opts ? !!opts.extended : false;
    // When globstar is _false_ (default), '/foo/*' is translated a regexp like
    // '^\/foo\/.*$' which will match any string beginning with '/foo/'
    // When globstar is _true_, '/foo/*' is translated to regexp like
    // '^\/foo\/[^/]*$' which will match any string beginning with '/foo/' BUT
    // which does not have a '/' to the right of it.
    // E.g. with '/foo/*' these will match: '/foo/bar', '/foo/bar.txt' but
    // these will not '/foo/bar/baz', '/foo/bar/baz.txt'
    // Lastely, when globstar is _true_, '/foo/**' is equivelant to '/foo/*' when
    // globstar is _false_
    const globstar = opts ? !!opts.globstar : false;
    // If we are doing extended matching, this boolean is true when we are inside
    // a group (eg {*.html,*.js}), and false otherwise.
    let inGroup = false;
    // RegExp flags (eg "i" ) to pass in to RegExp constructor.
    const flags = opts && typeof (opts.flags) === "string" ? opts.flags : "";
    let c;
    for (let i = 0, len = str.length; i < len; i++) {
        c = str[i];
        switch (c) {
            case "/":
            case "$":
            case "^":
            case "+":
            case ".":
            case "(":
            case ")":
            case "=":
            case "!":
            case "|":
                reStr += "\\" + c;
                break;
            case "?":
                if (extended) {
                    reStr += ".";
                    break;
                }
            case "[":
            case "]":
                if (extended) {
                    reStr += c;
                    break;
                }
            case "{":
                if (extended) {
                    inGroup = true;
                    reStr += "(";
                    break;
                }
            case "}":
                if (extended) {
                    inGroup = false;
                    reStr += ")";
                    break;
                }
            case ",":
                if (inGroup) {
                    reStr += "|";
                    break;
                }
                reStr += "\\" + c;
                break;
            case "*":
                // Move over all consecutive "*"'s.
                // Also store the previous and next characters
                const prevChar = str[i - 1];
                let starCount = 1;
                while (str[i + 1] === "*") {
                    starCount++;
                    i++;
                }
                const nextChar = str[i + 1];
                if (!globstar) {
                    // globstar is disabled, so treat any number of "*" as one
                    reStr += ".*";
                }
                else {
                    // globstar is enabled, so determine if this is a globstar segment
                    const isGlobstar = starCount > 1 // multiple "*"'s
                        && (prevChar === "/" || prevChar === undefined || prevChar === '{' || prevChar === ',') // from the start of the segment
                        && (nextChar === "/" || nextChar === undefined || nextChar === ',' || nextChar === '}'); // to the end of the segment
                    if (isGlobstar) {
                        if (nextChar === "/") {
                            i++; // move over the "/"
                        }
                        else if (prevChar === '/' && reStr.endsWith('\\/')) {
                            reStr = reStr.substr(0, reStr.length - 2);
                        }
                        // it's a globstar, so match zero or more path segments
                        reStr += "((?:[^/]*(?:\/|$))*)";
                    }
                    else {
                        // it's not a globstar, so only match one path segment
                        reStr += "([^/]*)";
                    }
                }
                break;
            default:
                reStr += c;
        }
    }
    // When regexp 'g' flag is specified don't
    // constrain the regular expression with ^ & $
    if (!flags || !~flags.indexOf('g')) {
        reStr = "^" + reStr + "$";
    }
    return new RegExp(reStr, flags);
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const localize = main.loadMessageBundle();
const BANG = '!';
const PATH_SEP = '/';
class FilePatternAssociation {
    constructor(pattern, uris) {
        this.globWrappers = [];
        try {
            for (let patternString of pattern) {
                const include = patternString[0] !== BANG;
                if (!include) {
                    patternString = patternString.substring(1);
                }
                if (patternString.length > 0) {
                    if (patternString[0] === PATH_SEP) {
                        patternString = patternString.substring(1);
                    }
                    this.globWrappers.push({
                        regexp: createRegex('**/' + patternString, { extended: true, globstar: true }),
                        include: include,
                    });
                }
            }
            ;
            this.uris = uris;
        }
        catch (e) {
            this.globWrappers.length = 0;
            this.uris = [];
        }
    }
    matchesPattern(fileName) {
        let match = false;
        for (const { regexp, include } of this.globWrappers) {
            if (regexp.test(fileName)) {
                match = include;
            }
        }
        return match;
    }
    getURIs() {
        return this.uris;
    }
}
class SchemaHandle {
    constructor(service, uri, unresolvedSchemaContent) {
        this.service = service;
        this.uri = uri;
        this.dependencies = new Set();
        this.anchors = undefined;
        if (unresolvedSchemaContent) {
            this.unresolvedSchema = this.service.promise.resolve(new UnresolvedSchema(unresolvedSchemaContent));
        }
    }
    getUnresolvedSchema() {
        if (!this.unresolvedSchema) {
            this.unresolvedSchema = this.service.loadSchema(this.uri);
        }
        return this.unresolvedSchema;
    }
    getResolvedSchema() {
        if (!this.resolvedSchema) {
            this.resolvedSchema = this.getUnresolvedSchema().then(unresolved => {
                return this.service.resolveSchemaContent(unresolved, this);
            });
        }
        return this.resolvedSchema;
    }
    clearSchema() {
        const hasChanges = !!this.unresolvedSchema;
        this.resolvedSchema = undefined;
        this.unresolvedSchema = undefined;
        this.dependencies.clear();
        this.anchors = undefined;
        return hasChanges;
    }
}
class UnresolvedSchema {
    constructor(schema, errors = []) {
        this.schema = schema;
        this.errors = errors;
    }
}
class ResolvedSchema {
    constructor(schema, errors = [], warnings = [], schemaDraft) {
        this.schema = schema;
        this.errors = errors;
        this.warnings = warnings;
        this.schemaDraft = schemaDraft;
    }
    getSection(path) {
        const schemaRef = this.getSectionRecursive(path, this.schema);
        if (schemaRef) {
            return asSchema(schemaRef);
        }
        return undefined;
    }
    getSectionRecursive(path, schema) {
        if (!schema || typeof schema === 'boolean' || path.length === 0) {
            return schema;
        }
        const next = path.shift();
        if (schema.properties && typeof schema.properties[next]) {
            return this.getSectionRecursive(path, schema.properties[next]);
        }
        else if (schema.patternProperties) {
            for (const pattern of Object.keys(schema.patternProperties)) {
                const regex = extendedRegExp(pattern);
                if (regex?.test(next)) {
                    return this.getSectionRecursive(path, schema.patternProperties[pattern]);
                }
            }
        }
        else if (typeof schema.additionalProperties === 'object') {
            return this.getSectionRecursive(path, schema.additionalProperties);
        }
        else if (next.match('[0-9]+')) {
            if (Array.isArray(schema.items)) {
                const index = parseInt(next, 10);
                if (!isNaN(index) && schema.items[index]) {
                    return this.getSectionRecursive(path, schema.items[index]);
                }
            }
            else if (schema.items) {
                return this.getSectionRecursive(path, schema.items);
            }
        }
        return undefined;
    }
}
class JSONSchemaService {
    constructor(requestService, contextService, promiseConstructor) {
        this.contextService = contextService;
        this.requestService = requestService;
        this.promiseConstructor = promiseConstructor || Promise;
        this.callOnDispose = [];
        this.contributionSchemas = {};
        this.contributionAssociations = [];
        this.schemasById = {};
        this.filePatternAssociations = [];
        this.registeredSchemasIds = {};
    }
    getRegisteredSchemaIds(filter) {
        return Object.keys(this.registeredSchemasIds).filter(id => {
            const scheme = URI.parse(id).scheme;
            return scheme !== 'schemaservice' && (!filter || filter(scheme));
        });
    }
    get promise() {
        return this.promiseConstructor;
    }
    dispose() {
        while (this.callOnDispose.length > 0) {
            this.callOnDispose.pop()();
        }
    }
    onResourceChange(uri) {
        // always clear this local cache when a resource changes
        this.cachedSchemaForResource = undefined;
        let hasChanges = false;
        uri = normalizeId(uri);
        const toWalk = [uri];
        const all = Object.keys(this.schemasById).map(key => this.schemasById[key]);
        while (toWalk.length) {
            const curr = toWalk.pop();
            for (let i = 0; i < all.length; i++) {
                const handle = all[i];
                if (handle && (handle.uri === curr || handle.dependencies.has(curr))) {
                    if (handle.uri !== curr) {
                        toWalk.push(handle.uri);
                    }
                    if (handle.clearSchema()) {
                        hasChanges = true;
                    }
                    all[i] = undefined;
                }
            }
        }
        return hasChanges;
    }
    setSchemaContributions(schemaContributions) {
        if (schemaContributions.schemas) {
            const schemas = schemaContributions.schemas;
            for (const id in schemas) {
                const normalizedId = normalizeId(id);
                this.contributionSchemas[normalizedId] = this.addSchemaHandle(normalizedId, schemas[id]);
            }
        }
        if (Array.isArray(schemaContributions.schemaAssociations)) {
            const schemaAssociations = schemaContributions.schemaAssociations;
            for (let schemaAssociation of schemaAssociations) {
                const uris = schemaAssociation.uris.map(normalizeId);
                const association = this.addFilePatternAssociation(schemaAssociation.pattern, uris);
                this.contributionAssociations.push(association);
            }
        }
    }
    addSchemaHandle(id, unresolvedSchemaContent) {
        const schemaHandle = new SchemaHandle(this, id, unresolvedSchemaContent);
        this.schemasById[id] = schemaHandle;
        return schemaHandle;
    }
    getOrAddSchemaHandle(id, unresolvedSchemaContent) {
        return this.schemasById[id] || this.addSchemaHandle(id, unresolvedSchemaContent);
    }
    addFilePatternAssociation(pattern, uris) {
        const fpa = new FilePatternAssociation(pattern, uris);
        this.filePatternAssociations.push(fpa);
        return fpa;
    }
    registerExternalSchema(uri, filePatterns, unresolvedSchemaContent) {
        const id = normalizeId(uri);
        this.registeredSchemasIds[id] = true;
        this.cachedSchemaForResource = undefined;
        if (filePatterns) {
            this.addFilePatternAssociation(filePatterns, [id]);
        }
        return unresolvedSchemaContent ? this.addSchemaHandle(id, unresolvedSchemaContent) : this.getOrAddSchemaHandle(id);
    }
    clearExternalSchemas() {
        this.schemasById = {};
        this.filePatternAssociations = [];
        this.registeredSchemasIds = {};
        this.cachedSchemaForResource = undefined;
        for (const id in this.contributionSchemas) {
            this.schemasById[id] = this.contributionSchemas[id];
            this.registeredSchemasIds[id] = true;
        }
        for (const contributionAssociation of this.contributionAssociations) {
            this.filePatternAssociations.push(contributionAssociation);
        }
    }
    getResolvedSchema(schemaId) {
        const id = normalizeId(schemaId);
        const schemaHandle = this.schemasById[id];
        if (schemaHandle) {
            return schemaHandle.getResolvedSchema();
        }
        return this.promise.resolve(undefined);
    }
    loadSchema(url) {
        if (!this.requestService) {
            const errorMessage = localize('json.schema.norequestservice', 'Unable to load schema from \'{0}\'. No schema request service available', toDisplayString(url));
            return this.promise.resolve(new UnresolvedSchema({}, [errorMessage]));
        }
        return this.requestService(url).then(content => {
            if (!content) {
                const errorMessage = localize('json.schema.nocontent', 'Unable to load schema from \'{0}\': No content.', toDisplayString(url));
                return new UnresolvedSchema({}, [errorMessage]);
            }
            let schemaContent = {};
            const jsonErrors = [];
            schemaContent = parse$1(content, jsonErrors);
            const errors = jsonErrors.length ? [localize('json.schema.invalidFormat', 'Unable to parse content from \'{0}\': Parse error at offset {1}.', toDisplayString(url), jsonErrors[0].offset)] : [];
            return new UnresolvedSchema(schemaContent, errors);
        }, (error) => {
            let errorMessage = error.toString();
            const errorSplit = error.toString().split('Error: ');
            if (errorSplit.length > 1) {
                // more concise error message, URL and context are attached by caller anyways
                errorMessage = errorSplit[1];
            }
            if (endsWith(errorMessage, '.')) {
                errorMessage = errorMessage.substr(0, errorMessage.length - 1);
            }
            return new UnresolvedSchema({}, [localize('json.schema.nocontent', 'Unable to load schema from \'{0}\': {1}.', toDisplayString(url), errorMessage)]);
        });
    }
    resolveSchemaContent(schemaToResolve, handle) {
        const resolveErrors = schemaToResolve.errors.slice(0);
        const schema = schemaToResolve.schema;
        let schemaDraft = schema.$schema ? normalizeId(schema.$schema) : undefined;
        if (schemaDraft === 'http://json-schema.org/draft-03/schema') {
            return this.promise.resolve(new ResolvedSchema({}, [localize('json.schema.draft03.notsupported', "Draft-03 schemas are not supported.")], [], schemaDraft));
        }
        let usesUnsupportedFeatures = new Set();
        const contextService = this.contextService;
        const findSectionByJSONPointer = (schema, path) => {
            path = decodeURIComponent(path);
            let current = schema;
            if (path[0] === '/') {
                path = path.substring(1);
            }
            path.split('/').some((part) => {
                part = part.replace(/~1/g, '/').replace(/~0/g, '~');
                current = current[part];
                return !current;
            });
            return current;
        };
        const findSchemaById = (schema, handle, id) => {
            if (!handle.anchors) {
                handle.anchors = collectAnchors(schema);
            }
            return handle.anchors.get(id);
        };
        const merge = (target, section) => {
            for (const key in section) {
                if (section.hasOwnProperty(key) && !target.hasOwnProperty(key) && key !== 'id' && key !== '$id') {
                    target[key] = section[key];
                }
            }
        };
        const mergeRef = (target, sourceRoot, sourceHandle, refSegment) => {
            let section;
            if (refSegment === undefined || refSegment.length === 0) {
                section = sourceRoot;
            }
            else if (refSegment.charAt(0) === '/') {
                // A $ref to a JSON Pointer (i.e #/definitions/foo)
                section = findSectionByJSONPointer(sourceRoot, refSegment);
            }
            else {
                // A $ref to a sub-schema with an $id (i.e #hello)
                section = findSchemaById(sourceRoot, sourceHandle, refSegment);
            }
            if (section) {
                merge(target, section);
            }
            else {
                resolveErrors.push(localize('json.schema.invalidid', '$ref \'{0}\' in \'{1}\' can not be resolved.', refSegment, sourceHandle.uri));
            }
        };
        const resolveExternalLink = (node, uri, refSegment, parentHandle) => {
            if (contextService && !/^[A-Za-z][A-Za-z0-9+\-.+]*:\/\/.*/.test(uri)) {
                uri = contextService.resolveRelativePath(uri, parentHandle.uri);
            }
            uri = normalizeId(uri);
            const referencedHandle = this.getOrAddSchemaHandle(uri);
            return referencedHandle.getUnresolvedSchema().then(unresolvedSchema => {
                parentHandle.dependencies.add(uri);
                if (unresolvedSchema.errors.length) {
                    const loc = refSegment ? uri + '#' + refSegment : uri;
                    resolveErrors.push(localize('json.schema.problemloadingref', 'Problems loading reference \'{0}\': {1}', loc, unresolvedSchema.errors[0]));
                }
                mergeRef(node, unresolvedSchema.schema, referencedHandle, refSegment);
                return resolveRefs(node, unresolvedSchema.schema, referencedHandle);
            });
        };
        const resolveRefs = (node, parentSchema, parentHandle) => {
            const openPromises = [];
            this.traverseNodes(node, next => {
                const seenRefs = new Set();
                while (next.$ref) {
                    const ref = next.$ref;
                    const segments = ref.split('#', 2);
                    delete next.$ref;
                    if (segments[0].length > 0) {
                        // This is a reference to an external schema
                        openPromises.push(resolveExternalLink(next, segments[0], segments[1], parentHandle));
                        return;
                    }
                    else {
                        // This is a reference inside the current schema
                        if (!seenRefs.has(ref)) {
                            const id = segments[1];
                            mergeRef(next, parentSchema, parentHandle, id);
                            seenRefs.add(ref);
                        }
                    }
                }
                if (next.$recursiveRef) {
                    usesUnsupportedFeatures.add('$recursiveRef');
                }
                if (next.$dynamicRef) {
                    usesUnsupportedFeatures.add('$dynamicRef');
                }
            });
            return this.promise.all(openPromises);
        };
        const collectAnchors = (root) => {
            const result = new Map();
            this.traverseNodes(root, next => {
                const id = next.$id || next.id;
                const anchor = isString(id) && id.charAt(0) === '#' ? id.substring(1) : next.$anchor;
                if (anchor) {
                    if (result.has(anchor)) {
                        resolveErrors.push(localize('json.schema.duplicateid', 'Duplicate anchor declaration: \'{0}\'', anchor));
                    }
                    else {
                        result.set(anchor, next);
                    }
                }
                if (next.$recursiveAnchor) {
                    usesUnsupportedFeatures.add('$recursiveAnchor');
                }
                if (next.$dynamicAnchor) {
                    usesUnsupportedFeatures.add('$dynamicAnchor');
                }
            });
            return result;
        };
        return resolveRefs(schema, schema, handle).then(_ => {
            let resolveWarnings = [];
            if (usesUnsupportedFeatures.size) {
                resolveWarnings.push(localize('json.schema.warnings', 'The schema uses meta-schema features ({0}) that are not yet supported by the validator.', Array.from(usesUnsupportedFeatures.keys()).join(', ')));
            }
            return new ResolvedSchema(schema, resolveErrors, resolveWarnings, schemaDraft);
        });
    }
    traverseNodes(root, handle) {
        if (!root || typeof root !== 'object') {
            return Promise.resolve(null);
        }
        const seen = new Set();
        const collectEntries = (...entries) => {
            for (const entry of entries) {
                if (isObject(entry)) {
                    toWalk.push(entry);
                }
            }
        };
        const collectMapEntries = (...maps) => {
            for (const map of maps) {
                if (isObject(map)) {
                    for (const k in map) {
                        const key = k;
                        const entry = map[key];
                        if (isObject(entry)) {
                            toWalk.push(entry);
                        }
                    }
                }
            }
        };
        const collectArrayEntries = (...arrays) => {
            for (const array of arrays) {
                if (Array.isArray(array)) {
                    for (const entry of array) {
                        if (isObject(entry)) {
                            toWalk.push(entry);
                        }
                    }
                }
            }
        };
        const collectEntryOrArrayEntries = (items) => {
            if (Array.isArray(items)) {
                for (const entry of items) {
                    if (isObject(entry)) {
                        toWalk.push(entry);
                    }
                }
            }
            else if (isObject(items)) {
                toWalk.push(items);
            }
        };
        const toWalk = [root];
        let next = toWalk.pop();
        while (next) {
            if (!seen.has(next)) {
                seen.add(next);
                handle(next);
                collectEntries(next.additionalItems, next.additionalProperties, next.not, next.contains, next.propertyNames, next.if, next.then, next.else, next.unevaluatedItems, next.unevaluatedProperties);
                collectMapEntries(next.definitions, next.$defs, next.properties, next.patternProperties, next.dependencies, next.dependentSchemas);
                collectArrayEntries(next.anyOf, next.allOf, next.oneOf, next.prefixItems);
                collectEntryOrArrayEntries(next.items);
            }
            next = toWalk.pop();
        }
    }
    ;
    getSchemaFromProperty(resource, document) {
        if (document.root?.type === 'object') {
            for (const p of document.root.properties) {
                if (p.keyNode.value === '$schema' && p.valueNode?.type === 'string') {
                    let schemaId = p.valueNode.value;
                    if (this.contextService && !/^\w[\w\d+.-]*:/.test(schemaId)) { // has scheme
                        schemaId = this.contextService.resolveRelativePath(schemaId, resource);
                    }
                    return schemaId;
                }
            }
        }
        return undefined;
    }
    getAssociatedSchemas(resource) {
        const seen = Object.create(null);
        const schemas = [];
        const normalizedResource = normalizeResourceForMatching(resource);
        for (const entry of this.filePatternAssociations) {
            if (entry.matchesPattern(normalizedResource)) {
                for (const schemaId of entry.getURIs()) {
                    if (!seen[schemaId]) {
                        schemas.push(schemaId);
                        seen[schemaId] = true;
                    }
                }
            }
        }
        return schemas;
    }
    getSchemaURIsForResource(resource, document) {
        let schemeId = document && this.getSchemaFromProperty(resource, document);
        if (schemeId) {
            return [schemeId];
        }
        return this.getAssociatedSchemas(resource);
    }
    getSchemaForResource(resource, document) {
        if (document) {
            // first use $schema if present
            let schemeId = this.getSchemaFromProperty(resource, document);
            if (schemeId) {
                const id = normalizeId(schemeId);
                return this.getOrAddSchemaHandle(id).getResolvedSchema();
            }
        }
        if (this.cachedSchemaForResource && this.cachedSchemaForResource.resource === resource) {
            return this.cachedSchemaForResource.resolvedSchema;
        }
        const schemas = this.getAssociatedSchemas(resource);
        const resolvedSchema = schemas.length > 0 ? this.createCombinedSchema(resource, schemas).getResolvedSchema() : this.promise.resolve(undefined);
        this.cachedSchemaForResource = { resource, resolvedSchema };
        return resolvedSchema;
    }
    createCombinedSchema(resource, schemaIds) {
        if (schemaIds.length === 1) {
            return this.getOrAddSchemaHandle(schemaIds[0]);
        }
        else {
            const combinedSchemaId = 'schemaservice://combinedSchema/' + encodeURIComponent(resource);
            const combinedSchema = {
                allOf: schemaIds.map(schemaId => ({ $ref: schemaId }))
            };
            return this.addSchemaHandle(combinedSchemaId, combinedSchema);
        }
    }
    getMatchingSchemas(document, jsonDocument, schema) {
        if (schema) {
            const id = schema.id || ('schemaservice://untitled/matchingSchemas/' + idCounter++);
            const handle = this.addSchemaHandle(id, schema);
            return handle.getResolvedSchema().then(resolvedSchema => {
                return jsonDocument.getMatchingSchemas(resolvedSchema.schema).filter(s => !s.inverted);
            });
        }
        return this.getSchemaForResource(document.uri, jsonDocument).then(schema => {
            if (schema) {
                return jsonDocument.getMatchingSchemas(schema.schema).filter(s => !s.inverted);
            }
            return [];
        });
    }
}
let idCounter = 0;
function normalizeId(id) {
    // remove trailing '#', normalize drive capitalization
    try {
        return URI.parse(id).toString(true);
    }
    catch (e) {
        return id;
    }
}
function normalizeResourceForMatching(resource) {
    // remove queries and fragments, normalize drive capitalization
    try {
        return URI.parse(resource).with({ fragment: null, query: null }).toString(true);
    }
    catch (e) {
        return resource;
    }
}
function toDisplayString(url) {
    try {
        const uri = URI.parse(url);
        if (uri.scheme === 'file') {
            return uri.fsPath;
        }
    }
    catch (e) {
        // ignore
    }
    return url;
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
function getFoldingRanges(document, context) {
    const ranges = [];
    const nestingLevels = [];
    const stack = [];
    let prevStart = -1;
    const scanner = createScanner(document.getText(), false);
    let token = scanner.scan();
    function addRange(range) {
        ranges.push(range);
        nestingLevels.push(stack.length);
    }
    while (token !== 17 /* EOF */) {
        switch (token) {
            case 1 /* OpenBraceToken */:
            case 3 /* OpenBracketToken */: {
                const startLine = document.positionAt(scanner.getTokenOffset()).line;
                const range = { startLine, endLine: startLine, kind: token === 1 /* OpenBraceToken */ ? 'object' : 'array' };
                stack.push(range);
                break;
            }
            case 2 /* CloseBraceToken */:
            case 4 /* CloseBracketToken */: {
                const kind = token === 2 /* CloseBraceToken */ ? 'object' : 'array';
                if (stack.length > 0 && stack[stack.length - 1].kind === kind) {
                    const range = stack.pop();
                    const line = document.positionAt(scanner.getTokenOffset()).line;
                    if (range && line > range.startLine + 1 && prevStart !== range.startLine) {
                        range.endLine = line - 1;
                        addRange(range);
                        prevStart = range.startLine;
                    }
                }
                break;
            }
            case 13 /* BlockCommentTrivia */: {
                const startLine = document.positionAt(scanner.getTokenOffset()).line;
                const endLine = document.positionAt(scanner.getTokenOffset() + scanner.getTokenLength()).line;
                if (scanner.getTokenError() === 1 /* UnexpectedEndOfComment */ && startLine + 1 < document.lineCount) {
                    scanner.setPosition(document.offsetAt(Position.create(startLine + 1, 0)));
                }
                else {
                    if (startLine < endLine) {
                        addRange({ startLine, endLine, kind: FoldingRangeKind.Comment });
                        prevStart = startLine;
                    }
                }
                break;
            }
            case 12 /* LineCommentTrivia */: {
                const text = document.getText().substr(scanner.getTokenOffset(), scanner.getTokenLength());
                const m = text.match(/^\/\/\s*#(region\b)|(endregion\b)/);
                if (m) {
                    const line = document.positionAt(scanner.getTokenOffset()).line;
                    if (m[1]) { // start pattern match
                        const range = { startLine: line, endLine: line, kind: FoldingRangeKind.Region };
                        stack.push(range);
                    }
                    else {
                        let i = stack.length - 1;
                        while (i >= 0 && stack[i].kind !== FoldingRangeKind.Region) {
                            i--;
                        }
                        if (i >= 0) {
                            const range = stack[i];
                            stack.length = i;
                            if (line > range.startLine && prevStart !== range.startLine) {
                                range.endLine = line;
                                addRange(range);
                                prevStart = range.startLine;
                            }
                        }
                    }
                }
                break;
            }
        }
        token = scanner.scan();
    }
    const rangeLimit = context && context.rangeLimit;
    if (typeof rangeLimit !== 'number' || ranges.length <= rangeLimit) {
        return ranges;
    }
    if (context && context.onRangeLimitExceeded) {
        context.onRangeLimitExceeded(document.uri);
    }
    const counts = [];
    for (let level of nestingLevels) {
        if (level < 30) {
            counts[level] = (counts[level] || 0) + 1;
        }
    }
    let entries = 0;
    let maxLevel = 0;
    for (let i = 0; i < counts.length; i++) {
        const n = counts[i];
        if (n) {
            if (n + entries > rangeLimit) {
                maxLevel = i;
                break;
            }
            entries += n;
        }
    }
    const result = [];
    for (let i = 0; i < ranges.length; i++) {
        const level = nestingLevels[i];
        if (typeof level === 'number') {
            if (level < maxLevel || (level === maxLevel && entries++ < rangeLimit)) {
                result.push(ranges[i]);
            }
        }
    }
    return result;
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
function getSelectionRanges(document, positions, doc) {
    function getSelectionRange(position) {
        let offset = document.offsetAt(position);
        let node = doc.getNodeFromOffset(offset, true);
        const result = [];
        while (node) {
            switch (node.type) {
                case 'string':
                case 'object':
                case 'array':
                    // range without ", [ or {
                    const cStart = node.offset + 1, cEnd = node.offset + node.length - 1;
                    if (cStart < cEnd && offset >= cStart && offset <= cEnd) {
                        result.push(newRange(cStart, cEnd));
                    }
                    result.push(newRange(node.offset, node.offset + node.length));
                    break;
                case 'number':
                case 'boolean':
                case 'null':
                case 'property':
                    result.push(newRange(node.offset, node.offset + node.length));
                    break;
            }
            if (node.type === 'property' || node.parent && node.parent.type === 'array') {
                const afterCommaOffset = getOffsetAfterNextToken(node.offset + node.length, 5 /* CommaToken */);
                if (afterCommaOffset !== -1) {
                    result.push(newRange(node.offset, afterCommaOffset));
                }
            }
            node = node.parent;
        }
        let current = undefined;
        for (let index = result.length - 1; index >= 0; index--) {
            current = SelectionRange.create(result[index], current);
        }
        if (!current) {
            current = SelectionRange.create(Range.create(position, position));
        }
        return current;
    }
    function newRange(start, end) {
        return Range.create(document.positionAt(start), document.positionAt(end));
    }
    const scanner = createScanner(document.getText(), true);
    function getOffsetAfterNextToken(offset, expectedToken) {
        scanner.setPosition(offset);
        let token = scanner.scan();
        if (token === expectedToken) {
            return scanner.getTokenOffset() + scanner.getTokenLength();
        }
        return -1;
    }
    return positions.map(getSelectionRange);
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
function findLinks(document, doc) {
    const links = [];
    doc.visit(node => {
        if (node.type === "property" && node.keyNode.value === "$ref" && node.valueNode?.type === 'string') {
            const path = node.valueNode.value;
            const targetNode = findTargetNode(doc, path);
            if (targetNode) {
                const targetPos = document.positionAt(targetNode.offset);
                links.push({
                    target: `${document.uri}#${targetPos.line + 1},${targetPos.character + 1}`,
                    range: createRange(document, node.valueNode)
                });
            }
        }
        return true;
    });
    return Promise.resolve(links);
}
function createRange(document, node) {
    return Range.create(document.positionAt(node.offset + 1), document.positionAt(node.offset + node.length - 1));
}
function findTargetNode(doc, path) {
    const tokens = parseJSONPointer(path);
    if (!tokens) {
        return null;
    }
    return findNode(tokens, doc.root);
}
function findNode(pointer, node) {
    if (!node) {
        return null;
    }
    if (pointer.length === 0) {
        return node;
    }
    const token = pointer.shift();
    if (node && node.type === 'object') {
        const propertyNode = node.properties.find((propertyNode) => propertyNode.keyNode.value === token);
        if (!propertyNode) {
            return null;
        }
        return findNode(pointer, propertyNode.valueNode);
    }
    else if (node && node.type === 'array') {
        if (token.match(/^(0|[1-9][0-9]*)$/)) {
            const index = Number.parseInt(token);
            const arrayItem = node.items[index];
            if (!arrayItem) {
                return null;
            }
            return findNode(pointer, arrayItem);
        }
    }
    return null;
}
function parseJSONPointer(path) {
    if (path === "#") {
        return [];
    }
    if (path[0] !== '#' || path[1] !== '/') {
        return null;
    }
    return path.substring(2).split(/\//).map(unescape);
}
function unescape(str) {
    return str.replace(/~1/g, '/').replace(/~0/g, '~');
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
function getLanguageService(params) {
    const promise = params.promiseConstructor || Promise;
    const jsonSchemaService = new JSONSchemaService(params.schemaRequestService, params.workspaceContext, promise);
    jsonSchemaService.setSchemaContributions(schemaContributions);
    const jsonCompletion = new JSONCompletion(jsonSchemaService, params.contributions, promise, params.clientCapabilities);
    const jsonHover = new JSONHover(jsonSchemaService, params.contributions, promise);
    const jsonDocumentSymbols = new JSONDocumentSymbols(jsonSchemaService);
    const jsonValidation = new JSONValidation(jsonSchemaService, promise);
    return {
        configure: (settings) => {
            jsonSchemaService.clearExternalSchemas();
            if (settings.schemas) {
                settings.schemas.forEach(settings => {
                    jsonSchemaService.registerExternalSchema(settings.uri, settings.fileMatch, settings.schema);
                });
            }
            jsonValidation.configure(settings);
        },
        resetSchema: (uri) => jsonSchemaService.onResourceChange(uri),
        doValidation: jsonValidation.doValidation.bind(jsonValidation),
        getLanguageStatus: jsonValidation.getLanguageStatus.bind(jsonValidation),
        parseJSONDocument: (document) => parse(document, { collectComments: true }),
        newJSONDocument: (root, diagnostics) => newJSONDocument(root, diagnostics),
        getMatchingSchemas: jsonSchemaService.getMatchingSchemas.bind(jsonSchemaService),
        doResolve: jsonCompletion.doResolve.bind(jsonCompletion),
        doComplete: jsonCompletion.doComplete.bind(jsonCompletion),
        findDocumentSymbols: jsonDocumentSymbols.findDocumentSymbols.bind(jsonDocumentSymbols),
        findDocumentSymbols2: jsonDocumentSymbols.findDocumentSymbols2.bind(jsonDocumentSymbols),
        findDocumentColors: jsonDocumentSymbols.findDocumentColors.bind(jsonDocumentSymbols),
        getColorPresentations: jsonDocumentSymbols.getColorPresentations.bind(jsonDocumentSymbols),
        doHover: jsonHover.doHover.bind(jsonHover),
        getFoldingRanges,
        getSelectionRanges,
        findDefinition: () => Promise.resolve([]),
        findLinks,
        format: (d, r, o) => {
            let range = undefined;
            if (r) {
                const offset = d.offsetAt(r.start);
                const length = d.offsetAt(r.end) - offset;
                range = { offset, length };
            }
            const options = { tabSize: o ? o.tabSize : 4, insertSpaces: o?.insertSpaces === true, insertFinalNewline: o?.insertFinalNewline === true, eol: '\n' };
            return format(d.getText(), range, options).map(e => {
                return TextEdit.replace(Range.create(d.positionAt(e.offset), d.positionAt(e.offset + e.length)), e.content);
            });
        }
    };
}

// Simple JSON LS in Web Worker that provides completion and hover.
const jsonService = getLanguageService({
    async schemaRequestService(url) {
        const res = await fetch(url);
        return res.text();
    },
});
jsonService.configure({
    schemas: [
        {
            // "name": "tsconfig.json",
            // description: "TypeScript compiler configuration file",
            uri: "https://json.schemastore.org/tsconfig",
            fileMatch: ["tsconfig.json"],
        },
    ],
});
const docs = {};
const worker = self;
const conn = browser$1.exports.createProtocolConnection(new browser$1.exports.BrowserMessageReader(worker), new browser$1.exports.BrowserMessageWriter(worker));
conn.onRequest(browser$1.exports.InitializeRequest.type, (_params) => {
    return {
        capabilities: {
            textDocumentSync: browser$1.exports.TextDocumentSyncKind.Incremental,
            completionProvider: {
                triggerCharacters: ['"', ":"],
            },
            hoverProvider: true,
        },
    };
});
conn.onNotification(browser$1.exports.DidOpenTextDocumentNotification.type, ({ textDocument: { uri, languageId, version, text } }) => {
    docs[uri] = TextDocument.create(uri, languageId, version, text);
});
conn.onNotification(browser$1.exports.DidChangeTextDocumentNotification.type, ({ textDocument, contentChanges }) => {
    const doc = docs[textDocument.uri];
    if (doc) {
        docs[textDocument.uri] = TextDocument.update(doc, contentChanges, textDocument.version || 0);
    }
});
conn.onRequest(browser$1.exports.CompletionRequest.type, async ({ textDocument, position }) => {
    const doc = docs[textDocument.uri];
    if (!doc)
        return null;
    return jsonService.doComplete(doc, position, jsonService.parseJSONDocument(doc));
});
conn.onRequest(browser$1.exports.HoverRequest.type, async ({ textDocument, position }) => {
    const doc = docs[textDocument.uri];
    if (!doc)
        return null;
    return jsonService.doHover(doc, position, jsonService.parseJSONDocument(doc));
});
conn.listen();
