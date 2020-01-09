import {Component, OnInit, ViewChild} from '@angular/core';
import {RegistryService} from '../services/registry.service';
import KonvaUtil from './konva-util';
import {theme} from './theme';

import Konva, {Collection} from 'konva';
import {Observable, of} from 'rxjs';
import {CanvasService} from '../services/canvas.service';
import {CircleTypes, IActiveWrapperBlock, ICurrentLineToDraw, IGroupCustom, IPathCustom, IRectCustom, TypeGroup} from './shapes-interface';
import {Group} from 'konva/types/Group';
import {Path} from 'konva/types/shapes/Path';

// import * as d3 from 'd3';


@Component({
  selector: 'luwfy-canvas',
  templateUrl: './luwfy-canvas.component.html',
  styleUrls: ['./luwfy-canvas.component.scss'],
})

export class CanvasComponent implements OnInit {
  constructor(private RegistryService: RegistryService, private canvasService: CanvasService) {

  }


  temp = 'hello';
  data = [];
  selected_items = [];
  lines = [];
  drawningLine = false;
  KonvaUtil = KonvaUtil;

  rectangle: IRectCustom = new Konva.Rect({
    x: null,
    y: null,
    width: 100,
    height: 50,
    fill: theme.rect_background,
    stroke: 'black',
    draggable: true,
  });


  // createdGroup: IGroupCustom | Group = new Konva.Group({
  //   draggable: true,
  //   x: 0,
  //   y: 0,
  //   number_of_groups: 0
  // });

  currentId: string;
  idChangedTrigger: boolean = false;

  currentLineToDraw: ICurrentLineToDraw = {
    isLineDrawable: false,
    groupId: 0,
    lineId: 0,
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

  };

  //todo move to service


  currentActiveGroup: Group = new Konva.Group({
    draggable: true,
    visible: true,
  }).on('dragstart', (event) => {
    console.log('[c] 777');

    this.activeWrapperBlock.isDraw = false;
    this.activeWrapperBlock.rectangle.setAttr('visible', false);
  }).on('dragmove', (event) => {


    if (!event) {
      return 0;
    }


    let isPathInGroup = this.canvasService.isPathInGroup(event.target);


    let input_paths: Collection<IPathCustom> = this.canvasService.getAllInputLinesFromGroup(this.mainLayer, event.target as Group | IGroupCustom);
    console.log('[c] input path zzz', input_paths);
    if (isPathInGroup || input_paths) {


      let output_paths: Collection<IPathCustom> = this.canvasService.getAllOutputLinesFromGroup(event.target as Group | IGroupCustom);


      if (output_paths) {

        output_paths.each((elem) => {


          //start point
          let temp_start_point_group = this.canvasService.getGroupById(elem.attrs.end_info.end_group_id, this.mainLayer.getStage());
          let temp_end_point_circle = this.canvasService.getCircleFromGroupById(event.target.getStage(), elem.attrs.start_info.start_circle_id);


          let temp_start_circle = this.canvasService.getCircleFromGroupById(temp_start_point_group, elem.attrs.end_info.end_circle_id);


          //end point


          elem.setAttr('data',
            KonvaUtil.generateLinkPath(temp_start_point_group.getAbsolutePosition().x - event.target.attrs.x + temp_start_circle.attrs.x,
              temp_start_point_group.getAbsolutePosition().y - event.target.attrs.y + temp_start_circle.attrs.y,
              temp_end_point_circle.attrs.x, temp_end_point_circle.attrs.y, -3));


        });


      }

      if (input_paths) {


        console.log('[c] input_path',);
        input_paths.each((elem) => {


          //start point
          let temp_start_point_group = this.canvasService.getGroupById(elem.attrs.start_info.start_group_id, mainLayer.getStage());
          let temp_end_point_circle = this.canvasService.getCircleFromGroupById(event.target.getStage(), elem.attrs.end_info.end_circle_id);

          let temp_start_point_circle = this.canvasService.getCircleFromGroupById(event.target.getStage(), elem.attrs.start_info.start_circle_id);


          let temp_start_circle = this.canvasService.getCircleFromGroupById(temp_start_point_group, elem.attrs.start_info.start_circle_id);

          let temp_input_circle = event.target.getStage().findOne((elem) => {
            if (elem.className === 'Circle' && elem.attrs.type === CircleTypes.Input) {
              return elem;
            }
          });
          console.log('[c] i', event.target);

          elem.setAttr('data',
            KonvaUtil.generateLinkPath(temp_start_point_group.getAbsolutePosition().x - temp_start_point_group.attrs.x + temp_start_circle.attrs.x,
              temp_start_point_group.getAbsolutePosition().y - temp_start_point_group.attrs.y + temp_start_circle.attrs.y,
              event.target.attrs.x - temp_start_point_group.attrs.x, event.target.attrs.y - temp_start_point_group.attrs.y + temp_input_circle.attrs.y, 3));
        });


      }


    }


  });


  // mouse rectangle selection
  activeWrapperBlock: IActiveWrapperBlock = {

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
      isActive_block: true
    }),

  };


  reverseFunction = (r1, r2) => {
    let r1x = r1.x,
      r1y = r1.y,
      r2x = r2.x,
      r2y = r2.y, d;
    if (r1x > r2x) {
      d = Math.abs(r1x - r2x);
      r1x = r2x;
      r2x = r1x + d;
    }
    if (r1y > r2y) {
      d = Math.abs(r1y - r2y);
      r1y = r2y;
      r2y = r1y + d;
    }
    return ({x1: r1x, y1: r1y, x2: r2x, y2: r2y});
  };

  updateDragWrapper(posIn: { x: number, y: number }) {
    this.activeWrapperBlock.now_position = {x: posIn.x, y: posIn.y};
    let posRect = this.reverseFunction(this.activeWrapperBlock.initial_position, this.activeWrapperBlock.now_position);

    this.activeWrapperBlock.rectangle.setAttrs({
      width: posRect.x2 - posRect.x1,
      height: posRect.y2 - posRect.y1,
      visible: true,
      x: posRect.x1,
      y: posRect.y1
    });
  }

  @ViewChild('stage', null) stage: any;
  @ViewChild('lineLayer', null) lineLayer: any;
  @ViewChild('mainLayer', null) mainLayer: any = new Konva.Layer({});


  //delete all objects from the selection rectangle
  deleteShapesFromGroup = () => {

    let group_children_temp = this.currentActiveGroup.children;

    if (group_children_temp.length > 0) {
      while (group_children_temp.length) {
        group_children_temp[group_children_temp.length - 1].children.each((elem) => {
          if (elem.attrs.custom_id && elem.attrs.custom_id.includes('line')) {
            elem.setAttr('stroke', theme.line_color);
          } else {
            elem.setAttr('stroke', theme.rect_border);
          }
        });
        group_children_temp[group_children_temp.length - 1].setAttr('draggable', true);
        group_children_temp[group_children_temp.length - 1].setAttr('x',
          group_children_temp[group_children_temp.length - 1].position().x + this.currentActiveGroup.position().x);
        group_children_temp[group_children_temp.length - 1].setAttr('y',
          group_children_temp[group_children_temp.length - 1].position().y + this.currentActiveGroup.position().y);
        this.mainLayer.getStage().add(group_children_temp[group_children_temp.length - 1]);
      }

      this.currentActiveGroup.removeChildren();
      this.mainLayer.getStage().draw();

    }

  };

  setClickEventForGroup = (group: Group) => {
    group.on('click', (event) => {

      event.cancelBubble = true;

      if (event.evt.ctrlKey) {

        event.target.parent.setAttr('x', event.target.parent.position().x - this.currentActiveGroup.position().x);
        event.target.parent.setAttr('y', event.target.parent.position().y - this.currentActiveGroup.position().y);

        this.currentActiveGroup.add(event.target.parent as Group);
        event.target.parent.children.each((elem) => {
          elem.setAttr('stroke', 'yellow');
          elem.setAttr('draggable', false);

        });
        event.target.parent.setAttr('draggable', false);

      }

    });

    //todo add switches for different group types

  };

  handleClickEvent = (event) => {

    if (this.currentLineToDraw.isLineDrawable) {
      this.currentLineToDraw.isLineDrawable = false;

      let current_group = this.mainLayer.getStage().findOne((elem) => {
        if (elem._id === this.currentLineToDraw.groupId) {
          return elem;
        }

      });

      let current_path = current_group.findOne((elem) => {
        if (elem.attrs.custom_id && elem.attrs.custom_id.includes('line')) {
          return elem;
        }

      });

      if (current_path) {
        console.log('[c] case 1');
        current_path.hide();
      } else {
        console.log('[c] case 2');
        this.currentLineToDraw.line.hide();
      }
      current_group.draw();

      return 0;

    }
    this.deleteShapesFromGroup();
  };

  handleDragOver = (e) => {

    if (this.idChangedTrigger) {


      let current_group = this.canvasService.createDefaultGroup(4, TypeGroup.Regular, this.mainLayer, this.activeWrapperBlock, this.currentActiveGroup);
      this.idChangedTrigger = false;
      this.setClickEventForGroup(current_group);
      this.mainLayer.getStage().add(current_group);


    } else {

      this.mainLayer.getStage().children[this.mainLayer.getStage().children.length - 1].position({
        x: e.layerX,
        y: e.layerY,
      });


    }

  };


  //todo uncomment

  handleMouseUp = (e) => {


    let elem = this.mainLayer.getStage().children[this.mainLayer.getStage().children.length - 1];
    let i = this.mainLayer.getStage().children.length;

    let temp = this.mainLayer.getStage().children.length;
    for (let i = 0; i < temp; i++) {
      if (this.mainLayer.getStage().children[i] && this.mainLayer.getStage().children[i]._id > 100) {
        if (this.checkValueBetween(this.mainLayer.getStage().children[i].position(), this.mainLayer.getStage().children[i].attrs.width, this.mainLayer.getStage().children[i].attrs.height)) {

          this.mainLayer.getStage().children[i].setAttr('x', this.mainLayer.getStage().children[i].position().x - this.currentActiveGroup.position().x);
          this.mainLayer.getStage().children[i].setAttr('y', this.mainLayer.getStage().children[i].position().y - this.currentActiveGroup.position().y);

          if (this.mainLayer.getStage().children[i].nodeType === 'Group') {
            this.mainLayer.getStage().children[i].children.each((elem) => {
              elem.setAttr('stroke', 'yellow');
            });
          }

          this.mainLayer.getStage().children[i].setAttr('draggable', false);
          this.mainLayer.getStage().children[i].moveTo(this.currentActiveGroup);
          i--;

        }
      }
    }

    //

    this.activeWrapperBlock.isActive = true;

    this.activeWrapperBlock.isDraw = false;
    this.activeWrapperBlock.rectangle.setAttr('visible', false);

  };

  checkValueBetween = (obj: { x: number, y: number }, width, height) => {
    // up and left


    let condition_up_and_left = (

      ((obj.x < this.activeWrapperBlock.initial_position.x
        && obj.x > this.activeWrapperBlock.now_position.x
        ||
        obj.x + width < this.activeWrapperBlock.initial_position.x
        && obj.x + width > this.activeWrapperBlock.now_position.x)

        &&

        (this.activeWrapperBlock.initial_position.y >= obj.y
          && this.activeWrapperBlock.now_position.y <= obj.y
          ||
          this.activeWrapperBlock.initial_position.y >= obj.y + height
          && this.activeWrapperBlock.now_position.y <= obj.y + height
        ))

    );

    let condition_up_and_right = (
      (obj.x >= this.activeWrapperBlock.initial_position.x
        && obj.x <= this.activeWrapperBlock.now_position.x
        ||
        obj.x + width >= this.activeWrapperBlock.initial_position.x
        && obj.x + width <= this.activeWrapperBlock.now_position.x)

      &&

      (this.activeWrapperBlock.initial_position.y >= obj.y
        && this.activeWrapperBlock.now_position.y <= obj.y
        ||
        height && this.activeWrapperBlock.initial_position.y >= obj.y + height
        && this.activeWrapperBlock.now_position.y <= obj.y + height)

    );

    let condition_down_and_right = (
      obj.x >= this.activeWrapperBlock.initial_position.x
      && obj.x <= this.activeWrapperBlock.now_position.x
      ||
      width && obj.x >= this.activeWrapperBlock.initial_position.x + width
      && obj.x <= this.activeWrapperBlock.now_position.x + width

      &&

      (this.activeWrapperBlock.initial_position.y >= obj.y
        && this.activeWrapperBlock.now_position.y <= obj.y
        ||
        (this.activeWrapperBlock.initial_position.y >= obj.y
          && this.activeWrapperBlock.now_position.y <= obj.y
          ||
          height && this.activeWrapperBlock.initial_position.y >= obj.y + height
          && this.activeWrapperBlock.now_position.y <= obj.y + height)
      ));

    let condition_down_and_left = (obj.x <= this.activeWrapperBlock.initial_position.x
        && obj.x >= this.activeWrapperBlock.now_position.x
        ||
        width && obj.x + width <= this.activeWrapperBlock.initial_position.x
        && obj.x + width >= this.activeWrapperBlock.now_position.x
      )

      &&

      (
        this.activeWrapperBlock.initial_position.y <= obj.y
        && this.activeWrapperBlock.now_position.y >= obj.y
      );

    // up and left
    if (this.activeWrapperBlock.initial_position.x >= this.activeWrapperBlock.now_position.x && this.activeWrapperBlock.initial_position.y >= this.activeWrapperBlock.now_position.y) {
      if (condition_up_and_left) {
        return true;
      }

    }

    // up and right
    if (this.activeWrapperBlock.initial_position.x <= this.activeWrapperBlock.now_position.x && this.activeWrapperBlock.initial_position.y >= this.activeWrapperBlock.now_position.y) {
      if (condition_up_and_right) {
        return true;
      }
    }

    // down and left
    if (this.activeWrapperBlock.initial_position.x >= this.activeWrapperBlock.now_position.x && this.activeWrapperBlock.initial_position.y <= this.activeWrapperBlock.now_position.y) {
      if (condition_down_and_left) {
        return true;
      }

    }

    // down and right
    if (this.activeWrapperBlock.initial_position.x <= this.activeWrapperBlock.now_position.x && this.activeWrapperBlock.initial_position.y <= this.activeWrapperBlock.now_position.y) {

      if (condition_down_and_right) {

        return true;
        //todo add elem to group

      }

    } else {
      return false;
    }

  };

  //todo uncomment

  handleMouseMove = (e) => {

    if (!e) {
      return 0;
    }

    if (this.currentLineToDraw.isLineDrawable) {
      const pos = this.stage.getStage().getPointerPosition();
      if (Math.abs(this.currentLineToDraw.prevMainX - pos.x) > 10 || Math.abs(this.currentLineToDraw.prevMainY - pos.y) > 10) {

        const pos = this.stage.getStage().getPointerPosition();


        let current_group = this.mainLayer.getStage().findOne((elem) => {

          if (elem._id === this.currentLineToDraw.groupId) {
            return elem;
          }

        });

        let current_path = current_group.findOne((elem) => {
          if (elem._id === this.currentLineToDraw.lineId) {
            return elem;
          }

        });


        if (current_path) {

          current_path.setAttr('data', KonvaUtil.generateLinkPath(this.currentLineToDraw.prevX - current_group.getPosition().x - 20, this.currentLineToDraw.prevY - current_group.getPosition().y, Math.ceil((pos.x - current_group.getPosition().x) / 5) * 5, Math.ceil((pos.y - current_group.getPosition().y) / 5) * 5, 1));

          current_path.zIndex(100);
          current_path.show();

        }
      }
    }

    if (this.activeWrapperBlock.isDraw) {
      this.updateDragWrapper({x: e.layerX, y: e.layerY});

    }
  };

//todo uncomment

  handleMouseDown = (e) => {
    if (this.currentLineToDraw.isLineDrawable) {
      return 0;
    }

    if (this.activeWrapperBlock.isActive) {
      this.deleteShapesFromGroup();
    }

    this.activeWrapperBlock.initial_position.x = e.layerX;
    this.activeWrapperBlock.initial_position.y = e.layerY;
    this.activeWrapperBlock.now_position.x = e.layerX;
    this.activeWrapperBlock.now_position.y = e.layerY;
    this.activeWrapperBlock.isDraw = true;

  };

  ngOnInit() {

    this.RegistryService.currentDraggableItem.subscribe((data) => {
      this.currentId = data;
      this.idChangedTrigger = true;
    });

    this.RegistryService.currentTabBlocks.subscribe(blocks => {
      this.data = blocks;
    });

    this.canvasService.lineToDraw.subscribe((data) => {
      this.currentLineToDraw = data;
    });

    this.canvasService.activeBlock.subscribe((data) => {
      this.activeWrapperBlock = data;
    });


    setInterval(() => {
      // this.lineLayer.getStage().draw();
      //   this.stage.getStage().add(this.mainLayer.getStage());
      //this.stage.getStage().add(this.lineLayer.getStage());
      this.stage.getStage().add(this.mainLayer.getStage());
      this.mainLayer.getStage().add(this.activeWrapperBlock.rectangle);
      // this.mainLayer.getStage().draw();
    }, 0);

    // setTimeout(() => {
    //   for (let i = 0; i < 10000; i++) {
    //     console.log('[c] qqqqqqqq');
    //     this.mainLayer.getStage().add(new Konva.Rect({
    //       x: 100 + i * 30,
    //       y: 50 + i * 30,
    //       width: 100,
    //       height: 50,
    //       fill: 'red',
    //       stroke: 'black',
    //       draggable: true
    //     }));
    //
    //   }
    //
    // }, 0);
    setTimeout(() => {
      this.mainLayer.getStage().add(this.currentActiveGroup);
      this.mainLayer.getStage().add(this.currentLineToDraw.line);


      //this.mainLayer.getStage ().add ( line_q );

      //todo draw
      // let group = this.canvasService.createDefaultGroup(50, TypeGroup.Regular, this.mainLayer, this.activeWrapperBlock, this.currentActiveGroup);
      // let group2 = this.canvasService.createDefaultGroup(5, TypeGroup.Regular, this.mainLayer, this.activeWrapperBlock, this.currentActiveGroup);
      // let group3 = this.canvasService.createDefaultGroup(10, TypeGroup.Regular, this.mainLayer, this.activeWrapperBlock, this.currentActiveGroup);
      // let group2 = this.canvasService.createDefaultGroup(5, TypeGroup.Regular, this.mainLayer, this.activeWrapperBlock, this.currentActiveGroup);

      //todo put in one place

      // this.setClickEventForGroup(group);

      // this.setClickEventForGroup(group2);
      // this.setClickEventForGroup(group3);

      // this.mainLayer.getStage().add(group);

      // this.mainLayer.getStage().add(group2);
      // this.mainLayer.getStage().add(group3);

      // this.mainLayer.getStage().add(group2);
      // this.mainLayer.getStage().add(switchBlock);
      // this.mainLayer.getStage().add(injectBlock);
      // this.mainLayer.getStage().add(debugBlock);

      //  this.mainLayer.getStage ().add ( path);
    }, 0);

  }
}
