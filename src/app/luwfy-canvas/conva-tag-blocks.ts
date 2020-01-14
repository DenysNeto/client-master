// import Konva from 'konva';
// import {theme} from './theme';
//
// // export const switchGroup1 = new Konva.Group({
// //   draggable: true
// // });
// //
// // export const injectGroup1 = new Konva.Group({
// //   draggable: true
// // });
// //
// // export const debugGroup1 = new Konva.Group({
// //   draggable: true
// // });
//
// // const iconGroupCreator = (x = 0, y = 0) => {
// //   return new Konva.Group({
// //     x,
// //     y,
// //     type:'iconGroup',
// //     hovered: true
// //   }).add(new Konva.Text({
// //       x: 0,
// //       padding: 2,
// //       fontFamily: 'FontAwesome',
// //       fontSize: 19,
// //       text: '\uf040',
// //       fill: 'orange'
// //     }),
// //     new Konva.Text({
// //       x: 20,
// //       padding: 2,
// //       fontFamily: 'FontAwesome',
// //       fontSize: 19,
// //       text: '\uf1de',
// //       fill: '#4fd0d6'
// //     }),
// //     new Konva.Text({
// //       x: 40,
// //       padding: 2,
// //       fontFamily: 'FontAwesome',
// //       fontSize: 19,
// //       text: '\uf013',
// //       fill: '#133f63'
// //     }))
// // };
//
// // const switcherGroupCreator = (x = 0, y = 0, rectWidth, rectColor, switcherText, swTextColor,
// //                               rectBackColor = theme.switcher_unactivated_background) => {
// //   return new Konva.Group({
// //     x,
// //     y
// //   }).add(
// //     new Konva.Rect({
// //       x: 0,
// //       y: 0,
// //       width: rectWidth,
// //       height: 18,
// //       fill: rectBackColor,
// //       cornerRadius: 10,
// //       stroke: rectColor,
// //     }),
// //     new Konva.Text({
// //       x: 17,
// //       y: 5,
// //       text: switcherText,
// //       fontSize: 11,
// //       fontFamily: 'Roboto',
// //       fill: swTextColor
// //     }),
// //     new Konva.Circle({
// //       radius: 10,
// //       x: 9,
// //       y: 9,
// //       width: 14,
// //       height: 14,
// //       stroke: 'gray',
// //       strokeWidth: 1,
// //       fill: 'white'
// //     }));
// // };
//
//
// // // Create switch rectangleSwitch with 1 input and 2 outputs
// // let tagSwitch = new Konva.Text({
// //   x: 620,
// //   y: 485,
// //   text: 'Switch',
// //   fontSize: 14,
// //   fontFamily: 'Roboto',
// //   fill: theme.text_color
// // });
// //
// // let rectangleSwitch = new Konva.Rect({
// //   x: 600,
// //   y: 500,
// //   width: 80,
// //   height: 80,
// //   fill: theme.rect_background,
// //   cornerRadius: 10,
// //   stroke: theme.rect_switch_stroke
// // });
// //
// // let circleInput = new Konva.Circle({
// //   radius: 10,
// //   x: 600,
// //   y: 540,
// //   width: 18,
// //   height: 18,
// //   fill: theme.rect_switch_stroke
// // });
// //
// // let circleOutput1 = new Konva.Circle({
// //   radius: 10,
// //   x: 680,
// //   y: 520,
// //   width: 18,
// //   height: 18,
// //   stroke: theme.rect_switch_stroke,
// //   fill: theme.circle_background
// // });
// //
// // let circleOutput2 = new Konva.Circle({
// //   radius: 10,
// //   x: 680,
// //   y: 560,
// //   width: 18,
// //   height: 18,
// //   stroke: theme.rect_switch_stroke,
// //   fill: theme.circle_background
// // });
// //
// // // Creating elements for switch group
// // let switchImage = new Konva.Text({
// //   x: 623,
// //   y: 513,
// //   fontSize: 50,
// //   fontFamily: 'FontAwesome',
// //   text: '\uf061',
// //   fill: 'white',
// //   hovered: true
// // });
// //
// // let switchIconsGroup = iconGroupCreator(613, 528);
// //
// // switchGroup1.add(switchImage, rectangleSwitch, switchIconsGroup.hide(), tagSwitch, circleInput, circleOutput1, circleOutput2);
//
// // // mouseInsideRectangle is flag set true when mouse inside rectangle
// // // and will changes when mouse leave rectangle
// // let mouseInsideRectangle: boolean;
// //
// // // Function hide standard image and show to us icons (edit, tune, settings)
// // const onChangeHiddenElement = () => {
// //   if (!mouseInsideRectangle) {
// //     switchImage.hide();
// //     switchIconsGroup.show();
// //   } else {
// //     switchImage.show();
// //     switchIconsGroup.hide();
// //   }
// // };
// //
// // rectangleSwitch.on('mouseenter', (event) => {
// //   onChangeHiddenElement();
// //   mouseInsideRectangle = true;
// // });
// //
// // switchGroup1.on('mouseleave', (event) => {
// //   onChangeHiddenElement();
// //   mouseInsideRectangle = false;
// // });
//
// // Create Inject rectangleSwitch with 1 input and switcher
// let tagInject = new Konva.Text({
//   x: 772,
//   y: 483,
//   text: 'Inject',
//   fontSize: 14,
//   fontFamily: 'Roboto',
//   fill: theme.rect_inject_stroke
// });
//
// let blockInject = new Konva.Rect({
//   x: 750,
//   y: 500,
//   width: 80,
//   height: 80,
//   fill: theme.rect_background,
//   cornerRadius: 10,
//   stroke: theme.rect_inject_stroke
// });
//
// let circleInputInject = new Konva.Circle({
//   radius: 10,
//   x: 750,
//   y: 540,
//   width: 18,
//   height: 18,
//   fill: theme.rect_inject_stroke
// });
//
// let injectSwitcher = switcherGroupCreator(768, 570, 45, theme.rect_inject_stroke, 'Push', theme.switcher_unactivated_text);
// injectSwitcher.on('click', (event) => {
//   let parent = event.target.parent;
//   let elemRect = parent.findOne('Rect');
//   let elemText = parent.findOne('Text');
//   elemRect.attrs.fill = 'steelblue';
//   elemText.attrs.fill = 'white';
//   console.warn('It was click on push');
//   setTimeout(() => {
//     elemRect.attrs.fill = 'white';
//     elemText.attrs.fill = 'steelblue';
//     parent.attrs.switch = !parent.attrs.switch;
//   }, 50);
//
// });
//
// let injectIconsGroup = iconGroupCreator(763, 528);
//
// injectGroup1.add(tagInject, blockInject, injectSwitcher, injectIconsGroup, circleInputInject);
//
// // Create Debug rectangleSwitch with 1 output and switcher
// let tagDebug = new Konva.Text({
//   x: 922,
//   y: 483,
//   text: 'Debug',
//   fontSize: 14,
//   fontFamily: 'Roboto',
//   fill: theme.rect_debug_stroke
// });
//
// let blockDebug = new Konva.Rect({
//   x: 900,
//   y: 500,
//   width: 80,
//   height: 80,
//   fill: theme.rect_background,
//   cornerRadius: 10,
//   stroke: theme.rect_debug_stroke
// });
//
// let circleInputDebug = new Konva.Circle({
//   radius: 10,
//   x: 980,
//   y: 540,
//   width: 18,
//   height: 18,
//   fill: theme.rect_debug_stroke
// });
//
// // let debugSwitcher = switcherGroupCreator(920, 570, 40, theme.rect_debug_stroke, 'ON', 'white', 'steelblue');
// debugSwitcher.setAttr('switch', true).on('click', (event) => {
//
//   let parent = event.target.parent;
//   let elemSwitchRect = parent.findOne('Rect');
//   let elemSwitchText = parent.findOne('Text');
//   let elemSwitchCircle = parent.findOne('Circle');
//   let highParent = event.target.parent.parent;
//   let highSwitchRect = highParent.findOne('Rect');
//   let highSwitchCircle = highParent.findOne('Circle');
//
//   if (parent.attrs.switch) {
//     elemSwitchRect.attrs.fill = elemSwitchRect.attrs.stroke = highSwitchCircle.attrs.fill = highSwitchRect.attrs.stroke = '#8dc0c2';
//     elemSwitchText.attrs.fill = 'white';
//     elemSwitchText.offsetX(15);
//     // @ts-ignore
//     elemSwitchText.text('OFF');
//     elemSwitchCircle.offsetX(-24);
//     elemSwitchCircle.attrs.fill = theme.rect_debug_stroke;
//     elemSwitchCircle.attrs.stroke = theme.rect_debug_stroke;
//     console.log(false);
//     parent.attrs.switch = !parent.attrs.switch;
//   } else {
//     elemSwitchRect.attrs.fill = 'steelblue';
//     elemSwitchRect.attrs.stroke = highSwitchRect.attrs.stroke = highSwitchCircle.attrs.fill = theme.rect_debug_stroke;
//     elemSwitchText.attrs.fill = 'white';
//     elemSwitchText.offsetX(0);
//     // @ts-ignore
//     elemSwitchText.text('ON');
//     elemSwitchCircle.offsetX(0);
//     elemSwitchCircle.attrs.fill = 'white';
//     elemSwitchCircle.attrs.stroke = 'gray';
//     console.log(true);
//     parent.attrs.switch = !parent.attrs.switch;
//   }
// });
//
// // let debugIconsGroup = iconGroupCreator(908, 528);
// //
// // debugGroup1.add(tagDebug, blockDebug, debugIconsGroup, circleInputDebug, debugSwitcher);
