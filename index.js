"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/api/GameLoop.ts
var import_node_events = require("node:events");

// src/api/Store.ts
var import_node_path = __toESM(require("node:path"));
var import_node_fs = __toESM(require("node:fs"));
var import_promises = __toESM(require("node:fs/promises"));
var Store = class {
  OUT_DIR = import_node_path.default.join(__dirname, "store");
  async mkdir() {
    if (!import_node_fs.default.existsSync(this.OUT_DIR)) {
      await import_promises.default.mkdir(this.OUT_DIR);
    }
  }
  async save(race) {
    await this.mkdir();
    const outFile = import_node_path.default.join(this.OUT_DIR, `${race.raceNumber}.json`);
    await import_promises.default.writeFile(outFile, race.getState(false));
  }
  async load(raceNumber) {
    const filepath = import_node_path.default.join(this.OUT_DIR, raceNumber.toString() + ".json");
    if (!import_node_fs.default.existsSync(filepath)) {
      throw new Error("Race not found");
    }
    try {
      const text = await import_promises.default.readFile(filepath);
      return JSON.parse(text.toString());
    } catch (e) {
      throw new Error("Race store file corrupted, please report to the developer");
    }
  }
  async getAllRaceNumbers() {
    const raceNum = [];
    if (import_node_fs.default.existsSync(this.OUT_DIR))
      try {
        const files = await import_promises.default.readdir(this.OUT_DIR);
        const regExp = new RegExp(/^([0-9]+)\.json$/);
        for (const file of files) {
          const matches = regExp.exec(file);
          if (matches == null) continue;
          raceNum.push(+matches[1]);
        }
      } catch (e) {
      }
    return raceNum.sort((a, b) => a - b);
  }
};

// node_modules/uuid/dist/esm-node/stringify.js
var byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
  return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}

// node_modules/uuid/dist/esm-node/rng.js
var import_node_crypto = __toESM(require("node:crypto"));
var rnds8Pool = new Uint8Array(256);
var poolPtr = rnds8Pool.length;
function rng() {
  if (poolPtr > rnds8Pool.length - 16) {
    import_node_crypto.default.randomFillSync(rnds8Pool);
    poolPtr = 0;
  }
  return rnds8Pool.slice(poolPtr, poolPtr += 16);
}

// node_modules/uuid/dist/esm-node/v7.js
var _seqLow = null;
var _seqHigh = null;
var _msecs = 0;
function v7(options, buf, offset) {
  options = options || {};
  let i = buf && offset || 0;
  const b = buf || new Uint8Array(16);
  const rnds = options.random || (options.rng || rng)();
  const msecs = options.msecs !== void 0 ? options.msecs : Date.now();
  let seq = options.seq !== void 0 ? options.seq : null;
  let seqHigh = _seqHigh;
  let seqLow = _seqLow;
  if (msecs > _msecs && options.msecs === void 0) {
    _msecs = msecs;
    if (seq !== null) {
      seqHigh = null;
      seqLow = null;
    }
  }
  if (seq !== null) {
    if (seq > 2147483647) {
      seq = 2147483647;
    }
    seqHigh = seq >>> 19 & 4095;
    seqLow = seq & 524287;
  }
  if (seqHigh === null || seqLow === null) {
    seqHigh = rnds[6] & 127;
    seqHigh = seqHigh << 8 | rnds[7];
    seqLow = rnds[8] & 63;
    seqLow = seqLow << 8 | rnds[9];
    seqLow = seqLow << 5 | rnds[10] >>> 3;
  }
  if (msecs + 1e4 > _msecs && seq === null) {
    if (++seqLow > 524287) {
      seqLow = 0;
      if (++seqHigh > 4095) {
        seqHigh = 0;
        _msecs++;
      }
    }
  } else {
    _msecs = msecs;
  }
  _seqHigh = seqHigh;
  _seqLow = seqLow;
  b[i++] = _msecs / 1099511627776 & 255;
  b[i++] = _msecs / 4294967296 & 255;
  b[i++] = _msecs / 16777216 & 255;
  b[i++] = _msecs / 65536 & 255;
  b[i++] = _msecs / 256 & 255;
  b[i++] = _msecs & 255;
  b[i++] = seqHigh >>> 4 & 15 | 112;
  b[i++] = seqHigh & 255;
  b[i++] = seqLow >>> 13 & 63 | 128;
  b[i++] = seqLow >>> 5 & 255;
  b[i++] = seqLow << 3 & 255 | rnds[10] & 7;
  b[i++] = rnds[11];
  b[i++] = rnds[12];
  b[i++] = rnds[13];
  b[i++] = rnds[14];
  b[i++] = rnds[15];
  return buf || unsafeStringify(b);
}
var v7_default = v7;

// src/game/Maths.ts
function getPermutations(array) {
  const results = [];
  function permute(arr, m = []) {
    if (arr.length === 0) {
      results.push(m);
    } else {
      for (let i = 0; i < arr.length; i++) {
        const current = arr.slice();
        const next = current.splice(i, 1);
        permute(current.slice(), m.concat(next));
      }
    }
  }
  permute(array);
  return results;
}
function getCombinations(array, size) {
  const results = [];
  function combine(arr, combination, start, depth) {
    if (depth === 0) {
      results.push([...combination]);
      return;
    }
    for (let i = start; i <= arr.length - depth; i++) {
      combination.push(arr[i]);
      combine(arr, combination, i + 1, depth - 1);
      combination.pop();
    }
  }
  combine(array, [], 0, size);
  return results;
}
function getWinnerOrders(array, size) {
  const combinations = getCombinations(array, size);
  const winnerOrders = [];
  combinations.forEach((combination) => {
    const permutations = getPermutations(combination);
    winnerOrders.push(...permutations);
  });
  return winnerOrders;
}

// src/game/GreyhoundRace.ts
var Race = class {
  static calculateStat(result, dogs, tickets) {
    for (const ticket of tickets) {
      let payout = 0;
      for (const bet of ticket.bets) {
        switch (bet.type) {
          case "win":
            if (bet.dogNumber === result.first) {
              payout += Math.round(bet.amount * dogs.get(bet.dogNumber).winOdd);
            }
            break;
          case "place":
            if ([result.first, result.second, result.third].includes(bet.dogNumber)) {
              payout += Math.round(bet.amount * dogs.get(bet.dogNumber).placeOdd);
            }
            break;
        }
      }
      if (payout > 0) {
        result.winnersCount++;
        result.totalAmount += payout;
      }
    }
    return result;
  }
};
var GreyhoundRace = class {
  raceNumber = 100;
  systemBalance = 0;
  betDuration;
  date;
  dogs = /* @__PURE__ */ new Map();
  tickets = /* @__PURE__ */ new Map();
  result = { first: 0, second: 0, third: 0, winnersCount: 0, totalAmount: 0 };
  played = false;
  constructor(betDuration = 3 * 60 * 1e3) {
    this.betDuration = betDuration;
    this.date = new Date(Date.now() + this.betDuration);
    const dogs = [
      {
        number: 1,
        name: "Calypso Delivery",
        formRating: 3.91,
        winOdd: 3.91,
        placeOdd: 1.91,
        racesSinceLastWin: 1,
        racesSinceLastPlace: 1
      },
      {
        number: 2,
        name: "Eternal Beach",
        formRating: 7.22,
        winOdd: 3.05,
        placeOdd: 1.55,
        racesSinceLastWin: 2,
        racesSinceLastPlace: 3
      },
      {
        number: 3,
        name: "Dawn Caballito",
        formRating: 4.67,
        winOdd: 4.67,
        placeOdd: 2.67,
        racesSinceLastWin: 3,
        racesSinceLastPlace: 5
      },
      {
        number: 4,
        name: "Black Strawberry",
        formRating: 5.5,
        winOdd: 2.5,
        placeOdd: 1.5,
        racesSinceLastWin: 4,
        racesSinceLastPlace: 4
      },
      {
        number: 5,
        name: "Fantasia Slayer",
        formRating: 6.79,
        winOdd: 1.79,
        placeOdd: 1.29,
        racesSinceLastWin: 1,
        racesSinceLastPlace: 2
      },
      {
        number: 6,
        name: "Century Power",
        formRating: 3.14,
        winOdd: 2.14,
        placeOdd: 1.14,
        racesSinceLastWin: 5,
        racesSinceLastPlace: 3
      }
    ];
    for (const dog of dogs)
      this.dogs.set(dog.number, dog);
  }
  run(decider) {
    const dogNumbers = Array.from(this.dogs.values()).map((v) => v.number);
    const combinations = getWinnerOrders(dogNumbers, 3);
    const stats = combinations.map(([first, second, third]) => {
      return Race.calculateStat({
        first,
        second,
        third,
        winnersCount: 0,
        totalAmount: 0
      }, this.dogs, Array.from(this.tickets.values()));
    });
    stats.sort((a, b) => a.totalAmount - b.totalAmount);
    this.result = decider != void 0 ? decider.decide(this.dogs, stats) : stats[0];
    this.systemBalance -= this.result.totalAmount;
  }
  nextGame() {
    this.raceNumber++;
    this.played = false;
    this.date = new Date(Date.now() + this.betDuration);
    this.tickets.clear();
    this.result = { first: 0, second: 0, third: 0, totalAmount: 0, winnersCount: 0 };
  }
  placeBet(bets) {
    const ticket = { id: v7_default(), bets };
    this.tickets.set(ticket.id, ticket);
    bets.forEach((v) => this.systemBalance += v.amount);
    return ticket;
  }
  getPrediction() {
    return Array.from(this.dogs.values()).slice().sort((a, b) => a.winOdd - b.winOdd);
  }
  getState(raw = false) {
    const value = {
      date: this.date,
      raceNumber: this.raceNumber,
      systemBalance: this.systemBalance,
      dogs: Array.from(this.dogs.values()),
      tickets: Array.from(this.tickets.values()),
      result: this.result,
      played: this.played
    };
    if (raw)
      return value;
    return JSON.stringify(value);
  }
  loadState(prev) {
    if (typeof prev != "object") return false;
    if (prev?.played === true)
      this.played = true;
    if (typeof prev?.raceNumber == "number")
      this.raceNumber = prev.raceNumber;
    if (typeof prev?.systemBalance == "number")
      this.systemBalance = prev.systemBalance;
    if (Array.isArray(prev?.dogs)) {
      this.dogs.clear();
      for (const dog of prev.dogs)
        this.dogs.set(dog.number, dog);
    }
    if (Array.isArray(prev?.tickets)) {
      this.tickets.clear();
      for (const ticket of prev.tickets)
        this.tickets.set(ticket.id, ticket);
    }
    if (typeof prev?.result == "object")
      this.result = prev.result;
    this.date = new Date(prev?.date);
    return true;
  }
  isClosed() {
    return Date.now() >= this.date.getTime();
  }
  isEnded() {
    return this.played && this.hasResult();
  }
  hasResult() {
    return ![this.result.first, this.result.second, this.result.third].includes(0);
  }
};

// src/api/GameLoop.ts
var Statuses = class _Statuses {
  static STATUS_GAME = "gameStatus";
  static GAME_STARTED = { name: _Statuses.STATUS_GAME, status: "gameStarted" };
  static GAME_ENDED = { name: _Statuses.STATUS_GAME, status: "gameEnded" };
  static BETS_CLOSED = { name: _Statuses.STATUS_GAME, status: "betsClosed" };
  static BETS_OPENED = { name: _Statuses.STATUS_GAME, status: "betsOpened" };
};
var GameLoop = class extends import_node_events.EventEmitter {
  race;
  store;
  loop = true;
  #updates = /* @__PURE__ */ new Map();
  constructor(race = new GreyhoundRace(), store = new Store()) {
    super({ captureRejections: true });
    this.race = race;
    this.store = store;
  }
  #emmitUpdate(update, data) {
    this.#updates.set(update.name, update.status);
    this.emit("update", update, data);
  }
  getUpdateStatus(updateName) {
    return this.#updates.get(updateName) ?? "unknown";
  }
  async init() {
    const raceNum = await this.store.getAllRaceNumbers();
    let isNew = false;
    try {
      if (raceNum.length > 0) {
        const data = await this.store.load(raceNum.at(-1));
        if (data != null && this.race.loadState(data) && this.race.isEnded()) {
          this.race.nextGame();
          isNew = true;
        }
      } else isNew = true;
    } catch (e) {
      isNew = true;
    }
    if (isNew)
      await this.store.save(this.race);
  }
  async startLoop() {
    const save = () => this.store.save(this.race);
    const startResultTimeout = (timeout = this.race.date.getTime() - Date.now()) => {
      return new Promise((res) => {
        setTimeout(async () => {
          this.race.run();
          await save();
          res(void 0);
        }, timeout);
      });
    };
    const play = async () => {
      this.#emmitUpdate(Statuses.GAME_STARTED);
      await new Promise((res) => setTimeout(res, 3e3));
      this.race.played = true;
      await save();
      this.#emmitUpdate(Statuses.GAME_ENDED);
    };
    if (this.race.isClosed() && !this.race.hasResult()) {
      this.#emmitUpdate(Statuses.BETS_CLOSED);
      await startResultTimeout(1e4);
    } else {
      this.#emmitUpdate(Statuses.BETS_OPENED);
      await startResultTimeout();
      this.#emmitUpdate(Statuses.BETS_CLOSED);
    }
    await play();
    while (this.loop) {
      this.race.nextGame();
      await save();
      this.#emmitUpdate(Statuses.BETS_OPENED);
      await startResultTimeout();
      this.#emmitUpdate(Statuses.BETS_CLOSED);
      await play();
    }
  }
};

// src/api/GameController.ts
var MIN_BET_AMOUNT = 10;
var GameController = class {
  gameLoop;
  constructor(gameLoop2) {
    this.gameLoop = gameLoop2;
    gameLoop2.on("update", (update, data) => {
      console.log(update);
    });
  }
  placeBet(objs) {
    if (this.gameLoop.getUpdateStatus(Statuses.STATUS_GAME) != Statuses.BETS_OPENED.status)
      throw new Error("Bets are closed");
    if (!Array.isArray(objs))
      throw new Error("Invalid bets");
    const bets = [];
    for (const obj of objs) {
      if (obj?.type !== "place" && obj?.type !== "win")
        throw new Error("Invalid bet type");
      if (typeof obj?.amount != "number" || obj.amount < MIN_BET_AMOUNT)
        throw new Error(`Invalid cash amount`);
      if (this.gameLoop.race.dogs.get(obj.dogNumber) == void 0)
        throw new Error(`Invalid dog`);
      bets.push({ type: obj.type, amount: obj.amount, dogNumber: obj.dogNumber });
    }
    if (bets.length == 0)
      throw new Error("No bets set");
    return this.gameLoop.race.placeBet(bets);
  }
};

// src/main.ts
var gameLoop = new GameLoop();
var gameAPI = new GameController(gameLoop);
gameLoop.init().then(() => gameLoop.startLoop());
