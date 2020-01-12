import {Injectable} from '@angular/core';
import {Group} from 'konva/types/Group';

@Injectable({
  providedIn: 'root'
})

export class BlocksRedactorService {
  private blocksArray: Array<Group> = [];

  addBlock(block: Group) {
    this.blocksArray.push(block);
  }

  getAllBlocks(): Group[] {
    return this.blocksArray;
  }

  removeBlock(id: number) {
    this.blocksArray = this.blocksArray.filter(block => block._id !== id);
  }

  checkerOnExistBlock(block: Group){
    return this.blocksArray.includes(block);
  }
}
