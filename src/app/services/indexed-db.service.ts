import { Injectable } from "@angular/core";
import { Subject, Observable } from 'rxjs';
import { openDB } from 'idb';
import { Stage } from 'konva/types/Stage';

const DB_NAME = 'stage_data';

@Injectable({
    providedIn: "root"
})

export class IdbService {
    private dataChange: Subject<Stage> = new Subject<Stage>();
    private dbPromise;

    constructor(){
    }



    async connectionToIdb() {
        this.dbPromise = await openDB(DB_NAME, 1, {
            upgrade(db) {
                db.createObjectStore('stages');
                const stageStore = db.createObjectStore('stages', { keyPath: 'id' });
            }
        })
    }

    // deleteItems(target: string, value: Stage) {
    //     this.dbPromise.then((db: any) => {
    //         const tx = db.transaction(target, 'readwrite');
    //         const store = tx.objectStore(target);
    //         store.delete(value);
    //         this.getAllData(target).then((items: Stage) => {
    //             this.dataChange.next(items);
    //         });
    //         return tx.complete;
    //     });
    // }

    // addStage(storeName, stage) {
    //     this.dbPromise.then((db: any) => {
    //         const tx = db.transaction(storeName, 'readwrite');
    //         tx.store.put(stage);
    //         this.getAllData('stages').then((stage: Stage) => {
    //             this.dataChange.next(stage);
    //         });
    //         return tx.complete();
    //     })
    // }

    // getAllData(target: string) {
    //     return this.dbPromise.then((db: any) => {
    //         const tx = db.transaction(target, 'readonly');
    //         const store = tx.objectStore(target);
    //         return store.getAll();
    //     });
    // }

    // dataChanged(): Observable<Stage> {
    //     return this.dataChange;
    // }

}