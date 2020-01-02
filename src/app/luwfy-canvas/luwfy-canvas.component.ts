import {Component, OnInit, ViewChild} from '@angular/core';
import {RegistryService} from '../services/registry.service';
import KonvaUtil from './konva-util';

import Konva from 'konva';
// import * as d3 from 'd3';
import {Observable, of} from 'rxjs';

@Component({
  selector: 'luwfy-canvas',
  templateUrl: './luwfy-canvas.component.html',
  styleUrls: ['./luwfy-canvas.component.scss']
})

export class CanvasComponent implements OnInit {
  constructor(private RegistryService: RegistryService) {

  }

  temp = 'hello';
  data = [];
  selected_items = [];
  lines = [];
  drawningLine = false;
  KonvaUtil = KonvaUtil;

  currentShape: any = new Konva.Rect({
    x: null,
    y: null,
    width: 100,
    height: 50,
    fill: 'red',
    stroke: 'black',
    draggable: true
  });


  createdGroup: any = new Konva.Group({
    draggable: true,
    x: 0,
    y: 0,
    stroke: 'yellow'

  });


  currentId: string;
  idChangedTrigger: boolean = false;


  currentLineToDraw = {
    isLineDrawable: false,
    groupId: 0,

  };


  // prevId:string;

  currentActiveGroup = new Konva.Group({
    draggable: true,
    visible: true
  }).on('dragstart', (event) => {
    console.log('dragStart');
    this.activeWrapperBlock.isDraw = false;
    this.activeWrapperBlock.rectangle.setAttr('visible', false);
  });

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
      draggable: false
    })


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
    return ({x1: r1x, y1: r1y, x2: r2x, y2: r2y}); // return the corrected rect.
  };


  updateDragWrapper(posIn: { x: number, y: number }) {
    this.activeWrapperBlock.now_position = {x: posIn.x, y: posIn.y};
    let posRect = this.reverseFunction(this.activeWrapperBlock.initial_position, this.activeWrapperBlock.now_position);
    this.activeWrapperBlock.rectangle.setAttr('x', posRect.x1);
    this.activeWrapperBlock.rectangle.setAttr('y', posRect.y1);

    this.activeWrapperBlock.rectangle.setAttr('width', posRect.x2 - posRect.x1);
    this.activeWrapperBlock.rectangle.setAttr('height', posRect.y2 - posRect.y1);
    this.activeWrapperBlock.rectangle.setAttr('visible', true);

  }


  prev_X: any;
  prev_Y: any;

  @ViewChild('stage', null) stage: any;
  @ViewChild('lineLayer', null) lineLayer: any;
  @ViewChild('mainLayer', null) mainLayer: any = new Konva.Layer({});


  box = new Konva.Rect({
    x: 10,
    y: 10,
    width: 100,
    height: 50,
    fill: 'red',
    stroke: 'black'
  });


  private path_background: Observable<any> = of({
    data: 'M 240 200 C 315 200 395 160 470 160',
    stroke: '#fff',
    opacity: 0,
    strokeWidth: 20,
  });

  // values: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];


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


  handleClickingOnShape = (event) => {
    console.log('[c] event', event);

  };

  handleDragStart = (event) => {
    console.log('[c] dragStart', event);

  };

  handleDragEnd = (e) => {
    console.log('[c] dragEnd', e);
  };


  deleteShapesFromGroup = () => {
    console.log('[c] delete selection', this.currentActiveGroup.children);
    if (this.currentActiveGroup.children.length > 0) {

      while (this.currentActiveGroup.children.length) {

        this.currentActiveGroup.children[this.currentActiveGroup.children.length - 1].children.each((elem) => {
          elem.setAttr('stroke', 'black');
          // elem.setAttr('draggable', true);
        });

        // this.currentActiveGroup.children[this.currentActiveGroup.children.length - 1].setAttr('stroke', 'black');
        this.currentActiveGroup.children[this.currentActiveGroup.children.length - 1].setAttr('draggable', true);


        this.currentActiveGroup.children[this.currentActiveGroup.children.length - 1].setAttr('x',
          this.currentActiveGroup.children[this.currentActiveGroup.children.length - 1].position().x + this.currentActiveGroup.position().x);


        this.currentActiveGroup.children[this.currentActiveGroup.children.length - 1].setAttr('y',
          this.currentActiveGroup.children[this.currentActiveGroup.children.length - 1].position().y + this.currentActiveGroup.position().y);

        this.mainLayer.getStage().add(this.currentActiveGroup.children[this.currentActiveGroup.children.length - 1]);
        console.log('[c]  this.mainLayer', this.mainLayer.getStage());

      }


      this.currentActiveGroup.removeChildren();
      this.mainLayer.getStage().draw();


    }


  };

  handleClickEvent = (event) => {
    this.deleteShapesFromGroup();
  };


  handleDragOver = (e) => {

    if (!this.currentShape || this.idChangedTrigger) {


      this.currentShape = new Konva.Rect({
        width: 100,
        // x: -10,
        // y: 0,
        height: 50,
        fill: this.currentId.includes('input') ? 'red' : 'blue',
        stroke: 'black',
        draggable: false
      });

      console.log('[c] position', e);


      let circle = new Konva.Circle({
        radius: 10,
        x: this.currentId.includes('input') ? 100 : 0,
        y: 25,
        fill: 'white',
        stroke: 'black',
        strokeWidth: 5
      }).on('click', (event) => {


        if (this.currentId.includes('input')) {
          event.cancelBubble = true;
          this.currentLineToDraw.isLineDrawable = !this.currentLineToDraw.isLineDrawable;
          this.currentLineToDraw.groupId = event.target.parent._id;

        }
      });


      this.createdGroup = new Konva.Group({
        draggable: true,
        // x: e.pageX,
        // y: e.pageY,
        // stroke: 'yellow'

      }).on('click', (event) => {
        event.cancelBubble = true;
        console.log('event group', event);


        console.log('[c] group position', event.target.position());
        console.log('[c] group width', event.target.attrs.width);
        console.log('[c] group height', event.target.attrs.height);

        if (event.evt.ctrlKey) {
          console.log('[c] EVENT_TARGET', event.target);


          event.target.parent.setAttr('x', event.target.parent.position().x - this.currentActiveGroup.position().x);
          event.target.parent.setAttr('y', event.target.parent.position().y - this.currentActiveGroup.position().y);

          //this.currentActiveGroup.add(event.target);
          this.currentActiveGroup.add(event.target.parent);
          event.target.parent.children.each((elem) => {
            elem.setAttr('stroke', 'yellow');
            elem.setAttr('draggable', false);

          });
          event.target.parent.setAttr('draggable', false);


          // event.target.setAttr('stroke', 'yellow');
          // event.target.setAttr('draggable', false);
        }


      }).on('dragstart', (event) => {
        this.activeWrapperBlock.isDraw = false;
        this.activeWrapperBlock.rectangle.setAttr('visible', false);
      }).on('mousedown', (event) => {
        // event.cancelBubble = true;
        this.activeWrapperBlock.isActive = false;
        this.activeWrapperBlock.isDraw = false;
        this.activeWrapperBlock.rectangle.setAttr('visible', false);
      });
      this.createdGroup.absolutePosition({
        x: e.pageX,
        y: e.pageY
      });

      this.createdGroup.add(this.currentShape);
      this.createdGroup.add(circle);

      console.log('[c] group position', this.createdGroup.position());

      //   .on('mouseenter', (event) => {
      //   if (this.activeWrapperBlock.isDraw) {
      //     event.target.setAttr('x', event.target.position().x - this.currentActiveGroup.position().x);
      //     event.target.setAttr('y', event.target.position().y - this.currentActiveGroup.position().y);
      //
      //     this.currentActiveGroup.add(event.target);
      //     event.target.setAttr('stroke', 'yellow');
      //     event.target.setAttr('draggable', false);
      //   }
      //
      //
      // }

      // );

      //
      // this.currentShape.setAttr('x', e.layerX);
      // this.currentShape.setAttr('y', e.layerY);


      this.prev_X = e.layerX;
      this.prev_Y = e.layerY;
      this.idChangedTrigger = false;
      // this.mainLayer.getStage().add(this.currentShape);
      this.mainLayer.getStage().add(this.createdGroup);
      console.log('CHILDREN COUNT', this.mainLayer.getStage().children);
      this.mainLayer.getStage().draw();


      // this.mainLayer.getStage().add(this.currentShape);

      // this.mainLayer.getStage().children[0].startDrag();
      // alert(this.mainLayer.getStage().children[0].emit)
      // this.mainLayer.getStage().children[0].stopDrag();
      // this.mainLayer.getStage().children[0].startDrag();


      // this.mainLayer.getStage().children[0].startDrag();

    } else
      // if (Math.abs(this.prev_X - e.layerX) > 1 || Math.abs(this.prev_Y - e.layerY) > 1)
    {

      //let temp_shape = this.mainLayer.getStage().children[0];

      // this.mainLayer.getStage().clear();

      // console.log()

      // this.mainLayer.getStage().children[this.mainLayer.getStage().children.length - 1].hide();
      // this.mainLayer.getStage().children[this.mainLayer.getStage().children.length - 1].draw();

      //this.createdGroup.setAttr('x', 0);


      this.mainLayer.getStage().children[this.mainLayer.getStage().children.length - 1].position({
        x: e.layerX,
        y: e.layerY,
      });


      this.createdGroup = null;

      //this.mainLayer.getStage().draw();

      // temp_shape.draw();
      // temp_shape.shouldDrawHit(false);


      // this.prev_X = e.layerX;
      // this.prev_Y = e.layerY;


      //setTimeout(()=> , 0);

      //temp_shape.draw();


    }


  };

  // handleMouseDown = (e) => {
  //   if (!e) {
  //     return;
  //   }
  //   var stage = this.stage.getStage();
  //
  //   if (!stage.clickStartShape) {
  //     return;
  //   }
  //
  //   var output = stage.clickStartShape;
  //   var group = output.parent.parent;
  //   var container = output.parent;
  //
  //   group.draggable(false);
  //
  //   const onOutput = output instanceof Konva.Rect && output.attrs.type === 'output';
  //
  //   if (onOutput) {
  //     console.log('should draw line');
  //     this.drawningLine = true;
  //
  //     var line_layer = this.lineLayer.getStage();
  //
  //     var Path = new Konva.Path({
  //       _x: container.x() + group.x(),
  //       _y: container.y() + group.y(),
  //       attached: false,
  //       data: '',
  //       stroke: '#999',
  //       opacity: 1,
  //       strokeWidth: 3,
  //     });
  //     this.lines.push(Path);
  //     line_layer.add(Path);
  //
  //     line_layer.draw();
  //
  //   }
  // };

  // handleMouseMove = (e) => {
  //   if (!this.drawningLine) {
  //     return;
  //   }
  //   var stage = this.stage.getStage();
  //   var line_layer = this.lineLayer.getStage();
  //
  //   const pos = stage.getPointerPosition();
  //   const lastLine = this.lines[this.lines.length - 1];
  //   // lastLine.setAttr('points', [lastLine.attrs.points[0],lastLine.attrs.points[1], Math.ceil(pos.x / 20) * 20, Math.ceil(pos.y / 20) * 20]);
  //   // lastLine.setAttr('points', [lastLine.attrs.points[0],lastLine.attrs.points[1], Math.ceil(pos.x / 5) * 5, Math.ceil(pos.y / 5) * 5]);
  //   lastLine.setAttr('data', KonvaUtil.generateLinkPath(lastLine.attrs._x, lastLine.attrs._y, Math.ceil(pos.x / 5) * 5, Math.ceil(pos.y / 5) * 5, 1));
  //   line_layer.draw();
  // };

  // handleMouseUp = (e) => {
  //   if (!e) {
  //     return;
  //   }
  //   if (this.drawningLine) {
  //     this.drawningLine = false;
  //     const lastLine = this.lines[this.lines.length - 1];
  //     lastLine.destroy();
  //
  //     var stage = this.stage.getStage();
  //     var output = stage.clickStartShape;
  //     var input = stage.clickEndShape;
  //
  //     if (!output || !input || !output.parent || !input.parent) {
  //       return;
  //     }
  //
  //     var output_group = output.parent.parent;
  //     var input_group = input.parent.parent;
  //     var container = output.parent;
  //
  //     const onInput = input instanceof Konva.Rect && input.attrs.type === 'input';
  //
  //     if (onInput && output_group !== input_group) {
  //       alert('attach path');
  //     }
  //
  //     stage.clickStartShape = null;
  //     stage.clickEndShape = null;
  //
  //     return;
  //   }
  // };

  //todo uncomment

  handleMouseUp = (e) => {
    let elem = this.mainLayer.getStage().children[this.mainLayer.getStage().children.length - 1];
    let i = this.mainLayer.getStage().children.length;


    console.log('[c] CHILDREN_BEFORE', this.mainLayer.getStage().children.length);
    let temp = this.mainLayer.getStage().children.length;
    for (let i = 0; i < temp; i++) {
      if (this.mainLayer.getStage().children[i] && this.mainLayer.getStage().children[i]._id > 100) {
        if (this.checkValueBetween(this.mainLayer.getStage().children[i].position(), this.mainLayer.getStage().children[i].attrs.width, this.mainLayer.getStage().children[i].attrs.height)) {


          this.mainLayer.getStage().children[i].setAttr('x', this.mainLayer.getStage().children[i].position().x - this.currentActiveGroup.position().x);
          this.mainLayer.getStage().children[i].setAttr('y', this.mainLayer.getStage().children[i].position().y - this.currentActiveGroup.position().y);

          console.log('[c] children[i]', this.mainLayer.getStage().children[i].nodeType === 'Group');


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

    // this.mainLayer.getStage().children.each((elem) => {
    //
    //   if (elem._id > 100) {
    //     if (this.checkValueBetween(elem.position(), elem.attrs.width, elem.attrs.height)) {
    //       //todo add to group
    //       elem.setAttr('x', elem.position().x - this.currentActiveGroup.position().x);
    //       elem.setAttr('y', elem.position().y - this.currentActiveGroup.position().y);
    //       // this.mainLayer.getStage().children[i].moveTo(this.currentActiveGroup);
    //       elem.moveTo(this.currentActiveGroup);
    //       // this.currentActiveGroup.add(elem);
    //       console.log('[c] GROUP CHILDREN', this.currentActiveGroup.children);
    //
    //       elem.setAttr('stroke', 'yellow');
    //       elem.setAttr('draggable', false);
    //
    //
    //     }
    //   }
    //
    //
    // });


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


      this.activeWrapperBlock.initial_position.y >= obj.y + height
      && this.activeWrapperBlock.now_position.y <= obj.y + height


    );
    let condition_down_and_right = (
        obj.x >= this.activeWrapperBlock.initial_position.x
        && obj.x <= this.activeWrapperBlock.now_position.x
        ||
        obj.x + width >= this.activeWrapperBlock.initial_position.x
        && obj.x + width <= this.activeWrapperBlock.now_position.x
      )

      &&

      (this.activeWrapperBlock.initial_position.y >= obj.y
        && this.activeWrapperBlock.now_position.y <= obj.y
        ||
        this.activeWrapperBlock.initial_position.y <= obj.y + height
        && this.activeWrapperBlock.now_position.y >= obj.y + height);


    let condition_down_and_left = (obj.x <= this.activeWrapperBlock.initial_position.x
        && obj.x >= this.activeWrapperBlock.now_position.x
        ||
        obj.x + width <= this.activeWrapperBlock.initial_position.x
        && obj.x + width >= this.activeWrapperBlock.now_position.x
      )

      &&

      (
        this.activeWrapperBlock.initial_position.y <= obj.y
        && this.activeWrapperBlock.now_position.y >= obj.y
      );


    // up and left
    if (this.activeWrapperBlock.initial_position.x >= this.activeWrapperBlock.now_position.x && this.activeWrapperBlock.initial_position.y >= this.activeWrapperBlock.now_position.y) {
      console.log('1 cccc');
      if (condition_up_and_left) {
        console.log('[c] condition up and left');
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
      console.log('4 cccc');
      console.log('[c] condition right and down',);


      if (condition_down_and_right) {

        console.log('[c] condition_down_and_right', obj.x >= this.activeWrapperBlock.initial_position.x
          && obj.x <= this.activeWrapperBlock.now_position.x);

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
      console.log('[c] line to move');

     // let arr = line.points();
     //  arr.push([e.layerX, e.layerY]);
     //  line.points(arr);
     //  console.log('[c] line points', line.points());
     //  //todo draw line
     //  this.mainLayer.getStage().add(line);
      this.mainLayer.getStage().draw();
    }


    if (this.activeWrapperBlock.isDraw) {
      this.updateDragWrapper({x: e.layerX, y: e.layerY});


    }

  };

//todo uncomment

  handleMouseDown = (e) => {
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
      tension: 1
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
      this.mainLayer.getStage().add(line_q);
    }, 0);


  }
}
