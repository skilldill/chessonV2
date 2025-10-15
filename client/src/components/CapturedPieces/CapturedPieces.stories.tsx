import type { Meta, StoryObj } from '@storybook/react';
import { CapturedPieces } from './CapturedPieces';

const meta: Meta<typeof CapturedPieces> = {
    title: 'Components/CapturedPieces',
    component: CapturedPieces,
    // component: ChessTimer,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        FEN: "8/8/8/8/8/8/1K6/P7 w - - 0 1",
        color: "white",
    },
};