import type { Meta, StoryObj } from '@storybook/react';
import { HistoryMoves } from '../HistoryMoves';
import { useState } from 'react';
import type { MoveData } from '../../../types';

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

const meta: Meta<typeof HistoryMoves> = {
    title: 'Components/HistoryMoves',
    component: () => {
        const [moves, setMoves] = useState<MoveData[]>([]);
        const [count, setCount] = useState(0);

        const addMove = () => {
            if (count >= TRANSFORM_TO_QUEEN.length) return;
            setMoves((prevMoves) => [...prevMoves, TRANSFORM_TO_QUEEN[count] as any]);
            setCount((prev) => prev + 1);
        }

        return (
            <div className="w-[500px] h-[450px] rounded-lg border border-gray-200/20 flex flex-col items-center justify-center gap-8">
                <button 
                    onClick={addMove}
                    className="px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors cursor-pointer"
                >
                    Move!
                </button>

                <HistoryMoves moves={moves} />
            </div>
        )
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        moves: TRANSFORM_TO_QUEEN as any[],
    },
};