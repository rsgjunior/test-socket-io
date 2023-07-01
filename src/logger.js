export default class Logger {
  constructor(options) {
    this.locale = options?.locale ?? "pt-BR";
    this.timeZone = options?.timeZone ?? "America/Sao_Paulo";
  }

  createLogDate() {
    return new Date().toLocaleString(this.locale, {
      timeZone: this.timeZone,
    });
  }

  log(msg) {
    console.log(`[${this.createLogDate()}] ${msg}`);
  }
}
