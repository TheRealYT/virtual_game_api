import GameLoop, {Statuses, Update} from './GameLoop';
import {Bet} from '../game/GreyhoundRace';
import {ISocket} from './Socket';

export const MIN_BET_AMOUNT = 10;

export default class GameController {
    gameLoop: GameLoop;
    socket: ISocket;

    constructor(gameLoop: GameLoop, socket: ISocket) {
        this.gameLoop = gameLoop;
        this.socket = socket;

        gameLoop.on('update', (update: Update, data?: {}) => {
            // TODO: broadcast
            socket.broadcast({update, data});
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

            if (typeof obj?.amount != 'number' || obj.amount < MIN_BET_AMOUNT)
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