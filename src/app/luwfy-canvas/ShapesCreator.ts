import Konva from 'konva';
import {theme} from './theme';
import {ShapesSizes, ShapesSizes as sizes} from './sizes';
import {
  BtnEventBlock,
  CircleTypes,
  GroupTypes,
  ICircleCustom,
  IPathCustom,
  IRectCustom,
  IStartPointPathInfo,
  SettingIcons
} from './shapes-interface';


const ShapeCreator = {
  createShapeName: (shapeName: string, fillColor) => {
    return new Konva.Text({
      // formula for align text on center
      x: (ShapesSizes.block_width / 2) - (shapeName.length * 14 * 0.2645833333333),
      y: -18,
      padding: 2,
      text: shapeName,
      fontSize: 14,
      fontFamily: 'Roboto',
      fill: fillColor
    });
  },

  createPortCircle: (x, y, color, inputPort: boolean) => {
    return new Konva.Circle({
      x,
      y: y ? y : sizes.block_height / 2,
      radius: sizes.circle_radius,
      fill: inputPort ? color : theme.circle_background,
      stroke: color,
      type: inputPort ? CircleTypes.Input : CircleTypes.Output
    });
  },


  createErrorOutput: (y) => {
    return new Konva.Text({
      x: sizes.block_width - (sizes.error_icon_size / 2.5),
      y,
      text: '\uf05c',
      fontFamily: 'FontAwesome',
      fontSize: sizes.error_icon_size,
      fill: 'red'
    });
  },

  createCircleOutput: (y?: number, payload?: any) => {
    return new Konva.Circle({
      x: sizes.block_width,
      y,
      radius: sizes.circle_radius,
      fill: theme.circle_background_output,
      stroke: theme.rect_switch_stroke,
      type: CircleTypes.Output,
    });
  },

  createRect: (strokeColor: string, height?: number, payload?: any): IRectCustom => {
    return new Konva.Rect({
      width: sizes.block_width,
      height: height || sizes.block_height,
      fill: theme.rect_background,
      cornerRadius: 10,
      stroke: strokeColor,
      main_stroke:strokeColor
    });
  },

  createLine: (start_info: IStartPointPathInfo, strokeLine?) => {
    return new Konva.Path({
      data: '',
      start_info,
      attached: true,
      custom_id_output: 0,
      strokeWidth: 3,
      lineJoin: 'round',
      opacity: 1,
      stroke: strokeLine || theme.line_color,
      isLastPathInGroup: true
    });
  },

  iconGroupCreator: (x, y, iconsGroup: SettingIcons) => {
    return new Konva.Group({
      x,
      y,
      type: 'iconGroup',
      hovered: true
    }).add(new Konva.Text({
        x: 0,
        padding: 2,
        fontFamily: 'FontAwesome',
        fontSize: 19,
        text: iconsGroup.edit_icon,
        fill: 'orange'
      }),
      new Konva.Text({
        x: 20,
        padding: 2,
        fontFamily: 'FontAwesome',
        fontSize: 19,
        text: iconsGroup.wizard_icon,
        fill: '#4fd0d6'
      }),
      new Konva.Text({
        x: 40,
        padding: 2,
        fontFamily: 'FontAwesome',
        fontSize: 19,
        text: iconsGroup.settings_icon,
        fill: '#133f63'
      }));
  },

  switcherGroupCreator: (x = 0, y = 0, rectWidth, rectColor, btnValues: BtnEventBlock) => {
    return new Konva.Group({
      x,
      y,
      type: GroupTypes.Switcher,
      switched: true
    }).add(
      new Konva.Rect({
        x: 0,
        y: 0,
        width: rectWidth,
        height: 18,
        fill: btnValues.color_active,
        cornerRadius: 10,
        stroke: rectColor,
      }),
      new Konva.Text({
        x: ((rectWidth + 11) / 2) - (btnValues.label.length * 11 * 0.264),
        y: 5,
        text: btnValues.label,
        fontSize: 11,
        fontFamily: 'Roboto',
        fill: btnValues.color_disabled
      }),
      new Konva.Circle({
        radius: 10,
        x: 9,
        y: 9,
        width: 14,
        height: 14,
        stroke: 'gray',
        strokeWidth: 1,
        fill: 'red',
        //type: CircleTypes.Output
      }));
  },

  createFaceImage: (x, y, imgColor, icon) => {
    return new Konva.Text({
      x,
      y,
      fontSize: ShapesSizes.face_img_font_size,
      fontFamily: 'FontAwesome',
      text: icon,
      fill: imgColor,
      hovered: true,
      type: 'headImage'
    });
  },
  createFlowboard: (x, y, width, height) => {
    return new Konva.Group({
      x,
      y,
      width,
      height,
      type: GroupTypes.Flowboard,
      draggable: true
    });
  },
  createLineForGrid: (points) => {
    return new Konva.Line({
      points,
      stroke: '#eef6fa',
      strokeWidth: 1,
    });
  },
  createShadowForGrid: (width, height) => {
    return new Konva.Rect({
      width,
      height,
      cornerRadius: 10,
      stroke: 'silver',
      strokeWidth: 1,
      shadowColor: 'silver',
      shadowBlur: 4
    });
  },
  createNameOfFlowboard: (num) => {
    return new Konva.Text({
      text: `new flow${num}`,
      y: -20,
      color: 'black'
    });
  },
  createDrugPoint: () => {
    return new Konva.Text({
      x: 505,
      y: 10,
      fontSize: 20,
      fontFamily: 'FontAwesome',
      text: '\uf047',
      fill: '#115770',
      type: 'dragPoint'
    });
  },
  createMenuButton: () => {
    return new Konva.Text({
      x: 505,
      y: 40,
      fontSize: 25,
      fontFamily: 'FontAwesome',
      text: '\uf196',
      fill: '#115770',
      type: 'menuButton'
    })
      .on('mousedown', event => event.target.attrs.fill = 'silver')
      .on('mouseup', event => event.target.attrs.fill = '#115770');
  }
};

export default ShapeCreator;
