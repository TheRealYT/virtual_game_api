import {createServer} from 'http';
import {WebSocketServer} from 'ws';
import {AddressInfo} from 'node:net';

export interface ISocket {
    start(): Promise<void>;

    broadcast(message: any): void;

    get port(): number;

    get clientsCount(): number;
}

export class LiveSocket implements ISocket {
    #server;
    #ws;
    #port: number = 0;

    constructor(server = createServer()) {
        const wss = new WebSocketServer({server});
        this.#server = server;
        this.#ws = wss;

        wss.on('connection', client => {
            const source = {id: crypto.randomUUID()};
            Object.assign(client, source);

            client.on('error', console.error);
        });
    }

    async start(): Promise<void> {
        return new Promise(res => {
            if (this.#server.listening) {
                this.#port = (this.#server.address() as AddressInfo).port;
            }

            const listen = this.#server.listen(undefined, '127.0.0.1', undefined, () => {
                const data = listen.address() as AddressInfo;
                this.#port = data.port;

                res();
            });
        });
    }

    broadcast(message: any): void {
        for (const client of this.#ws.clients)
            client.send(JSON.stringify(message));
    }

    get port(): number {
        return this.#port;
    }

    get clientsCount(): number {
        return this.#ws.clients.size;
    }
}