import { Injectable } from '@angular/core';
import data from '../../assets/document.json';
import { Group } from 'konva/types/Group';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class BlocksService {
  subjectArray: BehaviorSubject<any>;
  // variable will take JSON from server and build
  // block whick we can see on left pannel
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

  getCodData() {
    return this.codData;
  }

  getFlowboards() {
    return this.flowboards;
  }

  addFlowboard(flowboard) {
    this.flowboards.push(flowboard);
    this.pushFlowboardsChanges();
  }

  removeFlowboard(id) {
    this.flowboards = this.flowboards.filter(flow => flow._id !== id);
    this.pushFlowboardsChanges();
  }

  pushFlowboardsChanges() {
    this.subjectArray.next(this.flowboards);
  }

  getFlowboardName(id) {
    let name = '';
    this.flowboards.forEach(flow => {
      if (flow._id === id) {
        name = flow.attrs.name;
      }
    });
    return name;
  }
}
