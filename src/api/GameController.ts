import GameLoop, {Statuses} from './GameLoop';
import {Bet} from '../game/GreyhoundRace';

export const MIN_BET_AMOUNT = 10;

export type ControllerMethod = (body: any, gameLoop: GameLoop) => Promise<{}>

export class InputError extends Error {
}

export default class GameController {
    static async placeBet(objs: any, gameLoop: GameLoop): Promise<{}> {
        if (gameLoop.getUpdateStatus(Statuses.STATUS_GAME) != Statuses.BETS_OPENED.status)
            throw new InputError('Bets are closed');

        if (!Array.isArray(objs))
            throw new InputError('Invalid bets');

        const bets: Bet[] = [];

        for (const obj of objs) {
            if (obj?.type !== 'place' && obj?.type !== 'win')
                throw new InputError('Invalid bet type');

            if (typeof obj?.amount != 'number' || obj.amount < MIN_BET_AMOUNT)
                throw new InputError(`Invalid cash amount`);

            if (gameLoop.race.dogs.get(obj.dogNumber) == undefined)
                throw new InputError(`Invalid dog`);

            bets.push({type: obj.type, amount: obj.amount, dogNumber: obj.dogNumber});
        }

        if (bets.length == 0)
            throw new InputError('No bets set');

        const ticket = gameLoop.race.placeBet(bets);
        await gameLoop.save();

        return {ticket};
    }
}