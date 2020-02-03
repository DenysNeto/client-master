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
    let index_temp = this.undoRedoArr.findIndex((elem) => {
      if (elem.action === action && (elem.object as IGroupCustom)._id === object_id) {
        return elem;
      }
    });
    if (index_temp !== undefined) {
      this.undoRedoArr.splice(index_temp, 1);
    }
  }




}
