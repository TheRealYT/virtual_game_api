import GameLoop from './api/GameLoop';
import GameServer from './api/GameServer';
import Socket from './api/Socket';

const gameLoop = new GameLoop();
const socket = new Socket();
const gameServer = new GameServer(gameLoop, socket);

gameServer.init().then(async () => {
    console.log(socket.port);

    await gameLoop.startLoop();
});