import { MemAvatarSelect } from '../MemAvatarSelect';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof MemAvatarSelect> = {
    title: 'Components/MemAvatarSelect',
    component: (args) => (
        <div className="w-full h-full flex justify-center align-center">
            <MemAvatarSelect {...args} />
        </div>
    ),
};

export default meta;
type Story = StoryObj<typeof MemAvatarSelect>;

export const Default: Story = {
    args: {}
};
