import GameLoop from './api/GameLoop';
import GameController from './api/GameController';

const gameLoop = new GameLoop();
const gameAPI = new GameController(gameLoop);

gameLoop.init().then(() => gameLoop.startLoop());