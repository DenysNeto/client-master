import {Injectable} from '@angular/core';
import {StageComponent} from 'ng2-konva';
import {Group} from 'konva/types/Group';
import Konva from 'konva';
import {ICircleCustom, IGroupCustom, TypeGroup} from '../luwfy-canvas/shapes-interface';
import ShapeCreator from '../luwfy-canvas/ShapesCreator';
import {ShapesSizes as sizes} from '../luwfy-canvas/sizes';
import {theme} from '../luwfy-canvas/theme';
import KonvaUtil from '../luwfy-canvas/konva-util';
import {Circle} from 'konva/types/shapes/Circle';
import {Layer} from 'konva/types/Layer';
import {Shape, ShapeConfig} from 'konva/types/Shape';
import {Stage} from 'konva/types/Stage';


@Injectable({
  providedIn: 'root'
})
export class CanvasService {

  currentActiveGroup = new Konva.Group({
    draggable: true,
    visible: true,
  }).on('dragstart', (event) => {
    this.activeWrapperBlock.isDraw = false;
    this.activeWrapperBlock.rectangle.setAttr('visible', false);
  });


  currentLineToDraw = {
    isLineDrawable: false,
    groupId: 0,
    line: new Konva.Path({
      attached: false,
      width: 1,
      height: 1,
      strokeWidth: 3,
      opacity: 1,
      data: '',
      stroke: '#999',
    }),
    prevX: 0,
    prevY: 0,
    prevMainX: 0,
    prevMainY: 0,
    positionStart: {
      x: 0, y: 0,
    },
    positionEnd: {
      x: 0, y: 0,
    },

    swapOrientation: () => {
      this.currentLineToDraw.positionStart = {x: this.currentLineToDraw.prevX, y: this.currentLineToDraw.prevY};
      this.currentLineToDraw.positionEnd = {
        x: this.currentLineToDraw.prevMainX,
        y: this.currentLineToDraw.prevMainY,
      };
    },
  };


  activeWrapperBlock = {

    initial_position: {
      x: 0,
      y: 0,
    },
    now_position: {
      x: 0, y: 0,
    },
    isActive: false,
    isDraw: false,
    rectangle: new Konva.Rect({
      stroke: 'blue',
      draggable: false,
    }),

  };


  constructor() {


    this.activeWrapperBlock.rectangle.on('dragstart', (event) => {
      this.activeWrapperBlock.isDraw = false;
      this.activeWrapperBlock.rectangle.setAttr('visible', false);
    })

  }

  setRegularGroupHandlers () {

  }
  setDragGroupEvents(group: IGroupCustom, mainLayer:Layer)
  {
  group.on('dragstart', (event) => {
    if (this.currentLineToDraw.isLineDrawable) {
      return 0;
    }
    this.activeWrapperBlock.isDraw = false;
    this.activeWrapperBlock.rectangle.setAttr('visible', false);
  });
  group.on('dragmove', (event) => {
    if (!event) {
      return 0;
    }
    let isPathInGroup = this.isPathInGroup(event.target);

    if (isPathInGroup) {

      //todo add

      this.currentLineToDraw.prevX = event.target.attrs.x + 100;
      this.currentLineToDraw.prevY = event.target.attrs.y + 25;



      let current_path = this.getPathFromGroup(event.target);

      let current_output_group = this.getGroupById(current_path.attrs.custom_id_output, mainLayer.getStage());


      event.target.zIndex(100);

      current_path.setAttr('data', KonvaUtil.generateLinkPath(current_output_group.parent.attrs.x - event.target.attrs.x, current_output_group.parent.attrs.y - event.target.attrs.y + 25, 100, 25, 0));
    } else if (event.target.attrs.input_group) {


      let inputGroup_temp = event.target.attrs.input_group;

      inputGroup_temp.forEach((elem) => {
        this.currentLineToDraw.prevMainX = event.target.attrs.x + 100;
        this.currentLineToDraw.prevMainY = event.target.attrs.y + 25;
        let current_input_group = this.getGroupById(elem.group_id, mainLayer.getStage());
        this.currentLineToDraw.prevX = current_input_group.attrs.x + 100;
        this.currentLineToDraw.prevY = current_input_group.attrs.y + 25;


        let current_path = this.getPathFromGroup(current_input_group);


        current_path.setAttr('data', KonvaUtil.generateLinkPath(
          this.currentLineToDraw.prevX - current_input_group.getPosition().x,
          this.currentLineToDraw.prevY - current_input_group.getPosition().y,
          Math.ceil((event.target.attrs.x - current_input_group.getPosition().x + 10) / 5) * 5,
          Math.ceil((event.target.attrs.y - current_input_group.getPosition().y + 25) / 5) * 5, 1));

      });

      // current_path.setAttr('data', KonvaUtil.generateLinkPath(this.currentLineToDraw.positionEnd.x - event.target.getPosition().x, this.currentLineToDraw.positionEnd.y - event.target.getPosition().y, Math.ceil((event.target.attrs.x - event.target.getPosition().x + 100) / 5) * 5, Math.ceil((event.target.attrs.y - event.target.getPosition().y + 25) / 5) * 5, 0));
    }

  });



  // group.on('dragstart', (event) => {
  //   if (this.currentLineToDraw.isLineDrawable) {
  //     return 0;
  //   }
  //   this.activeWrapperBlock.isDraw = false;
  //   this.activeWrapperBlock.rectangle.setAttr('visible', false);
  //
  //
  // })
  }

  setRegularGroupEvents(group:IGroupCustom)
  {

    //group

  }

  createOutputPorts(number_of_ports: number, temp_group: Group, height: number) {

    if (number_of_ports === 1) {
      temp_group.add(ShapeCreator.createCircleOutput(height / 2));


    } else if (number_of_ports === 2) {
      temp_group.add(ShapeCreator.createCircleOutput(25));
      temp_group.add(ShapeCreator.createCircleOutput(55));
    }

    else if (number_of_ports >= 3) {
      let a = (number_of_ports - 1);
      console.log('[c] numbers_ports', a);
      let margin_temp = (height - a * 30) / 2 - 10;
      console.log('[c] margin_temp', margin_temp);
      let y;
      for (let i = 0; i < number_of_ports;) {
        i++;
        if (i == 1) {
          y = margin_temp + 10;
          console.log('[c] ddd ', y);
          temp_group.add(ShapeCreator.createCircleOutput(y));

        } else {
          y = margin_temp + i * (20) + (i - 2) * 10;
          console.log('[c] ddd ', y);
          temp_group.add(ShapeCreator.createCircleOutput(y));
        }

      }
    }


  };


  createDefaultGroup(number_of_ports: number, type: TypeGroup, mainLayer) {

    let temp_group = new Konva.Group({
      draggable: true,
      type, number_of_ports,
    }) as IGroupCustom;

    let height;

    if (number_of_ports >= 3) {
      height = sizes.block_height + (number_of_ports - 1) * 30;
    } else {
      height = sizes.block_height;
    }


    temp_group.add(ShapeCreator.createCircleInput(height / 2));
    this.createOutputPorts(number_of_ports, temp_group, height);
    temp_group.add(ShapeCreator.createRect(theme.rect_switch_stroke, height));

    let circles_collection = this.getAllCirclesFromGroup(temp_group);
    circles_collection && circles_collection.each((elem: ICircleCustom) => {
      elem.setAttr('zIndex', 20);
    });

    this.setDragGroupEvents(temp_group, mainLayer);

    return temp_group;


  }


  getAllCirclesFromGroup(component: Group | IGroupCustom) {
    if (component) {
      return component.find((elem) => {
        if (elem.className == 'Circle') {
          return elem;
        }

      });


    } else {
      return null;
    }

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


  };

  getAllPathsFromGroup = (component: Group) => {

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

  getRectFromGroup(component: StageComponent) {
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

  isPathInGroup(component:  Shape<ShapeConfig> | Stage) {
    if (component) {
      let temp = this.getPathFromGroup(component);
      return !!temp;
    } else {
      return false;
    }


  }
}
