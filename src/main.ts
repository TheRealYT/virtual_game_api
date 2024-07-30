import {EventEmitter} from 'node:events';

import GreyhoundRace, {Bet, IRace} from './game/GreyhoundRace';
import Store, {IStore} from './Store';

const MIN = 10;

interface Update {
    name: string;
    status: string;
}

class Statuses {
    static STATUS_GAME = 'gameStatus';

    static GAME_STARTED: Update = {name: Statuses.STATUS_GAME, status: 'gameStarted'};
    static GAME_ENDED: Update = {name: Statuses.STATUS_GAME, status: 'gameEnded'};
    static BETS_CLOSED: Update = {name: Statuses.STATUS_GAME, status: 'betsClosed'};
    static BETS_OPENED: Update = {name: Statuses.STATUS_GAME, status: 'betsOpened'};
}

class GameLoop extends EventEmitter {
    race: IRace;
    store: IStore;
    loop = true;

    #updates: Map<string, string> = new Map();

    constructor(race: IRace = new GreyhoundRace(), store: IStore = new Store()) {
        super({captureRejections: true});

        this.race = race;
        this.store = store;
    }

    #emmitUpdate(update: Update, data?: {}) {
        this.#updates.set(update.name, update.status);
        this.emit('update', update, data);
    }

    getUpdateStatus(updateName: string): string {
        return this.#updates.get(updateName) ?? 'unknown';
    }

    async init() {
        const raceNum = await this.store.getAllRaceNumbers();
        let isNew = false;

        try {
            if (raceNum.length > 0) {
                const data = await this.store.load(raceNum.at(-1) as number);

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
            return new Promise(res => {

                setTimeout(async () => {
                    this.race.run();
                    await save();

                    res(undefined);
                }, timeout);
            });
        };

        const play = async () => {
            this.#emmitUpdate(Statuses.GAME_STARTED);
            // TODO: play video, stream, or emmit duration
            await new Promise(res => setTimeout(res, 3_000));

            this.race.played = true;
            await save();
            this.#emmitUpdate(Statuses.GAME_ENDED);
        };

        if (this.race.isClosed() && !this.race.hasResult()) {
            this.#emmitUpdate(Statuses.BETS_CLOSED);
            await startResultTimeout(10_000);
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
}

class GameAPI {
    gameLoop: GameLoop;

    constructor(gameLoop: GameLoop) {
        this.gameLoop = gameLoop;
        gameLoop.on('update', (update: Update, data?: {}) => {
            // TODO: broadcast
            console.log(update);
        });
    }

    placeBet(objs: any) {
        if (this.gameLoop.getUpdateStatus(Statuses.STATUS_GAME) != Statuses.BETS_OPENED.status)
            throw new Error('Bets are closed');

        if (!Array.isArray(objs))
            throw new Error('Invalid bets');

        const bets: Bet[] = [];

        for (const obj of objs) {
            if (obj?.type !== 'place' && obj?.type !== 'win')
                throw new Error('Invalid bet type');

            if (typeof obj?.amount != 'number' || obj.amount < MIN)
                throw new Error(`Invalid cash amount`);

            if (this.gameLoop.race.dogs.get(obj.dogNumber) == undefined)
                throw new Error(`Invalid dog`);

            bets.push({type: obj.type, amount: obj.amount, dogNumber: obj.dogNumber});
        }

        if (bets.length == 0)
            throw new Error('No bets set');

        return this.gameLoop.race.placeBet(bets);
    }
}

const gameLoop = new GameLoop();
const gameAPI = new GameAPI(gameLoop);

gameLoop.init().then(() => gameLoop.startLoop());