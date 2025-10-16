import type { Meta, StoryObj } from '@storybook/react';
import { CapturedPieces } from './CapturedPieces';

const meta: Meta<typeof CapturedPieces> = {
    title: 'Components/CapturedPieces',
    component: (args) => (
        <div className="w-[500px] h-[450px] rounded-lg border border-gray-200/20 flex items-center justify-center">
            <CapturedPieces {...args} />
        </div>
    ),
    // component: ChessTimer,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        FEN: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        color: "white",
    },
};

export const AfterFewMoves: Story = {
    args: {
        FEN: "rnbqkbn1/pppppp2/8/8/8/8/PPP1PPPP/RNB1KBN1 w KQkq - 1 1",
        color: "black",
        figure: {
            color: "black",
            type: "rook",
        },
    },
};

export const LowMaterialPercent: Story = {
    args: {
        FEN: "8/8/8/8/8/8/1K6/P7 w - - 0 1",
        color: "white",
        figure: {
            color: "white",
            type: "pawn",
        },
    },
};