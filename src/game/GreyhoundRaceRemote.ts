import {Bet, DogInfo, Ticket} from './GreyhoundRace';

export class GreyhoundRaceRemote {
    raceNumber: number;
    date: Date;
    dogs: DogInfo[];

    constructor(raceNumber: number, date: Date, dogs: DogInfo[]) {
        this.raceNumber = raceNumber;
        this.date = date;
        this.dogs = dogs;
    }

    async placeBet(bets: Bet[]): Promise<Ticket> {
        // @ts-ignore
        return await ipcRenderer.invoke('bet:place', bets) as Ticket;
    }

    async getPrediction(): Promise<DogInfo[]> {
        // @ts-ignore
        return await ipcRenderer.invoke('pre:get') as DogInfo[];
    }
}