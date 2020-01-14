import {Injectable} from '@angular/core';
import {StageComponent} from 'ng2-konva';
import {Group} from 'konva/types/Group';
import Konva from 'konva';
import {
  CircleTypes,
  IActiveWrapperBlock,
  ICircleCustom,
  ICurrentLineToDraw,
  IGroupCustom, InputBlocksInterface, IPathCustom,
} from '../luwfy-canvas/shapes-interface';
import ShapeCreator from '../luwfy-canvas/ShapesCreator';
import {ShapesSizes, ShapesSizes as sizes, SwitcherSizes} from '../luwfy-canvas/sizes';
import {theme} from '../luwfy-canvas/theme';
import KonvaUtil from '../luwfy-canvas/konva-util';
import {Layer} from 'konva/types/Layer';
import {Shape, ShapeConfig} from 'konva/types/Shape';
import {Stage} from 'konva/types/Stage';
import {BehaviorSubject, Subject} from 'rxjs';
import {Collection} from 'konva/types/Util';
import {Path} from 'konva/types/shapes/Path';
import {ModalPropComponent} from '../popups/modal-prop/modal-prop.component';
import {MatDialog, MatDialogRef} from '@angular/material';
import {BlocksRedactorService} from '../popups/blocks-redactor.service';
import {log} from 'util';
import {BlocksService} from './blocks.service';

@Injectable({
  providedIn: 'root',
})
export class CanvasService {


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

    swapOrientation: () => {
      this.currentLineToDraw.positionStart = {x: this.currentLineToDraw.prevX, y: this.currentLineToDraw.prevY};
      this.currentLineToDraw.positionEnd = {
        x: this.currentLineToDraw.prevMainX,
        y: this.currentLineToDraw.prevMainY,
      };
    },
  };

  // chosedGroupOfLines:IPathCustom[] = [];

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

  lineToDraw: Subject<ICurrentLineToDraw> = new BehaviorSubject<ICurrentLineToDraw>(this.currentLineToDraw);
  activeBlock: Subject<IActiveWrapperBlock> = new BehaviorSubject<IActiveWrapperBlock>(this.activeWrapperBlock);
  fileNameDialogRef: MatDialogRef<ModalPropComponent>;
  blocksArr: InputBlocksInterface[];

  constructor(private dialog: MatDialog, private blocksRedactorService: BlocksRedactorService, private blocksService: BlocksService) {
    this.blocksArr = this.blocksService.getBlocks() as InputBlocksInterface[];
  }

  deleteShapesFromGroup = (mainLayer: Layer, currentActiveGroup: any) => {

    let group_children_temp = currentActiveGroup.children;

    if (group_children_temp.length > 0) {
      while (group_children_temp.length) {
        group_children_temp[group_children_temp.length - 1].children.each((elem) => {
          if (elem.className !== 'Path') {
            elem.setAttr('stroke', theme.rect_border);
          }
        });
        group_children_temp[group_children_temp.length - 1].setAttr('draggable', true);
        group_children_temp[group_children_temp.length - 1].setAttr('x',
          group_children_temp[group_children_temp.length - 1].position().x + currentActiveGroup.position().x);
        group_children_temp[group_children_temp.length - 1].setAttr('y',
          group_children_temp[group_children_temp.length - 1].position().y + currentActiveGroup.position().y);
        mainLayer.getStage().add(group_children_temp[group_children_temp.length - 1]);
      }

      currentActiveGroup.removeChildren();
      mainLayer.getStage().draw();

    }

  };

  setRegularGroupHandlers(group: IGroupCustom, mainLayer: Layer, activeWrapperBlock: IActiveWrapperBlock, currentActiveGroup: Group) {
    this.setDragGroupEvents(group, mainLayer, currentActiveGroup);
    this.setMouseMoveEvents(group, mainLayer, activeWrapperBlock);
    //  this.setClickEvent(group, mainLayer, activeWrapperBlock, this.currentActiveGroup)
  }

  setMouseMoveEvents(group: IGroupCustom, mainLayer: Layer, activeWrapperBlock: IActiveWrapperBlock) {

    //todo add switch for different types of groups

    group.on('mousedown', (event) => {
      activeWrapperBlock.isActive = false;
      activeWrapperBlock.isDraw = false;
      activeWrapperBlock.rectangle.setAttr('visible', false);
    });

    group.on('mouseup', (event) => {

      if (this.currentLineToDraw.isLineDrawable) {
        let input_circle = this.getInputCircleFromGroup(event.target as Group);

        let current_path_group = this.getGroupById(this.currentLineToDraw.groupId, mainLayer.getStage());

        current_path_group.setAttr('draggable', 'true');

        let current_path = current_path_group.findOne((elem) => {
          if (elem.className === 'Path' && elem.attrs.start_info.start_group_id === this.currentLineToDraw.groupId && elem._id === this.currentLineToDraw.lineId) {
            return elem;
          }
        });

        //event.target.zIndex(1);

        let start_circle = current_path_group.findOne((elem) => {
          if (current_path.attrs.start_info && elem._id === current_path.attrs.start_info.start_circle_id) {
            return elem;

          }

        });
        let deltaX = event.target.parent.attrs.x - current_path_group.attrs.x;
        let deltaY = event.target.parent.attrs.y - current_path_group.attrs.y;

        current_path.setAttr('data', KonvaUtil.generateLinkPath(start_circle.attrs.x, start_circle.attrs.y,
          event.target.parent.attrs.x - current_path_group.attrs.x,
          event.target.parent.attrs.y - current_path_group.attrs.y + input_circle.attrs.y, this.setParamForLine(deltaX, deltaY)));

        console.log('[c] current_path eee', current_path);

        current_path.setAttr('custom_id_output', event.target._id);

        current_path.setAttr('end_info', {
          end_group_id: event.target.parent._id,
          end_circle_id: input_circle._id,
        });

        if (!current_path.attrs.end_info || current_path.attrs.start_info.start_group_id === current_path.attrs.end_info.end_group_id) {
          console.log('[c] removing');
          current_path.remove();
        }

        this.currentLineToDraw.isLineDrawable = false;
        this.lineToDraw.next(this.currentLineToDraw);
        console.log('[c] CANVAS', current_path);
        // event.target.parent.draw();
        return 0;

      }

    });

    group.on('mouseenter', (event) => {
      if (event.target.parent.attrs.type && event.target.parent.attrs.type.includes('output')) {
        if (this.currentLineToDraw.isLineDrawable) {
          let current_circle = this.getCircleFromGroup(event.target.parent as Group);
          current_circle.setAttr('fill', theme.circle_background_output);
        }
      }
    });

    group.on('mouseleave', (event) => {
      if (event.target.parent.attrs.type && event.target.parent.attrs.type.includes('output')) {
        if (this.currentLineToDraw.isLineDrawable) {
          let current_circle = this.getCircleFromGroup(event.target.parent as Group);

        }

      }
    });

  }

  setMouseDownEventForSwitchCircle(circle: ICircleCustom, mainLayer: Layer) {

    circle.on('mousedown', (event) => {
      console.log('[c] bbb', event);
      if (event.target.attrs.type === CircleTypes.Output) {

        let line_temp = ShapeCreator.createLine({
          start_circle_id: event.target._id,
          start_group_id: event.target.parent._id,
        });

        //this.setClickEventForPath(line_temp);

        event.target.parent.add(line_temp);

        event.target.parent.setAttr('draggable', false);

        this.currentLineToDraw.isLineDrawable = true;
        this.currentLineToDraw.lineId = line_temp._id;
        this.currentLineToDraw.groupId = event.target.parent._id;

        console.log('[c] circle inside', event.target);

        this.currentLineToDraw.prevX = event.target.parent.attrs.x + event.target.attrs.x + 20;
        this.currentLineToDraw.prevY = event.target.parent.attrs.y + event.target.attrs.y;

        this.lineToDraw.next(this.currentLineToDraw);
      }

    });
  }

  setClickEventForPath(path: Path) {
    path.on('click', (event) => {
      console.log('[c] click path', event);
      if (event.evt.ctrlKey) {


      }

      //todo add chooser
      //

    });

  }

  getInputCircleFromGroup(component: Group | IGroupCustom) {
    if (component) {
      return component.getStage().findOne((elem) => {
        if (elem.className == 'Circle' || elem.attrs.type === CircleTypes.Input) {
          return elem;
        }

      });

    } else {
      return null;
    }

  }

  setClickEvent(group: IGroupCustom, mainLayer: Layer, activeWrapperBlock: IActiveWrapperBlock, currentActiveGroup: Group) {

    group.on('click', (event) => {

      event.cancelBubble = true;

      if (event.evt.ctrlKey) {

        event.target.parent.setAttr('x', event.target.parent.position().x - currentActiveGroup.position().x);
        event.target.parent.setAttr('y', event.target.parent.position().y - currentActiveGroup.position().y);

        currentActiveGroup.add(event.target.parent as Group);
        event.target.parent.children.each((elem) => {
          elem.setAttr('stroke', 'yellow');
          elem.setAttr('draggable', false);

        });
        event.target.parent.setAttr('draggable', false);

      }

    });

  }

  setParamForLine(deltaX: number, deltaY: number) {
    // return 0;
    if (deltaX < 0) {
      return 3;
    }

    // if ( deltaX < 180 ) {
    //     return 1;
    // }

    if (deltaX < 280) {
      return 1;
    } else {
      return 3;
    }

  }

  setDragGroupEvents(group: IGroupCustom, mainLayer: Layer, currentActiveGroup) {
    //todo add switch for different types of groups

    group.on('dragstart', (event) => {
      if (this.currentLineToDraw.isLineDrawable) {
        return 0;
      }

      if (currentActiveGroup.isDraw) {
        this.deleteShapesFromGroup(mainLayer, currentActiveGroup);
      }
      this.activeWrapperBlock.isDraw = false;
      this.activeWrapperBlock.rectangle.setAttr('visible', false);
      this.activeBlock.next(this.activeWrapperBlock);

    });
    group.on('dragmove', (event) => {
      if (!event) {
        return 0;
      }

      let isPathInGroup = this.isPathInGroup(event.target as Group);
      let input_paths: Array<IPathCustom> = this.getAllInputLinesFromGroup(mainLayer, event.target as Group | IGroupCustom);
      if (isPathInGroup || input_paths) {

        let output_paths: Collection<IPathCustom> = this.getAllOutputLinesFromGroup(event.target as Group | IGroupCustom);

        if (output_paths) {
          output_paths.each((elem) => {

            //start point
            let temp_start_point_group = this.getGroupById(elem.attrs.end_info.end_group_id, mainLayer.getStage());
            let temp_end_point_circle = this.getCircleFromGroupById(event.target.getStage(), elem.attrs.start_info.start_circle_id);
            let temp_start_circle = this.getCircleFromGroupById(temp_start_point_group, elem.attrs.end_info.end_circle_id);

            //end point
            let deltaX = temp_start_point_group.getAbsolutePosition().x - event.target.attrs.x + temp_start_circle.attrs.x - temp_end_point_circle.attrs.x;
            let deltaY = temp_start_point_group.getAbsolutePosition().y - event.target.attrs.y + temp_start_circle.attrs.y - temp_end_point_circle.attrs.y;
            // this.setParamForLine ( deltaX, deltaY );

            elem.setAttr('data',
              KonvaUtil.generateLinkPath(temp_start_point_group.getAbsolutePosition().x - event.target.attrs.x + temp_start_circle.attrs.x,
                temp_start_point_group.getAbsolutePosition().y - event.target.attrs.y + temp_start_circle.attrs.y,
                temp_end_point_circle.attrs.x, temp_end_point_circle.attrs.y, (-1) * this.setParamForLine(deltaX, deltaY)));
          });
        }

        if (input_paths) {
          console.log('[c] input_path');
          input_paths.forEach((elem) => {
            //start point
            let temp_start_point_group = this.getGroupById(elem.attrs.start_info.start_group_id, mainLayer.getStage());
            let temp_end_point_circle = this.getCircleFromGroupById(event.target.getStage(), elem.attrs.end_info.end_circle_id);

            let temp_start_point_circle = this.getCircleFromGroupById(event.target.getStage(), elem.attrs.start_info.start_circle_id);

            let temp_start_circle = this.getCircleFromGroupById(temp_start_point_group, elem.attrs.start_info.start_circle_id);

            let temp_input_circle = event.target.getStage().findOne((elem) => {
              if (elem.className === 'Circle' && elem.attrs.type === CircleTypes.Input) {
                return elem;
              }
            });
            console.log('[c] i', event.target);
            let deltaX = event.target.attrs.x - temp_start_point_group.attrs.x;
            let deltaY = temp_start_point_group.getAbsolutePosition().y - temp_start_point_group.attrs.y + temp_start_circle.attrs.y;
            // this.setParamForLine (deltaX, deltaY );
            console.log('[c] DELTA_INPUT_X', deltaX);
            console.log('[c] DELTA_INPUT_Y', deltaY);
            elem.setAttr('data',
              KonvaUtil.generateLinkPath(temp_start_point_group.getAbsolutePosition().x - temp_start_point_group.attrs.x + temp_start_circle.attrs.x,
                temp_start_point_group.getAbsolutePosition().y - temp_start_point_group.attrs.y + temp_start_circle.attrs.y,
                event.target.attrs.x - temp_start_point_group.attrs.x, event.target.attrs.y - temp_start_point_group.attrs.y + temp_input_circle.attrs.y, this.setParamForLine(deltaX, deltaY)));
          });
        }
      }
    });
  }

  setRegularGroupEvents(group: IGroupCustom) {

    //group

  }


  getAllInputLinesFromGroup(component: Layer, group: Group | IGroupCustom): Array<IPathCustom> {
    let collection_ports: Array<IPathCustom> = [];
    let all_groups = component.getStage().find((elem) => {
      if (!elem.className) {
        return elem;
        // return elem.find((elem) => {
        //   if (elem.className === 'Path' && elem.attrs.end_info.group_id === group._id) {
        //     return elem;
        //   }
        // });
      }
    });
    all_groups.each((elem) => {
      elem.getStage().find((elem) => {
        if (elem.className === 'Path' && elem.attrs.end_info && elem.attrs.end_info.end_group_id === group._id) {
          collection_ports.push(elem);
        }
      });
    });
    console.log('[c] ppp', collection_ports);
    return collection_ports;
  }

  getActiveBlock(mainLayer: Layer) {
    return mainLayer.findOne((elem) => {
      if (elem.attrs.isActive_block) {
        return elem;
      }
    });
  }

  getAllOutputLinesFromGroup(group: Group | IGroupCustom): Collection<IPathCustom> {
    return group.find((elem) => {
      console.log('[c] elem ppp', elem);
      if (elem.className === 'Path') {
        return elem;
      }
    });
  };

  // createOutputPorts(number_of_ports: number, color, temp_group: Group, height: number) {
  //   if (number_of_ports === 1) {
  //     temp_group.add(ShapeCreator.createCircleOutput(height / 2, null, color));
  //   } else if (number_of_ports === 2) {
  //     temp_group.add(ShapeCreator.createCircleOutput(height / 3, null, color));
  //     temp_group.add(ShapeCreator.createCircleOutput((height / 3) * number_of_ports, null, color));
  //   } else if (number_of_ports >= 3) {
  //     let a = (number_of_ports - 1);
  //     let margin_temp = (height - a * 30) / 2 - 10;
  //     let y;
  //     for (let i = 0; i < number_of_ports;) {
  //       i++;
  //       if (i == 1) {
  //         y = margin_temp + 10;
  //         let temp_circle = ShapeCreator.createCircleOutput(y, null, color);
  //         temp_group.add(temp_circle);
  //         temp_circle.zIndex(1);
  //       } else {
  //         y = margin_temp + i * (20) + (i - 2) * 10;
  //         let temp_circle = ShapeCreator.createCircleOutput(y, null, color);
  //         temp_group.add(temp_circle);
  //         temp_circle.zIndex(1);
  //       }
  //     }
  //   }
  // };
  //
  // createInputPorts(number_of_ports: number, color, temp_group: Group, height: number) {
  //   if (number_of_ports === 1) {
  //     temp_group.add(ShapeCreator.createCircleInput(height / 2, null, color));
  //   } else if (number_of_ports === 2) {
  //     temp_group.add(ShapeCreator.createCircleInput(height / 3, null, color));
  //     temp_group.add(ShapeCreator.createCircleInput((height / 3) * number_of_ports, null, color));
  //   } else if (number_of_ports >= 3) {
  //     let a = (number_of_ports - 1);
  //     let margin_temp = (height - a * 30) / 2 - 10;
  //     let y;
  //     for (let i = 0; i < number_of_ports;) {
  //       i++;
  //       if (i == 1) {
  //         y = margin_temp + 10;
  //         let temp_circle = ShapeCreator.createCircleInput(y, null, color);
  //         temp_group.add(temp_circle);
  //         temp_circle.zIndex(1);
  //       } else {
  //         y = margin_temp + i * (20) + (i - 2) * 10;
  //         let temp_circle = ShapeCreator.createCircleInput(y, null, color);
  //         temp_group.add(temp_circle);
  //         temp_circle.zIndex(1);
  //       }
  //     }
  //   }
  // };
// }

  // function add all ports (input, output, error)
  createPorts(blockVariables: InputBlocksInterface, temp_group: Group, height: number) {
    let max_ports = (blockVariables.outputs + blockVariables.output_errors) > blockVariables.inputs ? (blockVariables.outputs + blockVariables.output_errors) : blockVariables.inputs;
    let inputPorts = blockVariables.inputs;
    let outputPorts = blockVariables.outputs;
    let errorPorts = blockVariables.output_errors;
    let delayInput = height / (inputPorts + 1);
    let delayOutput = height / ((outputPorts + errorPorts) + 1);
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
      elemSwitchText.attrs.fill = 'white';
      elemSwitchText.offsetX(17);
      elemSwitchText.text('OFF');
      elemSwitchCircle.offsetX(-27);
      elemSwitchCircle.attrs.fill = theme.rect_debug_stroke;
      elemSwitchCircle.attrs.stroke = theme.rect_debug_stroke;
      console.log(false);
      parent.attrs.switched = !parent.attrs.switched;
    } else {
      elemSwitchRect.attrs.fill = 'steelblue';
      elemSwitchRect.attrs.stroke = highSwitchRect.attrs.stroke = highSwitchCircle.attrs.fill = blockColor;
      elemSwitchText.attrs.fill = 'white';
      elemSwitchText.offsetX(0);
      elemSwitchText.text('ON');
      elemSwitchCircle.offsetX(0);
      elemSwitchCircle.attrs.fill = 'white';
      elemSwitchCircle.attrs.stroke = 'gray';
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

  // TODO create universal block creator using data from JSON with properties for block
  createDefaultGroup(mainLayer: Layer, activeWrapperBlock, currentActiveGroup: Group, blockName) {

    let newBlockVariables = this.blocksArr.find(block => block.name === blockName);

    let temp_group = new Konva.Group({
      draggable: true
    }) as IGroupCustom;

    // mouseInsideRectangle is flag set true when mouse inside rectangle
    // and will changes when mouse leave rectangle
    let mouseInsideRectangle: boolean;
    let height;

    if ((newBlockVariables.outputs + newBlockVariables.output_errors) > 2 || newBlockVariables.inputs > 2) {
      let max_ports = (newBlockVariables.outputs + newBlockVariables.output_errors) > newBlockVariables.inputs ? (newBlockVariables.outputs + newBlockVariables.output_errors) : newBlockVariables.inputs;
      height = sizes.block_height + (max_ports - 1) * 30;
    } else {
      height = sizes.block_height;
    }

    temp_group.add(ShapeCreator.createShapeName(newBlockVariables.label, newBlockVariables.color));

    temp_group.add(ShapeCreator.createRect(newBlockVariables.color, height).on('mouseenter', (event) => {
      mouseInsideRectangle = true;
      onChangeHiddenElement(temp_group);
    }));

    this.createPorts(newBlockVariables, temp_group, height);
    // this.createOutputPorts(newBlockVariables.outputs, newBlockVariables.color, temp_group, height);
    // this.createInputPorts(newBlockVariables.inputs, newBlockVariables.color, temp_group, height);


    temp_group.add(ShapeCreator.iconGroupCreator(SwitcherSizes.margin_left, (height - SwitcherSizes.iconsFontSize) / 2,
      newBlockVariables.setting_icons).hide());

    temp_group.add(ShapeCreator.createFaceImage((ShapesSizes.block_width - ShapesSizes.face_img_font_size - 10),
      (height - ShapesSizes.face_img_font_size) / 2, newBlockVariables.color, newBlockVariables.setting_icons.face_image));

    if (newBlockVariables.btn_event_block.switch === 1) {
      temp_group.add(ShapeCreator.switcherGroupCreator((ShapesSizes.block_width - 45) / 2,
        height - 9, 45, newBlockVariables.color, newBlockVariables.btn_event_block));
      temp_group.findOne(elem => !!elem.attrs.switched).on('click', event =>
        this.switcherAnimation(event, newBlockVariables.btn_event_block.color_active,
          newBlockVariables.btn_event_block.color_disabled, newBlockVariables.color));
    } else if (newBlockVariables.btn_event_block.switch === 0) {
      temp_group.add(ShapeCreator.switcherGroupCreator((ShapesSizes.block_width - 45) / 2,
        height - 9, 45, newBlockVariables.color, newBlockVariables.btn_event_block));
      temp_group.findOne(elem => !!elem.attrs.switched).on('mousedown', event => {
        this.clickButtonAnimation(event);
      });
    }

    temp_group.on('mouseleave', (event) => {
      mouseInsideRectangle = false;
      onChangeHiddenElement(temp_group);
    });

    // Take icons group from created shape and add listeners on icons
    let icons_group = temp_group.findOne(elem => elem.attrs.type === 'iconGroup');
    Array.from(icons_group.children).forEach(elem => {
      elem.on('click', () => {
        if (!this.blocksRedactorService.checkerOnExistBlock(elem)) {
          this.blocksRedactorService.addBlock(elem);
        }
        this.fileNameDialogRef = this.dialog.open(ModalPropComponent, {data: elem._id});
      });
    });

    // Function hide face image and show to us icons (edit, wizard, settings)
    const onChangeHiddenElement = (group: Group) => {
      let iconGroup = group.findOne(elem => elem.attrs.type === 'iconGroup');
      let headImage = group.findOne(elem => elem.attrs.type === 'headImage');
      if (mouseInsideRectangle) {
        headImage.hide();
        iconGroup.show();
      } else {
        headImage.show();
        iconGroup.hide();
      }
    };

    let circles_collection = this.getAllCirclesFromGroup(temp_group);

    circles_collection && circles_collection.each((elem: ICircleCustom) => {
      elem.setAttr('zIndex', 1000);
      this.setMouseDownEventForSwitchCircle(elem, mainLayer);
    });

    this.setRegularGroupHandlers(temp_group, mainLayer, activeWrapperBlock, currentActiveGroup);
    return temp_group;
  }

  getAllCirclesFromGroup(component: Group | IGroupCustom) {
    if (component) {
      return component.find((elem) => {
        if (elem.className === 'Circle') {
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

  getRectFromGroup(component: IGroupCustom) {
    if (component) {
      return component.getStage().findOne((elem) => {
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
      return component.getStage().findOne((elem) => {
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
      return component.findOne((elem) => {
        console.log('[c]', elem.className === 'Circle');
        if (elem.className === 'Circle') {
          return elem;
        }
      });
    } else {
      return null;
    }
  }

  getPathFromGroup(component: Group) {
    if (component) {
      return component.findOne((elem) => {
        if (elem.className === 'Path') {
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
