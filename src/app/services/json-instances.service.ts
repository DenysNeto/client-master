import { Injectable } from '@angular/core';

interface IBlockObject {
  id: number,
  type: string, //name in palette
  z: number,   //the flowboard id
  x: number,
  y: number,
  outputs: number,
  wires: Array<any>
}

interface ITabObject {
  id: number,
  type: string,
  label: string,
  disabled?: boolean,
  info?: string,
  location: {
    x: number,
    y: number
  }
  width: number,
  height: number
}

interface IBlockUpdateObject {
  id: number,
  type?: string, //name in palette
  z?: number,   //the flowboard id
  x?: number,
  y?: number,
  outputs?: number,
  wires?: Array<any>
}

export const TYPE_FOR_FLOWBOARD = "FlowBoard";




@Injectable({
  providedIn: 'root'
})
export class JsonInstancesService {

  constructor() { }

  private _jsonInstancesObject = [];

  get jsonInstancesObject() {
    return this._jsonInstancesObject;
  }

  setJsonInstancesObject(jsonInstance: any) {
    this._jsonInstancesObject = jsonInstance;
    console.log('[c] this._jsonInstancesObject', this._jsonInstancesObject);

  }


  //convertBlockDataObjectToJsonRegistryObject(blockData);
  deleteWireInJsonInstances(wireId: number) {
    this._jsonInstancesObject.forEach(jsonInstance => {
      if (jsonInstance.wires) {
        for (let i = 0; i < jsonInstance.wires.length; i++) {
          jsonInstance.wires[i] = jsonInstance.wires[i].filter(wireElement => wireElement === wireId);
        }
      }
      console.log("this._jsonRegistryObject", this._jsonInstancesObject);
    })


  }


  createBlockInJsonInstances(updatedBlock: IBlockObject) {
    console.log('updateBlock', updatedBlock);
    this._jsonInstancesObject.push(updatedBlock);
    let lastAddedElement = this._jsonInstancesObject[this._jsonInstancesObject.length - 1];
    //lastAddedElement.wires = [];
    for (let i = 0; i - lastAddedElement.outputs; i++) {
      lastAddedElement.wires.push([]);
    }


    console.log("this._jsonRegistryObject", this._jsonInstancesObject);
  }


  addLineToBlockInJsonInstancesAndUpdateBlock(blockId, wiredBlockId: string | number, indexOfPort: number) {
    let currentElementIndexToAddWire = -1;
    this._jsonInstancesObject.forEach((elementInJsonRegistry, index) => {
      if (elementInJsonRegistry.id === blockId) {
        currentElementIndexToAddWire = index;
      }
    });
    if (currentElementIndexToAddWire !== -1) {
      this._jsonInstancesObject[currentElementIndexToAddWire].wires[indexOfPort].push(wiredBlockId);
    }

    console.log("this._jsonRegistryObject", this._jsonInstancesObject);
  }


  updateBlockInJsonInstances(blockObjectToChange: IBlockUpdateObject) {
    let currentElementIndexToUpdate = -1;
    this._jsonInstancesObject.forEach((elementInJsonRegistry, index) => {
      if (elementInJsonRegistry.id === blockObjectToChange.id) {
        currentElementIndexToUpdate = index;
      }

      if (currentElementIndexToUpdate !== -1) {
        this._jsonInstancesObject[currentElementIndexToUpdate] = { ...this._jsonInstancesObject[currentElementIndexToUpdate], ...blockObjectToChange }
      }
    });
    console.log("this._jsonRegistryObject", this._jsonInstancesObject);
  }

  deleteBlockInJsonRegistry() {

  }

  updateFlowboardInJsonInstances(updatedTab: ITabObject) {
    this._jsonInstancesObject.push(updatedTab);
    console.log("this._jsonRegistryObject", this._jsonInstancesObject);
  }


  // DELETE method for block and flowboard
  deleteElementFromJsonInstances(deleteElementId: number | string) {
    let currentElementIndexToDelete = -1;
    this._jsonInstancesObject.forEach((elementInJsonRegistry, index) => {
      if (elementInJsonRegistry.id === deleteElementId) {
        currentElementIndexToDelete = index;
      }
    });
    if (currentElementIndexToDelete !== -1) {
      this._jsonInstancesObject.splice(currentElementIndexToDelete, 1);
    }
    console.log("this._jsonRegistryObject", this._jsonInstancesObject);




  }

}
