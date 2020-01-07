import {Component, OnInit, ViewChild} from '@angular/core';
import {RegistryService} from '../services/registry.service';
import KonvaUtil from './konva-util';
import {theme} from './colors';

import Konva from 'konva';
// import * as d3 from 'd3';
import {Observable, of} from 'rxjs';
import {CanvasService} from '../services/canvas.service.ts.service';
import {IGroupCustom, IPathCustom, IRectCustom} from './shapes-interface';

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

  rectangle:  IRectCustom = new Konva.Rect({
    x: null,
    y: null,
    width: 100,
    height: 50,
    fill: theme.rect_background,
    stroke: 'black',
    draggable: true,
  });


  createdGroup: IGroupCustom = new Konva.Group({
    draggable: true,
    x: 0,
    y: 0,
  });

  currentId: string;
  idChangedTrigger: boolean = false;

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

  currentActiveGroup = new Konva.Group({
    draggable: true,
    visible: true,
  }).on('dragstart', (event) => {
    this.activeWrapperBlock.isDraw = false;
    this.activeWrapperBlock.rectangle.setAttr('visible', false);
  });


  // mouse rectangle selection
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

  //reverse mouse rectangle selection depending on move
  // left & up
  // left & down
  // right & up
  // right & down
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
    // this.activeWrapperBlock.rectangle.setAttr ( 'x', posRect.x1 );
    // this.activeWrapperBlock.rectangle.setAttr ( 'y', posRect.y1 );
    //
    // this.activeWrapperBlock.rectangle.setAttr ( 'width', posRect.x2 - posRect.x1 );
    // this.activeWrapperBlock.rectangle.setAttr ( 'height', posRect.y2 - posRect.y1 );
    // this.activeWrapperBlock.rectangle.setAttr ( 'visible', true );

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


  private path_background: Observable<any> = of({
    data: 'M 240 200 C 315 200 395 160 470 160',
    stroke: '#fff',
    opacity: 0,
    strokeWidth: 20,
  });


  private path_outline: Observable<any> = of({
    data: 'M 240 200 C 315 200 395 160 470 160',
    stroke: '#fff',
    strokeWidth: 5,
  });

  private path_link_line: Observable<any> = of({
    data: 'M 240 200 C 315 200 395 160 470 160',
    stroke: '#999',
    strokeWidth: 3,
  });


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

    if (!this.rectangle || this.idChangedTrigger) {

      this.rectangle  = new Konva.Rect({
        width: 100,
        height: 50,

        //todo change to separate types colors

        fill: this.currentId.includes('input') ? 'red' : 'blue',
        stroke: 'black',
        draggable: false,
      });

      let circle : IPathCustom  = new Konva.Circle({
        radius: 20,
        x: this.currentId.includes('input') ? 100 : 0,
        y: 25,
        fill: 'white',
        stroke: 'black',
        strokeWidth: 5,
      }).on('mousedown', (event) => {
        if (event.target.parent.attrs.type.includes('input')) {
          event.cancelBubble = true;
          let temp_path = event.target.parent.findOne((elem) => {
            if (elem.attrs.custom_id && elem.attrs.custom_id.includes(event.target._id.toString())) {
              return elem;
            }
          });


          // if (temp_path && temp_path.isVisible()) {
          //   //temp_path.hide();
          //
          //   this.currentLineToDraw.isLineDrawable = false;
          //   return 0;
          // }

          this.currentLineToDraw.isLineDrawable = true;
          this.currentLineToDraw.groupId = event.target.parent._id;

          event.target.setAttr('fill', 'blue');


          // this.currentLineToDraw.prevX = this.stage.getStage().getPointerPosition().x;
          // this.currentLineToDraw.prevY = this.stage.getStage().getPointerPosition().y;

          this.currentLineToDraw.prevX = event.target.parent.attrs.x + 100;
          this.currentLineToDraw.prevY = event.target.parent.attrs.y + 25;


          let current_group = this.mainLayer.getStage().findOne((elem) => {
            if (elem._id === this.currentLineToDraw.groupId) {
              return elem;
            }
          });

          let isCurrentPath = current_group.findOne((elem) => {
            if (elem.attrs.custom_id && elem.attrs.custom_id.includes('line')) {
              return true;
            }

          });

          if (true || !isCurrentPath) {
            event.target.parent.add(new Konva.Path({
              data: '',
              attached: true,
              custom_id: 'line_' + event.target._id,
              last_path: 'true',
              strokeWidth: 3,
              lineJoin: 'round',
              opacity: 1,
              stroke: '#999',
            }));
            event.target.parent.zIndex(100);
          }

        }



      }).on('mouseenter', (event) => {




      });

      this.createdGroup = new Konva.Group({
        draggable: true,
        type: this.currentId,
      }).on('click', (event) => {
        event.cancelBubble = true;

        if (event.evt.ctrlKey) {

          event.target.parent.setAttr('x', event.target.parent.position().x - this.currentActiveGroup.position().x);
          event.target.parent.setAttr('y', event.target.parent.position().y - this.currentActiveGroup.position().y);

          this.currentActiveGroup.add(event.target.parent);
          event.target.parent.children.each((elem) => {
            elem.setAttr('stroke', 'yellow');
            elem.setAttr('draggable', false);

          });
          event.target.parent.setAttr('draggable', false);

        }

      }).on('dragstart', (event) => {
        if (this.currentLineToDraw.isLineDrawable) {
          return 0;
        }
        this.activeWrapperBlock.isDraw = false;
        this.activeWrapperBlock.rectangle.setAttr('visible', false);
      }).on('mousedown', (event) => {
        this.activeWrapperBlock.isActive = false;
        this.activeWrapperBlock.isDraw = false;
        this.activeWrapperBlock.rectangle.setAttr('visible', false);
      })
        .on('mousedown', (event) => {
          event.target.position();

        }).on('mouseup', (event) => {


          if (event.target.parent.attrs.type && event.target.parent.attrs.type.includes('output')) {

            if (this.currentLineToDraw.isLineDrawable) {
              let current_circle = this.canvasService.getCircleFromGroup(event.target.parent);
              current_circle.setAttr('fill', 'red');
              // let current_group = this.mainLayer.getStage().findOne((elem) => {
              //   if (elem._id === this.currentLineToDraw.groupId) {
              //     return elem;
              //   }
              // });
              const pos = this.stage.getStage().getPointerPosition();
              let current_path_group = this.canvasService.getGroupById(this.currentLineToDraw.groupId, this.mainLayer);
              let current_path = current_path_group.findOne((elem) => {
                if (elem.attrs.custom_id && elem.attrs.custom_id.includes('line')) {
                  return elem;
                }
              });
              let current_output_rectangle = this.canvasService.getRectFromGroup(event.target.parent);
              current_path.zIndex(100);
              current_path.setAttr('data', KonvaUtil.generateLinkPath(this.currentLineToDraw.prevX - current_path_group.getPosition().x, this.currentLineToDraw.prevY - current_path_group.getPosition().y,
                event.target.parent.attrs.x - current_path_group.attrs.x,
                event.target.parent.attrs.y - current_path_group.attrs.y + 25, 1));

              current_path.setAttr('custom_id_output', event.target._id);


              if (event.target.parent.attrs.input_group) {
                let arr_temp: { path_id: number, group_id: number }[] = event.target.parent.attrs.input_group;
                arr_temp.push({
                  path_id: current_path._id,
                  //input id
                  group_id: current_path.parent._id,
                });
                event.target.parent.setAttr('input_group', arr_temp);

              }

              else {
                let arr_temp = [];
                arr_temp.push({
                  path_id: current_path._id,
                  group_id: current_path.parent._id,
                });
                event.target.parent.setAttr('input_group', arr_temp);
              }

              this.currentLineToDraw.isLineDrawable = false;
              event.target.parent.draw();
              return 0;

            }
          }
        }).on('mouseenter', (event) => {
          if (event.target.parent.attrs.type && event.target.parent.attrs.type.includes('output')) {
            if (this.currentLineToDraw.isLineDrawable) {
              let current_circle = this.canvasService.getCircleFromGroup(event.target.parent);
              current_circle.setAttr('fill', theme.circle_background_output);
            }

          }


        }).on('mouseleave', (event) => {
          if (event.target.parent.attrs.type && event.target.parent.attrs.type.includes('output')) {
            if (this.currentLineToDraw.isLineDrawable) {
              let current_circle = this.canvasService.getCircleFromGroup(event.target.parent);
              current_circle.setAttr('fill', 'white');
            }

          }
        })

        .on('dragmove', (event) => {
          if(!event)
          {
            return 0;
          }
          let isPathInGroup = this.canvasService.isPathInGroup(event.target);

          if (isPathInGroup) {

            //todo add

            this.currentLineToDraw.prevX = event.target.attrs.x + 100;
            this.currentLineToDraw.prevY = event.target.attrs.y + 25;


            console.log('[c] PPPPP', event.target);

            let current_path = this.canvasService.getPathFromGroup(event.target);
            console.log('[c] current_path', current_path);

            let current_output_group = this.canvasService.getGroupById(current_path.attrs.custom_id_output, this.mainLayer);

            console.log('[c] output group', current_output_group.parent.attrs.x, current_output_group.parent.attrs.y);

            // this.currentLineToDraw.swapOrientation();
            //
            // this.currentLineToDraw.positionEnd = {
            //   x: current_output_group.attrs.x,
            //   y: current_output_group.attrs.y + 25,
            // };

            console.log('[c] (x,y) start', this.currentLineToDraw.positionEnd.x, this.currentLineToDraw.positionEnd.y);
            console.log('[c] (x,y) end', event.target.attrs.x, event.target.attrs.y);

            event.target.zIndex(100);

            // current_path.setAttr('data', KonvaUtil.generateLinkPath(Math.abs(this.currentLineToDraw.prevMainX - event.target.getPosition().x),Math.abs (this.currentLineToDraw.prevMainY - event.target.getPosition().y), Math.ceil((pos.x - event.target.getPosition().x +  event.evt.movementX) / 5) * 5, Math.ceil((pos.y  + event.evt.movementY) / 5) * 5, 1));


            current_path.setAttr('data', KonvaUtil.generateLinkPath(current_output_group.parent.attrs.x - event.target.attrs.x, current_output_group.parent.attrs.y - event.target.attrs.y + 25,  100,  25, 0));

            ;


            //current_path.rotate(3);

            // this.currentLineToDraw.prevX = event.target.attrs.x + 100;
            // this.currentLineToDraw.prevY = event.target.attrs.y + 25;
          } else if (event.target.attrs.input_group) {


            let inputGroup_temp = event.target.attrs.input_group;

            inputGroup_temp.forEach((elem) => {
              this.currentLineToDraw.prevMainX = event.target.attrs.x + 100;
              this.currentLineToDraw.prevMainY = event.target.attrs.y + 25;
              let current_input_group = this.canvasService.getGroupById(elem.group_id, this.mainLayer);
              this.currentLineToDraw.prevX = current_input_group.attrs.x + 100;
              this.currentLineToDraw.prevY = current_input_group.attrs.y + 25;


              let current_path = this.canvasService.getPathFromGroup(current_input_group);


              current_path.setAttr('data', KonvaUtil.generateLinkPath(
                this.currentLineToDraw.prevX - current_input_group.getPosition().x,
                this.currentLineToDraw.prevY - current_input_group.getPosition().y,
                Math.ceil((event.target.attrs.x - current_input_group.getPosition().x + 10) / 5) * 5,
                Math.ceil((event.target.attrs.y - current_input_group.getPosition().y + 25) / 5) * 5, 1));

            });

            // current_path.setAttr('data', KonvaUtil.generateLinkPath(this.currentLineToDraw.positionEnd.x - event.target.getPosition().x, this.currentLineToDraw.positionEnd.y - event.target.getPosition().y, Math.ceil((event.target.attrs.x - event.target.getPosition().x + 100) / 5) * 5, Math.ceil((event.target.attrs.y - event.target.getPosition().y + 25) / 5) * 5, 0));
          }

        });

      this.createdGroup.absolutePosition({
        x: e.pageX,
        y: e.pageY,
      });

      this.createdGroup.add(this.rectangle);
      this.createdGroup.add(circle);

      this.idChangedTrigger = false;
      this.mainLayer.getStage().add(this.createdGroup);
      this.mainLayer.getStage().draw();

    } else

    {

      this.mainLayer.getStage().children[this.mainLayer.getStage().children.length - 1].position({
        x: e.layerX,
        y: e.layerY,
      });

      this.createdGroup = null;

    }

  };

  // handleMouseDown = ( e ) => {
  //     if ( !e ) {
  //         return;
  //     }
  //     var stage = this.stage.getStage ();
  //
  //     if ( !stage.clickStartShape ) {
  //         return;
  //     }
  //
  //     var output    = stage.clickStartShape;
  //     var group     = output.parent.parent;
  //     var container = output.parent;
  //
  //     group.draggable ( false );
  //
  //     const onOutput = output instanceof Konva.Rect && output.attrs.type === 'output';
  //
  //     if ( onOutput ) {
  //         console.log ( 'should draw line' );
  //         this.drawningLine = true;
  //
  //         var line_layer = this.lineLayer.getStage ();
  //
  //         var Path = new Konva.Path ( {
  //             _x         : container.x () + group.x (),
  //             _y         : container.y () + group.y (),
  //             attached   : false,
  //             data       : '',
  //             stroke     : '#999',
  //             opacity    : 1,
  //             strokeWidth: 3,
  //         } );
  //
  //         console.log ( '[c] event move', e );
  //         console.log ( '[c] event (x;y)', container.x () + group.x (), container.y () + group.y () );
  //         this.lines.push ( Path );
  //         line_layer.add ( Path );
  //
  //         line_layer.draw ();
  //
  //     }
  // };
  //
  // handleMouseMove = ( e ) => {
  //     if ( !this.drawningLine ) {
  //         return;
  //     }
  //     var stage      = this.stage.getStage ();
  //     var line_layer = this.lineLayer.getStage ();
  //
  //     const pos      = stage.getPointerPosition ();
  //     const lastLine = this.lines[ this.lines.length - 1 ];
  //     // lastLine.setAttr('points', [lastLine.attrs.points[0],lastLine.attrs.points[1], Math.ceil(pos.x / 20) * 20, Math.ceil(pos.y / 20) * 20]);
  //     // lastLine.setAttr('points', [lastLine.attrs.points[0],lastLine.attrs.points[1], Math.ceil(pos.x / 5) * 5, Math.ceil(pos.y / 5) * 5]);
  //
  //     console.log ( 'dest X', Math.ceil ( pos.x / 5 ) * 5, 'dest y', Math.ceil ( pos.y / 5 ) * 5 );
  //     console.log ( '[c] dddd', KonvaUtil.generateLinkPath ( lastLine.attrs._x, lastLine.attrs._y, Math.ceil ( pos.x / 5 ) * 5, Math.ceil ( pos.y / 5 ) * 5, 1 ) );
  //
  //     lastLine.setAttr ( 'data', KonvaUtil.generateLinkPath ( lastLine.attrs._x, lastLine.attrs._y, Math.ceil ( pos.x / 5 ) * 5, Math.ceil ( pos.y / 5 ) * 5, 1 ) );
  //
  //     line_layer.draw ();
  // };
  //
  // handleMouseUp = ( e ) => {
  //     if ( !e ) {
  //         return;
  //     }
  //     if ( this.drawningLine ) {
  //         this.drawningLine = false;
  //         const lastLine    = this.lines[ this.lines.length - 1 ];
  //         lastLine.destroy ();
  //
  //         var stage  = this.stage.getStage ();
  //         var output = stage.clickStartShape;
  //         var input  = stage.clickEndShape;
  //
  //         if ( !output || !input || !output.parent || !input.parent ) {
  //             return;
  //         }
  //
  //         var output_group = output.parent.parent;
  //         var input_group  = input.parent.parent;
  //         var container    = output.parent;
  //
  //         const onInput = input instanceof Konva.Rect && input.attrs.type === 'input';
  //
  //         if ( onInput && output_group !== input_group ) {
  //             alert ( 'attach path' );
  //         }
  //
  //         stage.clickStartShape = null;
  //         stage.clickEndShape   = null;
  //
  //         return;
  //     }
  // };

  //todo uncomment

  handleMouseUp = (e) => {

    console.log('[c]   mouse up canvas');
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
        //todo add elem to group

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
        //todo add elem to group

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

        //console.log ( '[c] line drawable uuuuu 2' );
        // console.log ( '[c] LAYER(cond)', Math.abs ( this.currentLineToDraw.prevX - e.layerX ) > 500 || Math.abs ( this.currentLineToDraw.prevY - e.layerY ) > 500 );

        // let arr = this.currentLineToDraw.line.points();
        // arr.push(e.layerX, e.layerY);
        // this.currentLineToDraw.line.points(arr);
        // this.currentLineToDraw.prevX = e.layerX;
        // this.currentLineToDraw.prevY = e.layerY;



        const pos = this.stage.getStage().getPointerPosition();

        //  let current_group = this.canvasService.getGroupById(this.currentLineToDraw.groupId, this.mainLayer);

        let current_group = this.mainLayer.getStage().findOne((elem) => {

          if (elem._id === this.currentLineToDraw.groupId) {
            return elem;
          }

        });


       let all_paths =  this.canvasService.getAllPathsFromGroup(current_group);

        let current_path = current_group.findOne((elem) => {
          console.log('elem', elem);
          if (elem.attrs.custom_id && elem.attrs.custom_id.includes('line')) {
            return elem;
          }

        });


        if (current_path) {
          this.currentLineToDraw.prevMainX = pos.x;
          this.currentLineToDraw.prevMainY = pos.y;
          current_path.setAttr('data', KonvaUtil.generateLinkPath(this.currentLineToDraw.prevX - current_group.getPosition().x, this.currentLineToDraw.prevY - current_group.getPosition().y, Math.ceil((pos.x - current_group.getPosition().x) / 5) * 5, Math.ceil((pos.y - current_group.getPosition().y) / 5) * 5, 1));

          current_path.zIndex(100);
          current_path.show();

        }

        // else {
        //     console.log ( '[c] path not exists' );
        //     this.currentLineToDraw.line.setAttr ( 'data', KonvaUtil.generateLinkPath ( this.currentLineToDraw.prevX, this.currentLineToDraw.prevY, Math.ceil ( (pos.x) / 5 ) * 5, Math.ceil ( (pos.y) / 5 ) * 5, 1 ) );
        //     this.currentLineToDraw.line.show ();
        //     // current_group.add ( this.currentLineToDraw.line );
        // }
        //
        // console.log ( '[c] current group', current_group );
        //  current_group.draw ();

        // this.currentLineToDraw.line.points ( [ ...this.current_line.points (), ...[ e.layerY, e.layerX ] ] );

        // this.currentLineToDraw.prevX = e.pageX;
        // this.currentLineToDraw.prevY = e.pageY;

        //  //todo draw line

      }

      // }
    }
    if (this.activeWrapperBlock.isDraw) {
      this.updateDragWrapper({x: e.layerX, y: e.layerY});

    }
  };

//todo uncomment

  handleMouseDown = (e) => {
    console.log('[c]   mouse down canvas');

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

  // @ViewChild("content", {read: TemplateRef}) contentRef: TemplateRef<any>;

  rerender() {

  }

  ngOnInit() {

    this.RegistryService.currentDraggableItem.subscribe((data) => {
      this.currentId = data;
      this.idChangedTrigger = true;
    });

    this.RegistryService.currentTabBlocks.subscribe(blocks => {
      this.data = blocks;
    });

    var line_layer = this.lineLayer.getStage();

    var line_q = new Konva.Line({
      x: 100,
      y: 50,
      points: [10, 10, 20, 20, 40, 40, 180, 210],
      stroke: 'red',
      tension: 1,
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

      var path = new Konva.Path({
        x: 240,
        y: 40,
        data: 'M12.582,9.551C3.251,16.237,0.921,29.021,7.08,38.564l-2.36,1.689l4.893,2.262l4.893,2.262l-0.568-5.36l-0.567-5.359l-2.365,1.694c-4.657-7.375-2.83-17.185,4.352-22.33c7.451-5.338,17.817-3.625,23.156,3.824c5.337,7.449,3.625,17.813-3.821,23.152l2.857,3.988c9.617-6.893,11.827-20.277,4.935-29.896C35.591,4.87,22.204,2.658,12.582,9.551z',

        scaleX: 2,
        scaleY: 2,
      });
      this.mainLayer.getStage().add(line_q);
      //  this.mainLayer.getStage ().add ( path);
    }, 0);

  }
}
