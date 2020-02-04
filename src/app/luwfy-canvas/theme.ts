type Theme = {
  line_color: string
  circle_background: string;
  circle_background_input: string;
  circle_background_output: string;
  circle_background_default: string
  circle_border: string;
  choose_group_color: string
  rect_background: string;
  rect_border: string;
  rect_selection_border: string;
  group_border_color: string;
  text_color: string;
  switcher_unactivated_background: string;
  switcher_unactivated_text: string;
  switcher_debug_on_text: string;
  fontSize: number,
  fontFamily: string,
}

export const theme: Theme = {
  line_color: '#999',
  circle_background: 'white',
  circle_background_input: '#802A6E',
  circle_background_output: 'black',
  circle_background_default: 'white',
  circle_border: 'black',
  rect_background: 'transparent',
  rect_border: 'black',
  rect_selection_border: 'blue',
  choose_group_color: 'yellow',
  switcher_unactivated_background: 'white',
  switcher_unactivated_text: 'steelblue',
  switcher_debug_on_text: '#9e9e9e',
  group_border_color: 'yellow',
  text_color: 'white',
  fontSize: 11,
  fontFamily: 'Roboto'
};


