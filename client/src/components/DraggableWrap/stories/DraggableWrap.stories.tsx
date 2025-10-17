import type { Meta, StoryObj } from '@storybook/react';
import { DraggableWrap } from '../DraggableWrap';

const meta: Meta<typeof DraggableWrap> = {
    title: 'Components/DraggableWrap',
    component: () => (
        <div className="w-[300px] h-[200px] rounded-lg border border-gray-200/20 flex items-center justify-center">
            <DraggableWrap styles={{ border: '1px solid #e0e0e0', borderRadius: 14, width: 200, height: 150 }} />
        </div>
    ),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};