import Konva from 'konva';
import {theme} from './theme';
import {ShapesSizes as sizes} from './sizes';
import {IPathCustom, IRectCustom} from './shapes-interface';


const ShapeCreator = {

  createCircleInput: (y?: number) => {


    return new Konva.Circle({
      x: 0,
      y: y ? y : sizes.block_height / 2,
      radius: sizes.circle_radius,
      fill: theme.circle_background_input,
    });

  },

  createCircleOutput: (y?: number) => {
    return new Konva.Circle({
      x: sizes.block_width,
      y,
      radius: sizes.circle_radius,
      fill: theme.circle_background_output,
      stroke:theme.rect_switch_stroke
    });
  },

  createCircleError: () => {
    return new Konva.Rect({
      width: sizes.block_width,
      height: sizes.block_height,
      fill: theme.switcher_unactivated_background,
      cornerRadius: 10,
      stroke: 'red',
    });

  },

  createRect: (strokeColor: string, height?: number): IRectCustom => {
    return new Konva.Rect({
      width: sizes.block_width,
      height: height || sizes.block_height,
      fill: theme.switcher_unactivated_background,
      cornerRadius: 10,
      stroke: strokeColor,
    });

  },

  createLine: (): IPathCustom => {

    return new Konva.Path({
        data: '',
        attached: true,
        custom_id_output: 0,
        strokeWidth: 3,
        lineJoin: 'round',
        opacity: 1,
        stroke: theme.line_color,
        isLastPathInGroup: 'true'
      }
    );
  }

};

export default ShapeCreator;
