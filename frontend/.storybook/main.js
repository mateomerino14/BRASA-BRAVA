const config = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: {name: '@storybook/react-vite', options: {}},
  staticDirs: ['../public'],
};

export default config;
