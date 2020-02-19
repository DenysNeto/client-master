import { Injectable } from '@angular/core';
import { Group } from 'konva/types/Group';
import { BehaviorSubject } from 'rxjs';
import { PaletteElement, Category, Image, Color, DataStorages } from './indexed-db.interface';
import { IdbService } from './indexed-db.service';

@Injectable({
  providedIn: 'root'
})

export class BlocksService {
  // variable will take JSON from server and build
  // block whick we can see on left pannel
  private flowboards: Group[] = [];
  subjectArray: BehaviorSubject<any>;
  dataInBlock: any;

  private codData = {
    codLanguage: 'javascript',
    codText: 'some code'
  };

  constructor(private iDBService: IdbService) {
    this.subjectArray = new BehaviorSubject<Group[]>(this.flowboards);
  }

  getPallets() {
    this.iDBService.getAllData(DataStorages.PALLETE_ELEMENTS).then(data => {
      if (data) {
        return data;
      }
    });
  }

  getCategories() {
    return this.iDBService.getAllData(DataStorages.CATEGORIES).then(data => {
      if (data) {
        return data;
      }
    });
  }

  getImages() {
    return this.iDBService.getAllData(DataStorages.IMAGES).then(data => {
      if (data) {
        return data;
      }
    });
  }

  getColors() {
    return this.iDBService.getAllData(DataStorages.COLORS).then(data => {
      if (data) {
        return data;
      }
    });
  }

  getFlowBoardById(flowBoardId: number) {
    console.log('qwerty', flowBoardId);
    return this.flowboards.find((flowBoardElement => {
      if (flowBoardElement._id === flowBoardId) {
        return flowBoardElement;


      }
    }))
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
