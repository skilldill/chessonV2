import type { Meta, StoryObj } from '@storybook/react';
import { PlasmaButton } from './PlasmaButton';

const meta: Meta<typeof PlasmaButton> = {
  title: 'Components/PlasmaButton',
  component: PlasmaButton,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
