import type { Meta, StoryObj } from '@storybook/react';
import { HistoryMoves } from '../HistoryMoves';
import type { MoveData } from 'react-chessboard-ui';

const meta: Meta<typeof HistoryMoves> = {
    title: 'Components/HistoryMoves',
    component: (args) => (
        <div className="w-[500px] h-[450px] rounded-lg border border-gray-200/20 flex items-center justify-center">
            <HistoryMoves {...args} />
        </div>
    ),
};

export default meta;
type Story = StoryObj<typeof meta>;

const TRANSFORM_TO_QUEEN = [
    {
        figure: { type: "king", color: "white", touched: true },
        from: [7, 7],
        to: [7, 6],
        FEN: "k7/p7/8/8/8/8/7K/8 b - - 0 1",
    },
    {
        figure: { type: "pawn", color: "black", touched: true },
        from: [0, 1],
        to: [0, 3],
        FEN: "k7/8/8/p7/8/8/7K/8 w - a6 0 1",
    },
    {
        figure: { type: "king", color: "white", touched: true },
        from: [7, 6],
        to: [7, 5],
        FEN: "k7/8/8/p7/8/7K/8/8 b - - 0 1",
    },
    {
        figure: { type: "pawn", color: "black", touched: true },
        from: [0, 3],
        to: [0, 4],
        FEN: "k7/8/8/8/p7/7K/8/8 w - - 0 1",
    },
    {
        figure: { type: "king", color: "white", touched: true },
        from: [7, 5],
        to: [6, 4],
        FEN: "k7/8/8/8/p5K1/8/8/8 b - - 0 1",
    },
    {
        figure: { type: "pawn", color: "black", touched: true },
        from: [0, 4],
        to: [0, 5],
        FEN: "k7/8/8/8/6K1/p7/8/8 w - - 0 1",
    },
    {
        figure: { type: "king", color: "white", touched: true },
        from: [6, 4],
        to: [5, 4],
        FEN: "k7/8/8/8/5K2/p7/8/8 b - - 0 1",
    },
    {
        figure: { type: "pawn", color: "black", touched: true },
        from: [0, 5],
        to: [0, 6],
        FEN: "k7/8/8/8/5K2/8/p7/8 w - - 0 1",
    },
    {
        figure: { type: "king", color: "white", touched: true },
        from: [5, 4],
        to: [4, 5],
        FEN: "k7/8/8/8/8/4K3/p7/8 b - - 0 1",
    },
    {
        figure: { type: "queen", color: "black", touched: true },
        from: [0, 6],
        to: [0, 7],
        type: "transform", // <~~~ Required for transform
    },
];


export const Default: Story = {
    args: {
        moves: TRANSFORM_TO_QUEEN as MoveData[],
    },
};