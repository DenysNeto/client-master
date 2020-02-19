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
export class JsonRegistryService {

  constructor() { }

  private _jsonRegistryObject = [];

  get jsonRegistryObject() {
    return this._jsonRegistryObject;
  }



  createRegistryForFlowBoadrs(tabDataObject) {



  }
  //convertBlockDataObjectToJsonRegistryObject(blockData);

  deleteWireInJsonRegistry(wireId: number) {

    // get all jsonregistry object
    // get objects that contains wires
    // check all blocks  if [wiredId]  wires

  }


  createBlockInJsonRegistry(updatedBlock: IBlockObject) {
    console.log('updateBlock', updatedBlock);
    this._jsonRegistryObject.push(updatedBlock);
    let lastAddedElement = this._jsonRegistryObject[this._jsonRegistryObject.length - 1];
    //lastAddedElement.wires = [];
    for (let i = 0; i - lastAddedElement.outputs; i++) {
      lastAddedElement.wires.push([]);
    }


    console.log("this._jsonRegistryObject", this._jsonRegistryObject);
  }


  addLineToBlockInJsonRegistryAndUpdateBlock(blockId, wiredBlockId: string | number, indexOfPort: number) {
    let currentElementIndexToAddWire = -1;
    this._jsonRegistryObject.forEach((elementInJsonRegistry, index) => {
      if (elementInJsonRegistry.id === blockId) {
        currentElementIndexToAddWire = index;
      }
    });
    if (currentElementIndexToAddWire !== -1) {
      this._jsonRegistryObject[currentElementIndexToAddWire].wires[indexOfPort].push(wiredBlockId);
    }

    console.log("this._jsonRegistryObject", this._jsonRegistryObject);
  }


  updateBlockInJsonRegistry(blockObjectToChange: IBlockUpdateObject) {
    let currentElementIndexToUpdate = -1;
    this._jsonRegistryObject.forEach((elementInJsonRegistry, index) => {
      if (elementInJsonRegistry.id === blockObjectToChange.id) {
        currentElementIndexToUpdate = index;
      }

      if (currentElementIndexToUpdate !== -1) {
        this._jsonRegistryObject[currentElementIndexToUpdate] = { ...this._jsonRegistryObject[currentElementIndexToUpdate], ...blockObjectToChange }
      }
    });
    console.log("this._jsonRegistryObject", this._jsonRegistryObject);
  }

  deleteBlockInJsonRegistry() {

  }

  updateTabInJsonRegistry(updatedTab: ITabObject) {
    this._jsonRegistryObject.push(updatedTab);
    console.log("this._jsonRegistryObject", this._jsonRegistryObject);
  }


  // DELETE method for block and flowboard
  deleteElementFromJsonRegistry(deleteElementId) {
    let currentElementIndexToDelete = -1;
    this._jsonRegistryObject.forEach((elementInJsonRegistry, index) => {
      if (elementInJsonRegistry.id === deleteElementId) {
        currentElementIndexToDelete = index;
      }
    });
    if (currentElementIndexToDelete !== -1) {
      this._jsonRegistryObject.splice(currentElementIndexToDelete, 1);
    }
    console.log("this._jsonRegistryObject", this._jsonRegistryObject);




  }

}
