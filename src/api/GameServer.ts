import express, {Request, Response, NextFunction} from 'express';

import GameLoop, {Update} from './GameLoop';
import {ISocket} from './Socket';
import GameController, {ControllerMethod, InputError} from './GameController';

export default class GameServer {
    gameLoop: GameLoop;
    socket: ISocket;

    constructor(gameLoop: GameLoop, socket: ISocket) {
        this.gameLoop = gameLoop;
        this.socket = socket;

        gameLoop.on('update', (update: Update, data?: {}) => {
            socket.broadcast({update, data});
            console.log(update);
        });

        socket.app.use(express.json());

        this.#addController(GameController.placeBet, 'bets/place');

        socket.app.use((_req: Request, res: Response, _next: NextFunction) => {
            res.status(404).send(':( Not found');
        });

        socket.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
            if (err instanceof InputError)
                return res.status(400).json({
                    error: err.message,
                });

            console.error(err);
            res.status(500).send(':( Internal error');
        });
    }

    #addController(method: ControllerMethod, route: string) {
        this.socket.app.post(route, async (req: Request, res: Response, next: NextFunction) => {
            method(req.body, this.gameLoop)
                .then(result => res.status(200).json(result))
                .catch(next);
        });
    }

    async init() {
        await this.gameLoop.init();
        await this.socket.start();
    }
}