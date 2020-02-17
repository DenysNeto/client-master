import { Injectable } from '@angular/core';
import { StageComponent } from 'ng2-konva';
import { Group } from 'konva/types/Group';
import Konva from 'konva';
import { ButtonsTypes, CircleTypes, GroupTypes, IActiveWrapperBlock, ICircleCustom, ICurrentLineToDraw, IGroupCustom, IPathCustom } from '../luwfy-canvas/shapes-interface';
import ShapeCreator from '../luwfy-canvas/ShapesCreator';
import { ButtonSizes, FlowboardSizes, GridSizes, ShapesSizes, ShapesSizes as sizes, SwitcherSizes } from '../luwfy-canvas/sizes';
import { theme } from '../luwfy-canvas/theme';
import { Layer } from 'konva/types/Layer';
import { BehaviorSubject, Subject } from 'rxjs';
import { Collection } from 'konva/types/Util';
import { ActionType } from '../luwfy-canvas/undo-redo.interface';
import { MatDialog, MatDialogRef } from '@angular/material';
import { ModalPropComponent } from '../popups/modal-prop/modal-prop.component';
import { UndoRedoService } from './undo-redo.service';
import { BlocksRedactorService } from '../popups/blocks-redactor.service';
import { BlocksService } from './blocks.service';
import { TestStartStop } from './testStartStop';
import { Path } from 'konva/types/shapes/Path';
import { IdbService } from './indexed-db.service';
import ShapesClipboard from '../luwfy-canvas/shapes-clipboard';
import { DataStorages, FlowRelation, FlowBlock, Board, FlowPort, DataState } from './indexed-db.interface';
import { async } from '@angular/core/testing';

@Injectable({
  providedIn: 'root'
})
export class CanvasService {

  //variable for cheking mouse inside block
  private mouseInsideRectangle = null;
  selectedBlocks = [];

  constructor(
    private dialog: MatDialog,
    private undoRedoService: UndoRedoService,
    private blocksRedactorService: BlocksRedactorService,
    private blocksService: BlocksService,
    private testStartStop: TestStartStop,
    private iDBService: IdbService
  ) { }

  currentLineToDraw: ICurrentLineToDraw = {
    isLineDrawable: false,
    groupId: 0,
    lineId: 0,
    flowboardId: 0,
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
    },

    swapOrientation: () => {
      this.currentLineToDraw.positionStart = {
        x: this.currentLineToDraw.prevX,
        y: this.currentLineToDraw.prevY
      };
      this.currentLineToDraw.positionEnd = {
        x: this.currentLineToDraw.prevMainX,
        y: this.currentLineToDraw.prevMainY
      };
    }
  };

  _currentZoom: number;

  setCurrentZoom(value) {
    this._currentZoom = value;
  }

  activePathsArr: IPathCustom[] = [];

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
      stroke: 'blue',
      strokeWidth: 0.75,
      fill: 'rgba(231,242,255,0.2)',
      draggable: false,
      isActive_block: true
    })
  };

  flowboardDimensionsChanged: BehaviorSubject<{
    dimension: 'width' | 'height' | '';
    id: number;
  }> = new BehaviorSubject<{ dimension: 'width' | 'height' | ''; id: number }>({
    dimension: '',
    id: 0
  });
  flowboardPositionChanged: BehaviorSubject<{
    dimension: 'width' | 'height' | '';
    id: number;
  }> = new BehaviorSubject<{ dimension: 'width' | 'height' | ''; id: number }>({
    dimension: '',
    id: 0
  });

  dragFinished: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

  lineToDraw: Subject<ICurrentLineToDraw> = new BehaviorSubject<ICurrentLineToDraw>(this.currentLineToDraw);

  activeBlock: Subject<IActiveWrapperBlock> = new BehaviorSubject<IActiveWrapperBlock>(this.activeWrapperBlock);

  blockSettingDialogRef: MatDialogRef<ModalPropComponent>;

  isElem() {
    return this.activePathsArr.length > 0;
  }

  deleteShapesFromGroup = (mainLayer: Layer, currentActiveGroup: any) => {
    let group_children_temp = currentActiveGroup.children;
    if (group_children_temp.length > 0) {
      while (group_children_temp.length) {
        group_children_temp[group_children_temp.length - 1].children.each(elem => {
          if (elem.className !== 'Path') {
            elem.setAttr('stroke', theme.rect_border);
          }
        });
        group_children_temp[group_children_temp.length - 1].setAttr('draggable', true);
        group_children_temp[group_children_temp.length - 1].setAttr('x',
          group_children_temp[group_children_temp.length - 1].position().x +
          currentActiveGroup.position().x
        );
        group_children_temp[group_children_temp.length - 1].setAttr('y',
          group_children_temp[group_children_temp.length - 1].position().y +
          currentActiveGroup.position().y
        );
        mainLayer.getStage().add(group_children_temp[group_children_temp.length - 1]);
      }
      currentActiveGroup.removeChildren();
      mainLayer.getStage().draw();
    }
  };

  setRegularGroupHandlers(group: IGroupCustom, mainLayer: Layer, activeWrapperBlock: IActiveWrapperBlock, currentActiveGroup: Group) {
    this.setDragGroupEvents(group, mainLayer, currentActiveGroup);
    this.setMouseMoveEvents(group, mainLayer, activeWrapperBlock);
  }

  setMouseMoveEvents(group: IGroupCustom, mainLayer: Layer, activeWrapperBlock) {
    group.on('mousedown', event => {
      activeWrapperBlock.isActive = false;
      activeWrapperBlock.isDraw = false;
      activeWrapperBlock.rectangle.setAttr('visible', false);
    });
    group.on('mouseup', event => {
      if (this.currentLineToDraw.isLineDrawable && event.target._id !== this.currentLineToDraw.groupId &&
        event.target.parent._id !== this.currentLineToDraw.groupId && this.currentLineToDraw.groupId !== 0
      ) {
        let input_circle = this.getInputCircleFromGroup(event.target.parent as Group);
        let current_flowboard = this.getGroupById(this.currentLineToDraw.flowboardId, mainLayer.getStage());
        let current_path_group = this.getGroupById(this.currentLineToDraw.groupId, current_flowboard as Group);
        current_path_group.setAttr('draggable', true);
        // take path witch we draw
        let current_path = (current_path_group as Group).findOne(elem => {
          if (elem.className === 'Path' && elem.attrs.start_info.start_group_id === this.currentLineToDraw.groupId && elem._id === this.currentLineToDraw.lineId) {
            return elem;
          }
        });

        // take start circle of this path
        let start_circle = (current_path_group as Group).findOne(elem => {
          if (current_path && current_path.attrs.start_info && elem._id === current_path.attrs.start_info.start_circle_id) {
            return elem;
          }
        });
        let deltaX = event.target.parent.attrs.x - current_path_group.attrs.x;
        let deltaY = event.target.parent.attrs.y - current_path_group.attrs.y;
        current_path.setAttr(
          'data',
          ShapeCreator.generateLinkPath(
            start_circle.attrs.x,
            start_circle.attrs.y,
            event.target.parent.attrs.x - current_path_group.attrs.x,
            event.target.parent.attrs.y - current_path_group.attrs.y + input_circle.attrs.y,
            this.setParamForLine(deltaX, deltaY)
          )
        );
        current_path.setAttr('end_info', {
          end_group_id: event.target.parent._id,
          end_circle_id: input_circle._id,
          end_flowboard_id: event.target.parent.parent._id
        });
        current_path.setAttr('zIndex', 1);
        this.undoRedoService.addAction({
          action: ActionType.Create,
          object: current_path as IPathCustom,
          parent: event.target.parent as Group
        });

        this.setGradientForPath(current_path as Path,
          { x: start_circle.attrs.x, y: start_circle.attrs.y },
          current_path.parent.parent.findOne(elem => elem._id === current_path.attrs.start_info.start_circle_id).attrs.stroke,
          { x: event.target.parent.attrs.x - current_path_group.attrs.x, y: event.target.parent.attrs.y - current_path_group.attrs.y + input_circle.attrs.y },
          current_path.parent.parent.findOne(elem => elem._id === current_path.attrs.end_info.end_circle_id).attrs.fill
        );

        if (!current_path.attrs.end_info || current_path.attrs.start_info.start_group_id === current_path.attrs.end_info.end_group_id) {
          current_path.remove();
        }
        this.currentLineToDraw.isLineDrawable = false;
        this.lineToDraw.next(this.currentLineToDraw);

        // update DB flows after line beetwen blocks was drew
        this.iDBService.addData(DataStorages.FLOW_RELATIONS, {
          id: current_path._id,
          startPortId: current_path.attrs.start_info.start_circle_id,
          endPortId: current_path.attrs.end_info.end_circle_id,
          colorId: 1,
          state: DataState.ACTIVE,
          name: 'relation',
          description: 'description'
        } as FlowRelation);

        mainLayer.getStage().draw();
        return 0;
      }
    });

    if (group.attrs.type === GroupTypes.Block) {
      group.on('dragmove', event => {
        this.checkTheGroupNearBorder(event.target as IGroupCustom);
        let temp_blocks = this.getAllBlocksFromFlowBoard(event.target.parent as IGroupCustom, event.target._id);
        if (temp_blocks && this.checkIfCollision(temp_blocks, event.target as IGroupCustom)) {
          event.target.setAttr('collision', true);
        } else {
          event.target.setAttr('collision', false);
        }
      });

      group.on('dragend', event => {
        if (event.target.attrs.collision) {
          event.target.attrs.copyPaths.forEach(cp => {
            event.currentTarget.parent.find('Path').each((shape: Path) => {
              if (shape._id === cp.id) {
                shape.attrs.data = cp.path.attrs.data;
                shape.dataArray = cp.path.dataArray;
              }
            });
          });
          event.target.attrs.copyPath = null;
          event.target.position(event.target.attrs.drag_start_position);
          let temp_blocks = this.getAllBlocksFromFlowBoard(
            event.target.parent as IGroupCustom,
            event.target._id
          );
          if (temp_blocks) {
            temp_blocks.each(elem => {
              elem.children.each(elem => {
                if (elem.className === 'Rect') {
                  elem.setAttr('stroke', elem.attrs.main_stroke);
                }
              });
            });
          }
        }

        // save block after change position
        let targetBlock = event.currentTarget;
        this.iDBService.updateData(DataStorages.FLOW_BLOCKS,
          {
            id: targetBlock._id,
            boardId: targetBlock.parent._id,
            paletteElementId: targetBlock.attrs.paletteElementId,
            location: {
              x: targetBlock.attrs.x,
              y: targetBlock.attrs.y,
            },
            formId: 1,
            name: targetBlock.attrs.label,
            state: DataState.ACTIVE,
            sizes: {
              width: targetBlock.attrs.width,
              height: targetBlock.attrs.height
            }
          } as FlowBlock);
      });
    }
  }

  setGradientForPath(path: Path, startCircleLocation, startCircleColor, endCircleLocation, endCircleColor) {
    // add start and end points for gradient for path
    (path as any).strokeLinearGradientStartPoint({
      x: startCircleLocation.x,
      y: startCircleLocation.y
    });
    (path as any).strokeLinearGradientEndPoint({
      x: endCircleLocation.x,
      y: endCircleLocation.y
    });
    (path as any).strokeLinearGradientColorStops([0, startCircleColor, 1, endCircleColor]);
  }

  checkTheGroupNearBorder(current_group: IGroupCustom) {
    let temp_changes: boolean = false;
    if (current_group.parent.attrs.width - current_group.attrs.x - current_group.attrs.width < GridSizes.flowboard_cell &&
      current_group.parent.attrs.width + GridSizes.flowboard_cell < GridSizes.flowboard_max_width
    ) {
      current_group.parent.children.each(elem => {
        if (elem.className === 'Rect') {
          elem.setAttr('width', elem.attrs.width + GridSizes.flowboard_cell);
          return 0;
        }
      });
      current_group.parent.setAttr('width', current_group.parent.attrs.width + GridSizes.flowboard_cell);
      this.flowboardDimensionsChanged.next({
        dimension: 'width',
        id: current_group.parent._id
      });
      current_group.parent.findOne(elem => {
        if (elem.attrs.type === ButtonsTypes.DrugPoint || elem.attrs.type === ButtonsTypes.MenuButton || elem.attrs.type === ButtonsTypes.DeleteButton) {
          elem.setAttr('x', current_group.parent.attrs.width + FlowboardSizes.buttonPadding);
          this.flowboardPositionChanged.next({
            dimension: 'width',
            id: elem._id
          });
        }
      });
      temp_changes = true;
    } else if (current_group.parent.attrs.height - current_group.attrs.y - current_group.attrs.height < GridSizes.flowboard_cell * 2 &&
      current_group.parent.attrs.height + GridSizes.flowboard_cell < GridSizes.flowboard_max_height
    ) {
      current_group.parent.children.each(elem => {
        if (elem.className === 'Rect') {
          elem.setAttr('height', elem.attrs.height + GridSizes.flowboard_cell);
          return 0;
        }
      });
      current_group.parent.setAttr('height', current_group.parent.attrs.height + GridSizes.flowboard_cell);
      this.flowboardDimensionsChanged.next({
        dimension: 'height',
        id: current_group.parent._id
      });
      temp_changes = true;
    }

    if (temp_changes) {
      let board = current_group.parent;
      board.find('Line').each(elem => elem.destroy());
      let vertLines = board.attrs.height / GridSizes.flowboard_cell;
      let horLines = board.attrs.width / GridSizes.flowboard_cell;
      let maxLines = vertLines > horLines ? vertLines : horLines;
      for (let i = 1; i <= maxLines; i++) {
        if (horLines > i) {
          let temp = ShapeCreator.createLineForGrid([GridSizes.flowboard_cell * i, 0, GridSizes.flowboard_cell * i, board.attrs.height]);
          board.add(temp);
          temp.setAttr('zIndex', 0);
        }
        if (vertLines > i) {
          let temp = ShapeCreator.createLineForGrid([0, GridSizes.flowboard_cell * i, board.attrs.width, GridSizes.flowboard_cell * i]);
          board.add(temp);
          temp.setAttr('zIndex', 0);
        }
      }
      // update to IDB flowboard border
      this.updateBoardData(board);
      this.saveUpdateBoards(board);
    }
  }

  // function check all boards and update their data
  saveUpdateBoards(board) {
    board.parent.children.each(item => {
      if (item.attrs.type === GroupTypes.Flowboard) {
        this.updateBoardData(item);
      }
    })
  }

  updateBoardData(board) {
    this.iDBService.updateData(DataStorages.BOARDS,
      {
        id: board._id,
        name: board.attrs.name,
        location: {
          x: board.attrs.x,
          y: board.attrs.y
        },
        state: DataState.ACTIVE,
        description: 'description',
        colorId: 1,
        imageId: 1,
        formId: 1,
        sizes: {
          width: board.attrs.width,
          height: board.attrs.height
        }
      } as Board);
  }


  setClickEventForPath(path: IPathCustom) {
    path.on('mousedown', event => {
      if (event.evt.ctrlKey) {

      }
    })
      .on('mouseenter', event => event.cancelBubble = true)
      .on('click', event => {
        if (event.evt.ctrlKey) {
          this.activePathsArr.push(event.target as IPathCustom);
          event.cancelBubble = true;
          this.activeWrapperBlock.isDraw = false;
          event.target.setAttr('stroke', theme.choose_group_color);
        }
      });
  }

  resetActivePathArr() {
    this.activePathsArr = [];
  }

  addElemToActivePathArr(elem: IPathCustom) {
    this.activePathsArr.push(elem);
  }

  removeLastElementFromPathArr() {
    this.activePathsArr.pop();
  }

  getInputCircleFromGroup(component: Group | IGroupCustom) {
    if (component) {
      return component.findOne(elem => {
        if (
          elem.className == 'Circle' &&
          elem.attrs.type === CircleTypes.Input &&
          !elem.attrs.switcher_circle
        ) {
          return elem;
        }
      });
    } else {
      return null;
    }
  }

  setParamForLine(deltaX: number, deltaY: number) {
    if (deltaX < 0) {
      return 3;
    }
    if (deltaX < 280) {
      return 1;
    } else {
      return 3;
    }
  }

  setDragGroupEvents(group: IGroupCustom, mainLayer: Layer, currentActiveGroup) {
    group.on('dragstart', event => {
      event.target.setAttr('drag_start_position', {
        x: event.target.attrs.x,
        y: event.target.attrs.y
      });
      let copyPaths = [];
      event.currentTarget.parent.find('Path').each(path => {
        if (path.attrs.end_info.end_group_id === event.currentTarget._id || path.attrs.start_info.start_group_id === event.currentTarget._id) {
          copyPaths.push({ id: path._id, path: path.clone() });
        }
      });
      event.target.setAttr('copyPaths', copyPaths);
      if (this.currentLineToDraw.isLineDrawable) {
        return 0;
      }
      this.undoRedoService.addAction({
        action: ActionType.Move,
        object: event.target,
        coordinates: { x: event.target.attrs.x, y: event.target.attrs.y },
        parent: event.target.parent as Layer
      });
      if (currentActiveGroup.isDraw) {
        this.deleteShapesFromGroup(mainLayer, currentActiveGroup);
      }
      this.activeWrapperBlock.isDraw = false;
      this.activeWrapperBlock.rectangle.setAttr('visible', false);
      this.activeBlock.next(this.activeWrapperBlock);
    });
    group.on('dragmove', event => {
      if (!event) {
        return 0;
      }
      event.target.attrs.x = event.target.attrs.x % 20 > 10 ? event.target.attrs.x - (event.target.attrs.x % 20) + 20 : event.target.attrs.x - (event.target.attrs.x % 20);
      event.target.attrs.y = event.target.attrs.y % 20 > 10 ? event.target.attrs.y - (event.target.attrs.y % 20) + 20 : event.target.attrs.y - (event.target.attrs.y % 20);
      let isPathInGroup = this.isPathInGroup(event.target as Group);
      let input_paths: Array<IPathCustom> = this.getAllInputLinesFromGroup(mainLayer.getStage(), event.target as Group | IGroupCustom);
      if (isPathInGroup || input_paths) {
        let output_paths: Collection<IPathCustom> = this.getAllOutputLinesFromGroup(
          event.target as Group | IGroupCustom
        );
        if (output_paths) {
          output_paths.each(elem => {
            //start point
            let currentFlowboard = this.getGroupById(elem.attrs.end_info.end_flowboard_id, mainLayer.getStage());
            let temp_start_point_group = this.getGroupById(elem.attrs.end_info.end_group_id, currentFlowboard as Group);
            let temp_end_point_circle = this.getCircleFromGroupById(event.target.getStage(), elem.attrs.start_info.start_circle_id);
            let temp_start_circle = this.getCircleFromGroupById(temp_start_point_group as Group, elem.attrs.end_info.end_circle_id);
            //end point
            let deltaX = temp_start_point_group.getAbsolutePosition().x - event.target.attrs.x + temp_start_circle.attrs.x - temp_end_point_circle.attrs.x;
            let deltaY = temp_start_point_group.getAbsolutePosition().y - event.target.attrs.y + temp_start_circle.attrs.y - temp_end_point_circle.attrs.y;
            elem.setAttr(
              'data',
              ShapeCreator.generateLinkPath(
                temp_start_point_group.getAbsolutePosition().x / (this._currentZoom / 100) - event.target.attrs.x + temp_start_circle.attrs.x - event.target.parent.attrs.x,
                temp_start_point_group.getAbsolutePosition().y / (this._currentZoom / 100) - event.target.attrs.y + temp_start_circle.attrs.y - event.target.parent.attrs.y,
                temp_end_point_circle.attrs.x,
                temp_end_point_circle.attrs.y,
                -1 * this.setParamForLine(deltaX, deltaY)
              )
            );
          });
        }
        if (input_paths) {
          input_paths.forEach(elem => {
            //start point
            let temp_start_point_group = this.getGroupById(elem.attrs.start_info.start_group_id, mainLayer.getStage());
            let temp_end_point_circle = this.getCircleFromGroupById(event.target.getStage(), elem.attrs.end_info.end_circle_id);
            let temp_start_point_circle = this.getCircleFromGroupById(event.target.getStage(), elem.attrs.start_info.start_circle_id);
            let temp_start_circle = this.getCircleFromGroupById(temp_start_point_group as Group, elem.attrs.start_info.start_circle_id);
            let temp_input_circle = event.target.getStage().findOne(elem => {
              if (elem.className === 'Circle' && elem.attrs.type === CircleTypes.Input) {
                return elem;
              }
            });
            let deltaX = event.target.attrs.x - temp_start_point_group.attrs.x;
            let deltaY = temp_start_point_group.getAbsolutePosition().y - temp_start_point_group.attrs.y + temp_start_circle.attrs.y;
            elem.setAttr(
              'data',
              ShapeCreator.generateLinkPath(
                temp_start_point_group.getAbsolutePosition().x / (this._currentZoom / 100) - temp_start_point_group.attrs.x + temp_start_circle.attrs.x - event.target.parent.attrs.x,
                temp_start_point_group.getAbsolutePosition().y / (this._currentZoom / 100) - temp_start_point_group.attrs.y + temp_start_circle.attrs.y - event.target.parent.attrs.y,
                event.target.attrs.x - temp_start_point_group.attrs.x,
                event.target.attrs.y - temp_start_point_group.attrs.y + temp_input_circle.attrs.y,
                this.setParamForLine(deltaX, deltaY)
              )
            );
          });
        }
      }
      // this.iDBService.updateData(DataStorages.FLOWS, { id: event.currentTarget._id, flow: event.currentTarget.toJSON() });
    });
  }

  getAllInputLinesFromGroup(
    component: Group | IGroupCustom | any,
    group: Group | IGroupCustom
  ): Array<IPathCustom> {
    let collection_ports: Array<IPathCustom> = [];
    let all_groups = component.find(elem => {
      if (elem.attrs.type === GroupTypes.Block) {
        return elem;
      }
    });
    all_groups.each(elem => {
      elem.find(elem => {
        if (elem.className === 'Path' && elem.attrs.end_info && elem.attrs.end_info.end_group_id === group._id) {
          collection_ports.push(elem);
        }
      });
    });
    return collection_ports;
  }

  getActiveBlock(mainLayer: Layer) {
    return mainLayer.findOne(elem => {
      if (elem.attrs.isActive_block) {
        return elem;
      }
    });
  }

  getAllOutputLinesFromGroup(
    group: Group | IGroupCustom
  ): Collection<IPathCustom> {
    return group.find(elem => {
      if (elem.className === 'Path') {
        return elem;
      }
    });
  }

  // function add all ports (input, output, error)
  createPorts(blockVariables, temp_group: Group, height: number, blockDataID?: number, portsData?: FlowPort[]) {
    if (blockDataID) {
      portsData.forEach((port: FlowPort) => {
        if (port.flowBlockId === blockDataID) {
          if (port.type === CircleTypes.Input) {
            let input = ShapeCreator.createPortCircle(port.location.x, port.location.y, blockVariables.color.value, true);
            input.setAttr('zIndex', 1000);
            input._id = port.id;
            temp_group.add(input); // add input
          } else if (port.type === CircleTypes.Output) {
            let output = ShapeCreator.createPortCircle(port.location.x, port.location.y, blockVariables.color.value, false);
            output.setAttr('zIndex', 1000);
            output._id = port.id;
            temp_group.add(output); // add output
          } else {
            let errorPort = ShapeCreator.createErrorOutput(port.location.y, port.location.x);
            errorPort.setAttr('zIndex', 1000);
            errorPort._id = port.id;
            temp_group.add(errorPort); // add error
          }
        }
      })
    } else {
      // let inputPorts = blockVariables.inputs;
      // let outputPorts = blockVariables.outputs;
      // let errorPorts = blockVariables.output_errors;

      let inputPorts = 1;
      let outputPorts = 1;
      let errorPorts = 0;

      let max_ports = errorPorts + outputPorts > inputPorts ? errorPorts + outputPorts : inputPorts;
      let delayInput = height / (inputPorts + 1);
      let delayOutput = height / (outputPorts + errorPorts + 1);
      for (let i = 1; i <= max_ports; i++) {
        if (inputPorts > 0) {
          let input = ShapeCreator.createPortCircle(0, delayInput * i, blockVariables.color.value, true);
          temp_group.add(input); // add input
          inputPorts--;
        }
        if (outputPorts > 0) {
          let output = ShapeCreator.createPortCircle(sizes.block_width, delayOutput * i, blockVariables.color.value, false);
          temp_group.add(output); // add output
          outputPorts--;
        } else if (errorPorts > 0) {
          let errorPort = ShapeCreator.createErrorOutput(delayOutput * i);
          temp_group.add(errorPort); // add error
          errorPorts--;
        }
      }
    }

  }

  switcherAnimation(event, colorActive, colorDisabled, blockColor) {
    let parent = event.target.parent;
    let elemSwitchRect = parent.findOne('Rect');
    let elemSwitchText = parent.findOne('Text');
    let elemSwitchCircle = parent.findOne('Circle');
    let highParent = event.target.parent.parent;
    let highSwitchRect = highParent.findOne('Rect');
    let highSwitchCircle = highParent.findOne('Circle');
    if (parent.attrs.switched) {
      elemSwitchRect.attrs.fill = elemSwitchRect.attrs.stroke = highSwitchCircle.attrs.fill = highSwitchRect.attrs.stroke = colorDisabled;
      elemSwitchText.attrs.fill = colorActive;
      elemSwitchText.offsetX(17);
      elemSwitchText.text('OFF');
      elemSwitchCircle.offsetX(-27);
      elemSwitchCircle.attrs.fill = colorActive;
      alert(false);
      parent.attrs.switched = !parent.attrs.switched;
    } else {
      elemSwitchRect.attrs.fill = colorActive;
      elemSwitchRect.attrs.stroke = highSwitchRect.attrs.stroke = highSwitchCircle.attrs.fill = blockColor;
      elemSwitchText.attrs.fill = colorDisabled;
      elemSwitchText.offsetX(0);
      elemSwitchText.text('ON');
      elemSwitchCircle.offsetX(0);
      elemSwitchCircle.attrs.fill = 'white';
      alert(true);
      parent.attrs.switched = !parent.attrs.switched;
    }
  }

  clickButtonAnimation(event) {
    let parent = event.target.parent;
    let elemRect = parent.findOne('Rect');
    let elemText = parent.findOne('Text');
    elemRect.attrs.fill = 'steelblue';
    elemText.attrs.fill = 'white';
    alert('It was click on push');
    setTimeout(() => {
      elemRect.attrs.fill = 'white';
      elemText.attrs.fill = 'steelblue';
      parent.attrs.switch = !parent.attrs.switch;
    }, 50);
  }

  // detects intersection between two group(blocks / flowboards)
  haveIntersection(group1, group2) {
    return !(
      group2.x > group1.x + group1.width ||
      group2.x + group2.width < group1.x ||
      group2.y > group1.y + group1.height ||
      group2.y + group2.height < group1.y
    );
  }

  checkIfCollisionBetweenFlowBoards(current_flowboard, flowBoards_arr, filter: 'width' | 'height' | '') {
    let isCollisionBetweenFlowboards = false;
    let temp;
    flowBoards_arr.forEach(elem => {
      if (this.haveIntersection(current_flowboard.attrs, elem.attrs)) {
        if (filter === 'width') {
          if (elem.attrs.x < current_flowboard.attrs.x + FlowboardSizes.flowboard_padding + current_flowboard.attrs.width + ButtonSizes.plusBtn * 2 && elem.attrs.x > current_flowboard.attrs.x) {
            elem.setAttr('x', current_flowboard.attrs.x + FlowboardSizes.flowboard_padding + current_flowboard.attrs.width + ButtonSizes.plusBtn * 2);
            this.flowboardPositionChanged.next({
              dimension: 'width',
              id: elem._id
            });
          }
        } else if (filter === 'height') {
          if (elem.attrs.y < current_flowboard.attrs.y + current_flowboard.attrs.height + FlowboardSizes.flowboard_padding + ButtonSizes.plusBtn * 2 && elem.attrs.y > current_flowboard.attrs.y) {
            elem.setAttr('y', current_flowboard.attrs.y + FlowboardSizes.flowboard_padding + current_flowboard.attrs.height + ButtonSizes.plusBtn * 2);
            this.flowboardPositionChanged.next({
              dimension: 'height',
              id: elem._id
            });
          }
        }
        isCollisionBetweenFlowboards = true;
        return true;
      }
    });
    return isCollisionBetweenFlowboards;
  }

  //checks the collision between draggable group and all other children groups inside flowboard
  checkIfCollision(children: any, current_group: IGroupCustom) {
    let isCollisionDetected = false;
    children.each(elem => {
      if (elem.attrs.type === GroupTypes.Block) {
        if (this.haveIntersection(current_group.attrs, elem.attrs)) {
          elem.children.each(elem => {
            if (elem.className == 'Rect') {
              elem.setAttr('stroke', 'red');
            }
          });
          isCollisionDetected = true;
        } else {
          elem.children.each(elem => {
            if (
              elem.className == 'Rect' &&
              elem.attrs.stroke !== elem.attrs.main_stroke
            ) {
              elem.setAttr('stroke', elem.attrs.main_stroke);
            }
          });
        }
      }
    });
    return isCollisionDetected;
  }

  createDefaultGroup(mainLayer: Layer, activeWrapperBlock, currentActiveGroup: Group, blockVariables, blockData?: FlowBlock, portsData?) {
    let temp_group;
    let height = sizes.block_height;
    temp_group = new Konva.Group({
      draggable: true,
      type: GroupTypes.Block,
      name: blockVariables.block.name,
      date: Date.now(),
      blockData: blockVariables,
      paletteElementId: blockVariables.block.id,
      showOnPanel: true
    }) as IGroupCustom;

    temp_group._id = blockData ? blockData.id : ShapeCreator.randomIdNumber();

    // if (newBlockVariables.outputs + newBlockVariables.output_errors > 2 || newBlockVariables.inputs > 2) {
    //   let max_ports = newBlockVariables.outputs + newBlockVariables.output_errors > newBlockVariables.inputs ?
    //     newBlockVariables.outputs + newBlockVariables.output_errors : newBlockVariables.inputs;
    //   height = sizes.block_height + (max_ports - 1) * 30;
    // } else {
    //   height = sizes.block_height;
    // }

    temp_group.add(ShapeCreator.createShapeName(blockVariables.block.name, blockVariables.color.value));

    temp_group.add(ShapeCreator.createRect(blockVariables.color.value, height));

    blockData ? this.createPorts(blockVariables, temp_group, height, blockData.id, portsData) : this.createPorts(blockVariables, temp_group, height);

    temp_group.add(ShapeCreator.iconGroupCreator(SwitcherSizes.margin_left, (height - SwitcherSizes.iconsFontSize) / 2).hide());

    temp_group.add(ShapeCreator.createFaceImage(ShapesSizes.block_width - ShapesSizes.face_img_font_size - 10,
      (height - ShapesSizes.face_img_font_size) / 2, blockVariables.color.value, blockVariables.image.value)
    );

    // TODO: we haven't info about buttons
    // if (newBlockVariables.btn_event_block.switch > -1) {
    //   temp_group.add(ShapeCreator.switcherGroupCreator((ShapesSizes.block_width - 45) / 2, height - 9, 45, newBlockVariables.color, newBlockVariables.btn_event_block)
    //   );
    //   let blockSwitcher = temp_group.findOne(elem => !!elem.attrs.switched);
    //   if (newBlockVariables.btn_event_block.switch === 1) {
    //     blockSwitcher.on('click', event => {
    //       this.switcherAnimation(event, newBlockVariables.btn_event_block.color_active, newBlockVariables.btn_event_block.color_disabled, newBlockVariables.color)
    //     });
    //   } else if (newBlockVariables.btn_event_block.switch === 0) {
    //     blockSwitcher.on('mousedown', event =>
    //       this.clickButtonAnimation(event)
    //     );
    //   }
    // }

    temp_group.setAttrs({
      width: sizes.block_width + sizes.circle_radius * 2,
      height: height
    });

    this.setClickEventForGroup(temp_group);

    this.setListenerOnBlock(mainLayer, temp_group);

    this.setListenerOnIcons(temp_group);

    let circles_collection = this.getAllCirclesFromGroup(temp_group);

    circles_collection && circles_collection.each((elem: ICircleCustom) => {
      elem.setAttr('zIndex', 1000);
      this.setMouseDownEventForSwitchCircle(elem, mainLayer, currentActiveGroup);
    });

    this.setRegularGroupHandlers(temp_group, mainLayer, activeWrapperBlock, currentActiveGroup);

    return temp_group;
  }

  setMouseDownEventForSwitchCircle(circle: ICircleCustom, mainLayer: Layer, currentActiveGroup: Group) {
    circle.on('mousedown', event => {
      if (event.target.attrs.type === CircleTypes.Output && !currentActiveGroup.hasChildren()) {
        let line_temp: IPathCustom = ShapeCreator.createLine({
          start_circle_id: event.target._id,
          start_group_id: event.target.parent._id,
          start_flowboard_id: event.target.parent.parent._id
        }, event.target.attrs.stroke) as IPathCustom;
        this.setClickEventForPath(line_temp);
        event.target.parent.add(line_temp);
        event.target.parent.setAttr('draggable', false);
        this.currentLineToDraw.isLineDrawable = true;
        this.currentLineToDraw.lineId = line_temp._id;
        this.currentLineToDraw.groupId = event.target.parent._id;
        this.currentLineToDraw.flowboardId = event.target.parent.parent._id;
        this.currentLineToDraw.prevX = event.target.parent.attrs.x + event.target.attrs.x;
        this.currentLineToDraw.prevY = event.target.parent.attrs.y + event.target.attrs.y;
        this.lineToDraw.next(this.currentLineToDraw);
      }
    });
  }

  // function set listeners on block for add to selected group 
  // using "Ctrl+Click"
  setClickEventForGroup = (group: Group) => {
    group.on('mousedown', event => {
      event.cancelBubble = true;
      if (event.evt.ctrlKey) {
        if (event.target.className === 'Path') {
          return 0;
        }
        if (this.activePathsArr.length > 0) {
          return 0;
        }
        if (event.target.className && event.target.className === 'Path') {
          return 0;
        }
        ShapesClipboard.selectedBlock(event.target, this.selectedBlocks);
      } else {
        this.selectedBlocks.forEach(elem => {
          ShapesClipboard.returnColorAfterSelect(elem);
        });
        this.selectedBlocks = [];
        ShapesClipboard.selectedBlock(event.target, this.selectedBlocks);
      }
    });
  };


  // function set listeners on block for hover effect 
  setListenerOnBlock(layer: Layer, group: Group) {
    group.off('mouseleave mouseenter');
    group.on('mouseleave', event => {
      this.mouseInsideRectangle = false;
      this.onHoverEffect(group);
      layer.getStage().draw();
    }).on('mouseenter', event => {
      this.mouseInsideRectangle = true;
      this.onHoverEffect(group);
      layer.getStage().draw();
    });
  }

  // function take group searching icoms and add 
  // click listenet on every icon
  setListenerOnIcons(group: Group) {
    let icons_group = group.findOne(
      elem => elem.attrs.type === 'iconGroup'
    );
    Array.from(icons_group.children).forEach(elem => {
      elem.off('click');
      elem.on('click', () => {
        if (!this.blocksRedactorService.checkerOnExistBlock(elem)) {
          this.blocksRedactorService.addBlock(elem);
        }
        this.blockSettingDialogRef = this.dialog.open(ModalPropComponent, {
          data: elem._id
        });
      });
    });
  }

  //Function hide face image and show icons (edit, wizard, settings)
  onHoverEffect = (group: Group) => {
    if (!this.currentLineToDraw.isLineDrawable) {
      let iconGroup = group.findOne(elem => elem.attrs.type === 'iconGroup');
      let headImage = group.findOne(elem => elem.attrs.type === 'headImage');
      if (this.mouseInsideRectangle) {
        headImage.hide();
        iconGroup.show();
      } else {
        headImage.show();
        iconGroup.hide();
      }
    }
  };

  getAllCirclesFromGroup(component: Group | IGroupCustom) {
    if (component) {
      return component.find(elem => {
        if (elem.className == 'Circle') {
          return elem;
        }
      });
    } else {
      return null;
    }
  }

  getGroupById(id: number, component: Group) {
    if (component) {
      return component.getStage().findOne(elem => {
        if (elem._id === id && !elem.className) {
          return elem;
        }
      });
    } else {
      return null;
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

  getLastPathFromGroup = (component: Group) => {
    if (component) {
      return component.find(elem => {
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
      return component.find(elem => {
        if (elem.className == 'Path') {
          return elem;
        }
      });
    } else {
      return null;
    }
  };

  getAllBlocksFromFlowBoard(component: Group, except_id?: number) {
    if (component) {
      return component.find(elem => {
        if (elem.attrs.type === GroupTypes.Block && elem._id !== except_id) {
          return elem;
        }
      });
    } else {
      return null;
    }
  }

  getRectFromGroup(component: IGroupCustom) {
    if (component) {
      return component.getStage().findOne(elem => {
        if (elem.className === 'Rect') {
          return elem;
        }
      });
    } else {
      return null;
    }
  }

  getCircleFromGroupById(component: Group, circle_id: number) {
    if (component) {
      return component.findOne(elem => {
        if (elem.className === 'Circle' && elem._id === circle_id) {
          return elem;
        }
      });
    } else {
      return null;
    }
  }

  getCircleFromGroup(component: Group) {
    if (component) {
      return component.findOne(elem => {
        if (elem.className === 'Circle') {
          return elem;
        }
      });
    } else {
      return null;
    }
  }

  isGroupInGroup(group_id: number, search_group: IGroupCustom) {
    if (search_group) {
      return search_group.findOne(elem => {
        if (elem._id === group_id) {
          return elem;
        }
      });
    } else {
      return null;
    }
  }

  getPathFromGroup(component: StageComponent | any) {
    if (component) {
      return component.findOne(elem => {
        if (elem.className === 'Path') {
          return elem;
        }
      });
    } else {
      return null;
    }
  }

  getAllFlowsFromLayer(component: Layer) {
    if (component) {
      return component.getStage().find(elem => {
        if (elem.attrs.type === GroupTypes.Flowboard) {
          return elem;
        }
      });
    } else {
      return null;
    }
  }

  isPathInGroup(component: Group) {
    if (component) {
      let temp = this.getPathFromGroup(component);
      return !!temp;
    } else {
      return false;
    }
  }

  exportData(layer: Layer, callback) {
    let promisesArr = [];
    if (this.selectedBlocks.length > 0) {
      this.selectedBlocks.forEach((elem) => {
        promisesArr.push(new Promise(res => this.iDBService.getDataByKey(DataStorages.FLOW_BLOCKS, elem._id).then(data => res(data))));
        elem.children.each(shape => {
          if (shape.attrs.type === CircleTypes.Input || shape.attrs.type === CircleTypes.Output || shape.attrs.type === CircleTypes.Error) {
            promisesArr.push(new Promise(res => this.iDBService.getDataByKey(DataStorages.FLOW_PORTS, shape._id).then(data => res(data))));
          } else if (shape.className === 'Path') {
            if (this.isPathBetweenSelectedBlocks(shape)) {
              promisesArr.push(new Promise(res => this.iDBService.getDataByKey(DataStorages.FLOW_RELATIONS, shape._id).then(data => res(data))));
            }
          }
        })

      })
      callback(promisesArr);
    } else {
      callback(promisesArr);
    }
  }



  isPathBetweenSelectedBlocks(path): boolean {
    let input = false;
    this.selectedBlocks.forEach(elem => {
      elem.find('Circle').each(shape => {
        if (path.attrs.end_info.end_circle_id === shape._id) {
          input = true;
        }
      })
    })
    return input;
  }

  getAllDataFromIdb() {
    let promisesArr = [];
    promisesArr.push(new Promise(res => this.iDBService.getAllData(DataStorages.BOARDS).then(data => res(data))));
    promisesArr.push(new Promise(res => this.iDBService.getAllData(DataStorages.FLOW_BLOCKS).then(data => res(data))));
    promisesArr.push(new Promise(res => this.iDBService.getAllData(DataStorages.FLOW_PORTS).then(data => res(data))));
    promisesArr.push(new Promise(res => this.iDBService.getAllData(DataStorages.FLOW_RELATIONS).then(data => res(data))));
    return promisesArr;
  }
}
