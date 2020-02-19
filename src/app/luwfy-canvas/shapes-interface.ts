import { Group } from 'konva/types/Group';
import { Path } from 'konva/types/shapes/Path';
import { Circle } from 'konva/types/shapes/Circle';
import { Rect } from 'konva/types/shapes/Rect';
import { PaletteElement, Color, Image } from '../services/indexed-db.interface';


export enum CircleTypes {
  Input = 'input',
  Output = 'output',
  Error = 'error'
}

export enum GroupTypes {
  Flowboard = 'flowboard',
  Block = 'block',
  Switcher = 'switcher',
  CopiedGroup = 'copied_group',
  IconsGroup = 'iconsGroup',
  SelectedGroup = 'SelectedGroup'
}

export enum ButtonsTypes {
  DrugPoint = 'dragPoint',
  MenuButton = 'menuButton',
  DeleteButton = 'deleteButton'
}

export enum LineType {
  LineTypeWires = 'wires',
}

export interface ICoordinates {
  x: number,
  y: number,
}

export interface ICurrentLineToDraw {
  isLineDrawable: boolean,
  flowboardId: number
  lineId: number
  groupId: number,
  line: Path | IPathCustom,
  prevX: number,
  prevY: number,
  prevMainX: number,
  prevMainY: number,
  positionStart: ICoordinates,
  positionEnd: ICoordinates,
  swapOrientation?: () => void

}


export interface IActiveWrapperBlock {
  initial_position: { x: number, y: number },
  now_position: { x: number, y: number },
  isActive: boolean,
  isDraw: boolean,
  rectangle: Rect
}

export interface IGroupCustom extends Group {
  //input group for current output group
  input_group?:
  {
    path_id: number,
    //input id
    group_id: number,
  }
}


export interface IStartPointPathInfo {
  start_group_id: number,
  start_circle_id: number,
  start_flowboard_id: number
}

export interface IEndPointPathInfo {
  end_group_id: number,
  end_circle_id: number,
  end_flowboard_id: number
}

export interface IPathCustom extends Path {
  start_info: IStartPointPathInfo,
  end_info?: IEndPointPathInfo,
  isLastPathInGroup?: 'true' | 'false',
}

export interface ICircleCustom extends Circle {
  type: CircleTypes,

}

export interface IRectCustom extends Rect {


}




// interface for icons group in shape group
export interface SettingIcons {
  face_image: string;
  settings_icon: string,
  edit_icon: string,
  wizard_icon: string
}

// interface for buttons group in shape group
// if we have data about button we check
// is switcher(Debug shape) or button(Inject shape)
export interface BtnEventBlock {
  name: string,
  label: string,
  switch: number,
  color_active: string,
  color_disabled: string
}


export interface dataInTabLayer {
  label: string,
  layerData: any,
  startStageSize: {
    oldWidth: any,
    oldHeight: any
  }
}
