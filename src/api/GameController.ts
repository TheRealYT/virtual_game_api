import GameLoop, {Statuses} from './GameLoop';
import GreyhoundRace, {Bet, IRace, Result, Ticket} from '../game/GreyhoundRace';
import {BET_OPEN_TIME, DELAY_AFTER_END, OLD_GAME_DELAY, PLAY_TIME} from '../game/Constants';

export const MIN_BET_AMOUNT = 10;

export class InputError extends Error {
}

export default class GameController {
    gameLoop: GameLoop;

    constructor(gameLoop: GameLoop) {
        this.gameLoop = gameLoop;
    }

    async placeBet(objs: any): Promise<Ticket> {
        if (this.gameLoop.getUpdateStatus(Statuses.STATUS_GAME) != Statuses.BETS_OPENED.status)
            throw new InputError('Bets are closed');

        if (!Array.isArray(objs))
            throw new InputError('Invalid bets');

        const bets: Bet[] = [];

        for (const obj of objs) {
            if (obj?.type !== 'place' && obj?.type !== 'win')
                throw new InputError('Invalid bet type');

            if (typeof obj?.amount != 'number' || obj.amount < MIN_BET_AMOUNT)
                throw new InputError(`Invalid cash amount`);

            if (this.gameLoop.race.dogs.get(obj.dogNumber) == undefined)
                throw new InputError(`Invalid dog`);

            bets.push({type: obj.type, amount: obj.amount, dogNumber: obj.dogNumber});
        }

        if (bets.length == 0)
            throw new InputError('No bets set');

        const ticket = this.gameLoop.race.placeBet(bets);
        await this.gameLoop.save();

        return ticket;
    }

    async getRaceInstance(raceNumber: string): Promise<IRace> {
        if (raceNumber == 'current' || raceNumber == this.gameLoop.race.raceNumber.toString())
            return this.gameLoop.race;

        if (raceNumber == 'next')
            return await this.getNextRace();

        if (!(/^[0-9]+$/).test(raceNumber))
            throw new InputError('Invalid race number');

        const state = await this.gameLoop.store.load(+raceNumber);
        const greyhoundRace = new GreyhoundRace();

        if (!greyhoundRace.loadState(state))
            throw new InputError('Race not loaded');

        return greyhoundRace;
    }

    async getNextRace(): Promise<IRace> {
        const nextRace = new GreyhoundRace();
        nextRace.date = new Date(this.gameLoop.race.date.getTime() + BET_OPEN_TIME + PLAY_TIME + DELAY_AFTER_END + OLD_GAME_DELAY);
        nextRace.raceNumber = this.gameLoop.race.raceNumber + 1;

        return nextRace;
    }

    getResults(): Result[] {
        return [];
    }

    async getVideo(): Promise<string> {
        if (this.gameLoop.getUpdateStatus(Statuses.STATUS_GAME) != Statuses.GAME_STARTED.status)
            throw new InputError('Game is not started');

        return `${this.gameLoop.race.result.first}${this.gameLoop.race.result.second}${this.gameLoop.race.result.third}`;
    }
}