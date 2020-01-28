import {Injectable} from '@angular/core';
import data from '../../assets/document.json';
import {Group} from 'konva/types/Group';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BlocksService {
  subjectArray: BehaviorSubject<any>;
  private blocks = data;
  private flowboards: Group[] = [];
  dataInBlock: any;

  private codData = {
    codLanguage: 'javascript',
    codText: 'some code'
  };

  constructor() {
    this.subjectArray = new BehaviorSubject<Group[]>(this.flowboards);
  }

  getBlocks() {
    return this.blocks;
  }

  getCodData(){
    return this.codData;
  }

  getFlowboards(){
    return this.flowboards;
  }

  addFlowboard(flowboard){
    this.flowboards.push(flowboard);
    this.pushFlowboardsChanges();
  }

  pushFlowboardsChanges(){
    this.subjectArray.next(this.flowboards);
  }
}
