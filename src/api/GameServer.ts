import express, {Request, Response, NextFunction} from 'express';

import GameLoop, {Update} from './GameLoop';
import {ISocket} from './Socket';
import GameController, {InputError} from './GameController';

export default class GameServer {
    gameLoop: GameLoop;
    socket: ISocket;
    controller: GameController;

    constructor(gameLoop: GameLoop, socket: ISocket, controller = new GameController(gameLoop)) {
        this.gameLoop = gameLoop;
        this.socket = socket;
        this.controller = controller;

        gameLoop.on('update', (update: Update, data?: {}) => {
            socket.broadcast({update, data});
            console.log(update);
        });

        socket.app.use(express.json());

        this.#addController();

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

    #addController() {
        this.socket.app.put('/tickets/place', (req: Request, res: Response, next: NextFunction) => {
            this.controller.placeBet(req.body)
                .then(ticket => res.status(201).json({ticket}))
                .catch(next);
        });

        this.socket.app.get('/races/:raceNumber/prediction', (req: Request, res: Response, next: NextFunction) => {
            const raceNumber = req.params.raceNumber;

            this.controller.getRaceInstance(raceNumber)
                .then(race => res.status(200).json({pre: race.getPrediction().map(d => d.number)}))
                .catch(next);
        });

        this.socket.app.get('/races/:raceNumber', (req: Request, res: Response, next: NextFunction) => {
            const raceNumber = req.params.raceNumber;

            if (raceNumber === 'results')
                return res.status(200).json({results: this.controller.getResults()});

            if (raceNumber === 'next')
                return res.status(200).json({race: this.controller.getNextRace()});

            this.controller.getRace(raceNumber)
                .then(race => res.status(200).json({race}))
                .catch(next);
        });
    }

    async init() {
        await this.gameLoop.init();
        await this.socket.start();
    }
}