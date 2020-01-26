import {Injectable} from '@angular/core';
import {CanvasService} from './canvas.service';
import {UndoRedoService} from './undo-redo.service';
import {Layer} from 'konva/types/Layer';
import {ActionType} from '../luwfy-canvas/undo-redo.interface';
import {IGroupCustom, IPathCustom} from '../luwfy-canvas/shapes-interface';
import {Collection} from 'konva/types/Util';
import {Group} from 'konva/types/Group';
import {Shape, ShapeConfig} from 'konva/types/Shape';
import {theme} from '../luwfy-canvas/theme';

@Injectable({
  providedIn: 'root'
})
export class UndoRedoCanvasService {

  constructor(private canvasService: CanvasService, private undoRedoService: UndoRedoService) {


  }


  performUndo(mainLayer: Layer, activeGroup: Group, activePathArr?: IPathCustom[]) {

    if (this.undoRedoService.undoRedoArr && this.undoRedoService.undoRedoArr.length > 0) {
      let last_action_obj = this.undoRedoService.undoRedoArr[this.undoRedoService.undoRedoArr.length - 1];
      switch (last_action_obj.action) {
        case ActionType.Move : {
          (last_action_obj.object as IGroupCustom).x(last_action_obj.coordinates.x);
          (last_action_obj.object as IGroupCustom).y(last_action_obj.coordinates.y);
          (last_action_obj.object as IGroupCustom).fire('dragmove', () => {
          });
          console.log('action move');
          this.undoRedoService.deleteLastAction();
          break;
        }
        case ActionType.Delete : {
          if (!last_action_obj.parent) {
            let temp_parent: any;
            (last_action_obj.object as IPathCustom[]).forEach((elem) => {
              temp_parent = this.canvasService.getGroupById(elem.attrs.start_info.start_group_id, mainLayer.getStage());
              temp_parent.add(elem);
              this.canvasService.addElemToActivePathArr(elem);

            });


          } else {
            (last_action_obj.object as Collection<Group | Shape<ShapeConfig>>).each((elem) => {
              last_action_obj.parent.add(elem);
            });


          }

          this.undoRedoService.deleteLastAction();
          break;
        }
        case ActionType.Create : {
          if ((last_action_obj.object as IPathCustom).className === 'Path') {
            (last_action_obj.object as IPathCustom).remove();


          } else {

            (last_action_obj.object as IGroupCustom).remove();


          }


          this.undoRedoService.deleteLastAction();

          break;
        }
        case ActionType.Select : {
          if ((last_action_obj.object as IPathCustom).className === 'Path') {
            (last_action_obj.object as IPathCustom).setAttr('stroke', theme.line_color);

            this.canvasService.removeLastElementFromPathArr();
          }
          this.undoRedoService.deleteLastAction();
          break;
        }

        case ActionType.Unselect : {

          if ((last_action_obj.parent as Group)._id === activeGroup._id) {
            if ((last_action_obj.object as undefined as IGroupCustom[]).length && (last_action_obj.object as undefined as IGroupCustom[]).length > 0) {
              console.log('unselect 3');
              (last_action_obj.object as undefined as IGroupCustom[]).forEach((elem) => {
                console.log('unselect 4');


                elem.setAttr('x', elem.position().x - activeGroup.position().x);
                elem.setAttr('y', elem.position().y - activeGroup.position().y);
                elem.moveTo(last_action_obj.parent);
                elem.setAttr('draggable', false);
                activeGroup.setAttr('visible', true);
                elem.children.each((elem) => {
                  elem.setAttr('stroke', theme.choose_group_color);
                });


              });
            } else if ((last_action_obj.object as IPathCustom[]).length && (last_action_obj.object as IPathCustom[]).length > 0 && last_action_obj.object[0].className) {


            }


          } else {

            (last_action_obj.object as IGroupCustom).moveTo(last_action_obj.parent);

          }

          this.undoRedoService.deleteLastAction();
          break;


        }


      }


    }


  }


}
