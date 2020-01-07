type Theme = {
  line_color: string
  circle_background: string;
  circle_background_input: string;
  circle_background_output: string;
  circle_border: string;
  rect_background: string;
  rect_border: string;
  rect_selection_border: string;
  group_border_color: string;
  rect_switch_stroke: string;
  rect_inject_stroke: string;
  rect_debug_stroke: string;
  text_color: string;
  switcher_unactivated_background: string;
  switcher_unactivated_text: string;
  switcher_debug_on_text: string;
}

export const theme: Theme = {
  line_color: '#999',
  // circle_background: 'white', // After change background on white
  circle_background: 'black',
  circle_background_input: 'blue',
  circle_background_output: 'red',
  circle_border: 'black',
  rect_background: 'transparent',
  rect_border: 'black',
  rect_selection_border: 'blue',
  // rect_stroke: '#802a6e', // After change background on white
  rect_switch_stroke: 'white',
  rect_inject_stroke: '#4fd0d6',
  rect_debug_stroke: '#1fce43',
  switcher_unactivated_background: 'white',
  switcher_unactivated_text: 'steelblue',
  switcher_debug_on_text: '#9e9e9e',
  group_border_color: 'yellow',
  text_color: 'white'
};


