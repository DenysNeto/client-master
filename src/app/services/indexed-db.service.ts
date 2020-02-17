import { Injectable } from "@angular/core";
import { openDB, deleteDB } from 'idb';
import { DataStorages } from './indexed-db.interface';

const DB_NAME = 'luwfy_IDB';
const VERSION = 1;

@Injectable({
    providedIn: "root"
})

export class IdbService {
    private localIDB;

    constructor() { }

    async connectionToIdb() {
        this.localIDB = await openDB(DB_NAME, VERSION, {
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
                if (!localIDB.objectStoreNames.contains(DataStorages.CATEGORIES)) {
                    localIDB.createObjectStore(DataStorages.CATEGORIES, { keyPath: 'id' });
                }
                if (!localIDB.objectStoreNames.contains(DataStorages.IMAGES)) {
                    localIDB.createObjectStore(DataStorages.IMAGES, { keyPath: 'id' });
                }
                if (!localIDB.objectStoreNames.contains(DataStorages.COLORS)) {
                    localIDB.createObjectStore(DataStorages.COLORS, { keyPath: 'id' });
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
            store.add(value);
        } catch (error) {
            console.log(error.message + ' / ID: ' + value.id + ' / Store: ' + target);
        }
    }

    async getDataByKey(target: string, key: any) {
        await this.connectionToIdb();
        const tx = await this.localIDB.transaction(target, 'readonly');
        const store = tx.objectStore(target);
        return store.get(key);
    }

    async getStoreFromIDBByNameAndClear(storeName: string) {
        await this.connectionToIdb();
        const tx = await this.localIDB.transaction(storeName, 'readwrite');
        console.log('tx', tx);
        return tx ? await tx.objectStore(storeName).clear() : -1;


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

    async getAllDataObjectsFromDatabase() {
        await this.connectionToIdb();
        return this.localIDB.objectStoreNames;
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
