import {Group} from 'konva/types/Group';
import {Path} from 'konva/types/shapes/Path';
import {Circle} from 'konva/types/shapes/Circle';
import {Rect} from 'konva/types/shapes/Rect';
import Konva from 'konva';


export enum TypeGroup {
  Debug = 'debug',
  Inject = 'inject',
  Regular = 'regular'
}

export enum CircleTypes {
  Input = 'input',
  Output = 'output',
  Error = 'error'
}


export interface ICoordinates {
  x: number,
  y: number,
}

export interface ICurrentLineToDraw {
  isLineDrawable: boolean,
  lineId:number
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
  rectangle: Rect,

}

export interface IGroupCustom extends Group {
  //input group for current output group
  input_group?:
    {
      path_id: number,
      //input id
      group_id: number,
    }
  number_of_ports: string


}

export interface IStartPointPathInfo {
  start_group_id: number,
  start_circle_id: number,
}

export interface IEndPointPathInfo {
  end_group_id: number,
  end_circle_id: number,
}

export interface IPathCustom extends Path {
  custom_id_output?: number;
  start_info: IStartPointPathInfo,
  end_info?: IEndPointPathInfo,
  isLastPathInGroup?: 'true' | 'false',
}

export interface ICircleCustom extends Circle {
  type: CircleTypes,

}

export interface IRectCustom extends Rect {


}

