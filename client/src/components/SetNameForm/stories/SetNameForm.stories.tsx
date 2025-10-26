import { SetNameForm } from '../SetNameForm';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof SetNameForm> = {
    title: 'Components/SetNameForm',
    component: (args) => (
        <div className="w-full h-full flex justify-center align-center">
            <SetNameForm {...args} />
        </div>
    ),
};

export default meta;
type Story = StoryObj<typeof SetNameForm>;

export const Default: Story = {
    args: {}
};
