import GameLoop from './api/GameLoop';
import GameServer from './api/GameServer';
import Socket from './api/Socket';

const gameLoop = new GameLoop();
const socket = new Socket(undefined, 3000);
const gameServer = new GameServer(gameLoop, socket);

gameServer.init().then(async () => {
    console.log(socket.port);

    await gameLoop.startLoop();
});