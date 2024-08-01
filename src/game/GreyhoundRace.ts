import {v7 as uuid} from 'uuid';

import {getWinnerOrders} from './Maths';
import {BET_OPEN_TIME} from './Constants';

export interface DogInfo {
    number: number;
    name: string;
    formRating: number;
    winOdd: number;
    placeOdd: number;
    racesSinceLastWin: number;
    racesSinceLastPlace: number;
}

export interface Result {
    first: number;
    second: number;
    third: number;
    raceNumber: number,
}

export interface RaceResult {
    first: number;
    second: number;
    third: number;
    winnersCount: number,
    totalAmount: number
}

export interface Bet {
    type: 'win' | 'place';
    dogNumber: number;
    amount: number;
    date?: Date;
}

export interface Ticket {
    id: string;
    bets: Bet[];
}

export interface IDecision {
    decide(dogs: Dogs, results: RaceResult[]): RaceResult;
}

export type RaceState = {
    date: Date,
    raceNumber: number,
    systemBalance: number,
    dogs: DogInfo[],
    tickets: Ticket[],
    result: RaceResult,
    played: boolean
};

export interface IRace {
    raceNumber: number;
    systemBalance: number;
    played: boolean;
    date: Date;
    dogs: Dogs;
    tickets: Tickets;
    result: RaceResult;

    run(decider?: IDecision): void;

    placeBet(bets: Bet[]): Ticket;

    getPrediction(): DogInfo[];

    getState(raw?: boolean): string | RaceState;

    loadState(prev: any): boolean;

    nextGame(): void;

    isClosed(): boolean;

    isEnded(): boolean;

    hasResult(): boolean;
}

export class Race {
    static calculateStat(result: RaceResult, dogs: Dogs, tickets: Ticket[]): RaceResult {
        for (const ticket of tickets) {
            let payout = 0;

            for (const bet of ticket.bets) {
                switch (bet.type) {
                    case 'win':
                        if (bet.dogNumber === result.first) {
                            payout += Math.round(bet.amount * dogs.get(bet.dogNumber)!.winOdd);
                        }
                        break;
                    case 'place':
                        if ([result.first, result.second, result.third].includes(bet.dogNumber)) {
                            payout += Math.round(bet.amount * dogs.get(bet.dogNumber)!.placeOdd);
                        }
                        break;
                }
            }

            if (payout > 0) {
                result.winnersCount++;
                result.totalAmount += payout;
            }
        }

        return result;
    }
}

type Dogs = Map<number, DogInfo>;

type Tickets = Map<string, Ticket>;

export default class GreyhoundRace implements IRace {
    raceNumber: number = 100;
    systemBalance: number = 0;
    date: Date;
    dogs: Dogs = new Map();
    tickets: Tickets = new Map();
    result: RaceResult = {first: 0, second: 0, third: 0, winnersCount: 0, totalAmount: 0};
    played = false;

    constructor() {
        this.date = new Date(Date.now() + BET_OPEN_TIME);

        const dogs = [
            {
                number: 1,
                name: 'Calypso Delivery',
                formRating: 3.91,
                winOdd: 3.91,
                placeOdd: 1.91,
                racesSinceLastWin: 0,
                racesSinceLastPlace: 0,
            },
            {
                number: 2,
                name: 'Eternal Beach',
                formRating: 7.22,
                winOdd: 3.05,
                placeOdd: 1.55,
                racesSinceLastWin: 0,
                racesSinceLastPlace: 0,
            },
            {
                number: 3,
                name: 'Dawn Caballito',
                formRating: 4.67,
                winOdd: 4.67,
                placeOdd: 2.67,
                racesSinceLastWin: 0,
                racesSinceLastPlace: 0,
            },
            {
                number: 4,
                name: 'Black Strawberry',
                formRating: 5.50,
                winOdd: 2.50,
                placeOdd: 1.50,
                racesSinceLastWin: 0,
                racesSinceLastPlace: 0,
            },
            {
                number: 5,
                name: 'Fantasia Slayer',
                formRating: 6.79,
                winOdd: 1.79,
                placeOdd: 1.29,
                racesSinceLastWin: 0,
                racesSinceLastPlace: 0,
            },
            {
                number: 6,
                name: 'Century Power',
                formRating: 3.14,
                winOdd: 2.14,
                placeOdd: 1.14,
                racesSinceLastWin: 0,
                racesSinceLastPlace: 0,
            },
        ];

        for (const dog of dogs)
            this.dogs.set(dog.number, dog);
    }

    run(decider?: IDecision | undefined): void {
        const dogNumbers = Array.from(this.dogs.values()).map(v => v.number);
        const combinations = getWinnerOrders(dogNumbers, 3);

        const stats = combinations.map(([first, second, third]) => {
            return Race.calculateStat({
                first, second, third,
                winnersCount: 0,
                totalAmount: 0,
            }, this.dogs, Array.from(this.tickets.values()));
        });

        stats.sort((a, b) => a.totalAmount - b.totalAmount);

        this.result = decider != undefined ? decider.decide(this.dogs, stats) : stats[0];

        this.systemBalance -= this.result.totalAmount;
    }

    nextGame() {
        this.raceNumber++;
        this.played = false;
        this.date = new Date(Date.now() + BET_OPEN_TIME);
        this.tickets.clear();
        this.result = {first: 0, second: 0, third: 0, totalAmount: 0, winnersCount: 0};
    }

    placeBet(bets: Bet[]): Ticket {
        const ticket = {id: uuid(), bets};
        this.tickets.set(ticket.id, ticket);

        bets.forEach(v => this.systemBalance += v.amount);

        return ticket;
    }

    getPrediction(): DogInfo[] {
        return Array.from(this.dogs.values()).slice().sort((a, b) => a.winOdd - b.winOdd);
    }

    getState(raw = false) {
        const value = {
            date: this.date,
            raceNumber: this.raceNumber,
            systemBalance: this.systemBalance,
            dogs: Array.from(this.dogs.values()),
            tickets: Array.from(this.tickets.values()),
            result: this.result,
            played: this.played,
        };

        if (raw)
            return value;

        return JSON.stringify(value);
    }

    loadState(prev: any): boolean {
        if (typeof prev != 'object') return false;

        if (prev?.played === true)
            this.played = true;

        if (typeof prev?.raceNumber == 'number')
            this.raceNumber = prev.raceNumber;

        if (typeof prev?.systemBalance == 'number')
            this.systemBalance = prev.systemBalance;

        if (Array.isArray(prev?.dogs) && prev.dogs.length === 6) {
            this.dogs.clear();

            for (const dog of prev.dogs)
                this.dogs.set(dog.number, dog);
        }

        if (Array.isArray(prev?.tickets)) {
            this.tickets.clear();

            for (const ticket of prev.tickets)
                this.tickets.set(ticket.id, ticket);
        }

        if (typeof prev?.result == 'object')
            this.result = prev.result;

        this.date = new Date(prev?.date);

        return true;
    }

    isClosed(): boolean {
        return Date.now() >= this.date.getTime();
    }

    isEnded(): boolean {
        return this.played && this.hasResult();
    }

    hasResult() {
        return ![this.result.first, this.result.second, this.result.third].includes(0);
    }
}