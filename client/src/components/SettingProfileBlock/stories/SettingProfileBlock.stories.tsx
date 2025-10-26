import { SettingProfileBlock } from '../SettingProfileBlock';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof SettingProfileBlock> = {
    title: 'Components/SettingProfileBlock',
    component: (args) => (
        <div className="w-full h-full flex justify-center align-center">
            <SettingProfileBlock {...args} />
        </div>
    ),
};

export default meta;
type Story = StoryObj<typeof SettingProfileBlock>;

export const Default: Story = {
    args: {}
};
