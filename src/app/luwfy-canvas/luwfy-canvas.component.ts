import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { RegistryService } from '../services/registry.service';
import KonvaUtil from './konva-util';
import { theme } from './theme';
import Konva from 'konva';
import { CanvasService } from '../services/canvas.service';
import { CircleTypes, dataInTabLayer, GroupTypes, ButtonsTypes, IActiveWrapperBlock, ICurrentLineToDraw, IGroupCustom, IPathCustom } from './shapes-interface';
import { Collection } from 'konva/types/Util';
import { MatDialog, MatMenuTrigger } from '@angular/material';
import { BlocksRedactorService } from '../popups/blocks-redactor.service';
import { Group } from 'konva/types/Group';
import { UndoRedoService } from '../services/undo-redo.service';
import { ActionType } from './undo-redo.interface';
import { Layer } from 'konva/types/Layer';
import { UndoRedoCanvasService } from '../services/undo-redo-canvas.service';
import { ContainerKonvaSizes, GridSizes, KonvaStartSizes, MaxStageSize, ShapesSizes } from './sizes';
import ShapeCreator from './ShapesCreator';
import { FlowboardSizes } from './sizes';
import { Stage } from 'konva/types/Stage';
import { BlocksService } from '../services/blocks.service';
import { TestStartStop } from '../services/testStartStop';
import { StageComponent } from 'ng2-konva';
import {LocalNotificationService, NotificationTypes} from '../popups/local-notification/local-notification.service';

@Component({
  selector: 'luwfy-canvas',
  templateUrl: './luwfy-canvas.component.html',
  styleUrls: ['./luwfy-canvas.component.scss']
})

export class CanvasComponent implements OnInit, AfterViewInit {
  constructor(
    private RegistryService: RegistryService,
    private canvasService: CanvasService,
    private dialog: MatDialog,
    private blocksRedactorService: BlocksRedactorService,
    private undoRedoService: UndoRedoService,
    private tempService: UndoRedoCanvasService,
    private blocksService: BlocksService,
    private testStartStop: TestStartStop,
    private localNotificationService: LocalNotificationService
  ) {
  }

  @ViewChild('stage', null) stage: Stage;
  @ViewChild('menuTrigger', null) menuTrigger: MatMenuTrigger;
  @ViewChild('mainLayer', null) mainLayer: any = new Konva.Layer({});
  @ViewChild('scroll_container', { static: true }) scrollContainer: ElementRef;

  data = [];
  lines = [];
  currentId: string;
  idChangedTrigger: boolean = false;
  KonvaUtil = KonvaUtil;
  subTabs: dataInTabLayer[] = [];
  menuOfViews: string[] = [];
  zoomInPercent: number = 100;
  konvaSize = {
    width: window.innerWidth + KonvaStartSizes.padding * 2,
    height: window.innerHeight + KonvaStartSizes.padding * 2
  };

  private interval: any;
  private isMouseDown: boolean;
  private oldStageWidth: number;
  private oldStageHeight: number;
  private activeTab: dataInTabLayer;
  private calledMenuButton = '';
  private selectedBlocks = [];


  currentCopiedGroup: IGroupCustom = new Konva.Group({
    x: 0,
    y: 0,
    type: GroupTypes.CopiedGroup,
    draggable: true,
    visible: false,
    zIndex: 1000
  });

  activePaths: IPathCustom[] = [];

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
      stroke: '#999'
    }),
    prevX: 0,
    prevY: 0,
    prevMainX: 0,
    prevMainY: 0,
    positionStart: {
      x: 0,
      y: 0
    },
    positionEnd: {
      x: 0,
      y: 0
    }
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
    type: GroupTypes.SelectedGroup
  })
    .on('dragstart', event => {
      this.activeWrapperBlock.isDraw = false;
      this.activeWrapperBlock.rectangle.setAttr('visible', false);
      this.undoRedoService.addAction({
        action: ActionType.Move,
        object: event.target,
        coordinates: { x: event.target.attrs.x, y: event.target.attrs.y },
        parent: event.target.parent as Layer
      });
    })
    .on('dragmove', event => {
      if (!event) {
        return 0;
      }
      event.target.children.each(elem => {
        let isPathInGroup = this.canvasService.isPathInGroup(elem);
        let input_paths: Array<IPathCustom> = this.canvasService.getAllInputLinesFromGroup(elem.parent, elem as Group | IGroupCustom);
        if (isPathInGroup || input_paths) {
          let output_paths: Collection<IPathCustom> = this.canvasService.getAllOutputLinesFromGroup(elem.parent as Group | IGroupCustom);
          if (output_paths) {
            output_paths.each(elem => {
              //start point
              let temp_start_point_group = this.canvasService.getGroupById(elem.attrs.end_info.end_group_id, elem.parent as Group);
              let temp_end_point_group = this.canvasService.getGroupById(elem.attrs.start_info.start_group_id, elem.parent as Group);
              let temp_end_point_circle = this.canvasService.getCircleFromGroupById(elem as any, elem.attrs.start_info.start_circle_id);
              let temp_start_circle = this.canvasService.getCircleFromGroupById(temp_start_point_group as Group, elem.attrs.end_info.end_circle_id);
              let temp_input_circle = elem.getStage().findOne(elem => {
                if (elem.className === 'Circle' && elem.attrs.type === CircleTypes.Input) {
                  return elem;
                }
              });
              elem.setAttr(
                'data',
                KonvaUtil.generateLinkPath(
                  temp_end_point_circle.attrs.x,
                  temp_end_point_circle.attrs.y,
                  temp_start_point_group.getAbsolutePosition().x -
                  event.target.getAbsolutePosition().x -
                  temp_end_point_group.attrs.x,
                  temp_start_point_group.getAbsolutePosition().y -
                  event.target.getAbsolutePosition().y -
                  temp_end_point_group.attrs.y +
                  temp_start_circle.attrs.y,
                  1
                )
              );
            });
          }
          if (input_paths) {
            input_paths.forEach(elem => {
              //start point
              let temp_start_point_group = this.canvasService.getGroupById(elem.attrs.start_info.start_group_id, elem.parent as Group);
              let temp_end_point_group = this.canvasService.getGroupById(elem.attrs.end_info.end_group_id, elem.parent as Group);
              let temp_start_point_circle = this.canvasService.getCircleFromGroupById((elem as unknown) as Group, elem.attrs.start_info.start_circle_id);
              let temp_input_circle = elem.parent.findOne(elem => {
                if (elem && elem.className === 'Circle' && elem.attrs && elem.attrs.type === CircleTypes.Input) {
                  return elem;
                }
              });
              elem.setAttr('data',
                KonvaUtil.generateLinkPath(
                  temp_start_point_circle.attrs.x,
                  temp_start_point_circle.attrs.y,
                  event.target.getAbsolutePosition().x -
                  temp_start_point_group.getAbsolutePosition().x +
                  temp_end_point_group.attrs.x,
                  event.target.getAbsolutePosition().y -
                  temp_start_point_group.getAbsolutePosition().y +
                  temp_end_point_group.attrs.y +
                  temp_input_circle.attrs.y,
                  1
                )
              );
            });
          }
        }
      });
    });

  // TODO: mouse rectangle selection
  activeWrapperBlock: IActiveWrapperBlock = {
    initial_position: {
      x: 0,
      y: 0
    },
    now_position: {
      x: 0,
      y: 0
    },
    isActive: false,
    isDraw: false,
    rectangle: new Konva.Rect({
      stroke: '#3f51b5',
      draggable: false,
      isActive_block: true
    })
  };

  reverseFunction(pos1, pos2) {
    let pos1X = pos1.x,
      pos1Y = pos1.y,
      pos2X = pos2.x,
      pos2Y = pos2.y,
      diff;
    if (pos1X > pos2X) {
      diff = Math.abs(pos1X - pos2X);
      pos1X = pos2X;
      pos2X = pos1X + diff;
    }
    if (pos1Y > pos2Y) {
      diff = Math.abs(pos1Y - pos2Y);
      pos1Y = pos2Y;
      pos2Y = pos1Y + diff;
    }
    return { x1: pos1X, y1: pos1Y, x2: pos2X, y2: pos2Y };
  };

  updateDragWrapper(posIn: { x: number; y: number }) {
    this.activeWrapperBlock.now_position = { x: posIn.x, y: posIn.y };
    let posRect = this.reverseFunction(this.activeWrapperBlock.initial_position, this.activeWrapperBlock.now_position);
    this.activeWrapperBlock.rectangle.setAttrs({
      width: posRect.x2 - posRect.x1,
      height: posRect.y2 - posRect.y1,
      visible: true,
      x: posRect.x1,
      y: posRect.y1
    });
  }

  //delete all objects from the selection rectangle
  deleteShapesFromGroup() {
    let group_children_temp = this.currentActiveGroup.children;
    let currentFlowboard = this.blocksService.getFlowboards().find(elem => {
      if (elem._id === this.currentActiveGroup.attrs.currentFlowboardId) {
        return elem;
      }
    });

    if (group_children_temp.length > 0 && currentFlowboard) {
      while (group_children_temp.length) {
        group_children_temp[group_children_temp.length - 1].children.each(
          elem => {
            if (elem.className !== 'Rect' && elem.attrs.main_stroke) {
              elem.setAttr('stroke', elem.attrs.main_stroke);
            }
          }
        );
        group_children_temp[group_children_temp.length - 1].setAttr(
          'draggable',
          true
        );
        group_children_temp[group_children_temp.length - 1].setAttr(
          'x',
          group_children_temp[group_children_temp.length - 1].position().x +
          this.currentActiveGroup.position().x
        );
        group_children_temp[group_children_temp.length - 1].setAttr(
          'y',
          group_children_temp[group_children_temp.length - 1].position().y +
          this.currentActiveGroup.position().y
        );
        currentFlowboard.add(
          group_children_temp[group_children_temp.length - 1]
        );
      }
      this.currentActiveGroup.removeChildren();
      this.mainLayer.getStage().draw();
    }
  };

  setClickEventForGroup = (group: Group) => {
    group.on('click', event => {
      event.cancelBubble = true;
      if (event.evt.ctrlKey) {
        if (event.target.className === 'Path') {
          return 0;
        }
        if (this.canvasService.activePathsArr.length > 0) {
          return 0;
        }
        if (event.target.className && event.target.className === 'Path') {
          return 0;
        }
        this.selectedBlock(event.target);
      }
    });
  };

  // TODO: function add selected block to array with other blocks
  selectedBlock(event) {
    if (this.selectedBlocks.length > 0) {
      if (this.selectedBlocks[0].parent._id !== event.parent.parent._id) {
        return 0;
      }
    }
    this.selectedBlocks.push(event.parent);
    event.parent.children.each(elem => {
      if (elem.className === 'Rect' && elem.attrs.main_stroke) {
        elem.setAttr('stroke', theme.choose_group_color);
      }
      elem.setAttr('draggable', false);
    });
  }

  handleClickEvent = event => {
    if (this.currentLineToDraw.isLineDrawable) {
      this.currentLineToDraw.isLineDrawable = false;
      let current_group = this.mainLayer.getStage().findOne(elem => {
        if (elem._id === this.currentLineToDraw.groupId) {
          return elem;
        }
      });
      let current_path = current_group.findOne(elem => {
        if (elem.attrs.custom_id && elem.attrs.custom_id.includes('line')) {
          return elem;
        }
      });
      this.canvasService.resetActivePathArr();
      return 0;
    }
  };

  handleDragOver = e => {
    if (this.idChangedTrigger) {
      this.currentDraggedGroup = this.canvasService.createDefaultGroup(this.mainLayer, this.activeWrapperBlock, this.currentActiveGroup, this.currentId);
      this.idChangedTrigger = false;
      this.setClickEventForGroup(this.currentDraggedGroup);
      this.mainLayer.getStage().add(this.currentDraggedGroup);
      this.mainLayer.getStage().children[this.mainLayer.getStage().children.length - 1].setAttr('time', new Date().getTime());
      this.mainLayer.getStage().draw();
      this.undoRedoService.addAction({ action: ActionType.Create, object: this.currentDraggedGroup, parent: this.mainLayer });
    } else {
      this.mainLayer.getStage().children[this.mainLayer.getStage().children.length - 1].position({ x: e.layerX / (this.zoomInPercent / 100), y: e.layerY / (this.zoomInPercent / 100) });
      this.checkingBlockInFlowboard();
      if (!this.interval) {
        this.interval = setInterval(() => {
          this.stage.getStage().add(this.mainLayer.getStage());
        }, 0);
      }
    }
  };

  checkIsGroupInFlow(flowboard, block, returnFlow?: boolean) {
    if (flowboard && flowboard.attrs.x < block.attrs.x - ShapesSizes.circle_radius && 
      flowboard.attrs.x + flowboard.attrs.width > block.attrs.x + block.width() - ShapesSizes.circle_radius &&
      flowboard.attrs.y < block.attrs.y &&
      flowboard.attrs.y + flowboard.attrs.height > block.attrs.y + block.height()) {
      return returnFlow ? flowboard : true;
    }
  }

  checkingBlockInFlowboard(){
    let temp;
    this.blocksService.getFlowboards().forEach(elem => {
      if (this.checkIsGroupInFlow(elem, this.currentDraggedGroup)) {
        temp = this.checkIsGroupInFlow(elem, this.currentDraggedGroup, true);
        return 0;
      }
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
  }

  getPathFromGroupById(id: number, component: StageComponent | any) {
    if (component) {
      return component.findOne(elem => {
        if (elem.className === 'Path' && elem._id === id) {
          return elem;
        }
      });
    } else {
      return null;
    }
  }

  handleMouseUp = e => {
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
      return 0;
    }

    // TODO: rectamgle selected blocks
    if (this.activeWrapperBlock.isDraw) {
      let allBlocks = this.mainLayer.getStage().find('Group').filter(group => group.attrs.type === GroupTypes.Block);
      allBlocks.forEach(elem => {
        if (this.checkValueBetween(elem.getAbsolutePosition(), elem.attrs.width, elem.attrs.height)) {
          this.selectedBlock((elem as any).findOne('Rect'));
        }
      });
      this.activeWrapperBlock.isActive = true;
      this.activeWrapperBlock.isDraw = false;
      this.activeWrapperBlock.rectangle.setAttr('visible', false);
    }
    this.mainLayer.getStage().draw();
  };

  checkValueBetween = (obj: { x: number; y: number }, width, height) => {
    // up and left
    let condition_up_and_left =
      ((obj.x < this.activeWrapperBlock.initial_position.x &&
        obj.x > this.activeWrapperBlock.now_position.x) ||
        (obj.x + width < this.activeWrapperBlock.initial_position.x &&
          obj.x + width > this.activeWrapperBlock.now_position.x)) &&
      ((this.activeWrapperBlock.initial_position.y >= obj.y &&
        this.activeWrapperBlock.now_position.y <= obj.y) ||
        (this.activeWrapperBlock.initial_position.y >= obj.y + height &&
          this.activeWrapperBlock.now_position.y <= obj.y + height));
    let condition_up_and_right =
      ((obj.x >= this.activeWrapperBlock.initial_position.x &&
        obj.x <= this.activeWrapperBlock.now_position.x) ||
        (obj.x + width >= this.activeWrapperBlock.initial_position.x &&
          obj.x + width <= this.activeWrapperBlock.now_position.x)) &&
      ((this.activeWrapperBlock.initial_position.y >= obj.y &&
        this.activeWrapperBlock.now_position.y <= obj.y) ||
        (height &&
          this.activeWrapperBlock.initial_position.y >= obj.y + height &&
          this.activeWrapperBlock.now_position.y <= obj.y + height));

    let condition_down_and_right =
      (obj.x >= this.activeWrapperBlock.initial_position.x &&
        obj.x <= this.activeWrapperBlock.now_position.x) ||
      (width &&
        obj.x >= this.activeWrapperBlock.initial_position.x + width &&
        obj.x <= this.activeWrapperBlock.now_position.x + width &&
        ((this.activeWrapperBlock.initial_position.y >= obj.y &&
          this.activeWrapperBlock.now_position.y <= obj.y) ||
          (this.activeWrapperBlock.initial_position.y >= obj.y &&
            this.activeWrapperBlock.now_position.y <= obj.y) ||
          (height &&
            this.activeWrapperBlock.initial_position.y >= obj.y + height &&
            this.activeWrapperBlock.now_position.y <= obj.y + height)));

    let condition_down_and_left =
      ((obj.x <= this.activeWrapperBlock.initial_position.x &&
        obj.x >= this.activeWrapperBlock.now_position.x) ||
        (width &&
          obj.x + width <= this.activeWrapperBlock.initial_position.x &&
          obj.x + width >= this.activeWrapperBlock.now_position.x)) &&
      this.activeWrapperBlock.initial_position.y <= obj.y &&
      this.activeWrapperBlock.now_position.y >= obj.y;
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
  };

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
      this.canvasService.activePathsArr.forEach(elem => {
        elem.remove();
      });
      this.undoRedoService.addAction({
        action: ActionType.Delete,
        object: this.canvasService.activePathsArr
      });
      this.canvasService.resetActivePathArr();
    }
  }

  @HostListener('document:keydown.escape') undoEsc(event: KeyboardEvent){
    if(this.currentCopiedGroup.isVisible() && this.currentCopiedGroup.hasChildren()){
      this.currentCopiedGroup.setAttr('visible', false);
      this.mainLayer.getStage().draw();
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

  // TODO: Ctrl + C
  @HostListener('document:keydown.control.c') undoCtrlC(event: KeyboardEvent) {
    if (this.selectedBlocks.length > 0) {
      this.currentCopiedGroup.removeChildren();
      let allElemPaths = [];
      let allClonedPaths = [];
      let allElemOutputs = [];
      let allClonedOutputs = [];
      let allElemInputs = [];
      let allClonedInputs = [];
      let clonedBlocks = [];
      this.selectedBlocks.forEach(elem => {
        elem.find('Path').forEach(path => allElemPaths.push(path));
        elem.find('Circle').filter(circle => circle.attrs.type === CircleTypes.Output).forEach(output => allElemOutputs.push(output));
        elem.find('Circle').filter(circle => circle.attrs.type === CircleTypes.Input).forEach(input => allElemInputs.push(input));
        let clone = elem.clone();
        clone.attrs.flowId = elem.parent._id;
        clonedBlocks.push(clone);
        this.returnColorAfterSelect(elem);
      });
      clonedBlocks.forEach(elem => {
        elem.find('Path').forEach(path => allClonedPaths.push(path));
        elem.find('Circle').filter(circle => circle.attrs.type === CircleTypes.Output).forEach(output => allClonedOutputs.push(output));
        elem.find('Circle').filter(circle => circle.attrs.type === CircleTypes.Input).forEach(input => allClonedInputs.push(input));
      })
      allElemPaths.forEach((path, indexPath) => {
        if (path) {
          allElemOutputs.forEach((output, indexOutput) => {
            if (output) {
              if (path.attrs.start_info.start_circle_id === output._id) {
                allClonedPaths[indexPath].attrs.start_info.start_circle_id = allClonedOutputs[indexOutput]._id;
                allClonedPaths[indexPath].attrs.start_info.start_group_id = allClonedOutputs[indexOutput].parent._id;
              }
            }
          })
          allElemInputs.forEach((input, indexInput) => {
            if (input) {
              if (path.attrs.end_info.end_circle_id === input._id) {
                allClonedPaths[indexPath].attrs.end_info.end_circle_id = allClonedInputs[indexInput]._id;
                allClonedPaths[indexPath].attrs.end_info.end_group_id = allClonedInputs[indexInput].parent._id;
              }
            }
          })
        }
        // if id input cicle original path equal id input cicle clone path
        // it's mean we don't copy block on end of this path
        // and don't need copy this path
        if (path.attrs.end_info.end_circle_id === allClonedPaths[indexPath].attrs.end_info.end_circle_id) {
          allClonedPaths[indexPath].destroy();
        }
      })
      if (clonedBlocks.length > 0) {
        clonedBlocks.forEach(block => this.currentCopiedGroup.add(block))
      }
      this.localNotificationService.sendLocalNotification(`Copied ${this.selectedBlocks.length} blocks`, NotificationTypes.INFO);
      this.selectedBlocks = [];
    }
    // responds to control+z
  }

  // TODO: Ctrl + V
  @HostListener('document:keydown.control.v') undoCtrlV(event: KeyboardEvent) {
    this.currentCopiedGroup.setAttr('visible', true);
    this.currentCopiedGroup.setAbsolutePosition({
      x: this.stage.getStage().getPointerPosition().x - this.currentCopiedGroup.children[0].attrs.x,
      y: this.stage.getStage().getPointerPosition().y - this.currentCopiedGroup.children[0].attrs.y
    });
    console.log(this.currentCopiedGroup);
    
    this.mainLayer.getStage().draw();
    // responds to control+z
  }

  handleMouseMove = e => {
    if (!e) {
      return 0;
    }
    if (this.currentCopiedGroup.getChildren()) {
      this.mainLayer.getStage().draw();
    }
    if (this.stage.getStage().getPointerPosition().x > this.stage.getStage().width() - 20 && this.isMouseDown) {
      if (this.stage.getStage().width() + 500 <= MaxStageSize) {
        this.stage.getStage().width(this.stage.getStage().width() + 500);
        this.activeTab.startStageSize.oldWidth = this.stage.getStage().width();
      }
    }
    if (this.stage.getStage().getPointerPosition().y > this.stage.getStage().height() - 20 && this.isMouseDown) {
      if (this.stage.getStage().height() + 500 <= MaxStageSize) {
        this.stage.getStage().height(this.stage.getStage().height() + 500);
        this.activeTab.startStageSize.oldHeight = this.stage.getStage().height();
      }
    }

    if (this.currentLineToDraw.isLineDrawable) {
      const pos = this.stage.getStage().getPointerPosition();
      if (Math.abs(this.currentLineToDraw.prevMainX - pos.x) > 10 || Math.abs(this.currentLineToDraw.prevMainY - pos.y) > 10) {
        const pos = this.stage.getStage().getPointerPosition();
        let current_flowboard = this.mainLayer.getStage().findOne(elem => {
          if (elem._id === this.currentLineToDraw.flowboardId) {
            return elem;
          }
        });
        let current_group = current_flowboard.findOne(elem => {
          if (elem._id === this.currentLineToDraw.groupId) {
            return elem;
          }
        });
        let current_path = current_group.findOne(elem => {
          if (elem._id === this.currentLineToDraw.lineId) {
            return elem;
          }
        });
        if (current_path) {
          current_path.setAttr(
            'data',
            KonvaUtil.generateLinkPath(
              this.currentLineToDraw.prevX - current_group.getPosition().x - 20,
              this.currentLineToDraw.prevY - current_group.getPosition().y,
              Math.ceil(
                (pos.x / (this.zoomInPercent / 100) -
                  current_group.parent.getPosition().x -
                  current_group.getPosition().x) /
                5
              ) * 5,
              Math.ceil(
                (pos.y / (this.zoomInPercent / 100) -
                  current_group.parent.getPosition().y -
                  current_group.getPosition().y) /
                5
              ) * 5,
              1
            )
          );
        }
        this.mainLayer.getStage().draw();
      }
    }
    if (this.canvasService.activePathsArr.length > 0) {
      return 0;
    }

    // TODO: some logic for Ctrl+V
    if (this.currentCopiedGroup.hasChildren()) {
      this.currentCopiedGroup.setAbsolutePosition({
        x: this.stage.getStage().getPointerPosition().x - this.currentCopiedGroup.children[0].attrs.x,
        y: this.stage.getStage().getPointerPosition().y - this.currentCopiedGroup.children[0].attrs.y
      });
    }

    if (this.activeWrapperBlock.isDraw) {
      this.updateDragWrapper({x: e.layerX, y: e.layerY});
      this.mainLayer.getStage().draw();
    }

  };

  handleMouseDown = e => {
    this.isMouseDown = true;
    if (this.currentLineToDraw.isLineDrawable) {
      return 0;
    }
    this.activeWrapperBlock.initial_position.x = e.layerX;
    this.activeWrapperBlock.initial_position.y = e.layerY;
    this.activeWrapperBlock.now_position.x = e.layerX;
    this.activeWrapperBlock.now_position.y = e.layerY;
    this.activeWrapperBlock.isDraw = true;
  };

  // TODO: function call when we click on place where paste objects
  // at first we take position of first shape for calculation 
  // positions for another objects, after we transer all object
  // from copy group in flowboard 
  pasteOperation(flow) {
    let pasteFlowId = this.currentCopiedGroup.children[0].attrs.flowId;
    if(flow._id === pasteFlowId){
      let firstShapeX = this.currentCopiedGroup.children[0].attrs.x;
      let firstShapeY = this.currentCopiedGroup.children[0].attrs.y;
      let pasteObj;
      while (this.currentCopiedGroup.getChildren().length > 0) {
        pasteObj = this.currentCopiedGroup.children[0];
        this.canvasService.setListenerOnBlock(this.mainLayer, pasteObj);
        this.canvasService.setListenerOnIcons(pasteObj);
        let flow = this.blocksService.getFlowboards().find(flow => flow._id === pasteObj.attrs.flowId);
        pasteObj.setAttrs({
          x: this.stage.getStage().getPointerPosition().x - flow.attrs.x + 5 + pasteObj.attrs.x - firstShapeX,
          y: this.stage.getStage().getPointerPosition().y - flow.attrs.y + 5 + pasteObj.attrs.y - firstShapeY,
        })
        pasteObj.children[0].setAttr('text', 'copy ' + pasteObj.children[0].attrs.text);
        this.returnColorAfterSelect(pasteObj);
        flow.add(pasteObj);
        this.currentCopiedGroup.setAttr('visible', false);
      }
      this.blocksService.pushFlowboardsChanges();
    }else{
      this.localNotificationService.sendLocalNotification(`Choose place inside ${this.blocksService.getFlowboardName(pasteFlowId)}`, NotificationTypes.ERROR);
    }
  }

  createGrid = flow => {
    let distBetweenLines = 20;
    let vertLines = flow.attrs.height / distBetweenLines;
    let horLines = flow.attrs.width / distBetweenLines;
    let maxLines = vertLines > horLines ? vertLines : horLines;
    for (let i = 1; i <= maxLines; i++) {
      if (vertLines > i) {
        flow.add(
          ShapeCreator.createLineForGrid([
            distBetweenLines * i,
            0,
            distBetweenLines * i,
            flow.attrs.height
          ])
        );
      }
      if (horLines > i) {
        flow.add(
          ShapeCreator.createLineForGrid([
            0,
            distBetweenLines * i,
            flow.attrs.width,
            distBetweenLines * i
          ])
        );
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
    flow.setAttr(
      'name',
      `new flow${this.blocksService.getFlowboards().length}`
    );
    flow.add(
      ShapeCreator.createShadowForGrid(flow.attrs.width, flow.attrs.height),
      ShapeCreator.createDrugPoint(),
      ShapeCreator.createNameOfFlowboard(flow.attrs.name),
      menuButton
    );
  };

  ngOnInit() {
    this.subTabs = [
      {
        label: 'Main Project',
        layerData: [],
        startStageSize: { oldHeight: 0, oldWidth: 0 }
      },
      {
        label: 'Sub View',
        layerData: [],
        startStageSize: { oldHeight: 0, oldWidth: 0 }
      }
    ];
    this.activeTab = this.subTabs[0];
    if (this.subTabs.length > 1) {
      this.subTabs.forEach((tab, index) => {
        if (index > 0) {
          this.menuOfViews.push(tab.label);
        }
      });
    }
    this.RegistryService.currentDraggableItem.subscribe(data => {
      this.currentId = data;
      this.idChangedTrigger = true;
    });
    this.RegistryService.currentTabBlocks.subscribe(blocks => {
      this.data = blocks;
    });
    this.canvasService.lineToDraw.subscribe(data => {
      this.currentLineToDraw = data;
    });
    this.canvasService.activeBlock.subscribe(data => {
      this.activeWrapperBlock = data;
    });
  }

  ngAfterViewInit() {
    this.stage.getStage().add(this.mainLayer.getStage());
    this.mainLayer.getStage().add(this.activeWrapperBlock.rectangle);
    this.canvasService.dragFinished.subscribe(() => {
      let temp;
      this.canvasService.getAllFlowsFromLayer(this.mainLayer).each(flowGroup => {
        if (!temp) {
          temp = this.checkIsGroupInFlow(flowGroup,this.currentDraggedGroup, true);
          if (temp) {
            this.currentDraggedGroup.position({
              x: Math.abs(this.currentDraggedGroup.position().x - temp.position().x),
              y: Math.abs(this.currentDraggedGroup.position().y - temp.position().y)
            });
            temp.add(this.currentDraggedGroup);
            let temp_custom  = temp.findOne(elem => elem._id === this.currentDraggedGroup._id);
            this.blocksService.pushFlowboardsChanges();

            // function restrict block in border of flowboard 
            this.currentDraggedGroup.dragBoundFunc(pos => {
              return {
                x: pos.x <= (temp_custom.parent.position().x + GridSizes.flowboard_cell) * (this.zoomInPercent / 100) ? (temp_custom.parent.position().x + GridSizes.flowboard_cell) * (this.zoomInPercent / 100)
                  : pos.x <= (temp_custom.parent.position().x + temp_custom.parent.attrs.width - temp_custom.attrs.width) * (this.zoomInPercent / 100)
                    ? pos.x : (temp_custom.parent.position().x + temp_custom.parent.attrs.width - temp_custom.attrs.width) * (this.zoomInPercent / 100),
                y: pos.y <= (temp_custom.parent.position().y + GridSizes.flowboard_cell * 2) * (this.zoomInPercent / 100) ? (temp_custom.parent.position().y + GridSizes.flowboard_cell) * (this.zoomInPercent / 100)
                  : pos.y <= (temp_custom.parent.position().y + temp_custom.parent.attrs.height - temp_custom.attrs.height) * (this.zoomInPercent / 100)
                    ? pos.y : (temp_custom.parent.position().y + temp_custom.parent.attrs.height - temp_custom.attrs.height - GridSizes.flowboard_cell) * (this.zoomInPercent / 100)
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
    this.canvasService.flowboardDimensionsChanged.subscribe(value => {
      let temp_elem = this.blocksService.getFlowboards().find(elem => {
        if (elem._id === value.id) {
          return elem;
        }
      });
      this.canvasService.checkIfCollisionBetweenFlowBoards(
        temp_elem,
        this.blocksService.getFlowboards(),
        value.dimension
      );
    });
    this.canvasService.flowboardPositionChanged.subscribe(value => {
      let temp_elem = this.blocksService.getFlowboards().find(elem => {
        if (elem._id === value.id) {
          return elem;
        }
      });
      temp_elem &&
        this.canvasService.checkIfCollisionBetweenFlowBoards(
          temp_elem,
          this.blocksService.getFlowboards(),
          value.dimension
        );
    });

    this.blocksService &&
      this.blocksService.getFlowboards().forEach(flow => {
        this.createGrid(flow);
        this.mainLayer.getStage().add(flow);
      });
    this.mainLayer.getStage().add(this.currentActiveGroup);
    this.currentActiveGroup.zIndex(1);
    this.mainLayer.getStage().add(this.currentLineToDraw.line);
    this.mainLayer.getStage().add(this.currentCopiedGroup);
    // TODO: if we have few selected blocks and click on free space 
    // all blocks became unselected
    this.stage.getStage().on('click', event => {
      if (this.selectedBlocks.length > 0) {
        this.selectedBlocks.forEach(elem => {
          this.returnColorAfterSelect(elem);
        });
      }
      this.selectedBlocks = [];
    })

    this.scrollContainer.nativeElement.addEventListener('scroll', event => {
      this.repositionStage(event);
    });
    this.repositionStage();
    this.activeTab.startStageSize.oldWidth = this.stage.getStage().width();
    this.activeTab.startStageSize.oldHeight = this.stage.getStage().height();
    this.zoomInPercent = this.stage.getStage().scaleX() * 100;
    this.canvasService.setCurrentZoom(this.zoomInPercent);
  }

  returnColorAfterSelect(shape) {
    shape.children.each(elem => {
      if (elem.className === 'Rect') {
        elem.setAttr('stroke', shape.attrs.blockData.color);
      }
    })
  }

  addFlowToLayer() {
    let newX, newY;
    if (this.blocksService.getFlowboards().length === 0) {
      newX = newY = FlowboardSizes.sizeBetweenFlowblock;
    } else {
      let lastFlowboard = this.blocksService.getFlowboards()[
        this.blocksService.getFlowboards().length - 1
      ];
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
    newFlow.on('click', event =>{
    //TODO: if we paste copied block we chose place 
    if (this.currentCopiedGroup.getChildren().length > 0 && this.currentCopiedGroup.isVisible()) {
      this.pasteOperation(newFlow);
    }
    })
    this.createGrid(newFlow);
    this.mainLayer.getStage().add(newFlow);
    this.subTabs[0].layerData = [];
    this.subTabs[0].layerData = this.mainLayer.getStage().children.toArray();
    setTimeout(() => {
      this.mainLayer.getStage().draw();
    }, 100);
  }

  onMainTabBarClick(event) {
    this.activeTab = this.subTabs.find(
      tab => tab.label === event.tab.textLabel
    );
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
        this.showSubView(this.activeTab.layerData[0].id);
      }
    }
  }

  onFlowTabBarClick(event) {
    this.showSubView(this.activeTab.layerData[event].id);
  }

  showSubView(id) {
    this.mainLayer.getStage().removeChildren();
    this.stage
      .getStage()
      .content.parentElement.parentElement.parentElement.scroll(0, 0);
    let showFlow = this.blocksService
      .getFlowboards()
      .find(flow => flow._id === id)
      .clone();
    this.stage.getStage().width(KonvaStartSizes.width);
    if (showFlow.attrs.height * 1.25 > KonvaStartSizes.height) {
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
  }

  convertMyFlowForView(flowboard) {
    if (flowboard.attrs.type === GroupTypes.Flowboard) {
      this.draggingOnOff(flowboard);
      this.setPositionInView(flowboard);
      flowboard.children.toArray().forEach(obj => {
        if (obj.attrs.type === GroupTypes.Block) {
          this.draggingOnOff(obj);
        }
        if (
          obj.attrs.type === ButtonsTypes.DrugPoint ||
          obj.attrs.type === ButtonsTypes.MenuButton
        ) {
          this.showOrHide(obj);
        }
      });
    }
  }

  setPositionInView(flowboard) {
    flowboard.attrs.x = (ContainerKonvaSizes.width - flowboard.attrs.width) / 2;
    flowboard.attrs.y =
      (ContainerKonvaSizes.height - flowboard.attrs.height) / 2;
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
    if (!tmp.layerData.find(elem => elem.id === this.calledMenuButton._id)) {
      tmp.layerData.push({
        // @ts-ignore
        id: this.calledMenuButton._id,
        // @ts-ignore
        name: this.calledMenuButton.attrs.name
      });
    }
  }

  zoomingEvent(event) {
    this.zoomInPercent = event * 100;
    this.canvasService.setCurrentZoom(event * 100);
    this.stage.getStage().scale({ x: event, y: event });
    this.stage
      .getStage()
      .width(
        this.activeTab.startStageSize.oldWidth * event < MaxStageSize
          ? this.activeTab.startStageSize.oldWidth * event
          : MaxStageSize
      );
    this.stage
      .getStage()
      .height(
        this.activeTab.startStageSize.oldHeight * event < MaxStageSize
          ? this.activeTab.startStageSize.oldHeight * event
          : MaxStageSize
      );
  }

  repositionStage(event?) {
    let dx;
    let dy;
    if (event) {
      dx = event.target.scrollLeft - KonvaStartSizes.padding;
      dy = event.target.scrollTop - KonvaStartSizes.padding;
    } else {
      dx =
        this.scrollContainer.nativeElement.scrollLeft - KonvaStartSizes.padding;
      dy =
        this.scrollContainer.nativeElement.scrollTop - KonvaStartSizes.padding;
    }
    this.stage.getStage().container().style.transform =
      'translate(' + dx + 'px, ' + dy + 'px)';
    // this.stage.getStage().x(-dx);
    // this.stage.getStage().y(-dy);
    this.stage.getStage().batchDraw();
  }
}
