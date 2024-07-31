import GameLoop, {Statuses} from './GameLoop';
import GreyhoundRace, {Bet, IRace, RaceState, Result, Ticket} from '../game/GreyhoundRace';

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

    async getRace(raceNumber: string): Promise<{}> {
        const race = (await this.getRaceInstance(raceNumber)).getState(true) as RaceState;

        return {
            date: race.date,
            raceNumber: race.raceNumber,
            dogs: race.dogs,
        };
    }

    async getRaceInstance(raceNumber: string): Promise<IRace> {
        if (!/^[0-9]+$/.test(raceNumber))
            throw new InputError('Invalid race number');

        if (raceNumber != 'current' && raceNumber != this.gameLoop.race.raceNumber.toString()) {
            const state = await this.gameLoop.store.load(+raceNumber);
            const greyhoundRace = new GreyhoundRace();

            if (!greyhoundRace.loadState(state))
                throw new InputError('Race not loaded');

            return greyhoundRace;
        }

        return this.gameLoop.race;
    }

    getNextRace() {
        const race = this.gameLoop.race.getState(true) as RaceState;

        return {
            date: race.date,
            raceNumber: race.raceNumber + 1,
            dogs: race.dogs,
        };
    }

    getResults(): Result[] {
        return [];
    }
}