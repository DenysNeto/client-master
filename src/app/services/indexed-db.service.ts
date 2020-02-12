import { Injectable } from "@angular/core";
import { openDB, deleteDB } from 'idb';

const DB_NAME = 'luwfy_IDB';

export interface FlowBlock {
    id: number,
    pallete_elem_id: string,
    board_id: number,
    x: number,
    y: number,
    width: number,
    height: number
}

export interface FlowPort {
    id: number,
    type: string,
    block_id: number,
    x: number,
    y: number
}

export interface FlowRelation {
    start_port_id: number,
    end_port_id: number
}

export interface Board {
    id: number,
    name: string,
    x: number,
    y: number,
    width: number,
    height: number
}

export enum DataStorages {
    PALLETE_ELEMENTS = 'pallete_elements',
    FLOW_BLOCKS = 'flow_blocks',
    FLOW_PORTS = 'flow_ports',
    FLOW_RELATIONS = 'flow_relations',
    BOARDS = 'boards',
    EVENTS = 'events'
}

@Injectable({
    providedIn: "root"
})

export class IdbService {
    private localIDB;

    constructor() { }

    async connectionToIdb() {
        this.localIDB = await openDB(DB_NAME, 1, {
            upgrade(localIDB) {
                if (!localIDB.objectStoreNames.contains(DataStorages.PALLETE_ELEMENTS)) {
                    localIDB.createObjectStore(DataStorages.PALLETE_ELEMENTS, { keyPath: 'id' });
                }
                if (!localIDB.objectStoreNames.contains(DataStorages.FLOW_BLOCKS)) {
                    localIDB.createObjectStore(DataStorages.FLOW_BLOCKS, { keyPath: 'id' });
                }
                if (!localIDB.objectStoreNames.contains(DataStorages.FLOW_PORTS)) {
                    localIDB.createObjectStore(DataStorages.FLOW_PORTS, { keyPath: 'id' });
                }
                if (!localIDB.objectStoreNames.contains(DataStorages.FLOW_RELATIONS)) {
                    localIDB.createObjectStore(DataStorages.FLOW_RELATIONS, { keyPath: 'id' });
                }
                if (!localIDB.objectStoreNames.contains(DataStorages.BOARDS)) {
                    localIDB.createObjectStore(DataStorages.BOARDS, { keyPath: 'id' });
                }
                if (!localIDB.objectStoreNames.contains(DataStorages.EVENTS)) {
                    localIDB.createObjectStore(DataStorages.EVENTS, { keyPath: 'id' });
                }
            },
            blocked() {
                console.log('Was closed');
            }
        });
    }

    async deleteData(target: string, value: number) {
        await this.connectionToIdb();
        const tx = await this.localIDB.transaction(target, 'readwrite');
        const store = tx.objectStore(target);
        await store.delete(value);
    }

    async addData(target: string, value: any) {
        try {
            await this.connectionToIdb();
            const tx = await this.localIDB.transaction(target, 'readwrite');
            const store = tx.objectStore(target);
            await store.add(value);
        } catch (error) {
            console.log(error.message + ' / ID: ' + value.id + ' / Store: ' + target);
        }
    }

    async getDataByKey(target: string, key: any) {
        await this.connectionToIdb();
        const tx = await this.localIDB.transaction(target, 'readonly');
        const store = tx.objectStore(target);
        return await store.get(key);
    }

    async checkIsKeyExist(target: string, key: any) {
        await this.connectionToIdb();
        const tx = await this.localIDB.transaction(target, 'readonly');
        const store = tx.objectStore(target);
        return store.count(key);
    }

    async getAllData(target: string) {
        await this.connectionToIdb();
        const tx = await this.localIDB.transaction(target, 'readonly');
        const store = tx.objectStore(target);
        return store.getAll();
    }

    async updateData(target: string, value: any) {
        await this.connectionToIdb();
        const tx = await this.localIDB.transaction(target, 'readwrite');
        const store = tx.objectStore(target);
        await store.put(value);
    }

    async deleteDB() {
        await deleteDB(DB_NAME, {});
    }
}