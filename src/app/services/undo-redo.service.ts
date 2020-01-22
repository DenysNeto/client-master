import {Injectable} from '@angular/core';
import {ActionType, IStackUndoRedo} from '../luwfy-canvas/undo-redo.interface';
import {Layer} from 'konva/types/Layer';
import {IGroupCustom, IPathCustom} from '../luwfy-canvas/shapes-interface';
import {Collection} from 'konva/types/Util';
import {Group} from 'konva/types/Group';
import {Shape, ShapeConfig} from 'konva/types/Shape';
import {theme} from '../luwfy-canvas/theme';
import {CanvasService} from './canvas.service';
import {StageComponent} from 'ng2-konva';

@Injectable({
  providedIn: 'root'
})
export class UndoRedoService {


  constructor() {}

  private _undoRedoArr: IStackUndoRedo[] = [];

  get undoRedoArr(): IStackUndoRedo[] {
    return this._undoRedoArr;
  }

  addAction(action: IStackUndoRedo) {
    this._undoRedoArr.push(action);
  }

  deleteLastAction() {
    this._undoRedoArr.pop();
  }

  deleteAction(action: ActionType, object_id: number) {
    console.log('[c] delete action');
    let index_temp = this.undoRedoArr.findIndex((elem) => {
      if (elem.action === action && (elem.object as IGroupCustom)._id === object_id) {
        return elem;
      }
    });

    if (index_temp !== undefined) {
      this.undoRedoArr.splice(index_temp, 1);
    }

  }

  // performUndo(mainLayer: Layer) {
  //
  //   if (this.undoRedoArr && this.undoRedoArr.length > 0) {
  //     let last_action_obj = this.undoRedoArr[this.undoRedoArr.length - 1];
  //     switch (last_action_obj.action) {
  //       case ActionType.Move : {
  //         (last_action_obj.object as IGroupCustom).x(last_action_obj.coordinates.x);
  //         (last_action_obj.object as IGroupCustom).y(last_action_obj.coordinates.y);
  //         (last_action_obj.object as IGroupCustom).fire('dragmove', () => {
  //         });
  //         this.deleteLastAction();
  //         break;
  //       }
  //       case ActionType.Delete : {
  //         if (!last_action_obj.parent) {
  //           let temp_parent: IGroupCustom;
  //           (last_action_obj.object as IPathCustom[]).forEach((elem) => {
  //             temp_parent = this.canvasService.getGroupById(elem.attrs.start_info.start_group_id, mainLayer.getStage());
  //             temp_parent.add(elem);
  //             this.canvasService.addElemToActivePathArr(elem);
  //
  //           });
  //
  //
  //         } else {
  //           (last_action_obj.object as Collection<Group | Shape<ShapeConfig>>).each((elem) => {
  //             last_action_obj.parent.add(elem);
  //           });
  //
  //
  //         }
  //
  //         this.deleteLastAction();
  //         break;
  //       }
  //       case ActionType.Create : {
  //         if ((last_action_obj.object as IPathCustom).className === 'Path') {
  //           (last_action_obj.object as IPathCustom).remove();
  //
  //
  //         } else {
  //
  //           (last_action_obj.object as IGroupCustom).remove();
  //
  //
  //         }
  //
  //
  //         this.deleteLastAction();
  //
  //         break;
  //       }
  //       case ActionType.Select : {
  //         if ((last_action_obj.object as IPathCustom).className === 'Path') {
  //           (last_action_obj.object as IPathCustom).setAttr('stroke', theme.line_color);
  //
  //           this.canvasService.removeLastElementFromPathArr();
  //         }
  //
  //         this.deleteLastAction();
  //
  //
  //       }
  //
  //
  //     }
  //
  //
  //   }
  //
  //
  // }


}
