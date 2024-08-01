import {EventEmitter} from 'node:events';

import Store, {IStore} from './Store';
import GreyhoundRace, {IRace} from '../game/GreyhoundRace';
import {DELAY_AFTER_END, OLD_GAME_DELAY, PLAY_TIME} from '../game/Constants';

export interface Update {
    name: string;
    status: string;
}

export class Statuses {
    static STATUS_GAME = 'gameStatus';

    static GAME_STARTED: Update = {name: Statuses.STATUS_GAME, status: 'gameStarted'};
    static GAME_ENDED: Update = {name: Statuses.STATUS_GAME, status: 'gameEnded'};
    static BETS_CLOSED: Update = {name: Statuses.STATUS_GAME, status: 'betsClosed'};
    static BETS_OPENED: Update = {name: Statuses.STATUS_GAME, status: 'betsOpened'};
}

export default class GameLoop extends EventEmitter {
    race: IRace;
    store: IStore;
    loop = true;

    #updates: Map<string, { status: string, data: any }> = new Map();

    constructor(race: IRace = new GreyhoundRace(), store: IStore = new Store()) {
        super({captureRejections: true});

        this.race = race;
        this.store = store;
    }

    #emmitUpdate(update: Update, data?: {}) {
        this.#updates.set(update.name, {status: update.status, data});
        this.emit('update', update, data);
    }

    getUpdateStatus(updateName: string): string {
        return this.#updates.get(updateName)?.status ?? 'unknown';
    }

    getUpdateData(updateName: string): any | undefined {
        return this.#updates.get(updateName)?.data;
    }

    getUpdate(updateName: string) {
        return this.#updates.get(updateName);
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
        const startResultTimeout = (timeout = this.race.date.getTime() - Date.now()) => {
            return new Promise(res => {

                setTimeout(async () => {
                    if (!this.race.hasResult()) {
                        this.race.run();
                        await this.save();
                    }

                    res(undefined);
                }, timeout);
            });
        };

        const play = async () => {
            this.#emmitUpdate(Statuses.GAME_STARTED, new Date());
            await new Promise(res => setTimeout(res, PLAY_TIME));

            this.race.played = true;

            const standings = [this.race.result.second, this.race.result.third];
            for (const dog of this.race.dogs.values()) {
                if (dog.number == this.race.result.first) {
                    dog.racesSinceLastWin = 0;
                    dog.racesSinceLastPlace = 0;
                    continue;
                }

                if (standings.includes(dog.number))
                    dog.racesSinceLastPlace = 0;
                else
                    dog.racesSinceLastPlace++;

                dog.racesSinceLastWin++;
            }

            await this.save();
            this.#emmitUpdate(Statuses.GAME_ENDED);
            await new Promise(res => setTimeout(res, DELAY_AFTER_END));
        };

        if (this.race.isClosed()) {
            this.#emmitUpdate(Statuses.BETS_CLOSED);
            await startResultTimeout(OLD_GAME_DELAY);
        } else {
            this.#emmitUpdate(Statuses.BETS_OPENED);
            await startResultTimeout();
            this.#emmitUpdate(Statuses.BETS_CLOSED);
        }

        await play();

        while (this.loop) {
            this.race.nextGame();
            await this.save();
            this.#emmitUpdate(Statuses.BETS_OPENED);
            await startResultTimeout();
            this.#emmitUpdate(Statuses.BETS_CLOSED);
            await play();
        }
    }

    async save() {
        await this.store.save(this.race);
    }
}