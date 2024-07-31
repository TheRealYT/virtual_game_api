import GameLoop from './api/GameLoop';
import GameController from './api/GameController';
import {LiveSocket} from './api/Socket';

const gameLoop = new GameLoop();
const liveSocket = new LiveSocket();
const gameController = new GameController(gameLoop, liveSocket);

liveSocket.start().then(() => {
    console.log(liveSocket.port);

    setTimeout(() => {
        gameLoop.init().then(() => gameLoop.startLoop());
    }, 10_000);
});