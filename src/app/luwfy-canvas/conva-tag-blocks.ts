import Konva from 'konva';
import {theme} from './colors';

export const switchBlock = new Konva.Group({
  draggable: true
});

export const injectBlock = new Konva.Group({
  draggable: true
});

export const debugBlock = new Konva.Group({
  draggable: true
});


// Create switch blockSwitch with 1 input and 2 outputs
let tagSwitch = new Konva.Text({
  x: 620,
  y: 483,
  text: 'Switch',
  fontSize: 14,
  fontFamily: 'Roboto',
  fill: theme.text_color
});

let blockSwitch = new Konva.Rect({
  x: 600,
  y: 500,
  width: 80,
  height: 80,
  fill: theme.rect_background,
  cornerRadius: 10,
  stroke: theme.rect_switch_stroke
});

let circleInput = new Konva.Circle({
  radius: 10,
  x: 600,
  y: 540,
  width: 18,
  height: 18,
  fill: theme.rect_switch_stroke
});

let circleOutput1 = new Konva.Circle({
  radius: 10,
  x: 680,
  y: 520,
  width: 18,
  height: 18,
  stroke: theme.rect_switch_stroke,
  fill: theme.circle_background
});

let circleOutput2 = new Konva.Circle({
  radius: 10,
  x: 680,
  y: 560,
  width: 18,
  height: 18,
  stroke: theme.rect_switch_stroke,
  fill: theme.circle_background
});

switchBlock.add(blockSwitch);
switchBlock.add(tagSwitch);
switchBlock.add(circleInput);
switchBlock.add(circleOutput1);
switchBlock.add(circleOutput2);


// Create Inject blockSwitch with 1 input and switcher

let tagInject = new Konva.Text({
  x: 772,
  y: 483,
  text: 'Inject',
  fontSize: 14,
  fontFamily: 'Roboto',
  fill: theme.rect_inject_stroke
});

let blockInject = new Konva.Rect({
  x: 750,
  y: 500,
  width: 80,
  height: 80,
  fill: theme.rect_background,
  cornerRadius: 10,
  stroke: theme.rect_inject_stroke
});

let circleInputInject = new Konva.Circle({
  radius: 10,
  x: 750,
  y: 540,
  width: 18,
  height: 18,
  fill: theme.rect_inject_stroke
});

let switcherText = new Konva.Text({
  x: 785,
  y: 575,
  text: 'Push',
  fontSize: 11,
  fontFamily: 'Roboto',
  fill: theme.switcher_unactivated_text
});

let switcherInject = new Konva.Rect({
  x: 768,
  y: 570,
  width: 45,
  height: 18,
  fill: theme.switcher_unactivated_background,
  cornerRadius: 10,
  stroke: theme.rect_inject_stroke,
});

let circleSwitcher = new Konva.Circle({
  radius: 10,
  x: 776,
  y: 579,
  width: 14,
  height: 14,
  stroke: 'gray',
  strokeWidth: 1
});

injectBlock.add(tagInject);
injectBlock.add(blockInject);
injectBlock.add(switcherInject);
injectBlock.add(circleSwitcher);
injectBlock.add(switcherText);
injectBlock.add(circleInputInject);


// Create Debug blockSwitch with 1 output and switcher

let tagDebug = new Konva.Text({
  x: 922,
  y: 483,
  text: 'Debug',
  fontSize: 14,
  fontFamily: 'Roboto',
  fill: theme.rect_debug_stroke
});

let blockDebug = new Konva.Rect({
  x: 900,
  y: 500,
  width: 80,
  height: 80,
  fill: theme.rect_background,
  cornerRadius: 10,
  stroke: theme.rect_debug_stroke
});

let circleInputDebug = new Konva.Circle({
  radius: 10,
  x: 980,
  y: 540,
  width: 18,
  height: 18,
  fill: theme.rect_debug_stroke
});

let switcherTextDebug = new Konva.Text({
  x: 940,
  y: 575,
  text: 'On',
  fontSize: 11,
  fontFamily: 'Roboto',
  fill: theme.switcher_debug_on_text
});

let switcherDebug = new Konva.Rect({
  x: 923,
  y: 570,
  width: 35,
  height: 18,
  fill: theme.switcher_unactivated_background,
  cornerRadius: 10,
  stroke: theme.rect_debug_stroke
});

let circleSwitcherDebug = new Konva.Circle({
  radius: 10,
  x: 932,
  y: 579,
  width: 14,
  height: 14,
  stroke: 'gray',
  strokeWidth: 1
});

debugBlock.add(tagDebug);
debugBlock.add(blockDebug);
debugBlock.add(circleInputDebug);
debugBlock.add(switcherDebug);
debugBlock.add(switcherTextDebug);
debugBlock.add(circleSwitcherDebug);
