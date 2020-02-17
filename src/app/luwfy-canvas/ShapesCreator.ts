import Konva from 'konva';
import { theme } from './theme';
import { FlowboardSizes, ShapesSizes, ShapesSizes as sizes } from './sizes';
import { BtnEventBlock, ButtonsTypes, CircleTypes, GroupTypes, IStartPointPathInfo, SettingIcons, IRectCustom } from './shapes-interface';


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
    let port = new Konva.Circle({
      x,
      y: y ? y : sizes.block_height / 2,
      radius: sizes.circle_radius,
      fill: inputPort ? color : theme.circle_background,
      stroke: color,
      type: inputPort ? CircleTypes.Input : CircleTypes.Output
    });
    port._id = ShapeCreator.randomIdNumber();
    return port;
  },


  createErrorOutput: (y, x?) => {
    let errorPort = new Konva.Text({
      x: x ? x : sizes.block_width - (sizes.error_icon_size / 2.5),
      y,
      text: '\uf05c',
      fontFamily: 'FontAwesome',
      fontSize: sizes.error_icon_size,
      fill: 'red'
    });
    errorPort._id = ShapeCreator.randomIdNumber();
    return errorPort;
  },

  createRect: (strokeColor: string, height?: number, payload?: any): IRectCustom => {
    return new Konva.Rect({
      width: sizes.block_width,
      height: height || sizes.block_height,
      fill: theme.rect_background,
      cornerRadius: 10,
      stroke: strokeColor,
      main_stroke: strokeColor
    });
  },

  createLine: (start_info?: IStartPointPathInfo, strokeColor?) => {
    return new Konva.Path({
      data: '',
      start_info,
      attached: true,
      strokeWidth: 3,
      lineJoin: 'round',
      opacity: 1,
      stroke: strokeColor || theme.line_color,
      isLastPathInGroup: true
    });
  },

  iconGroupCreator: (x, y) => {
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
      text: "\uf040",
      fill: 'orange'
    }),
      new Konva.Text({
        x: 20,
        padding: 2,
        fontFamily: 'FontAwesome',
        fontSize: 19,
        text: "\uf013",
        fill: '#4fd0d6'
      }),
      new Konva.Text({
        x: 40,
        padding: 2,
        fontFamily: 'FontAwesome',
        fontSize: 19,
        text: "\uf1de",
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
        switcher_circle: true
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

  createNameOfFlowboard: (name) => {
    return new Konva.Text({
      text: name,
      y: -20,
      color: 'black'
    });
  },

  createDrugPoint: (width) => {
    return new Konva.Text({
      x: width + FlowboardSizes.buttonPadding,
      y: 10,
      fontSize: 20,
      fontFamily: 'FontAwesome',
      text: '\uf047',
      fill: '#115770',
      type: ButtonsTypes.DrugPoint
    });
  },

  createDeleteButton: (width) => {
    return new Konva.Text({
      x: width + FlowboardSizes.buttonPadding + 2.5,
      y: 70,
      fontSize: 20,
      fontFamily: 'FontAwesome',
      text: '\uf014',
      fill: '#f54c4c',
      type: ButtonsTypes.DeleteButton
    });
  },

  createMenuButton: (width) => {
    return new Konva.Text({
      x: width + FlowboardSizes.buttonPadding,
      y: 40,
      fontSize: 25,
      fontFamily: 'FontAwesome',
      text: '\uf196',
      fill: '#115770',
      type: ButtonsTypes.MenuButton
    })
      .on('mousedown', event => event.target.attrs.fill = 'silver')
      .on('mouseup', event => event.target.attrs.fill = '#115770');
  },

  randomIdNumber: () => {
    let min = 111111111;
    let max = 999999999;
    return (Math.floor(Math.random() * max + 1) + min);
  },

  generateLinkPath: (origX, origY, destX, destY, sc) => {
    let dy = destY - origY;
    let dx = destX - origX;
    let delta = Math.sqrt(dy * dy + dx * dx);
    let scale = 0.75;
    let scaleY = 0;
    let node_width = 100;
    let node_height = 30;
    if (dx * sc > 0) {
      if (delta < node_width) {
        scale = 0.75 - 0.75 * ((node_width - delta) / node_width);
        // scale += 2*(Math.min(5*node_width,Math.abs(dx))/(5*node_width));
        // if (Math.abs(dy) < 3*node_height) {
        //     scaleY = ((dy>0)?0.5:-0.5)*(((3*node_height)-Math.abs(dy))/(3*node_height))*(Math.min(node_width,Math.abs(dx))/(node_width)) ;
        // }
      }
    } else {
      scale = 0.4 - 0.2 * (Math.max(0, (node_width - Math.min(Math.abs(dx), Math.abs(dy))) / node_width));
    }
    if (dx * sc > 0) {
      return "M " + origX + " " + origY +
        " C " + (origX + sc * (node_width * scale)) + " " + (origY + scaleY * node_height) + " " +
        (destX - sc * (scale) * node_width) + " " + (destY - scaleY * node_height) + " " +
        destX + " " + destY
    } else {
      let midX = Math.floor(destX - dx / 2);
      let midY = Math.floor(destY - dy / 2);
      if (dy === 0) {
        midY = destY + node_height;
      }
      let cp_height = node_height / 2;
      let y1 = (destY + midY) / 2
      let topX = origX + sc * node_width * scale;
      let topY = dy > 0 ? Math.min(y1 - dy / 2, origY + cp_height) : Math.max(y1 - dy / 2, origY - cp_height);
      let bottomX = destX - sc * node_width * scale;
      let bottomY = dy > 0 ? Math.max(y1, destY - cp_height) : Math.min(y1, destY + cp_height);
      let x1 = (origX + topX) / 2;
      let scy = dy > 0 ? 1 : -1;
      let cp = [
        // Orig -> Top
        [x1, origY],
        [topX, dy > 0 ? Math.max(origY, topY - cp_height) : Math.min(origY, topY + cp_height)],
        // Top -> Mid
        // [Mirror previous cp]
        [x1, dy > 0 ? Math.min(midY, topY + cp_height) : Math.max(midY, topY - cp_height)],
        // Mid -> Bottom
        // [Mirror previous cp]
        [bottomX, dy > 0 ? Math.max(midY, bottomY - cp_height) : Math.min(midY, bottomY + cp_height)],
        // Bottom -> Dest
        // [Mirror previous cp]
        [(destX + bottomX) / 2, destY]
      ];
      if (cp[2][1] === topY + scy * cp_height) {
        if (Math.abs(dy) < cp_height * 10) {
          cp[1][1] = topY - scy * cp_height / 2;
          cp[3][1] = bottomY - scy * cp_height / 2;
        }
        cp[2][0] = topX;
      }
      return "M " + origX + " " + origY + " C " + cp[0][0] + " " + cp[0][1] + " " + cp[1][0] + " " + cp[1][1] + " " + topX + " " + topY + " S " +
        cp[2][0] + " " + cp[2][1] + " " + midX + " " + midY + " S " + cp[3][0] + " " + cp[3][1] + " " + bottomX + " " + bottomY +
        " S " + cp[4][0] + " " + cp[4][1] + " " + destX + " " + destY;
    }
  }
};

export default ShapeCreator;
