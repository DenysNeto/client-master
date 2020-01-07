import {Group} from 'konva/types/Group';
import {Path} from 'konva/types/shapes/Path';
import {Circle} from 'konva/types/shapes/Circle';
import {Rect} from 'konva/types/shapes/Rect';


export interface IGroupCustom extends Group {
  //input group for current output group
  input_group?:
    {
      path_id: number,
      //input id
      group_id: number,
    }


}

export interface IPathCustom extends Path {
  custom_id_output: number;
  isLastPathInGroup?: 'true' | 'false'


}

export interface ICircleCustom extends Circle {


}

export interface IRectCustom extends Rect {


}

