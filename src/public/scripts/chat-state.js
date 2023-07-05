class ChatState extends EventEmitter {
  #usersTyping = new Set();
  #usersOnline = new Set();
  #lastMessageSentByClient = null;
  #clientTypingTimeoutID = null;
  #clientIsTyping = false;
  #clientUsername = null;

  constructor(chatStateOptions) {
    super();
    console.log(this.constructor.name);

    if (!chatStateOptions?.clientUsername.length) {
      throw new Error("clientUsername inválido");
    }

    this.#clientUsername = chatStateOptions.clientUsername;
  }

  // geters
  get usersTyping() {
    return this.#usersTyping;
  }

  get usersOnline() {
    return this.#usersOnline;
  }

  get lastMessageSentByClient() {
    return this.#lastMessageSentByClient;
  }

  get clientIsTyping() {
    return this.#clientIsTyping;
  }

  get clientUsername() {
    return this.#clientUsername;
  }

  // setters
  set clientIsTyping(bool) {
    if (typeof bool !== "boolean") {
      throw new TypeError("clientIsTyping deve ser um booleano");
    }

    this.#clientIsTyping = bool;
  }

  set lastMessageSentByClient(message) {
    if (typeof message !== "string") {
      throw new TypeError("lastMessageSentByClient deve ser uma string");
    }

    this.#lastMessageSentByClient = message;
  }

  // public methods
  clearClientTypingState(clearClientTypingTimeoutID = true) {
    this.#clientIsTyping = false;
    this.#usersTyping.delete(this.#clientUsername);

    if (clearClientTypingTimeoutID) {
      clearTimeout(this.#clientTypingTimeoutID);
      this.#clientTypingTimeoutID = null;
    }

    return this;
  }

  setClientTypingState(timeoutDelay = 0, callback) {
    if (this.#clientIsTyping) {
      return this;
    }

    this.#clientIsTyping = true;
    this.#usersTyping.add(this.#clientUsername);

    if (timeoutDelay) {
      this.#clientTypingTimeoutID = setTimeout(() => {
        this.clearClientTypingState();
        if (typeof callback === "function") {
          callback();
        }
      }, timeoutDelay);
    }

    return this;
  }

  getUsersTypingAsArray() {
    return Array.from(this.#usersTyping.values());
  }

  getUsersOnlineAsArray() {
    return Array.from(this.#usersOnline.values());
  }

  setUsersOnlineFromArray(usersOnlineArray) {
    this.#usersOnline = new Set(usersOnlineArray);

    return this;
  }
}
