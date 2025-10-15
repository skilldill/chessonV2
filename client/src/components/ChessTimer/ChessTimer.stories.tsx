import type { Meta, StoryObj } from '@storybook/react';
import { ChessTimer } from './ChessTimer';

const meta: Meta<typeof ChessTimer> = {
    title: 'Components/ChessTimer',
    component: (args) => (
        <div className="w-[300px] h-[200px] rounded-lg border border-gray-200/20 flex items-center justify-center">
            <ChessTimer {...args} />
        </div>
    ),
    // component: ChessTimer,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        initSeconds: 300,
        seconds: 300,
    },
};

export const Danger: Story = {
    args: {
        initSeconds: 300,
        seconds: 40,
    },
};

export const TimeLineBottom: Story = {
    args: {
        initSeconds: 300,
        seconds: 300,
        timeLineBottom: true,
    },
};

export const DangerTimeLineBottom: Story = {
    args: {
        initSeconds: 300,
        seconds: 120,
        timeLineBottom: true,
    },
};
