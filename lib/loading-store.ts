/**
 * Thin bridge between the axios http-client (outside React) and the
 * LoadingContext (inside React). The LoadingProvider registers its
 * callbacks here on mount.
 */
type Handler = () => void;

let _increment: Handler = () => {};
let _decrement: Handler = () => {};

export const loadingStore = {
  register(inc: Handler, dec: Handler) {
    _increment = inc;
    _decrement = dec;
  },
  increment() {
    _increment();
  },
  decrement() {
    _decrement();
  },
};
