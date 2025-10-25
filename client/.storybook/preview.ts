import type { Preview } from '@storybook/react-vite'
import '../src/index.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    },

    backgrounds: {
      default: 'dark',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#000000' },
      ],
    },
  },

  decorators: [
    (Story, context) => {
      const background = context.globals.backgrounds?.value || '#000000';
      const isDark = background === '#000000';
      
      document.body.className = isDark ? 'dark' : '';
      document.body.style.backgroundColor = background;
      
      return Story();
    },
  ],
};

export default preview;