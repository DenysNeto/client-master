import {AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import {RegistryService} from '../services/registry.service';
import KonvaUtil from './konva-util';
import {theme} from './theme';
import Konva from 'konva';
import {CanvasService} from '../services/canvas.service';
import {
  CircleTypes, dataInTabLayer, GroupTypes,
  ButtonsTypes,
  IActiveWrapperBlock,
  ICurrentLineToDraw,
  IGroupCustom,
  IPathCustom,
} from './shapes-interface';
import {Collection} from 'konva/types/Util';
import {MatDialog, MatMenuTrigger} from '@angular/material';
import {BlocksRedactorService} from '../popups/blocks-redactor.service';
import {Group} from 'konva/types/Group';
import {UndoRedoService} from '../services/undo-redo.service';
import {ActionType} from './undo-redo.interface';
import {Layer} from 'konva/types/Layer';
import {UndoRedoCanvasService} from '../services/undo-redo-canvas.service';
import {ContainerKonvaSizes, GridSizes, KonvaStartSizes, MaxStageSize, ShapesSizes} from './sizes';
import ShapeCreator from './ShapesCreator';
import {FlowboardSizes} from './sizes';
import {Stage} from 'konva/types/Stage';
import {BlocksService} from '../services/blocks.service';
import {TestStartStop} from '../services/testStartStop';

@Component({
  selector: 'luwfy-canvas',
  templateUrl: './luwfy-canvas.component.html',
  styleUrls: ['./luwfy-canvas.component.scss'],
})

export class CanvasComponent implements OnInit, AfterViewInit {
  constructor(private RegistryService: RegistryService, private canvasService: CanvasService, private dialog: MatDialog,
              private blocksRedactorService: BlocksRedactorService, private undoRedoService: UndoRedoService,
              private tempService: UndoRedoCanvasService, private blocksService: BlocksService, private testStartStop: TestStartStop) {
  }

  @ViewChild('stage', null) stage: Stage;
  @ViewChild('menuTrigger', null) menuTrigger: MatMenuTrigger;
  @ViewChild('mainLayer', null) mainLayer: any = new Konva.Layer({});
  @ViewChild('container', {static: true}) container: ElementRef;
  @ViewChild('scroll_container', {static: true}) scrollContainer: ElementRef;

  data = [];
  lines = [];
  currentId: string;
  idChangedTrigger: boolean = false;
  KonvaUtil = KonvaUtil;
  konvaSize = {width: window.innerWidth + KonvaStartSizes.padding * 2, height: window.innerHeight + KonvaStartSizes.padding * 2};
  interval: any;
  subTabs: dataInTabLayer[] = [];
  menuOfViews: string[] = [];
  zoomInPercent: number = 100;

  private isMouseDown: boolean;
  private oldStageWidth: number;
  private oldStageHeight: number;
  private activeTab: dataInTabLayer;
  private calledMenuButton = '';

  currentCopiedGroup: IGroupCustom = new Konva.Group({
    x: 0,
    y: 0,
    type: GroupTypes.CopiedGroup,
    draggable: true,
    visible: false,
    //opacity: .5,
    zIndex: 1000
  });

  activePaths: IPathCustom[] = [];

  // createdGroup: IGroupCustom | Group = new Konva.Group({
  //   draggable: true,
  //   x: 0,
  //   y: 0,
  //   number_of_groups: 0
  // });

  // currentId: string;
  // idChangedTrigger: boolean = false;

  currentLineToDraw: ICurrentLineToDraw = {
    isLineDrawable: false,
    groupId: 0,
    flowboardId: 0,
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

  currentDraggedGroup: IGroupCustom;

  currentActiveGroup: Group = new Konva.Group({
    draggable: true,
    minX: 0,
    minY: 0,
    currentFlowboardId: 0,
    height: 0,
    width: 0,
    visible: true,
    type: GroupTypes.SelectedGroup,

  }).on('dragstart', (event) => {
    this.activeWrapperBlock.isDraw = false;
    this.activeWrapperBlock.rectangle.setAttr('visible', false);
    this.undoRedoService.addAction({
      action: ActionType.Move,
      object: event.target,
      coordinates: {x: event.target.attrs.x, y: event.target.attrs.y},
      parent: event.target.parent as Layer,
    });
  }).on('dragmove', (event) => {
    this.testStartStop.startStopTest('dragmove -> currentActiveGroup', Date.now(), false); // test function ----------
    if (!event) {
      return 0;
    }
    event.target.children.each((elem) => {

      let isPathInGroup = this.canvasService.isPathInGroup(elem);

      let input_paths: Array<IPathCustom> = this.canvasService.getAllInputLinesFromGroup(elem.parent, elem as Group | IGroupCustom);
      if (isPathInGroup || input_paths) {

        let output_paths: Collection<IPathCustom> = this.canvasService.getAllOutputLinesFromGroup(elem.parent as Group | IGroupCustom);
        if (output_paths) {
          output_paths.each((elem) => {
            //start point
            let temp_start_point_group = this.canvasService.getGroupById(elem.attrs.end_info.end_group_id, elem.parent as Group);
            let temp_end_point_group = this.canvasService.getGroupById(elem.attrs.start_info.start_group_id, elem.parent as Group);
            let temp_end_point_circle = this.canvasService.getCircleFromGroupById(elem as any, elem.attrs.start_info.start_circle_id);
            let temp_start_circle = this.canvasService.getCircleFromGroupById(temp_start_point_group as Group, elem.attrs.end_info.end_circle_id);

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
          input_paths.forEach((elem) => {
            //start point
            let temp_start_point_group = this.canvasService.getGroupById(elem.attrs.start_info.start_group_id, elem.parent as Group);
            let temp_end_point_group = this.canvasService.getGroupById(elem.attrs.end_info.end_group_id, elem.parent as Group);
            let temp_start_point_circle = this.canvasService.getCircleFromGroupById(elem as unknown as Group, elem.attrs.start_info.start_circle_id);
            let temp_input_circle = elem.parent.findOne((elem) => {
              if (elem && elem.className === 'Circle' && elem.attrs && elem.attrs.type === CircleTypes.Input) {
                return elem;
              }
            });
            elem.setAttr('data',
              KonvaUtil.generateLinkPath(temp_start_point_circle.attrs.x,
                temp_start_point_circle.attrs.y,
                event.target.getAbsolutePosition().x - temp_start_point_group.getAbsolutePosition().x + temp_end_point_group.attrs.x,
                event.target.getAbsolutePosition().y - temp_start_point_group.getAbsolutePosition().y + temp_end_point_group.attrs.y + temp_input_circle.attrs.y, 1));
          });
        }
      }
    });
    this.testStartStop.startStopTest('dragmove -> currentActiveGroup', Date.now()); // test function ----------
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
    this.testStartStop.startStopTest('reverseFunction', Date.now(), false); // test function ----------
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
    this.testStartStop.startStopTest('reverseFunction', Date.now()); // test function ----------
    return ({x1: r1x, y1: r1y, x2: r2x, y2: r2y});
  };

  updateDragWrapper(posIn: { x: number, y: number }) {
    this.testStartStop.startStopTest('updateDragWrapper', Date.now(), false); // test function ----------
    this.activeWrapperBlock.now_position = {x: posIn.x, y: posIn.y};
    let posRect = this.reverseFunction(this.activeWrapperBlock.initial_position, this.activeWrapperBlock.now_position);
    this.activeWrapperBlock.rectangle.setAttrs({
      width: posRect.x2 - posRect.x1,
      height: posRect.y2 - posRect.y1,
      visible: true,
      x: posRect.x1,
      y: posRect.y1,
    });
    this.testStartStop.startStopTest('updateDragWrapper', Date.now()); // test function ----------
  }

  //delete all objects from the selection rectangle
  deleteShapesFromGroup = () => {
    this.testStartStop.startStopTest('deleteShapesFromGroup', Date.now(), false); // test function ----------
    let group_children_temp = this.currentActiveGroup.children;
    console.log('[c] vvv1', this.currentActiveGroup);
    let currentFlowboard = this.blocksService.getFlowboards().find((elem) => {
      console.log('pyyyy', this.currentActiveGroup.attrs.currentFlowboardId);
      if (elem._id === this.currentActiveGroup.attrs.currentFlowboardId) {
        return elem;
      }

    });

    console.log('pppopop', currentFlowboard);

    if (group_children_temp.length > 0 && currentFlowboard) {
      while (group_children_temp.length) {
        group_children_temp[group_children_temp.length - 1].children.each((elem) => {
          if (elem.className !== 'Rect' && elem.attrs.main_stroke) {
            elem.setAttr('stroke', elem.attrs.main_stroke);
          }
        });
        group_children_temp[group_children_temp.length - 1].setAttr('draggable', true);
        group_children_temp[group_children_temp.length - 1].setAttr('x',
          group_children_temp[group_children_temp.length - 1].position().x + this.currentActiveGroup.position().x);
        group_children_temp[group_children_temp.length - 1].setAttr('y',
          group_children_temp[group_children_temp.length - 1].position().y + this.currentActiveGroup.position().y);
        currentFlowboard.add(group_children_temp[group_children_temp.length - 1]);
      }
      this.currentActiveGroup.removeChildren();
      this.mainLayer.getStage().draw();
    }
    this.testStartStop.startStopTest('deleteShapesFromGroup', Date.now()); // test function ----------
  };

  //TODO CHANGE BEHAVIOR FOR SELECTION
  setClickEventForGroup = (group: Group) => {
    this.testStartStop.startStopTest('setClickEventForGroup', Date.now(), false); // test function ----------
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
        if (!this.currentActiveGroup.attrs.currentFlowboardId) {
          this.currentActiveGroup.setAttr('currentFlowboardId', event.target.parent.parent._id);
        }
        if (this.currentActiveGroup.attrs.currentFlowboardId === event.target.parent.parent._id) {
          this.currentActiveGroup.add(event.target.parent as any);
          event.target.parent.setAttr('x', event.target.position().x + event.target.parent.position().x - this.currentActiveGroup.position().x);
          event.target.parent.setAttr('y', event.target.position().y + event.target.parent.position().y - this.currentActiveGroup.position().y);
          this.currentActiveGroup.draggable(true);
          this.undoRedoService.addAction({
            action: ActionType.Select,
            object: this.currentActiveGroup,
          });

          event.target.parent.children.each((elem) => {
            if (elem.className === 'Rect' && elem.attrs.main_stroke) {
              elem.setAttr('stroke', theme.choose_group_color);
              //  elem.setAttr ( 'draggable', false );
            }
            elem.setAttr('draggable', false);
          });
          event.target.parent.setAttr('draggable', false);

        }


      }

    });
    this.testStartStop.startStopTest('setClickEventForGroup', Date.now()); // test function ----------
  };

  handleClickEvent = (event) => {
    this.testStartStop.startStopTest('handleClickEvent', Date.now(), false); // test function ------------
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
    this.testStartStop.startStopTest('handleClickEvent', Date.now()); // test function -------------
  };

  handleDragOver = (e) => {
    this.testStartStop.startStopTest('handleDragOver', Date.now(), false); // test function --------------
    if (this.idChangedTrigger) {
      this.currentDraggedGroup = this.canvasService.createDefaultGroup(this.mainLayer, this.activeWrapperBlock, this.currentActiveGroup, this.currentId);
      this.idChangedTrigger = false;
      this.setClickEventForGroup(this.currentDraggedGroup);
      this.mainLayer.getStage().add(this.currentDraggedGroup);
      this.mainLayer.getStage().children[this.mainLayer.getStage().children.length - 1].setAttr('time', new Date().getTime());
      this.mainLayer.getStage().draw();
      this.undoRedoService.addAction({
        action: ActionType.Create, object: this.currentDraggedGroup, parent: this.mainLayer,
      });
    } else {
      let temp;

      this.blocksService.getFlowboards().forEach((elem) => {
        if (this.checkIsGroupInFlow(elem)) {
          temp = this.checkIsGroupInFlow(elem, true);
          return 0;
        }
      });

      this.mainLayer.getStage().children[this.mainLayer.getStage().children.length - 1].setAttr('time', new Date().getTime());
      this.mainLayer.getStage().children[this.mainLayer.getStage().children.length - 1].position({
        x: e.layerX / (this.zoomInPercent / 100),
        y: e.layerY / (this.zoomInPercent / 100),
      });

      if (temp) {
        temp.children.each(elem => {
          if (elem.className === 'Rect') {
            elem.setAttr('stroke', 'green');
          }

        });

      } else {
        // @ts-ignore
        this.canvasService.getAllFlowsFromLayer(this.mainLayer).each(elem => {
          elem.children.each(elem => {
            if (elem.className === 'Rect') {
              elem.setAttr('stroke', theme.line_color);
            }
          });

        });
      }
      // this.mainLayer.getStage().children[this.mainLayer.getStage().children.length - 1].move({x: 10, y: 10});
      //
      // this.mainLayer.getStage().children[this.mainLayer.getStage().children.length - 1].show();

      if (!this.interval) {
        this.interval = setInterval(() => {
          this.stage.getStage().add(this.mainLayer.getStage());
        }, 0);
      }
    }
    this.testStartStop.startStopTest('handleDragOver', Date.now()); // test function ------------
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
    this.testStartStop.startStopTest('handleMouseUp', Date.now(), false); // test function ----------
    this.isMouseDown = false;
    if (this.currentLineToDraw.isLineDrawable) {
      let current_group = this.canvasService.getGroupById(this.currentLineToDraw.groupId, this.mainLayer);
      let temp_path = this.canvasService.getPathFromGroupById(this.currentLineToDraw.lineId, current_group);
      if (!temp_path) {
        return 0;
      }
      if (!temp_path.start_info || !temp_path.end_info) {
        temp_path.remove();
      }
      this.mainLayer.getStage().draw();
      return 0;
    }

    if (this.activeWrapperBlock.isDraw) {
      let currentSelectedArrayOfBlocks: any = [];

      for (let i = 0; i < this.blocksService.getFlowboards().length; i++) {
        this.blocksService.getFlowboards()[i].children.each((elem) => {
          if (this.currentActiveGroup.attrs.currentFlowboardId && this.currentActiveGroup.attrs.currentFlowboardId !== elem.parent._id) {
            return 0;
          }
          if (elem.attrs.type === GroupTypes.Block) {
            if (this.checkValueBetween(elem.getAbsolutePosition(), elem.attrs.width, elem.attrs.height)) {
              elem.position({
                x: elem.position().x - this.currentActiveGroup.position().x + elem.parent.position().x,
                y: elem.position().y - this.currentActiveGroup.position().y + elem.parent.position().y,
              });
              elem.children.each((elem) => {
                if (elem.className !== 'Path') {
                  elem.setAttr('stroke', theme.choose_group_color);
                }
              });
              elem.setAttr('draggable', false);
              currentSelectedArrayOfBlocks.length === 0 && this.currentActiveGroup.setAttr('currentFlowboardId', elem.parent._id);
              currentSelectedArrayOfBlocks.push(elem);
            }
          }
          this.currentActiveGroup.setAttr('zIndex', 1001);

        });

      }
      let minX = 0, maxX = 0, maxXGroupWidth = 0;
      let minY = 0, maxY = 0, maxYGroupHeight = 0;

      currentSelectedArrayOfBlocks.forEach((elem) => {
        minX > elem.attrs.x ? minX = elem.attrs.x : null;
        if (maxX === 0 || maxX < elem.attrs.x) {
          maxX = elem.attrs.x;
          maxXGroupWidth = elem.attrs.width;
        }
        if (minX === 0 || minX > elem.attrs.x) {
          minX = elem.attrs.x;
        }

        if (maxY === 0 || maxY < elem.attrs.y) {
          maxY = elem.attrs.y;
          maxYGroupHeight = elem.attrs.height;
        }
        if (minY === 0 || minY > elem.attrs.y) {
          minY = elem.attrs.y;
        }
        this.currentActiveGroup.add(elem);
      });

      this.currentActiveGroup.setAttr('width', maxX + maxXGroupWidth - minX);
      this.currentActiveGroup.setAttr('minX', minX);
      this.currentActiveGroup.setAttr('minY', minY);
      this.currentActiveGroup.setAttr('height', maxY + maxYGroupHeight - minY);

      let currentFlowboard = this.blocksService.getFlowboards().find((elem) => {
        if (elem._id === this.currentActiveGroup.attrs.currentFlowboardId) {
          return elem;
        }
      });
      if (currentFlowboard) {

        this.currentActiveGroup.dragBoundFunc((pos) => {
          let conditionXLeft = (currentFlowboard.position().x - this.currentActiveGroup.attrs.minX + GridSizes.flowboard_cell) * (this.zoomInPercent / 100);
          let conditionXRight = (currentFlowboard.position().x + currentFlowboard.attrs.width - this.currentActiveGroup.attrs.minX - this.currentActiveGroup.attrs.width - GridSizes.flowboard_cell) * (this.zoomInPercent / 100);
          let conditionYLeft = (currentFlowboard.position().y - this.currentActiveGroup.attrs.minY + GridSizes.flowboard_cell) * (this.zoomInPercent / 100);
          let conditionYRight = (currentFlowboard.position().y + currentFlowboard.attrs.height - this.currentActiveGroup.attrs.minY - this.currentActiveGroup.attrs.height - GridSizes.flowboard_cell) * (this.zoomInPercent / 100);

          return {
            x: pos.x <= conditionXLeft
              ?
              (conditionXLeft)
              :
              pos.x <= conditionXRight
                ?
                pos.x
                :
                conditionXRight,

            y: pos.y <= conditionYLeft ? conditionYLeft
              : pos.y <= conditionYRight ? pos.y : conditionYRight,
          };
        });

      }


      this.currentActiveGroup.draggable(true);

      if (currentSelectedArrayOfBlocks.length > 0) {
        this.undoRedoService.addAction({
          action: ActionType.Select,
          object: this.currentActiveGroup,
        });
      }

      //

      this.activeWrapperBlock.isActive = true;

      this.activeWrapperBlock.isDraw = false;
      this.activeWrapperBlock.rectangle.setAttr('visible', false);
      this.mainLayer.getStage().draw();
    }
  };

  checkValueBetween = (obj: { x: number, y: number }, width, height) => {
    this.testStartStop.startStopTest('checkValueBetween', Date.now(), false); // test function ---------
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
      }
    } else {
      return false;
    }
    this.testStartStop.startStopTest('checkValueBetween', Date.now()); // test function ------------
  };


  @HostListener('document:keydown.backspace') undoBackspace(event: KeyboardEvent) {
    if (this.currentActiveGroup.hasChildren()) {
      this.undoRedoService.addAction({
        action: ActionType.Delete,
        object: this.currentActiveGroup.children,
        parent: this.currentActiveGroup,
      });
      this.currentActiveGroup.removeChildren();
    }
    if (this.canvasService.activePathsArr.length > 0) {
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
    if (this.currentActiveGroup.hasChildren) {
      this.deleteShapesFromGroup();
      this.tempService.performUndo(this.mainLayer, this.currentActiveGroup);
    } else {
      this.tempService.performUndo(this.mainLayer, this.currentActiveGroup);
    }
  }

  @HostListener('document:keydown.control.c') undoCtrlC(event: KeyboardEvent) {
    if (this.currentActiveGroup.hasChildren) {
      this.currentCopiedGroup.add(this.currentActiveGroup.clone());
    }
    // responds to control+z
  }

  @HostListener('document:keydown.control.v') undoCtrlV(event: KeyboardEvent) {
    this.currentCopiedGroup.setAttr('visible', true);
    this.currentCopiedGroup.setAbsolutePosition(
      {
        x: this.stage.getStage().getPointerPosition().x - this.currentActiveGroup.children[0].attrs.x,
        y: this.stage.getStage().getPointerPosition().y - this.currentActiveGroup.children[0].attrs.y,
      },
    );
    // responds to control+z
  }

  handleMouseMove = (e) => {
    this.testStartStop.startStopTest('handleMouseMove', Date.now(), false); // test function -----------
    if (!e) {
      return 0;
    }

    if (this.stage.getStage().getPointerPosition().x > (this.stage.getStage().width() - 20) && this.isMouseDown) {
      if (this.stage.getStage().width() + 500 <= MaxStageSize) {
        this.stage.getStage().width(this.stage.getStage().width() + 500);
        this.activeTab.startStageSize.oldWidth = this.stage.getStage().width();
      }
    }
    if (this.stage.getStage().getPointerPosition().y > (this.stage.getStage().height() - 20) && this.isMouseDown) {
      if (this.stage.getStage().height() + 500 <= MaxStageSize) {
        this.stage.getStage().height(this.stage.getStage().height() + 500);
        this.activeTab.startStageSize.oldHeight = this.stage.getStage().height();
      }
    }

    if (this.currentLineToDraw.isLineDrawable) {
      const pos = this.stage.getStage().getPointerPosition();
      if (Math.abs(this.currentLineToDraw.prevMainX - pos.x) > 10 || Math.abs(this.currentLineToDraw.prevMainY - pos.y) > 10) {
        const pos = this.stage.getStage().getPointerPosition();
        let current_flowboard = this.mainLayer.getStage().findOne((elem) => {
          if (elem._id === this.currentLineToDraw.flowboardId) {
            return elem;
          }
        });
        let current_group = current_flowboard.findOne((elem) => {
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
          current_path.setAttr('data', KonvaUtil.generateLinkPath(this.currentLineToDraw.prevX - current_group.getPosition().x - 20, this.currentLineToDraw.prevY - current_group.getPosition().y,
            (Math.ceil((pos.x / (this.zoomInPercent / 100) - current_group.parent.getPosition().x - current_group.getPosition().x) / 5) * 5), (Math.ceil((pos.y / (this.zoomInPercent / 100) - current_group.parent.getPosition().y - current_group.getPosition().y) / 5) * 5), 1));
        }
        this.mainLayer.getStage().draw();
      }
    }
    if (this.canvasService.activePathsArr.length > 0) {
      return 0;
    }
    if (this.currentCopiedGroup.hasChildren()) {
      this.currentCopiedGroup.setAbsolutePosition({
        x: this.stage.getStage().getPointerPosition().x - this.currentActiveGroup.children[0].attrs.x,
        y: this.stage.getStage().getPointerPosition().y - this.currentActiveGroup.children[0].attrs.y,
      });
    }
    if (this.activeWrapperBlock.isDraw) {
      this.updateDragWrapper({x: e.layerX, y: e.layerY});
      this.mainLayer.getStage().draw();

    }
    this.testStartStop.startStopTest('handleMouseMove', Date.now()); // test function -----------
  };

  handleMouseDown = (e) => {
    this.testStartStop.startStopTest('handleMouseDown', Date.now(), false); // test function -----------
    this.isMouseDown = true;
    if (this.currentLineToDraw.isLineDrawable) {
      return 0;
    }
    if (this.activeWrapperBlock.isActive ) {
      if (this.currentActiveGroup.hasChildren()) {
        let temp_arr = [];
        this.currentActiveGroup.children.each((elem) => {
          temp_arr.push(elem);
        });
        this.undoRedoService.addAction({
          action: ActionType.Unselect,
          object: temp_arr,
          parent: this.currentActiveGroup,
        });
      }

     // this.deleteShapesFromGroup();
    }
    this.activeWrapperBlock.initial_position.x = e.layerX;
    this.activeWrapperBlock.initial_position.y = e.layerY;
    this.activeWrapperBlock.now_position.x = e.layerX;
    this.activeWrapperBlock.now_position.y = e.layerY;
    this.activeWrapperBlock.isDraw = true;
    this.testStartStop.startStopTest('handleMouseDown', Date.now()); // test function -----------
  };

  createGrid = (flow) => {
    this.testStartStop.startStopTest('createGrid', Date.now(), false); // test function -----------
    let distBetweenLines = 20;
    let vertLines = flow.attrs.height / distBetweenLines;
    let horLines = flow.attrs.width / distBetweenLines;
    let maxLines = vertLines > horLines ? vertLines : horLines;
    for (let i = 1; i <= maxLines; i++) {
      if (vertLines > i) {
        flow.add(ShapeCreator.createLineForGrid([distBetweenLines * i, 0, distBetweenLines * i, flow.attrs.height]));
      }
      if (horLines > i) {
        flow.add(ShapeCreator.createLineForGrid([0, distBetweenLines * i, flow.attrs.width, distBetweenLines * i]));
      }
    }
    let menuButton = ShapeCreator.createMenuButton();
    menuButton.on('click', event => {
      let menu = document.getElementById('menuTrigger');
      menu.style.display = '';
      menu.style.position = 'fixed';
      menu.style.left = event.evt.clientX + 'px';
      menu.style.top = event.evt.clientY + 10 + 'px';
      this.menuTrigger.openMenu();
      this.calledMenuButton = event.target.parent;
    });
    flow.add(ShapeCreator.createShadowForGrid(flow.attrs.width, flow.attrs.height), ShapeCreator.createDrugPoint(),
      ShapeCreator.createNameOfFlowboard(this.blocksService.getFlowboards().length), menuButton);
    this.testStartStop.startStopTest('createGrid', Date.now()); // test function -----------
  };

  checkIsGroupInFlow(flowGroup, returnFlow?: boolean) {
    this.testStartStop.startStopTest('checkIsGroupInFlow', Date.now(), false); // test function -----------
    if (flowGroup && flowGroup.attrs.x < this.currentDraggedGroup.attrs.x - ShapesSizes.circle_radius && flowGroup.attrs.x + flowGroup.attrs.width > this.currentDraggedGroup.attrs.x + this.currentDraggedGroup.width() - ShapesSizes.circle_radius
      &&
      flowGroup.attrs.y < this.currentDraggedGroup.attrs.y && flowGroup.attrs.y + flowGroup.attrs.height > this.currentDraggedGroup.attrs.y + this.currentDraggedGroup.height()) {
      return returnFlow ? flowGroup : true;
    }
    this.testStartStop.startStopTest('checkIsGroupInFlow', Date.now()); // test function -----------
  }

  ngOnInit() {
    this.subTabs = [
      {label: 'Main Project', layerData: [], startStageSize: {oldHeight: 0, oldWidth: 0}},
      {label: 'Sub View', layerData: [], startStageSize: {oldHeight: 0, oldWidth: 0}}];
    this.activeTab = this.subTabs[0];
    if (this.subTabs.length > 1) {
      this.subTabs.forEach((tab, index) => {
        if (index > 0) {
          this.menuOfViews.push(tab.label);
        }
      });
    }
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


  }

  ngAfterViewInit() {

    this.stage.getStage().add(this.mainLayer.getStage());
    this.mainLayer.getStage().add(this.activeWrapperBlock.rectangle);
    this.activeTab.startStageSize.oldWidth = this.stage.getStage().width();
    this.activeTab.startStageSize.oldHeight = this.stage.getStage().height();
    this.canvasService.dragFinished.subscribe(() => {
      let temp;
      // @ts-ignore
      this.canvasService.getAllFlowsFromLayer(this.mainLayer).each((flowGroup) => {
        if (!temp) {
          temp = this.checkIsGroupInFlow(flowGroup, true);
          if (temp) {
            this.currentDraggedGroup.position({
              x: Math.abs(this.currentDraggedGroup.position().x - temp.position().x),
              y: Math.abs(this.currentDraggedGroup.position().y - temp.position().y),
            });
            temp.add(this.currentDraggedGroup);
            this.blocksService.pushFlowboardsChanges();
            this.currentDraggedGroup.dragBoundFunc((pos) => {
              return {
                x: pos.x <= (this.currentDraggedGroup.parent.position().x + GridSizes.flowboard_cell) * (this.zoomInPercent / 100) ? (this.currentDraggedGroup.parent.position().x + GridSizes.flowboard_cell) * (this.zoomInPercent / 100) : pos.x <= (this.currentDraggedGroup.parent.position().x + this.currentDraggedGroup.parent.attrs.width - this.currentDraggedGroup.attrs.width) * (this.zoomInPercent / 100) ? pos.x : (this.currentDraggedGroup.parent.position().x + this.currentDraggedGroup.parent.attrs.width - this.currentDraggedGroup.attrs.width) * (this.zoomInPercent / 100),
                y: pos.y <= (this.currentDraggedGroup.parent.position().y + GridSizes.flowboard_cell * 2) * (this.zoomInPercent / 100) ? (this.currentDraggedGroup.parent.position().y + GridSizes.flowboard_cell) * (this.zoomInPercent / 100) : pos.y <= (this.currentDraggedGroup.parent.position().y + this.currentDraggedGroup.parent.attrs.height - this.currentDraggedGroup.attrs.height) * (this.zoomInPercent / 100) ? pos.y : (this.currentDraggedGroup.parent.position().y + this.currentDraggedGroup.parent.attrs.height - this.currentDraggedGroup.attrs.height - GridSizes.flowboard_cell) * (this.zoomInPercent / 100),
              };
            });
            flowGroup.children.each(elem => {
              if (elem.className === 'Rect') {
                elem.setAttr('stroke', theme.line_color);
                return 0;
              }
            });
            temp = true;
            return 0;
          }
        } else {
          return;
        }
      });
      !temp && this.currentDraggedGroup && this.currentDraggedGroup.destroy();
      clearInterval(this.interval);
      this.interval = undefined;
      this.mainLayer.getStage().draw();
    });
    this.canvasService.flowboardDimensionsChanged.subscribe((value) => {
      let temp_elem = this.blocksService.getFlowboards().find((elem) => {
        if (elem._id === value.id) {
          return elem;
        }
      });
      this.canvasService.checkIfCollisionBetweenFlowBoards(temp_elem, this.blocksService.getFlowboards(), value.dimension);
    });
    this.canvasService.flowboardPositionChanged.subscribe((value) => {
      let temp_elem = this.blocksService.getFlowboards().find((elem) => {
        if (elem._id === value.id) {
          return elem;
        }
      });
      temp_elem && this.canvasService.checkIfCollisionBetweenFlowBoards(temp_elem, this.blocksService.getFlowboards(), value.dimension);
    });

    this.blocksService && this.blocksService.getFlowboards().forEach(flow => {
      this.createGrid(flow);
      this.mainLayer.getStage().add(flow);
    });
    this.mainLayer.getStage().add(this.currentActiveGroup);
    this.currentActiveGroup.zIndex(1);
    this.mainLayer.getStage().add(this.currentLineToDraw.line);
    this.mainLayer.getStage().add(this.currentCopiedGroup);

    this.scrollContainer.nativeElement.addEventListener('scroll', event => {
      this.repositionStage(event);
    });
    this.repositionStage();
    this.zoomInPercent = this.stage.getStage().scaleX() * 100;
    this.canvasService.setCurrentZoom(this.zoomInPercent);
  }

  addFlowToLayer() {
    this.testStartStop.startStopTest('addFlowToLayer', Date.now(), false); // test function -----------
    let newX, newY;
    if (this.blocksService.getFlowboards().length === 0) {
      newX = newY = FlowboardSizes.sizeBetweenFlowblock;
    } else {
      let lastFlowboard = this.blocksService.getFlowboards()[this.blocksService.getFlowboards().length - 1];
      if (lastFlowboard.attrs.x + lastFlowboard.attrs.width + FlowboardSizes.newFlowWidth < this.stage.getStage().width()) {
        newX = lastFlowboard.attrs.x + lastFlowboard.attrs.width + FlowboardSizes.sizeBetweenFlowblock;
        newY = lastFlowboard.attrs.y;
      } else {
        newX = FlowboardSizes.sizeBetweenFlowblock;
        newY = lastFlowboard.attrs.y + lastFlowboard.attrs.height + FlowboardSizes.sizeBetweenFlowblock;
      }
    }
    let newFlow = new Konva.Group({
      x: newX,
      y: newY,
      width: FlowboardSizes.newFlowWidth,
      height: FlowboardSizes.newFlowHeight,
      //draggable: true,
      type: GroupTypes.Flowboard,
      showOnPanel: true
    });
    this.blocksService.addFlowboard(newFlow);
    this.createGrid(newFlow);
    this.mainLayer.getStage().add(newFlow);
    this.subTabs[0].layerData = [];
    this.subTabs[0].layerData = this.mainLayer.getStage().children.toArray();
    setTimeout(() => {
      this.mainLayer.getStage().draw();
    }, 100);
    this.testStartStop.startStopTest('addFlowToLayer', Date.now()); // test function -----------
  }

  onMainTabBarClick(event) {
    this.testStartStop.startStopTest('onMainTabBarClick', Date.now(), false); // test function -----------
    this.activeTab = this.subTabs.find(tab => tab.label === event.tab.textLabel);
    this.mainLayer.getStage().removeChildren();
    this.mainLayer.getStage().draw();
    if (this.activeTab.label === this.subTabs[0].label) {
      this.stage.getStage().width(this.oldStageWidth);
      this.stage.getStage().height(this.oldStageHeight);
      this.activeTab.layerData.forEach(elem => {
        this.mainLayer.getStage().add(elem);
      });
      this.zoomingEvent(1);
      this.mainLayer.getStage().draw();
    } else {
      if (this.activeTab.layerData.length !== 0) {
        this.oldStageWidth = this.stage.getStage().width();
        this.oldStageHeight = this.stage.getStage().height();
        this.showSubView(this.activeTab.layerData[0]);
      }
    }
    this.testStartStop.startStopTest('onMainTabBarClick', Date.now()); // test function -----------

  }

  onFlowTabBarClick(event) {
    this.showSubView(this.activeTab.layerData[event]);
  }

  showSubView(id) {
    this.testStartStop.startStopTest('showSubView', Date.now(), false); // test function -----------
    this.mainLayer.getStage().removeChildren();
    let showFlow = this.blocksService.getFlowboards().find(flow => flow._id === id).clone();
    this.stage.getStage().width(KonvaStartSizes.width);
    if ((showFlow.attrs.height * 1.25) > KonvaStartSizes.height) {
      this.stage.getStage().height(showFlow.attrs.height * 1.25);
    } else {
      this.stage.getStage().height(KonvaStartSizes.height);
    }
    this.convertMyFlowForView(showFlow);
    this.mainLayer.getStage().add(showFlow);
    this.activeTab.startStageSize.oldWidth = this.stage.getStage().width();
    this.activeTab.startStageSize.oldHeight = this.stage.getStage().height();
    this.zoomingEvent(1);
    this.mainLayer.getStage().draw();
    this.testStartStop.startStopTest('showSubView', Date.now()); // test function -----------
  }

  convertMyFlowForView(flowboard) {
    this.testStartStop.startStopTest('convertMyFlowForView', Date.now(), false); // test function -----------
    if (flowboard.attrs.type === GroupTypes.Flowboard) {
      this.draggingOnOff(flowboard);
      this.setPositionInView(flowboard);
      flowboard.children.toArray().forEach(obj => {
        if (obj.attrs.type === GroupTypes.Block) {
          this.draggingOnOff(obj);
        }
        if (obj.attrs.type === ButtonsTypes.DrugPoint || obj.attrs.type === ButtonsTypes.MenuButton) {
          this.showOrHide(obj);
        }
      });
    }
    this.testStartStop.startStopTest('convertMyFlowForView', Date.now()); // test function -----------
  }

  setPositionInView(flowboard) {
    flowboard.attrs.x = (ContainerKonvaSizes.width - flowboard.attrs.width) / 2;
    flowboard.attrs.y = (ContainerKonvaSizes.height - flowboard.attrs.height) / 2;
  }

  // Turn off dragging when flowboard show in sub view and on dragging in main tab
  draggingOnOff(elem) {
    // elem.draggable(elem.draggable());
  }

  // Hide buttons when flowboard show in sub view and show in main tab
  showOrHide(elem) {
    if (elem.isVisible()) {
      elem.hide();
    } else {
      elem.show();
    }
  }

  addFlowToSubView(subViewName: string) {
    let tmp = this.subTabs.find(tab => tab.label === subViewName);
    // @ts-ignore
    if (!tmp.layerData.find(elem => elem === this.calledMenuButton._id)) {
      // @ts-ignore
      tmp.layerData.push(this.calledMenuButton._id);
    }
  }

  zoomingEvent(event) {
    this.zoomInPercent = event * 100;
    this.canvasService.setCurrentZoom(event * 100);
    this.stage.getStage().scale({x: event, y: event});
    this.stage.getStage().width(this.activeTab.startStageSize.oldWidth * event < MaxStageSize ? this.activeTab.startStageSize.oldWidth * event : MaxStageSize);
    this.stage.getStage().height(this.activeTab.startStageSize.oldHeight * event < MaxStageSize ? this.activeTab.startStageSize.oldHeight * event : MaxStageSize);
  }

  repositionStage(event?) {
    let dx;
    let dy;
    if (event) {
      dx = event.target.scrollLeft;
      dy = event.target.scrollTop;
    } else {
      dx = this.scrollContainer.nativeElement.scrollLeft;
      dy = this.scrollContainer.nativeElement.scrollTop;
    }
    this.stage.getStage().container().style.transform =
      'translate(' + dx + 'px, ' + dy + 'px)';
    this.stage.getStage().x(-dx);
    this.stage.getStage().y(-dy);
    this.stage.getStage().batchDraw();
  }
}


