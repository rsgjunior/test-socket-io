class ChatDOM {
  #clientUsername;
  #htmlElementMain;
  #htmlElementMessages;
  #htmlElementForm;
  #htmlElementInput;
  #htmlElementUsersOnline;
  #htmlElementUsersTyping;

  constructor(chatDOMOptions) {
    console.log(this.constructor.name);

    this.#clientUsername = chatDOMOptions?.clientUsername ?? null;
  }

  // getters
  get clientUsername() {
    return this.#clientUsername;
  }

  get htmlElementMain() {
    return this.#htmlElementMain;
  }

  get htmlElementMessages() {
    return this.#htmlElementMessages;
  }

  get htmlElementForm() {
    return this.#htmlElementForm;
  }

  get htmlElementInput() {
    return this.#htmlElementInput;
  }

  get htmlElementUsersOnline() {
    return this.#htmlElementUsersOnline;
  }

  get htmlElementUsersTyping() {
    return this.#htmlElementUsersTyping;
  }

  // private methods
  #formatDate(dateArg) {
    return new Date(dateArg).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  #createMessageOfTypeCommon(messageObject) {
    const item = document.createElement("li");

    // data
    const spanDate = document.createElement("span");
    spanDate.innerText = `[${this.#formatDate(messageObject.timestamp)}] `;

    item.appendChild(spanDate);

    // username
    const b = document.createElement("b");
    b.innerText = `${messageObject.username}: `;

    item.appendChild(b);

    // message
    const spanMessage = document.createElement("span");
    spanMessage.innerText = messageObject.message;

    item.appendChild(spanMessage);

    return item;
  }

  #createMessageOfTypeServerEvent(messageObject) {
    const item = document.createElement("li");

    // data
    const spanDate = document.createElement("span");
    spanDate.innerText = `[${this.#formatDate(messageObject.timestamp)}] `;

    item.appendChild(spanDate);

    // message
    const spanMessage = document.createElement("span");
    spanMessage.innerText = messageObject.message;

    item.appendChild(spanMessage);

    return item;
  }

  #createMessageOfTypeError(messageObject) {
    const item = document.createElement("li");
    item.style.backgroundColor = "#f53022";

    // data
    const spanDate = document.createElement("span");
    spanDate.innerText = `[${this.#formatDate(messageObject.timestamp)}] `;

    item.appendChild(spanDate);

    // message
    const spanMessage = document.createElement("span");
    spanMessage.innerText = messageObject.message;

    item.appendChild(spanMessage);

    return item;
  }

  #createMessageOfTypePrivate(messageObject) {
    const item = document.createElement("li");
    item.style.backgroundColor = "#8fc1ff";

    // data
    const spanDate = document.createElement("span");
    spanDate.innerText = `[${this.#formatDate(messageObject.timestamp)}] `;
    item.appendChild(spanDate);

    // username
    const spanUsername = document.createElement("span");
    const b = document.createElement("b");

    if (messageObject.destinatary === this.#clientUsername) {
      spanUsername.innerText = `de `;
      b.innerText = `${messageObject.username}: `;
    } else {
      spanUsername.innerText = `para `;
      b.innerText = `${messageObject.destinatary}: `;
    }

    spanUsername.appendChild(b);
    item.appendChild(spanUsername);

    // message
    const spanMessage = document.createElement("span");
    spanMessage.innerText = messageObject.message;

    item.appendChild(spanMessage);

    return item;
  }

  // public methods
  queryHtmlElements() {
    this.#htmlElementMain = document.getElementById("main");
    this.#htmlElementMessages = document.getElementById("messages");
    this.#htmlElementForm = document.getElementById("form");
    this.#htmlElementInput = document.getElementById("input");
    this.#htmlElementUsersOnline = document.getElementById("usersOnline");
    this.#htmlElementUsersTyping = document.getElementById("typingUsers");

    return this;
  }

  insertMessage(messageObject) {
    const messageTypeMap = {
      common: this.#createMessageOfTypeCommon,
      error: this.#createMessageOfTypeError,
      private: this.#createMessageOfTypePrivate,
      serverEvent: this.#createMessageOfTypeServerEvent,
    };

    const messageFactory =
      messageTypeMap[messageObject.type] || messageTypeMap["common"];
    const item = messageFactory.apply(this, [messageObject]);

    this.#htmlElementMessages.appendChild(item);

    // scroll to the end of the chat
    this.#htmlElementMain.scrollTo(0, this.#htmlElementMain.scrollHeight);

    return this;
  }

  updateUsersTyping(usersTyping) {
    if (!usersTyping.length) {
      this.#htmlElementUsersTyping.innerText = "";
      return this;
    }

    const usersString = usersTyping.join(", ");
    const pluralOrSingular = usersTyping.length > 1 ? "estão" : "está";

    this.#htmlElementUsersTyping.innerText = `${usersString} ${pluralOrSingular} digitando...`;

    return this;
  }

  insertUserInOnlineList(usernameToInsert) {
    const item = document.createElement("li");
    item.id = `onlineList-${usernameToInsert}`;
    item.innerText = usernameToInsert;

    if (usernameToInsert === this.#clientUsername) {
      item.innerText += " (Você)";
    } else {
      item.onclick = () => {
        this.#htmlElementInput.value = `/w ${usernameToInsert} `;
        this.#htmlElementInput.focus();
      };
    }

    this.#htmlElementUsersOnline.appendChild(item);

    return this;
  }

  updateUsersOnlineList(usersArray) {
    for (const user of usersArray) {
      this.insertUserInOnlineList(user);
    }

    return this;
  }

  removeUserFromOnlineList(usernameToRemove) {
    document.getElementById(`onlineList-${usernameToRemove}`)?.remove();

    return this;
  }
}
