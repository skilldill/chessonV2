import { MemAvatarSelect } from '../MemAvatarSelect';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof MemAvatarSelect> = {
    title: 'Components/MemAvatarSelect',
    component: (args) => (
        <div className="w-full h-[600px] flex justify-center items-center">
            <MemAvatarSelect {...args} />
        </div>
    ),
};

export default meta;
type Story = StoryObj<typeof MemAvatarSelect>;

export const Default: Story = {
    args: {
        onSelectAvatar: console.log
    }
};
