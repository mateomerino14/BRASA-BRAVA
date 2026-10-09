import {MemoryRouter} from 'react-router';
import '../src/styles/index.css';

const preview = {
  decorators: [
    (Story, {parameters}) => (
      <MemoryRouter initialEntries={[parameters.route ?? '/']}>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'centered',
    backgrounds: {
      options: {
        lienzo: {name: 'Lienzo', value: '#f7f8fa'},
        crema: {name: 'Crema', value: '#faf3ea'},
        carbon: {name: 'Carbón', value: '#1c1a18'},
      },
    },
    a11y: {test: 'error'},
    controls: {matchers: {color: /(background|color)$/i}},
  },
  initialGlobals: {backgrounds: {value: 'lienzo'}},
};

export default preview;
