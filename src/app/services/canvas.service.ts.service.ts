import {Injectable} from '@angular/core';
import {StageComponent} from 'ng2-konva';
import {Group} from 'konva/types/Group';

@Injectable({
  providedIn: 'root'
})
export class CanvasService {

  constructor() {


  }

  getGroupById(id: number, component: StageComponent) {
    if (component) {
      console.log('[c] current group id', id);
      return component.getStage().findOne((elem) => {

        if (elem._id === id) {
          return elem;
        }

      });


    } else {
      return null;
    }


  }

  getPathFromGroup(component: StageComponent | any) {
    if (component) {
      return component.findOne((elem) => {
        console.log('[c] ELEM_AAA', elem);
        if (elem.attrs.custom_id && elem.attrs.custom_id.includes('line')) {
          return elem;
        }
      });
    } else {
      return null;
    }
  }

  isPathInGroup(component: StageComponent) {
    if (component) {
      let temp = this.getPathFromGroup(component);
      return !!temp;
    } else {
      return false;
    }


  }
}
