import {AddressInfo} from 'node:net';
import {createServer} from 'node:http';

import WebSocket, {WebSocketServer} from 'ws';
import express, {Application} from 'express';

export interface ISocket {
    app: Application;

    start(): Promise<void>;

    broadcast(message: any): void;

    get port(): number;

    get clientsCount(): number;
}

export default class Socket implements ISocket {
    app: Application;

    #server;
    #ws;

    #port;

    constructor(server = createServer(), port: number = 0) {
        this.#port = port;
        this.#server = server;

        this.app = express();
        server.addListener('request', this.app);

        const wss = new WebSocketServer({server});
        wss.on('connection', client => {
            const source = {id: crypto.randomUUID()};
            Object.assign(client, source);

            client.on('error', console.error);
        });
        this.#ws = wss;
    }

    async start(): Promise<void> {
        return new Promise(res => {
            if (this.#server.listening) {
                this.#port = (this.#server.address() as AddressInfo).port;
                return;
            }

            const listen = this.#server.listen(this.port, '127.0.0.1', undefined, () => {
                const data = listen.address() as AddressInfo;
                this.#port = data.port;

                res();
            });
        });
    }

    broadcast(message: any): void {
        for (const client of this.#ws.clients)
            if (client.readyState === WebSocket.OPEN)
                client.send(JSON.stringify(message));
    }

    get port(): number {
        return this.#port;
    }

    get clientsCount(): number {
        return this.#ws.clients.size;
    }
}