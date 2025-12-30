import { ShareLinkBlock } from '../ShareLinkBlock';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof ShareLinkBlock> = {
    title: 'Components/ShareLinkBlock',
    component: (args) => (
        <div className="w-full h-full flex justify-center align-center pt-[100px]">
            <ShareLinkBlock {...args} />
        </div>
    ),
};

export default meta;
type Story = StoryObj<typeof ShareLinkBlock>;

export const Default: Story = {
    args: {
    }
};
