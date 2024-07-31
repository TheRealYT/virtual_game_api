import {Response} from 'express';

import GameLoop, {Update} from './GameLoop';
import {ISocket} from './Socket';

export default class GameServer {
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

        socket.app.use('/', (req, res: Response) => {
            res.status(200).send('Hi');
        });
    }

    async init() {
        await this.gameLoop.init();
        await this.socket.start();
    }
}