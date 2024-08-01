import express, {Request, Response, NextFunction} from 'express';

import GameLoop, {Update} from './GameLoop';
import {ISocket} from './Socket';
import GameController, {InputError} from './GameController';
import {IRace, RaceState} from '../game/GreyhoundRace';

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
        this.socket.app.get('/race/watch', (_req: Request, res: Response, next: NextFunction) => {
            this.controller.getVideo()
                .then(stream => res.status(200).json({stream}))
                .catch(next);
        });

        this.socket.app.put('/tickets/place', (req: Request, res: Response, next: NextFunction) => {
            this.controller.placeBet(req.body)
                .then(ticket => res.status(201).json({
                    ticket: btoa(`${ticket.id}${this.gameLoop.race.raceNumber}`),
                }))
                .catch(next);
        });

        this.socket.app.get('/races/results', (_req: Request, res: Response) => {
            res.status(200).json({results: this.controller.getResults()});
        });

        this.socket.app.get('/races/:raceNumber/:param?', (req: Request, res: Response, next: NextFunction) => {
            const raceNumber = req.params.raceNumber;
            this.controller.getRaceInstance(raceNumber)
                .then(race => {
                    Object.defineProperty(req, 'race', {value: race});

                    const state = race.getState(true) as RaceState;

                    if (req.params.param === undefined)
                        return res.status(200).json({
                            race: {
                                date: state.date,
                                raceNumber: state.raceNumber,
                                dogs: state.dogs,
                            },
                        });

                    next();
                })
                .catch(next);
        });

        this.socket.app.get('/races/:raceNumber/prediction', (req: Request, res: Response) => {
            res.status(200).json({pre: ((req as any).race as IRace).getPrediction().map(d => d.number)});
        });

        this.socket.app.get('/races/:raceNumber/standing', (req: Request, res: Response) => {
            const race = (req as any).race as IRace;
            const standing: number[] = [];

            if (race.played && race.hasResult())
                standing.push(race.result.first, race.result.second, race.result.third);

            res.status(200).json({standing});
        });
    }

    async init() {
        await this.gameLoop.init();
        await this.socket.start();
    }
}