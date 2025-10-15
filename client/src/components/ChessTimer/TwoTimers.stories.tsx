import type { Meta, StoryObj } from '@storybook/react';
import { ChessTimer } from './ChessTimer';

const meta: Meta<typeof ChessTimer> = {
    title: 'Components/TwoTimers',
    component: () => (
        <div className="w-[300px] h-[200px] rounded-lg border border-gray-200/20 flex items-center justify-center">
            <div className="flex flex-col items-center justify-center gap-[8px]">
                <ChessTimer initSeconds={300} seconds={100} />
                <ChessTimer initSeconds={300} seconds={220} timeLineBottom={true} />
            </div>
        </div>
    ),
    // component: ChessTimer,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};