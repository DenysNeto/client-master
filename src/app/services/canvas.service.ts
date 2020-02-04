import { Injectable } from '@angular/core';
import { StageComponent } from 'ng2-konva';
import { Group } from 'konva/types/Group';
import Konva from 'konva';
import {
  ButtonsTypes,
  CircleTypes,
  GroupTypes,
  IActiveWrapperBlock,
  ICircleCustom,
  ICurrentLineToDraw,
  IGroupCustom,
  InputBlocksInterface,
  IPathCustom
} from '../luwfy-canvas/shapes-interface';
import ShapeCreator from '../luwfy-canvas/ShapesCreator';
import {
  ButtonSizes,
  FlowboardSizes,
  GridSizes,
  ShapesSizes,
  ShapesSizes as sizes,
  SwitcherSizes
} from '../luwfy-canvas/sizes';
import { theme } from '../luwfy-canvas/theme';
import KonvaUtil from '../luwfy-canvas/konva-util';
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

@Injectable({
  providedIn: 'root'
})
export class CanvasService {

  // TODO: variable for cheking mouse inside block
  private mouseInsideRectangle = null;

  constructor(
    private dialog: MatDialog,
    private undoRedoService: UndoRedoService,
    private blocksRedactorService: BlocksRedactorService,
    private blocksService: BlocksService,
    private testStartStop: TestStartStop
  ) {
    this.blocksArr = this.blocksService.getBlocks() as InputBlocksInterface[];
  }

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

  fileNameDialogRef: MatDialogRef<ModalPropComponent>;

  blocksArr: InputBlocksInterface[];

  isElem() {
    return this.activePathsArr.length > 0;
  }

  deleteShapesFromGroup = (mainLayer: Layer, currentActiveGroup: any) => {
    let group_children_temp = currentActiveGroup.children;
    if (group_children_temp.length > 0) {
      while (group_children_temp.length) {
        group_children_temp[group_children_temp.length - 1].children.each(
          elem => {
            if (elem.className !== 'Path') {
              elem.setAttr('stroke', theme.rect_border);
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
          currentActiveGroup.position().x
        );
        group_children_temp[group_children_temp.length - 1].setAttr(
          'y',
          group_children_temp[group_children_temp.length - 1].position().y +
          currentActiveGroup.position().y
        );
        mainLayer
          .getStage()
          .add(group_children_temp[group_children_temp.length - 1]);
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
      if (
        this.currentLineToDraw.isLineDrawable &&
        event.target._id !== this.currentLineToDraw.groupId &&
        event.target.parent._id !== this.currentLineToDraw.groupId &&
        this.currentLineToDraw.groupId !== 0
      ) {
        let input_circle = this.getInputCircleFromGroup(
          event.target.parent as Group
        );
        let current_flowboard = this.getGroupById(
          this.currentLineToDraw.flowboardId,
          mainLayer.getStage()
        );
        let current_path_group = this.getGroupById(
          this.currentLineToDraw.groupId,
          current_flowboard as Group
        );
        current_path_group.setAttr('draggable', 'true');
        let current_path = (current_path_group as Group).findOne(elem => {
          if (
            elem.className === 'Path' &&
            elem.attrs.start_info.start_group_id ===
            this.currentLineToDraw.groupId &&
            elem._id === this.currentLineToDraw.lineId
          ) {
            return elem;
          }
        });
        let start_circle = (current_path_group as Group).findOne(elem => {
          if (
            current_path &&
            current_path.attrs.start_info &&
            elem._id === current_path.attrs.start_info.start_circle_id
          ) {
            return elem;
          }
        });
        let deltaX = event.target.parent.attrs.x - current_path_group.attrs.x;
        let deltaY = event.target.parent.attrs.y - current_path_group.attrs.y;
        current_path.setAttr(
          'data',
          KonvaUtil.generateLinkPath(
            start_circle.attrs.x,
            start_circle.attrs.y,
            event.target.parent.attrs.x - current_path_group.attrs.x,
            event.target.parent.attrs.y -
            current_path_group.attrs.y +
            input_circle.attrs.y,
            this.setParamForLine(deltaX, deltaY)
          )
        );
        current_path.setAttr('custom_id_output', event.target._id);
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

        // add start and end points for gradient for path
        (current_path as any).strokeLinearGradientStartPoint({
          x: start_circle.attrs.x,
          y: start_circle.attrs.y
        });
        (current_path as any).strokeLinearGradientEndPoint({
          x: event.target.parent.attrs.x - current_path_group.attrs.x,
          y:
            event.target.parent.attrs.y -
            current_path_group.attrs.y +
            input_circle.attrs.y
        });

        let startColor = current_path.parent.parent.findOne(
          elem => elem._id === current_path.attrs.start_info.start_circle_id
        ).attrs.stroke;
        let endColor = current_path.parent.parent.findOne(
          elem => elem._id === current_path.attrs.end_info.end_circle_id
        ).attrs.fill;
        (current_path as any).strokeLinearGradientColorStops([
          0,
          startColor,
          1,
          endColor
        ]);
        if (
          !current_path.attrs.end_info ||
          current_path.attrs.start_info.start_group_id ===
          current_path.attrs.end_info.end_group_id
        ) {
          current_path.remove();
        }
        this.currentLineToDraw.isLineDrawable = false;
        this.lineToDraw.next(this.currentLineToDraw);
        mainLayer.getStage().draw();
        return 0;
      }
    });
    group.on('mouseenter', event => {
      if (this.currentLineToDraw.isLineDrawable) {
      }
    });
    group.on('mouseleave', event => {
      if (
        event.target.parent.attrs.type &&
        event.target.parent.attrs.type.includes('output')
      ) {
      }
    });
    if (group.attrs.type === GroupTypes.Block) {
      group.on('dragmove', event => {
        this.checkTheGroupNearBorder(event.target as IGroupCustom);
        let temp_blocks = this.getAllBlocksFromFlowBoard(
          event.target.parent as IGroupCustom,
          event.target._id
        );
        if (
          temp_blocks &&
          this.checkIfCollision(temp_blocks, event.target as IGroupCustom)
        ) {
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
      });
    }
  }

  checkTheGroupNearBorder(current_group: IGroupCustom) {
    let temp_changes: boolean = false;
    if (
      current_group.parent.attrs.width -
      current_group.attrs.x -
      current_group.attrs.width <
      GridSizes.flowboard_cell &&
      current_group.parent.attrs.width + GridSizes.flowboard_cell <
      GridSizes.flowboard_max_width
    ) {
      current_group.parent.children.each(elem => {
        if (elem.className === 'Rect') {
          elem.setAttr('width', elem.attrs.width + GridSizes.flowboard_cell);
          return 0;
        }
      });
      current_group.parent.setAttr(
        'width',
        current_group.parent.attrs.width + GridSizes.flowboard_cell
      );
      this.flowboardDimensionsChanged.next({
        dimension: 'width',
        id: current_group.parent._id
      });
      current_group.parent.findOne(elem => {
        if (
          elem.attrs.type === ButtonsTypes.DrugPoint ||
          elem.attrs.type === ButtonsTypes.MenuButton
        ) {
          elem.setAttr(
            'x',
            current_group.parent.attrs.width + FlowboardSizes.buttonPadding
          );
          this.flowboardPositionChanged.next({
            dimension: 'width',
            id: elem._id
          });
        }
      });
      temp_changes = true;
    } else if (
      current_group.parent.attrs.height -
      current_group.attrs.y -
      current_group.attrs.height <
      GridSizes.flowboard_cell * 2 &&
      current_group.parent.attrs.height + GridSizes.flowboard_cell <
      GridSizes.flowboard_max_height
    ) {
      current_group.parent.children.each(elem => {
        if (elem.className === 'Rect') {
          elem.setAttr('height', elem.attrs.height + GridSizes.flowboard_cell);
          return 0;
        }
      });
      current_group.parent.setAttr(
        'height',
        current_group.parent.attrs.height + GridSizes.flowboard_cell
      );
      this.flowboardDimensionsChanged.next({
        dimension: 'height',
        id: current_group.parent._id
      });
      temp_changes = true;
    }
    if (temp_changes) {
      current_group
        .find(elem => {
          if (elem.className === 'Line') {
            return elem;
          }
        })
        .each(elem => {
          elem.remove();
        });
      let vertLines =
        current_group.parent.attrs.height / GridSizes.flowboard_cell;
      let horLines =
        current_group.parent.attrs.width / GridSizes.flowboard_cell;
      let maxLines = vertLines > horLines ? vertLines : horLines;
      for (let i = 1; i <= maxLines; i++) {
        if (horLines > i) {
          let temp = ShapeCreator.createLineForGrid([
            GridSizes.flowboard_cell * i,
            0,
            GridSizes.flowboard_cell * i,
            current_group.parent.attrs.height
          ]);
          current_group.parent.add(temp);
          temp.setAttr('zIndex', 0);
        }

        if (vertLines > i) {
          let temp = ShapeCreator.createLineForGrid([
            0,
            GridSizes.flowboard_cell * i,
            current_group.parent.attrs.width,
            GridSizes.flowboard_cell * i
          ]);
          current_group.parent.add(temp);
          temp.setAttr('zIndex', 0);
        }
      }
    }
  }

  setMouseDownEventForSwitchCircle(
    circle: ICircleCustom,
    mainLayer: Layer,
    currentActiveGroup: Group
  ) {
    circle.on('mousedown', event => {
      if (
        event.target.attrs.type === CircleTypes.Output &&
        !currentActiveGroup.hasChildren()
      ) {
        let line_temp: IPathCustom = ShapeCreator.createLine({
          start_circle_id: event.target._id,
          start_group_id: event.target.parent._id,
          start_flowboard_id: event.target.parent.parent._id
        }) as IPathCustom;
        this.setClickEventForPath(line_temp, mainLayer, currentActiveGroup);
        event.target.parent.add(line_temp);
        event.target.parent.setAttr('draggable', false);
        this.currentLineToDraw.isLineDrawable = true;
        this.currentLineToDraw.lineId = line_temp._id;
        this.currentLineToDraw.groupId = event.target.parent._id;
        this.currentLineToDraw.flowboardId = event.target.parent.parent._id;
        this.currentLineToDraw.prevX =
          event.target.parent.attrs.x + event.target.attrs.x;
        this.currentLineToDraw.prevY =
          event.target.parent.attrs.y + event.target.attrs.y;
        this.lineToDraw.next(this.currentLineToDraw);
      }
    });
  }

  setClickEventForPath(
    path: IPathCustom,
    mainLayer: Layer,
    currentActiveGroup: Group
  ) {
    path.on('mousedown', event => {
      if (event.evt.ctrlKey) {
      }
    });
    path.on('mouseup', event => {
      if (this.currentLineToDraw.isLineDrawable) {
        event.cancelBubble = true;
      }
    });
    path.on('mouseenter', event => {
    });
    path.on('click', event => {
      if (event.evt.ctrlKey) {
        if (currentActiveGroup.hasChildren()) {
          event.cancelBubble = true;
          return 0;
        }
        this.activePathsArr.push(event.target as IPathCustom);
        event.cancelBubble = true;
        this.activeWrapperBlock.isDraw = false;
        this.undoRedoService.addAction({
          action: ActionType.Select,
          object: event.target as IPathCustom,
          parent: event.target.parent as IGroupCustom
        });
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

  setClickEvent(group: IGroupCustom, mainLayer: Layer, currentActiveGroup: Group) {
    group.on('click', event => {
      event.cancelBubble = true;
      if (event.evt.ctrlKey) {
        event.target.parent.setAttr(
          'x',
          event.target.parent.position().x - currentActiveGroup.position().x
        );
        event.target.parent.setAttr(
          'y',
          event.target.parent.position().y - currentActiveGroup.position().y
        );
        currentActiveGroup.add(event.target.parent as Group);
        event.target.parent.children.each(elem => {
          elem.setAttr('stroke', 'yellow');
          elem.setAttr('draggable', false);
        });
        event.target.parent.setAttr('draggable', false);
      }
    });
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
        if (path.attrs.end_info.end_group_id === event.currentTarget._id ||
          path.attrs.start_info.start_group_id === event.currentTarget._id
        ) {
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
      let input_paths: Array<IPathCustom> = this.getAllInputLinesFromGroup(
        mainLayer.getStage(),
        event.target as Group | IGroupCustom
      );
      if (isPathInGroup || input_paths) {
        let output_paths: Collection<IPathCustom> = this.getAllOutputLinesFromGroup(
          event.target as Group | IGroupCustom
        );
        if (output_paths) {
          output_paths.each(elem => {
            //start point
            let currentFlowboard = this.getGroupById(
              elem.attrs.end_info.end_flowboard_id,
              mainLayer.getStage()
            );
            let temp_start_point_group = this.getGroupById(
              elem.attrs.end_info.end_group_id,
              currentFlowboard as Group
            );
            let temp_end_point_circle = this.getCircleFromGroupById(
              event.target.getStage(),
              elem.attrs.start_info.start_circle_id
            );
            let temp_start_circle = this.getCircleFromGroupById(
              temp_start_point_group as Group,
              elem.attrs.end_info.end_circle_id
            );
            //end point
            let deltaX =
              temp_start_point_group.getAbsolutePosition().x -
              event.target.attrs.x +
              temp_start_circle.attrs.x -
              temp_end_point_circle.attrs.x;
            let deltaY =
              temp_start_point_group.getAbsolutePosition().y -
              event.target.attrs.y +
              temp_start_circle.attrs.y -
              temp_end_point_circle.attrs.y;
            elem.setAttr(
              'data',
              KonvaUtil.generateLinkPath(
                temp_start_point_group.getAbsolutePosition().x /
                (this._currentZoom / 100) -
                event.target.attrs.x +
                temp_start_circle.attrs.x -
                event.target.parent.attrs.x,
                temp_start_point_group.getAbsolutePosition().y /
                (this._currentZoom / 100) -
                event.target.attrs.y +
                temp_start_circle.attrs.y -
                event.target.parent.attrs.y,
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
            let temp_start_point_group = this.getGroupById(
              elem.attrs.start_info.start_group_id,
              mainLayer.getStage()
            );
            let temp_end_point_circle = this.getCircleFromGroupById(
              event.target.getStage(),
              elem.attrs.end_info.end_circle_id
            );
            let temp_start_point_circle = this.getCircleFromGroupById(
              event.target.getStage(),
              elem.attrs.start_info.start_circle_id
            );
            let temp_start_circle = this.getCircleFromGroupById(
              temp_start_point_group as Group,
              elem.attrs.start_info.start_circle_id
            );
            let temp_input_circle = event.target.getStage().findOne(elem => {
              if (
                elem.className === 'Circle' &&
                elem.attrs.type === CircleTypes.Input
              ) {
                return elem;
              }
            });
            let deltaX = event.target.attrs.x - temp_start_point_group.attrs.x;
            let deltaY = temp_start_point_group.getAbsolutePosition().y - temp_start_point_group.attrs.y + temp_start_circle.attrs.y;
            elem.setAttr(
              'data',
              KonvaUtil.generateLinkPath(
                temp_start_point_group.getAbsolutePosition().x /
                (this._currentZoom / 100) -
                temp_start_point_group.attrs.x +
                temp_start_circle.attrs.x -
                event.target.parent.attrs.x,
                temp_start_point_group.getAbsolutePosition().y /
                (this._currentZoom / 100) -
                temp_start_point_group.attrs.y +
                temp_start_circle.attrs.y -
                event.target.parent.attrs.y,
                event.target.attrs.x - temp_start_point_group.attrs.x,
                event.target.attrs.y -
                temp_start_point_group.attrs.y +
                temp_input_circle.attrs.y,
                this.setParamForLine(deltaX, deltaY)
              )
            );
          });
        }
      }
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
        if (
          elem.className === 'Path' &&
          elem.attrs.end_info &&
          elem.attrs.end_info.end_group_id === group._id
        ) {
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
  createPorts(blockVariables: InputBlocksInterface, temp_group: Group, height: number) {
    let inputPorts = blockVariables.inputs;
    let outputPorts = blockVariables.outputs;
    let errorPorts = blockVariables.output_errors;
    let max_ports = errorPorts + outputPorts > inputPorts ? errorPorts + outputPorts : inputPorts;
    let delayInput = height / (inputPorts + 1);
    let delayOutput = height / (outputPorts + errorPorts + 1);
    for (let i = 1; i <= max_ports; i++) {
      if (inputPorts > 0) {
        temp_group.add(ShapeCreator.createPortCircle(0, delayInput * i, blockVariables.color, true)); // add input
        inputPorts--;
      }
      if (outputPorts > 0) {
        temp_group.add(ShapeCreator.createPortCircle(sizes.block_width, delayOutput * i, blockVariables.color, false)); // add output
        outputPorts--;
      } else if (errorPorts > 0) {
        temp_group.add(ShapeCreator.createErrorOutput(delayOutput * i)); // add error
        errorPorts--;
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
      console.log(false);
      parent.attrs.switched = !parent.attrs.switched;
    } else {
      elemSwitchRect.attrs.fill = colorActive;
      elemSwitchRect.attrs.stroke = highSwitchRect.attrs.stroke = highSwitchCircle.attrs.fill = blockColor;
      elemSwitchText.attrs.fill = colorDisabled;
      elemSwitchText.offsetX(0);
      elemSwitchText.text('ON');
      elemSwitchCircle.offsetX(0);
      elemSwitchCircle.attrs.fill = 'white';
      console.log(true);
      parent.attrs.switched = !parent.attrs.switched;
    }
  }

  clickButtonAnimation(event) {
    let parent = event.target.parent;
    let elemRect = parent.findOne('Rect');
    let elemText = parent.findOne('Text');
    elemRect.attrs.fill = 'steelblue';
    elemText.attrs.fill = 'white';
    console.warn('It was click on push');
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

  createDefaultGroup(mainLayer: Layer, activeWrapperBlock, currentActiveGroup: Group, blockName) {
    let newBlockVariables = this.blocksArr.find(block => block.name === blockName);
    let height;
    let temp_group = new Konva.Group({
      draggable: true,
      type: GroupTypes.Block,
      name: newBlockVariables.name,
      date: Date.now(),
      label: newBlockVariables.label,
      blockData: newBlockVariables,
      showOnPanel: true
    }) as IGroupCustom;

    if (newBlockVariables.outputs + newBlockVariables.output_errors > 2 || newBlockVariables.inputs > 2) {
      let max_ports = newBlockVariables.outputs + newBlockVariables.output_errors > newBlockVariables.inputs ?
        newBlockVariables.outputs + newBlockVariables.output_errors : newBlockVariables.inputs;
      height = sizes.block_height + (max_ports - 1) * 30;
    } else {
      height = sizes.block_height;
    }
    temp_group.add(ShapeCreator.createShapeName(newBlockVariables.label, newBlockVariables.color));

    temp_group.add(ShapeCreator.createRect(newBlockVariables.color, height));

    this.createPorts(newBlockVariables, temp_group, height);
    temp_group.add(ShapeCreator.iconGroupCreator(SwitcherSizes.margin_left, (height - SwitcherSizes.iconsFontSize) / 2, newBlockVariables.setting_icons).hide());

    temp_group.add(ShapeCreator.createFaceImage(ShapesSizes.block_width - ShapesSizes.face_img_font_size - 10,
      (height - ShapesSizes.face_img_font_size) / 2, newBlockVariables.color, newBlockVariables.setting_icons.face_image)
    );

    if (newBlockVariables.btn_event_block.switch > -1) {
      temp_group.add(ShapeCreator.switcherGroupCreator((ShapesSizes.block_width - 45) / 2, height - 9, 45, newBlockVariables.color, newBlockVariables.btn_event_block)
      );

      let blockSwitcher = temp_group.findOne(elem => !!elem.attrs.switched);

      if (newBlockVariables.btn_event_block.switch === 1) {
        blockSwitcher.on('click', event => {
          this.switcherAnimation(event, newBlockVariables.btn_event_block.color_active, newBlockVariables.btn_event_block.color_disabled, newBlockVariables.color)
        });
      } else if (newBlockVariables.btn_event_block.switch === 0) {
        blockSwitcher.on('mousedown', event =>
          this.clickButtonAnimation(event)
        );
      }
    }

    temp_group.setAttrs({
      width: sizes.block_width + sizes.circle_radius * 2,
      height: height
    });

    // Set listener on block for hover effect
    this.setListenerOnBlock(mainLayer, temp_group);

    // Take icons group from created shape and add listeners on icons
    this.setListenerOnIcons(temp_group);

    let circles_collection = this.getAllCirclesFromGroup(temp_group);
    circles_collection && circles_collection.each((elem: ICircleCustom) => {
      elem.setAttr('zIndex', 1000);
      this.setMouseDownEventForSwitchCircle(elem, mainLayer, currentActiveGroup);
    });
    this.setRegularGroupHandlers(temp_group, mainLayer, activeWrapperBlock, currentActiveGroup);
    return temp_group;
  }

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
        this.fileNameDialogRef = this.dialog.open(ModalPropComponent, {
          data: elem._id
        });
      });
    });
  }

  // TODO: Function hide face image and show icons (edit, wizard, settings)
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
        if (elem._id === id) {
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
      return component.getStage().findOne(elem => {
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
}
