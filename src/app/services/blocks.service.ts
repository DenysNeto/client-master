import {Injectable} from '@angular/core';
import data from '../../assets/document.json';
import {Group} from 'konva/types/Group';

@Injectable({
  providedIn: 'root'
})
export class BlocksService {
  private blocks = data;
  private flowboards: Group[] = [];

  constructor() {
  }

  getBlocks() {
    return this.blocks;
  }

  getFlowboards(){
    return this.flowboards;
  }

  addFlowboard(flowboard){
    this.flowboards.push(flowboard);
  }
}
