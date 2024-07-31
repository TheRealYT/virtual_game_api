import path from 'node:path';
import fss from 'node:fs';
import fs from 'node:fs/promises';

import {IRace} from '../game/GreyhoundRace';

export interface IStore {
    save(race: IRace): Promise<void>;

    load(raceNumber: number): Promise<{}>;

    getAllRaceNumbers(): Promise<number[]>;
}

export default class Store implements IStore {
    private OUT_DIR = path.join(__dirname, 'store');

    async mkdir() {
        if (!fss.existsSync(this.OUT_DIR)) {
            await fs.mkdir(this.OUT_DIR);
        }
    }

    async save(race: IRace): Promise<void> {
        await this.mkdir();

        const outFile = path.join(this.OUT_DIR, `${race.raceNumber}.json`);

        await fs.writeFile(outFile, race.getState(false) as string); // TODO: encrypt
    }

    async load(raceNumber: number): Promise<{}> {
        const filepath = path.join(this.OUT_DIR, raceNumber.toString() + '.json');
        if (!fss.existsSync(filepath)) {
            throw new Error('Race not found');
        }

        try {
            const text = await fs.readFile(filepath);
            return JSON.parse(text.toString()); // TODO: decrypt, validate
        } catch (e) {
            throw new Error('Race store file corrupted, please report to the developer');
        }
    }

    async getAllRaceNumbers(): Promise<number[]> {
        const raceNum: number[] = [];

        if (fss.existsSync(this.OUT_DIR))
            try {
                const files = await fs.readdir(this.OUT_DIR);
                const regExp = new RegExp(/^([0-9]+)\.json$/);

                for (const file of files) {
                    const matches = regExp.exec(file);
                    if (matches == null) continue;

                    raceNum.push(+matches[1]);
                }
            } catch (e) {
            }

        return raceNum.sort((a, b) => a - b);
    }
}