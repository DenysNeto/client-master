import { storiesOf } from '@storybook/angular';

import { Button } from '@storybook/angular/demo';
import { LufyTabsComponent } from './app/luwfy-tabs/luwfy-tabs.component';

import { boolean, number, text, withKnobs } from '@storybook/addon-knobs';

export default { title: 'My kkkkkkkkkkkkkkk' }

const stories = storiesOf('Storybook Knobs', module);
stories.addDecorator(withKnobs);

export const withText = () => ({
  component: Button,
  props: {
    text: 'Hello Button',
  },
});

export const withEmoji = () => ({
  component: Button,
  props: {
    text: '😀 😎 👍 💯',
  },
});

export const withNumbers = () => ({
  component: Button,
  props: {
    text: '123',
  },
});

export const withCanvas = () => ({
  component: LufyTabsComponent,
  props: {
    text: '123',
  },
});

stories.add('with a button', () => ({
  component: Button,
  props: {
   text: text('text', 'Hello Storybook'), // The first param of the knob function has to be exactly the same as the component input.
  },
}));
