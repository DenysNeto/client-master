import {Group} from 'konva/types/Group';
import {Path} from 'konva/types/shapes/Path';
import {Collection} from 'konva/types/Util';
import {Shape, ShapeConfig} from 'konva/types/Shape';
import {ICoordinates, IGroupCustom, IPathCustom} from './shapes-interface';
import {Layer} from 'konva/types/Layer';

export enum ActionType {
  Move = 'move',
  Delete = 'delete',
  Create = 'create',
  Select = 'select',
  Unselect = 'unselect'
}


export interface IStackUndoRedo {
  action: ActionType,
  object?: IPathCustom | IGroupCustom | Collection<Group | Shape<ShapeConfig>> | Shape<ShapeConfig> | IPathCustom [];
  parent?: Group | Layer,
  coordinates?: ICoordinates
}
