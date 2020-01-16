import {Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {RegistryService} from '../services/registry.service';
import KonvaUtil from './konva-util';
import {theme} from './theme';

import Konva from 'konva';
import {CanvasService} from '../services/canvas.service';
import {
  CircleTypes,
  IActiveWrapperBlock,
  ICurrentLineToDraw,
  IGroupCustom,
  IPathCustom,
  IRectCustom,
} from './shapes-interface';
import {Collection} from 'konva/types/Util';
import {Observable, of} from 'rxjs';

import {MatDialog, MatDialogRef} from '@angular/material';
import {ModalPropComponent} from '../popups/modal-prop/modal-prop.component';
import {BlocksRedactorService} from '../popups/blocks-redactor.service';
import {Group} from 'konva/types/Group';
import {UndoRedoService} from '../services/undo-redo.service';
import {ActionType} from './undo-redo.interface';
import {Layer} from 'konva/types/Layer';
import {UndoRedoCanvasService} from '../services/undo-redo-canvas.service';
import {StageComponent} from 'ng2-konva';

@Component({
  selector: 'luwfy-canvas',
  templateUrl: './luwfy-canvas.component.html',
  styleUrls: ['./luwfy-canvas.component.scss'],
})

export class CanvasComponent implements OnInit {
  constructor(private RegistryService: RegistryService, private canvasService: CanvasService, private dialog: MatDialog,
              private blocksRedactorService: BlocksRedactorService, private undoRedoService: UndoRedoService, private tempService: UndoRedoCanvasService) {
  }

  newFlowWidth = 500;
  newFlowHeight = 580;
  sizeBetweenFlowblocks = 50;
  temp = 'hello';
  data = [];
  selected_items = [];
  lines = [];
  drawningLine = false;
  KonvaUtil = KonvaUtil;
  konvaSize = {width: 1800, height: 1200};
  flowboards: Group[] = [
    new Konva.Group({
      x: this.sizeBetweenFlowblocks,
      y: this.sizeBetweenFlowblocks,
      width: this.newFlowWidth,
      height: this.newFlowHeight,
      draggable: true
    })
  ];
  subTabs: [];



  rectangle: IRectCustom = new Konva.Rect({
    x: null,
    y: null,
    width: 100,
    height: 50,
    fill: theme.rect_background,
    stroke: 'black',
    draggable: true,
  });


  activePaths: IPathCustom[] = [];

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
    this.activeWrapperBlock.isDraw = false;
    this.activeWrapperBlock.rectangle.setAttr('visible', false);
    this.undoRedoService.addAction({
      action: ActionType.Move,
      object: event.target,
      coordinates: {x: event.target.attrs.x, y: event.target.attrs.y},
      parent: event.target.parent as Layer
    });
  }).on('dragmove', (event) => {

    if (!event) {
      return 0;
    }

    event.target.children.each((elem) => {

      let isPathInGroup = this.canvasService.isPathInGroup(elem.getStage());
      let input_paths: Array<IPathCustom> = this.canvasService.getAllInputLinesFromGroup(this.mainLayer, elem as Group | IGroupCustom);
      if (isPathInGroup || input_paths) {

        let output_paths: Collection<IPathCustom> = this.canvasService.getAllOutputLinesFromGroup(elem as Group | IGroupCustom);
        console.log('[c] test', output_paths);
        if (output_paths) {

          output_paths.each((elem) => {

            //start point
            let temp_start_point_group = this.canvasService.getGroupById(elem.attrs.end_info.end_group_id, this.mainLayer.getStage());
            let temp_end_point_group = this.canvasService.getGroupById(elem.attrs.start_info.start_group_id, this.mainLayer.getStage());
            let temp_end_point_circle = this.canvasService.getCircleFromGroupById(elem.getStage(), elem.attrs.start_info.start_circle_id);
            let temp_start_circle = this.canvasService.getCircleFromGroupById(temp_start_point_group, elem.attrs.end_info.end_circle_id);

            let temp_input_circle = elem.getStage().findOne((elem) => {
              if (elem.className === 'Circle' && elem.attrs.type === CircleTypes.Input) {
                return elem;
              }
            });


            elem.setAttr('data',
              KonvaUtil.generateLinkPath(temp_end_point_circle.attrs.x,
                temp_end_point_circle.attrs.y,
                temp_start_point_group.getAbsolutePosition().x - event.target.getAbsolutePosition().x - temp_end_point_group.attrs.x,
                temp_start_point_group.getAbsolutePosition().y - event.target.getAbsolutePosition().y - temp_end_point_group.attrs.y + temp_start_circle.attrs.y, 1));

          });

        }

        if (input_paths) {

          console.log('[c] input_path');
          input_paths.forEach((elem) => {

            //start point
            let temp_start_point_group = this.canvasService.getGroupById(elem.attrs.start_info.start_group_id, this.mainLayer.getStage());
            let temp_end_point_group = this.canvasService.getGroupById(elem.attrs.end_info.end_group_id, this.mainLayer.getStage());
            let temp_end_point_circle = this.canvasService.getCircleFromGroupById(elem.getStage(), elem.attrs.end_info.end_circle_id);
            let temp_start_point_circle = this.canvasService.getCircleFromGroupById(elem.getStage(), elem.attrs.start_info.start_circle_id);
            let temp_start_circle = this.canvasService.getCircleFromGroupById(temp_start_point_group, elem.attrs.start_info.start_circle_id);
            let temp_input_circle = elem.parent.findOne((elem) => {
              if (elem && elem.className === 'Circle' && elem.attrs && elem.attrs.type === CircleTypes.Input) {
                return elem;
              }
            });

            elem.setAttr('data',
              KonvaUtil.generateLinkPath(temp_start_point_circle.attrs.x,
                temp_start_point_circle.attrs.y,
                +event.target.getAbsolutePosition().x - temp_start_point_group.getAbsolutePosition().x + temp_end_point_group.attrs.x,
                event.target.getAbsolutePosition().y - temp_start_point_group.getAbsolutePosition().y + temp_end_point_group.attrs.y + temp_input_circle.attrs.y, 1));
          });

        }

      }


    });

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
      isActive_block: true,
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
      y: posRect.y1,
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
          if (elem.className !== 'Path') {
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
        if (event.target.className === 'Path') {
          return 0;
        }

        if (this.canvasService.activePathsArr.length > 0) {
          return 0;
        }


        if (this.currentActiveGroup.hasChildren() && this.canvasService.isGroupInGroup(event.target.parent._id, this.currentActiveGroup)) {
          return 0;
        }


        if (event.target.className && event.target.className === 'Path') {
          return 0;
        }

        event.target.parent.setAttr('x', event.target.parent.position().x - this.currentActiveGroup.position().x);
        event.target.parent.setAttr('y', event.target.parent.position().y - this.currentActiveGroup.position().y);


        this.currentActiveGroup.add(event.target.parent as Group);

        this.undoRedoService.addAction({
          action: ActionType.Select,
          object: this.currentActiveGroup
        });

        event.target.parent.children.each((elem) => {
          if (elem.className !== 'Path') {
            elem.setAttr('stroke', theme.choose_group_color);
            //  elem.setAttr ( 'draggable', false );
          }
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

      this.canvasService.resetActivePathArr();
      return 0;
    }


  };

  handleDragOver = (e) => {

    if (this.idChangedTrigger) {
      let current_group = this.canvasService.createDefaultGroup(this.mainLayer, this.activeWrapperBlock, this.currentActiveGroup, this.currentId);
      this.idChangedTrigger = false;
      this.setClickEventForGroup(current_group);
      this.mainLayer.getStage().add(current_group);


      this.undoRedoService.addAction({
        action: ActionType.Create, object: current_group, parent: this.mainLayer
      });

    } else {

      this.mainLayer.getStage().children[this.mainLayer.getStage().children.length - 1].position({
        x: e.layerX,
        y: e.layerY,
      });

    }

  };

  //todo uncomment

  getPathFromGroupById(id: number, component: StageComponent | any) {
    if (component) {
      return component.findOne((elem) => {
        if (elem.className === 'Path' && elem._id === id) {
          return elem;
        }
      });
    } else {
      return null;
    }
  }



  handleMouseUp = (e) => {
    if (this.currentLineToDraw.isLineDrawable) {
      let current_group = this.canvasService.getGroupById(this.currentLineToDraw.groupId, this.mainLayer);
      let temp_path = this.canvasService.getPathFromGroupById(this.currentLineToDraw.lineId, current_group);

      if (!temp_path) {
        return 0;
      }

      if (!temp_path.start_info || !temp_path.end_info) {
        temp_path.remove();
      }
      return 0;

    }


    let elem = this.mainLayer.getStage().children[this.mainLayer.getStage().children.length - 1];
    let i = this.mainLayer.getStage().children.length;

    let temp = this.mainLayer.getStage().children.length;
    let temp_arr: any = [];
    for (let i = 0; i < temp; i++) {
      if (this.mainLayer.getStage().children[i] && this.mainLayer.getStage().children[i]._id > 100) {
        if (this.checkValueBetween(this.mainLayer.getStage().children[i].position(), this.mainLayer.getStage().children[i].attrs.width, this.mainLayer.getStage().children[i].attrs.height)) {

          this.mainLayer.getStage().children[i].setAttr('x', this.mainLayer.getStage().children[i].position().x - this.currentActiveGroup.position().x);
          this.mainLayer.getStage().children[i].setAttr('y', this.mainLayer.getStage().children[i].position().y - this.currentActiveGroup.position().y);

          if (this.mainLayer.getStage().children[i].nodeType === 'Group') {
            this.mainLayer.getStage().children[i].children.each((elem) => {
              if (elem.className !== 'Path') {
                elem.setAttr('stroke', theme.choose_group_color);
              }

            });
          }

          this.mainLayer.getStage().children[i].setAttr('draggable', false);
          temp_arr.push(this.mainLayer.getStage().children[i]);

          this.mainLayer.getStage().children[i].moveTo(this.currentActiveGroup);


          i--;

        }
      }
    }
    if (temp_arr.length > 0) {
      this.undoRedoService.addAction({
        action: ActionType.Select,
        object: this.currentActiveGroup,
      });
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


  handleCancelEvent(event) {
    console.log('[c] cancel');
  }

  @HostListener('document:keydown.backspace') undoBackspace(event: KeyboardEvent) {

    if (this.currentActiveGroup.hasChildren()) {
      this.undoRedoService.addAction({
        action: ActionType.Delete,
        object: this.currentActiveGroup.children,
        parent: this.currentActiveGroup
      });


      this.currentActiveGroup.removeChildren();
    }


    if (this.canvasService.activePathsArr.length > 0) {


      console.log('[c] this.canvasService.activePathsArr', this.canvasService);
      this.canvasService.activePathsArr.forEach((elem) => {
        elem.remove();
      });


      this.undoRedoService.addAction({
        action: ActionType.Delete,
        object: this.canvasService.activePathsArr,
      });

      this.canvasService.resetActivePathArr();

    }


  }


  @HostListener('document:keydown.control.z') undoCtrlZ(event: KeyboardEvent) {

    if (this.currentActiveGroup.hasChildren
      // &&
      // this.undoRedoService.undoRedoArr[this.undoRedoService.undoRedoArr.length - 1].action === ActionType.Select &&
      // (this.undoRedoService.undoRedoArr[this.undoRedoService.undoRedoArr.length - 1].object as IGroupCustom | IPathCustom)._id === this.currentActiveGroup._id)
    ) {

      this.deleteShapesFromGroup();
      this.tempService.performUndo(this.mainLayer, this.currentActiveGroup);
    } else {
      this.tempService.performUndo(this.mainLayer, this.currentActiveGroup);
    }


    // responds to control+z
  }


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

          // current_path.zIndex(100);
          //current_path.show();

        }
      }
    }
    if (this.canvasService.activePathsArr.length > 0) {
      return 0;
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

      if (this.currentActiveGroup.hasChildren()) {
        let temp_arr = [] ;
        this.currentActiveGroup.children.each((elem) => {
          temp_arr.push(elem);
        });

        console.log('[c] temp_arr', temp_arr);
        this.undoRedoService.addAction({action: ActionType.Unselect, object: temp_arr, parent: this.currentActiveGroup});
      }
      this.deleteShapesFromGroup();


    }

    this.activeWrapperBlock.initial_position.x = e.layerX;
    this.activeWrapperBlock.initial_position.y = e.layerY;
    this.activeWrapperBlock.now_position.x = e.layerX;
    this.activeWrapperBlock.now_position.y = e.layerY;
    this.activeWrapperBlock.isDraw = true;

  };

  createGrid = (flow) => {
    let distBeetwenLines = 20;
    let vertLines = flow.attrs.height / distBeetwenLines;
    let horLines = flow.attrs.width / distBeetwenLines;
    for (let i = 0; i <= horLines; i++) {
      let line = new Konva.Line({
        points: [distBeetwenLines * i, 0, distBeetwenLines * i, flow.attrs.height],
        stroke: '#eef6fa',
        strokeWidth: 1
      });
      flow.add(line);
    }
    for (let i = 0; i <= vertLines; i++) {
      let line = new Konva.Line({
        points: [0, distBeetwenLines * i, flow.attrs.width, distBeetwenLines * i],
        stroke: '#eef6fa',
        strokeWidth: 1
      });
      flow.add(line);
    }
    flow.add(new Konva.Rect({
        width: flow.attrs.width,
        height: flow.attrs.height,
        cornerRadius: 10,
        stroke: 'silver',
        strokeWidth: 1,
        shadowColor: 'silver',
        shadowBlur: 4
      }),
      new Konva.Text({
        text: `new flow${this.flowboards.length}`,
        y: -20,
        color: 'black'
      }));
  };

  ngOnInit() {

    this.RegistryService.currentDraggableItem.subscribe((data) => {
      console.log('[c] yyy', data);
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
    // todo draw


    setTimeout(() => {
      this.flowboards.forEach(flow => {
        this.createGrid(flow);
        this.mainLayer.getStage().add(flow);
      });
      this.mainLayer.getStage().add(this.currentActiveGroup);
      this.mainLayer.getStage().add(this.currentLineToDraw.line);
    }, 0);
  }

  addFlowToLayer() {
    let newX, newY;
    let lastFlowboard = this.flowboards[this.flowboards.length - 1];
    if (lastFlowboard.attrs.x + lastFlowboard.attrs.width + this.newFlowWidth < this.konvaSize.width) {
      newX = lastFlowboard.attrs.x + lastFlowboard.attrs.width + this.sizeBetweenFlowblocks;
      newY = lastFlowboard.attrs.y;
    } else {
      newX = this.sizeBetweenFlowblocks;
      newY = lastFlowboard.attrs.y + lastFlowboard.attrs.height + this.sizeBetweenFlowblocks;
    }
    let newFlow = new Konva.Group({
      x: newX,
      y: newY,
      width: this.newFlowWidth,
      height: this.newFlowHeight,
      draggable: true
    });
    this.flowboards.push(newFlow);
    this.createGrid(newFlow);
    this.mainLayer.getStage().add(newFlow);
  }

  onMainClick(event) {
    this.mainLayer;
    console.log();
    console.log(event);
  }
}


