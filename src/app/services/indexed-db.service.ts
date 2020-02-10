import { Injectable } from "@angular/core";
import { Subject, Observable } from 'rxjs';
import * as idb from 'idb';
import { Stage } from 'konva/types/Stage';

const DB_NAME = 'luwfy_IDB';

export enum DataStorages {
    BLOCKS = 'blocks',
    FLOWS = 'flows',
    BOARDS = 'boards',
    EVENTS = 'events'
}

@Injectable({
    providedIn: "root"
})

export class IdbService {
    private dataChange: Subject<Stage[]> = new Subject<Stage[]>();
    private localIDB;

    constructor() { }

    async connectionToIdb() {
        this.localIDB = await idb.openDB(DB_NAME, 1, {
            upgrade(localIDB) {
                if (!localIDB.objectStoreNames.contains(DataStorages.BLOCKS)) {
                    localIDB.createObjectStore(DataStorages.BLOCKS, { keyPath: 'id' });
                }
                if (!localIDB.objectStoreNames.contains(DataStorages.FLOWS)) {
                    localIDB.createObjectStore(DataStorages.FLOWS, { keyPath: 'id' });
                }
                if (!localIDB.objectStoreNames.contains(DataStorages.BOARDS)) {
                    localIDB.createObjectStore(DataStorages.BOARDS, { keyPath: 'id' });
                }
                if (!localIDB.objectStoreNames.contains(DataStorages.EVENTS)) {
                    localIDB.createObjectStore(DataStorages.EVENTS, { keyPath: 'dateCreation' });
                }
            }
        })
    }

    async deleteData(target: string, value: number) {
        await this.connectionToIdb();
        const tx = await this.localIDB.transaction(target, 'readwrite');
        const store = tx.objectStore(target);
        await store.delete(value);
    }

    async addData(target: string, value: any) {
        await this.connectionToIdb();
        const tx = await this.localIDB.transaction(target, 'readwrite');
        const store = tx.objectStore(target);
        await store.add(value);
    }

    async getAllData(target: string) {
        await this.connectionToIdb();
        const tx = await this.localIDB.transaction(target, 'readonly');
        const store = tx.objectStore(target);
        return await store.getAll();
    }

    async updateData(target: string, value: any) {
        await this.connectionToIdb();
        const tx = await this.localIDB.transaction(target, 'readwrite');
        const store = tx.objectStore(target);
        await store.put(value);
    }

    dataChanged(): Observable<any> {
        return this.dataChange;
    }
}