import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { RegistryService } from '../services/registry.service';
import { theme } from './theme';
import Konva from 'konva';
import { CanvasService } from '../services/canvas.service';
import { CircleTypes, dataInTabLayer, GroupTypes, ButtonsTypes, IActiveWrapperBlock, ICurrentLineToDraw, IGroupCustom, IPathCustom, allBlockVariables } from './shapes-interface';
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
import ShapesClipboard from './shapes-clipboard';
import { FlowboardSizes } from './sizes';
import { Stage } from 'konva/types/Stage';
import { BlocksService } from '../services/blocks.service';
import { TestStartStop } from '../services/testStartStop';
import { StageComponent } from 'ng2-konva';
import { LocalNotificationService, NotificationTypes } from '../popups/local-notification/local-notification.service';
import { IdbService } from '../services/indexed-db.service';
import { DataStorages, FlowBlock, FlowPort, Board, DataState, FlowRelation, PaletteElement, Color, Image } from '../services/indexed-db.interface';
import { HttpClientService } from '../services/http-client.service';
import { Observable, of } from 'rxjs';

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
    private localNotificationService: LocalNotificationService,
    private iDBService: IdbService,
    private httpClientService: HttpClientService,
  ) { }

  @ViewChild('stage', null) stage: Stage;
  @ViewChild('menuTrigger', null) menuTrigger: MatMenuTrigger;
  @ViewChild('mainLayer', null) mainLayer: any = new Konva.Layer({});
  @ViewChild('scroll_container', { static: true }) scrollContainer: ElementRef;

  data = [];
  lines = [];
  currentId: number;
  idChangedTrigger: boolean = false;
  subTabs: dataInTabLayer[] = [];
  menuOfViews: string[] = [];
  zoomInPercent: number = 100;
  activeTab: dataInTabLayer;

  private interval: any;
  private isMouseDown: boolean;
  private oldStageWidth: number;
  private oldStageHeight: number;
  private calledMenuButton: any;
  private selectedBlocks = [];
  private copiedBlocks = [];
  private palettes: PaletteElement[];
  private colors: Color[];
  private images: Image[];

  public configStage: Observable<any> = of({
    width: window.innerWidth + KonvaStartSizes.padding * 2,
    height: window.innerHeight + KonvaStartSizes.padding * 2
  });

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
      opacity: 1,
      data: '',
      stroke: 'blue',
      strokeWidth: 0.75,
      fill: 'rgba(231,242,255,0.2)',
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
                ShapeCreator.generateLinkPath(
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
                ShapeCreator.generateLinkPath(
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

  // rectangle for selection blocks for copying
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

  // TODO: taking block data
  getAllBlockVariables(id) {
    let block = this.palettes.find(palette => palette.id === id);
    let color = this.colors.find(color => color.id === block.colorId);
    let image = this.images.find(image => image.id === block.imageId);
    return { block, color, image };
  }

  handleDragOver = e => {
    if (this.idChangedTrigger) {
      this.currentDraggedGroup = this.canvasService.createDefaultGroup(this.mainLayer, this.activeWrapperBlock, this.currentActiveGroup, this.getAllBlockVariables(this.currentId), this.selectedBlocks);
      this.idChangedTrigger = false;
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

  checkingBlockInFlowboard() {
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
        current_group.setAttr('draggable', true);
        temp_path.remove();
      }
      return 0;
    }
    //rectamgle look witch blocks in own borders
    if (this.activeWrapperBlock.isDraw) {
      let allBlocks = this.mainLayer.getStage().find('Group').filter(group => group.attrs.type === GroupTypes.Block);
      allBlocks.forEach(elem => {
        if (this.checkValueBetween(elem.getAbsolutePosition(), elem.attrs.width, elem.attrs.height)) {
          ShapesClipboard.selectedBlock((elem as any).findOne('Rect'), this.selectedBlocks);
        }
      });
      this.activeWrapperBlock.isActive = true;
      this.activeWrapperBlock.isDraw = false;
      this.activeWrapperBlock.rectangle.setAttr('visible', false);
    }
    this.mainLayer.getStage().draw();
  };

  checkValueBetween = (obj: { x: number; y: number }, width, height) => {
    let condition_up_and_left =
      ((obj.x < this.activeWrapperBlock.initial_position.x && obj.x > this.activeWrapperBlock.now_position.x) ||
        (obj.x + width < this.activeWrapperBlock.initial_position.x && obj.x + width > this.activeWrapperBlock.now_position.x)) &&
      ((this.activeWrapperBlock.initial_position.y >= obj.y && this.activeWrapperBlock.now_position.y <= obj.y) ||
        (this.activeWrapperBlock.initial_position.y >= obj.y + height && this.activeWrapperBlock.now_position.y <= obj.y + height));

    let condition_up_and_right =
      ((obj.x >= this.activeWrapperBlock.initial_position.x && obj.x <= this.activeWrapperBlock.now_position.x) ||
        (obj.x + width >= this.activeWrapperBlock.initial_position.x && obj.x + width <= this.activeWrapperBlock.now_position.x)) &&
      ((this.activeWrapperBlock.initial_position.y >= obj.y && this.activeWrapperBlock.now_position.y <= obj.y) ||
        (height && this.activeWrapperBlock.initial_position.y >= obj.y + height && this.activeWrapperBlock.now_position.y <= obj.y + height));

    let condition_down_and_right =
      ((obj.x >= this.activeWrapperBlock.initial_position.x && obj.x <= this.activeWrapperBlock.now_position.x) ||
        (width && obj.x + width >= this.activeWrapperBlock.initial_position.x && obj.x + width <= this.activeWrapperBlock.now_position.x)) &&
      this.activeWrapperBlock.initial_position.y <= obj.y && this.activeWrapperBlock.now_position.y >= obj.y;

    let condition_down_and_left =
      ((obj.x <= this.activeWrapperBlock.initial_position.x && obj.x >= this.activeWrapperBlock.now_position.x) ||
        (width && obj.x + width <= this.activeWrapperBlock.initial_position.x && obj.x + width >= this.activeWrapperBlock.now_position.x)) &&
      this.activeWrapperBlock.initial_position.y <= obj.y && this.activeWrapperBlock.now_position.y >= obj.y;

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

  @HostListener('document:keydown.escape') undoEsc(event: KeyboardEvent) {
    if (this.currentCopiedGroup.isVisible() && this.currentCopiedGroup.hasChildren()) {
      this.currentCopiedGroup.setAttr('visible', false);
      this.mainLayer.getStage().draw();
    }
  }

  @HostListener('document:keydown.control.z') undoCtrlZ(event: KeyboardEvent) {
    if (this.currentActiveGroup.hasChildren) {
      this.tempService.performUndo(this.mainLayer, this.currentActiveGroup);
    } else {
      this.tempService.performUndo(this.mainLayer, this.currentActiveGroup);
    }
  }

  // Ctrl + C
  @HostListener('document:keydown.control.c') undoCtrlC(event: KeyboardEvent) {
    if (this.selectedBlocks.length > 0) {
      this.copiedBlocks = this.selectedBlocks;
      this.localNotificationService.sendLocalNotification(`Copied (${this.selectedBlocks.length}) blocks`, NotificationTypes.OK);
      this.selectedBlocks = [];
    }
  }

  // Ctrl + V
  @HostListener('document:keydown.control.v') undoCtrlV(event: KeyboardEvent) {
    if (this.copiedBlocks.length > 0) {
      ShapesClipboard.copySelectedBlocks(this.currentCopiedGroup, this.copiedBlocks);
      ShapesClipboard.setSizeForCopiedGroup(this.currentCopiedGroup);
      this.setPositionForGroup(this.currentCopiedGroup);
      this.currentCopiedGroup.setAttr('visible', true);
    } else {
      this.localNotificationService.sendLocalNotification(`Clipboard is empty`, NotificationTypes.ERROR);
    }
    this.mainLayer.getStage().draw();
  }

  setPositionForGroup(group, isPointerXY?) {
    if (group.hasChildren()) {
      if (!isPointerXY) {
        group.setAttrs({
          x: this.stage.getStage().getPointerPosition().x - group.children[0].attrs.x,
          y: this.stage.getStage().getPointerPosition().y - group.children[0].attrs.y
        });
      } else {
        group.setAttrs({
          x: this.stage.getStage().getPointerPosition().x,
          y: this.stage.getStage().getPointerPosition().y
        });
      }
    }
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
          if (elem._id === this.currentLineToDraw.groupId && elem.attrs.type === GroupTypes.Block) {
            return elem;
          }
        });
        let current_path = current_group.findOne(elem => {
          if (elem._id === this.currentLineToDraw.lineId) {
            return elem;
          }
        });
        if (current_path) {
          current_path.setAttr('data',
            ShapeCreator.generateLinkPath(
              this.currentLineToDraw.prevX - current_group.getPosition().x - 20,
              this.currentLineToDraw.prevY - current_group.getPosition().y,
              Math.ceil((pos.x / (this.zoomInPercent / 100) - current_group.parent.getPosition().x - current_group.getPosition().x) / 5) * 5,
              Math.ceil((pos.y / (this.zoomInPercent / 100) - current_group.parent.getPosition().y - current_group.getPosition().y) / 5) * 5, 1)
          );
        }
        this.mainLayer.getStage().draw();
      }
    }
    if (this.canvasService.activePathsArr.length > 0) {
      return 0;
    }
    // change position of pasted group
    this.setPositionForGroup(this.currentCopiedGroup);
    if (this.activeWrapperBlock.isDraw) {
      this.updateDragWrapper({ x: e.layerX, y: e.layerY });
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

  createGrid = flow => {
    let distBetweenLines = 20;
    let horLines = flow.attrs.height / distBetweenLines;
    let vertLines = flow.attrs.width / distBetweenLines;
    let maxLines = vertLines > horLines ? vertLines : horLines;
    for (let i = 1; i <= maxLines; i++) {
      if (vertLines > i) {
        flow.add(ShapeCreator.createLineForGrid([distBetweenLines * i, 0, distBetweenLines * i, flow.attrs.height])
        );
      }
      if (horLines > i) {
        flow.add(ShapeCreator.createLineForGrid([0, distBetweenLines * i, flow.attrs.width, distBetweenLines * i])
        );
      }
    }
    let menuButton = ShapeCreator.createMenuButton(flow.attrs.width);
    let deleteButton = ShapeCreator.createDeleteButton(flow.attrs.width);
    flow.add(
      ShapeCreator.createShadowForGrid(flow.attrs.width, flow.attrs.height),
      ShapeCreator.createDrugPoint(flow.attrs.width),
      ShapeCreator.createNameOfFlowboard(flow.attrs.name),
      deleteButton,
      menuButton
    );
    this.setClickEventForFlowboardButtons(flow);
  };

  setClickEventForFlowboardButtons(flowboard) {
    flowboard.children.each(child => {
      if (child.attrs.type === ButtonsTypes.MenuButton) {
        child.on('click', event => {
          let menu = document.getElementById('menuTrigger');
          menu.style.display = '';
          menu.style.position = 'fixed';
          menu.style.left = event.evt.clientX + 'px';
          menu.style.top = event.evt.clientY + 10 + 'px';
          this.menuTrigger.openMenu();
          this.calledMenuButton = event.target.parent;
        });
      } else if (child.attrs.type === ButtonsTypes.DeleteButton) {
        child.on('click', event => {
          if (confirm(`Are you shore to deliting "${flowboard.attrs.name}"`)) {
            if (flowboard.hasChildren()) {
              flowboard.destroyChildren();
            }
            flowboard.destroy();
            this.blocksService.removeFlowboard(flowboard._id);
            this.localNotificationService.sendLocalNotification(`Flowboard "${flowboard.attrs.name}" was deleted.`, NotificationTypes.INFO);
          }
        })
      }
    })
  }

  ngOnInit() {
    this.httpClientService.getInitialData();
    //this.httpClientService.getFlowData();
    this.httpClientService.getPaletteData();
    this.httpClientService.httpResponsePayload.subscribe(payloadData => {
      if (payloadData.stores) {
        for (let storeName in payloadData.stores) {
          if (payloadData.stores[storeName].length > 0) {
            //check if store created in database if no creates it
            this.iDBService.connectionToIdb();
            this.iDBService.getStoreFromIDBByNameAndClear(storeName);
            payloadData.stores[storeName].forEach(storeElement => {
              this.iDBService.addData(storeName, storeElement);
            })
          }
        }
      }
    })

    // TODO: take data from iDB
    this.iDBService.getAllData(DataStorages.IMAGES).then(images => this.images = images);
    this.iDBService.getAllData(DataStorages.COLORS).then(colors => this.colors = colors);
    this.iDBService.getAllData(DataStorages.PALLETE_ELEMENTS).then(paletts => this.palettes = paletts);

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
      this.currentId = parseInt(data);
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
    this.loadingDataFromIDB();
    this.mainLayer.getStage().add(this.activeWrapperBlock.rectangle);
    this.canvasService.dragFinished.subscribe(() => {
      let actualFlowboard;
      this.canvasService.getAllFlowsFromLayer(this.mainLayer).each(flowGroup => {
        if (!actualFlowboard) {
          actualFlowboard = this.checkIsGroupInFlow(flowGroup, this.currentDraggedGroup, true);
          if (actualFlowboard) {
            this.currentDraggedGroup.position({
              x: Math.abs(this.currentDraggedGroup.position().x - actualFlowboard.position().x),
              y: Math.abs(this.currentDraggedGroup.position().y - actualFlowboard.position().y)
            });
            let actualFlowboardId = actualFlowboard._id;
            actualFlowboard.add(this.currentDraggedGroup);
            // save new Flow block to DB
            this.iDBService.checkIsKeyExist(DataStorages.FLOW_BLOCKS, this.currentDraggedGroup._id)
              .then(res => {
                if (!res) {
                  this.iDBService.addData(DataStorages.FLOW_BLOCKS,
                    {
                      id: this.currentDraggedGroup._id,
                      boardId: actualFlowboardId,
                      paletteElementId: this.currentDraggedGroup.attrs.paletteElementId,
                      location: {
                        x: this.currentDraggedGroup.attrs.x,
                        y: this.currentDraggedGroup.attrs.y,
                      },
                      formId: 1,
                      name: this.currentDraggedGroup.attrs.label,
                      state: DataState.ACTIVE,
                      sizes: {
                        width: this.currentDraggedGroup.attrs.width,
                        height: this.currentDraggedGroup.attrs.height
                      }
                    } as FlowBlock);
                  this.currentDraggedGroup.children.toArray().forEach(elem => {
                    if (elem.attrs.type === CircleTypes.Input || elem.attrs.type === CircleTypes.Output || elem.attrs.type === CircleTypes.Error) {
                      this.iDBService.addData(DataStorages.FLOW_PORTS,
                        {
                          id: elem._id,
                          type: elem.attrs.type,
                          location: {
                            x: elem.attrs.x,
                            y: elem.attrs.y
                          },
                          flowBlockId: elem.parent._id,
                          state: DataState.ACTIVE,
                          colorId: 1
                        } as FlowPort)
                    }
                  })
                }
              });



            let temp_custom = actualFlowboard.findOne(elem => elem._id === this.currentDraggedGroup._id);
            temp_custom.dragBoundFunc(pos => this.setDragBoundFunc(temp_custom, pos));
            this.blocksService.pushFlowboardsChanges();
            flowGroup.children.each(elem => {
              if (elem.className === 'Rect') {
                elem.setAttr('stroke', theme.line_color);
                return 0;
              }
            });
            actualFlowboard = true;
            return 0;
          }
        } else {
          return;
        }
      });
      !actualFlowboard && this.currentDraggedGroup && this.currentDraggedGroup.destroy();
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
      this.canvasService.checkIfCollisionBetweenFlowBoards(temp_elem, this.blocksService.getFlowboards(), value.dimension);
    });
    this.canvasService.flowboardPositionChanged.subscribe(value => {
      let temp_elem = this.blocksService.getFlowboards().find(elem => {
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
    // if we have few selected blocks and click on free space
    // all blocks became unselected
    this.stage.getStage().on('mouseup', event => {
      if (this.selectedBlocks.length > 0) {
        this.selectedBlocks.forEach(elem => {
          ShapesClipboard.returnColorAfterSelect(elem);
        });
        this.selectedBlocks = [];
      } else if (this.copiedBlocks.length > 0) {
        this.copiedBlocks.forEach(elem => {
          ShapesClipboard.returnColorAfterSelect(elem);
        });
      }
    })
    this.scrollContainer.nativeElement.addEventListener('scroll', this.repositionStage());
    this.repositionStage();
    this.activeTab.startStageSize.oldWidth = this.stage.getStage().width();
    this.activeTab.startStageSize.oldHeight = this.stage.getStage().height();
    this.zoomInPercent = this.stage.getStage().scaleX() * 100;
    this.canvasService.setCurrentZoom(this.zoomInPercent);
  }

  loadingDataFromIDB() {
    // loading boards from indexedDB
    this.iDBService.getAllData(DataStorages.BOARDS).then(data => {
      data.forEach((boardData: Board) => {
        this.addBoardToLayer(boardData);
      })
    })
    // loading ports from indexedDB
    this.iDBService.getAllData(DataStorages.FLOW_PORTS).then(portsData => {
      // loading blocks from indexedDB
      this.iDBService.getAllData(DataStorages.FLOW_BLOCKS).then(data => {
        data.forEach((blockData: FlowBlock) => {
          let block = this.canvasService.createDefaultGroup(this.mainLayer, this.activeWrapperBlock, this.currentActiveGroup,
            this.getAllBlockVariables(blockData.paletteElementId), this.selectedBlocks, blockData, portsData);
          block.setAttrs({ x: blockData.location.x, y: blockData.location.y });
          block.dragBoundFunc(pos => this.setDragBoundFunc(block, pos));
          this.blocksService.getFlowboards().forEach(board => {
            if (board._id === blockData.boardId) {
              board.add(block);
            }
          })
        })
        this.blocksService.pushFlowboardsChanges();
      }).then(() => {
        this.iDBService.getAllData(DataStorages.FLOW_RELATIONS).then(relationsData => {
          relationsData.forEach((path: FlowRelation) => {
            let startCircle;
            let endCircle;
            this.mainLayer.getStage().find('Circle').forEach(circle => {
              if (path.startPortId === circle._id) {
                startCircle = circle;
              } else if (path.endPortId === circle._id) {
                endCircle = circle;
              }
            });
            let lineData = ShapeCreator.generateLinkPath(
              startCircle.attrs.x,
              startCircle.attrs.y,
              endCircle.parent.attrs.x - startCircle.parent.attrs.x,
              endCircle.parent.attrs.y - startCircle.parent.attrs.y + endCircle.attrs.y,
              1);
            let line = ShapeCreator.createLine();
            startCircle.parent.add(line);
            line.setAttrs({
              'zIndex': 1,
              'data': lineData,
              start_info: {
                start_circle_id: startCircle._id,
                start_group_id: startCircle.parent._id,
                start_flowboard_id: startCircle.parent.parent._id
              },
              end_info: {
                end_circle_id: endCircle._id,
                end_group_id: endCircle.parent._id,
                end_flowboard_id: endCircle.parent.parent._id
              }
            })
            line._id = path.id;
            this.canvasService.setClickEventForPath(line as IPathCustom);
            this.canvasService.setGradientForPath(line, startCircle.position(), startCircle.attrs.stroke,
              { x: endCircle.parent.attrs.x - startCircle.parent.attrs.x, y: endCircle.parent.attrs.y - startCircle.parent.attrs.y + endCircle.attrs.y },
              endCircle.attrs.stroke);
            this.mainLayer.getStage().draw();
          })
        })
      })
    })
  }

  // function restrict block in border of flowboard
  setDragBoundFunc(flow, pos) {
    return {
      x: pos.x <= (flow.parent.position().x + GridSizes.flowboard_cell) * (this.zoomInPercent / 100) ? (flow.parent.position().x + GridSizes.flowboard_cell) * (this.zoomInPercent / 100)
        : pos.x <= (flow.parent.position().x + flow.parent.attrs.width - flow.attrs.width) * (this.zoomInPercent / 100)
          ? pos.x : (flow.parent.position().x + flow.parent.attrs.width - flow.attrs.width) * (this.zoomInPercent / 100),
      y: pos.y <= (flow.parent.position().y + GridSizes.flowboard_cell * 2) * (this.zoomInPercent / 100) ? (flow.parent.position().y + GridSizes.flowboard_cell) * (this.zoomInPercent / 100)
        : pos.y <= (flow.parent.position().y + flow.parent.attrs.height - flow.attrs.height) * (this.zoomInPercent / 100)
          ? pos.y : (flow.parent.position().y + flow.parent.attrs.height - flow.attrs.height - GridSizes.flowboard_cell) * (this.zoomInPercent / 100)
    };
  }

  addBoardToLayer(boardData?: Board) {
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
      x: boardData ? boardData.location.x : newX,
      y: boardData ? boardData.location.y : newY,
      width: boardData ? boardData.sizes.width : FlowboardSizes.newFlowWidth,
      height: boardData ? boardData.sizes.height : FlowboardSizes.newFlowHeight,
      //draggable: true,
      type: GroupTypes.Flowboard,
      name: boardData ? boardData.name : `new flowboard`,
      showOnPanel: true
    });
    this.setClickEventForFlowboard(newFlow);
    this.createGrid(newFlow);
    newFlow._id = boardData ? boardData.id : ShapeCreator.randomIdNumber();
    this.mainLayer.getStage().add(newFlow);
    this.blocksService.addFlowboard(newFlow);
    // save board to DB
    this.iDBService.checkIsKeyExist(DataStorages.BOARDS, newFlow._id)
      .then(res => {
        if (!res) {
          this.iDBService.addData(DataStorages.BOARDS,
            {
              id: newFlow._id,
              name: newFlow.attrs.name,
              location: {
                x: newFlow.attrs.x,
                y: newFlow.attrs.y
              },
              state: DataState.ACTIVE,
              description: 'description',
              colorId: 1,
              imageId: 1,
              formId: 1,
              sizes: {
                width: newFlow.attrs.width,
                height: newFlow.attrs.height
              }
            } as Board);
        }
      });
    this.subTabs[0].layerData = [];
    this.subTabs[0].layerData = this.mainLayer.getStage().children.toArray();
    setTimeout(() => {
      this.mainLayer.getStage().draw();
    }, 100);
  }

  setClickEventForFlowboard(flowboard) {
    flowboard.on('click', () => this.placeForPasteInsideFlowboard(flowboard));
  }

  placeForPasteInsideFlowboard = (flowboard: Group) => {
    //if we paste copied block we chose place
    if (this.currentCopiedGroup.getChildren().length > 0 && this.currentCopiedGroup.isVisible()) {
      this.setPositionForGroup(this.currentCopiedGroup, true);
      if (this.checkIsGroupInFlow(flowboard, this.currentCopiedGroup)) {
        ShapesClipboard.pasteOperation(flowboard, this.stage, this.mainLayer, this.currentCopiedGroup, this.canvasService,
          this.blocksService, this.localNotificationService, this.iDBService);
      } else {
        this.localNotificationService.sendLocalNotification(`Blocks outside`, NotificationTypes.ERROR);
      }
      this.setPositionForGroup(this.currentCopiedGroup);
    }
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
    this.stage.getStage().content.parentElement.parentElement.parentElement.scroll(0, 0);
    let showFlow = this.blocksService.getFlowboards().find(flow => flow._id === id).clone();
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
      // this.draggingOnOff(flowboard);
      this.setPositionInView(flowboard);
      flowboard.children.each(shape => {
        if (shape.attrs.type === GroupTypes.Block) {
          this.draggingOnOff(shape);
        }
        if (shape.attrs.type === ButtonsTypes.DrugPoint || shape.attrs.type === ButtonsTypes.MenuButton || shape.attrs.type === ButtonsTypes.DeleteButton) {
          shape.isVisible() ? shape.hide() : shape.show();
        }
      });
    }
  }

  setPositionInView(flowboard) {
    flowboard.attrs.x = (ContainerKonvaSizes.width - flowboard.attrs.width) / 2;
    flowboard.attrs.y = (ContainerKonvaSizes.height - flowboard.attrs.height) / 2;
  }

  // Turn off dragging when flowboard show in sub view and on dragging in main tab
  draggingOnOff(elem) {
    elem.draggable(!elem.draggable());
  }

  addFlowToSubView(subViewName: string) {
    let tmp = this.subTabs.find(tab => tab.label === subViewName);
    if (!tmp.layerData.find(elem => elem.id === this.calledMenuButton._id)) {
      tmp.layerData.push({
        id: this.calledMenuButton._id,
        name: this.calledMenuButton.attrs.name
      });
    }
  }

  zoomingEvent(event) {
    this.zoomInPercent = event * 100;
    this.canvasService.setCurrentZoom(event * 100);
    this.stage.getStage().scale({ x: event, y: event });
    this.stage.getStage().width(this.activeTab.startStageSize.oldWidth * event < MaxStageSize ? this.activeTab.startStageSize.oldWidth * event : MaxStageSize);
    this.stage.getStage().height(this.activeTab.startStageSize.oldHeight * event < MaxStageSize ? this.activeTab.startStageSize.oldHeight * event : MaxStageSize);
  }

  repositionStage() {
    let dx = this.scrollContainer.nativeElement.scrollLeft - KonvaStartSizes.padding;
    let dy = this.scrollContainer.nativeElement.scrollTop - KonvaStartSizes.padding;
    // this.stage.getStage().container().parentElement.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
    // this.stage.getStage().x(-dx);
    // this.stage.getStage().y(-dy);
    this.stage.getStage().batchDraw();
  }

  saveProject() {
    // TODO: deploy project on server
    // NOW IS DELETE DB
    this.iDBService.deleteDB();
  }
}
