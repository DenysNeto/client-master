import {Injectable} from '@angular/core';
import data from '../../assets/document.json';

@Injectable({
  providedIn: 'root'
})
export class BlocksService {
  private blocks = data;

  constructor() {
  }

  getBlocks() {
    return this.blocks;
  }
}
