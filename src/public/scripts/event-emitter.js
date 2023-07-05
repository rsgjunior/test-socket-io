class EventEmitter {
  #events = new Map();

  constructor() {
    console.log(this.constructor.name);
  }

  on(eventKey, listener) {
    if (typeof listener !== "function") {
      throw new TypeError("callback deve ser uma function");
    }

    let listeners = this.#events.get(eventKey);

    if (!listeners) {
      this.#events.set(eventKey, (listeners = []));
    }

    listeners.push(listener);

    return this;
  }

  emit(eventKey, ...args) {
    const listeners = this.#events.get(eventKey);

    if (!listeners) {
      return this;
    }

    for (const listener of listeners) {
      listener.apply(null, args);
    }

    return this;
  }

  removeListener(eventKey, listener) {
    let listeners = this.#events.get(eventKey);

    if (!listeners) {
      return this;
    }

    listeners = listeners.filter((e) => e !== listener);

    return this;
  }

  removeAllListeners(eventKey) {
    if (!this.#events.get(eventKey)) {
      return this;
    }

    this.#events.delete(eventKey);

    return this;
  }
}
