// Minimal Event Stream
// Same idea as https://github.com/rpominov/basic-streams, but
// operators return a function accepting a Stream instead so that
// we can pipe through them.
export type Subscriber<T> = (x: T) => void;
export type Disposer = () => void;
export type Stream<T> = (cb: Subscriber<T>) => Disposer;

export interface DomEventTarget<K extends keyof HTMLElementEventMap> {
  addEventListener(
    type: string,
    listener: (x: HTMLElementEventMap[K]) => void
  ): void;
  removeEventListener(
    type: string,
    listener?: (x: HTMLElementEventMap[K]) => void
  ): void;
}

// Creating Streams
export const fromDomEvent = <K extends keyof HTMLElementEventMap>(
  target: DomEventTarget<K>,
  type: K
): Stream<HTMLElementEventMap[K]> => {
  return (cb) => {
    target.addEventListener(type, cb);
    return () => {
      target.removeEventListener(type, cb);
    };
  };
};

// Operators
// Transform value
export const map = <T, U>(transform: (x: T) => U) => (
  stream: Stream<T>
): Stream<U> => {
  return (cb) => stream((x) => cb(transform(x)));
};

// Peform side effect
export const tap = <T>(effect: (x: T) => void) => (
  stream: Stream<T>
): Stream<T> => {
  return (cb) => {
    return stream((x) => {
      effect(x);
      cb(x);
    });
  };
};

type Maybe<T> = null | { value: T };
// stream: ____1____2____2____3
// result: ____1____2_________3
export const skipDuplicates = <T>(
  equals: (prev: T, next: T) => boolean = (a, b) => a === b
) => (stream: Stream<T>): Stream<T> => {
  return (cb) => {
    let prev: Maybe<T> = null;
    return stream((x) => {
      if (!prev || !equals(prev.value, x)) {
        prev = { value: x };
        cb(x);
      }
    });
  };
};

export const debounce = <T>(ms: number) => (stream: Stream<T>): Stream<T> => {
  return (cb) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return stream((x) => {
      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }
      timeout = setTimeout(() => cb(x), ms);
    });
  };
};

export const debouncedBuffer = <T>(ms: number) => (
  stream: Stream<T>
): Stream<T[]> => {
  return (cb) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const buffer: T[] = [];
    return stream((x) => {
      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }
      buffer.push(x);
      timeout = setTimeout(() => {
        cb(buffer.slice());
        buffer.length = 0;
      }, ms);
    });
  };
};

export const filter = <T>(test: (x: T) => boolean) => (
  stream: Stream<T>
): Stream<T> => {
  return (cb) => {
    return stream((x) => {
      if (test(x)) cb(x);
    });
  };
};

// For returning a Stream piped through operators.
export const piped: Piped = (
  stream: unknown,
  ...ops: UnknownUnaryFunction[]
): unknown => ops.reduce<unknown>((v, op) => op(v), stream);

export type UnknownUnaryFunction = (param: unknown) => unknown;
export type Piped = {
  <A, B>(a: A, ab: (this: void, a: A) => B): B;
  <A, B, C>(a: A, ab: (this: void, a: A) => B, bc: (this: void, b: B) => C): C;
  <A, B, C, D>(
    a: A,
    ab: (this: void, a: A) => B,
    bc: (this: void, b: B) => C,
    cd: (this: void, c: C) => D
  ): D;
  <A, B, C, D, E>(
    a: A,
    ab: (this: void, a: A) => B,
    bc: (this: void, b: B) => C,
    cd: (this: void, c: C) => D,
    de: (this: void, d: D) => E
  ): E;
  <A, B, C, D, E, F>(
    a: A,
    ab: (this: void, a: A) => B,
    bc: (this: void, b: B) => C,
    cd: (this: void, c: C) => D,
    de: (this: void, d: D) => E,
    ef: (this: void, e: E) => F
  ): F;
  <A, B, C, D, E, F, G>(
    a: A,
    ab: (this: void, a: A) => B,
    bc: (this: void, b: B) => C,
    cd: (this: void, c: C) => D,
    de: (this: void, d: D) => E,
    ef: (this: void, e: E) => F,
    fg: (this: void, f: F) => G
  ): G;
  <A, B, C, D, E, F, G, H>(
    a: A,
    ab: (this: void, a: A) => B,
    bc: (this: void, b: B) => C,
    cd: (this: void, c: C) => D,
    de: (this: void, d: D) => E,
    ef: (this: void, e: E) => F,
    fg: (this: void, f: F) => G,
    gh: (this: void, g: G) => H
  ): H;
  <A, B, C, D, E, F, G, H, I>(
    a: A,
    ab: (this: void, a: A) => B,
    bc: (this: void, b: B) => C,
    cd: (this: void, c: C) => D,
    de: (this: void, d: D) => E,
    ef: (this: void, e: E) => F,
    fg: (this: void, f: F) => G,
    gh: (this: void, g: G) => H,
    hi: (this: void, h: H) => I
  ): I;
  <A, B, C, D, E, F, G, H, I, J>(
    a: A,
    ab: (this: void, a: A) => B,
    bc: (this: void, b: B) => C,
    cd: (this: void, c: C) => D,
    de: (this: void, d: D) => E,
    ef: (this: void, e: E) => F,
    fg: (this: void, f: F) => G,
    gh: (this: void, g: G) => H,
    hi: (this: void, h: H) => I,
    ij: (this: void, i: I) => J
  ): J;
};
