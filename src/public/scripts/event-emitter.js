class EventEmitter {
  constructor() {
    this._events = {};
  }

  on(eventName, closure) {
    if (typeof eventName !== "string") {
      throw new TypeError("eventName deve ser uma string");
    }

    if (typeof closure !== "function") {
      throw new TypeError("closure deve ser uma function");
    }

    if (!this._events[eventName]) {
      this._events[eventName] = [];
    }

    this._events[eventName].push(closure);

    return this;
  }

  emit(eventName, data) {
    if (typeof eventName !== "string") {
      throw new TypeError("eventName deve ser uma string");
    }

    if (!this._events[eventName]) {
      throw new Error(`evento ${eventName} não cadastrado`);
    }

    for (const closure of this._events[eventName]) {
      closure(data);
    }

    return this;
  }

  removeListener(eventName, closureToRemove) {
    if (!this._events[eventName]) {
      throw new Error(`evento ${eventName} não cadastrado`);
    }

    this._events[eventName] = this._events[eventName].filter(
      (closure) => closure !== closureToRemove
    );

    return this;
  }

  removeAllListeners(eventName) {
    if (!this._events[eventName]) {
      throw new Error(`evento ${eventName} não cadastrado`);
    }

    this._events[eventName] = undefined;

    return this;
  }
}
