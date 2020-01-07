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

  getLastPathFromGroup = (component: Group) => {



    if (component) {
      return component.find((elem) => {
        if (elem.className == 'Path' && elem.attrs.last_path) {
          return elem;
        }

      });


    } else {
      return null;
    }

    last_path



  };

  getAllPathsFromGroup = (component:Group) => {

    if (component) {
      return component.find((elem) => {
        if (elem.className == 'Path') {
          return elem;
        }

      });


    } else {
      return null;
    }

  };

  getRectFromGroup(component:StageComponent) {
    if (component) {

      return component.getStage().findOne((elem) => {
        console.log('[c]', elem.className === 'Rect');

        if (elem.className === 'Circle') {
          return elem;
        }
      });
    } else {
      return null;
    }
  }

  getCircleFromGroup(component: Group) {
    if (component) {

      return component.findOne((elem) => {
        //  console.log('bbbb', elem.className);
        console.log('[c]', elem.className === 'Circle');

        if (elem.className === 'Circle') {
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
