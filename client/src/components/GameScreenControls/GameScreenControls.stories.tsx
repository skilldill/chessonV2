import type { Meta, StoryObj } from '@storybook/react';
import { GameScreenControls } from './GameScreenControls';

const meta: Meta<typeof GameScreenControls> = {
    title: 'Components/GameScreenControls',
    component: (args) => (
        <div className="w-[300px] h-[200px] rounded-lg border border-gray-200/20 pt-[50px]">
            <GameScreenControls {...args} />
        </div>
    ),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        onDrawOffer: () => { },
        onResignation: () => { },
        onQuitGame: () => { },
    },
};
