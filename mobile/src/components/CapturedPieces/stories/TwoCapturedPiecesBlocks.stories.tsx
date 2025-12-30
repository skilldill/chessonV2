import type { Meta, StoryObj } from '@storybook/react';
import { CapturedPieces } from '../CapturedPieces';

const meta: Meta<any> = {
    title: 'Components/TwoCapturedPiecesBlocks',
    component: (args: { FEN: string }) => (
        <div className="w-[500px] h-[600px] rounded-lg border border-gray-200/20 flex flex-col gap-y-4 items-center justify-center">
            <div className="mb-[8px]">
                <CapturedPieces FEN={args.FEN} color="white" />
            </div>
            <div>
                <CapturedPieces FEN={args.FEN} color="black" listInBottom={true} />
            </div>
        </div>
    ),
    // component: ChessTimer,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        FEN: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    },
};

export const AfterFewMoves: Story = {
    args: {
        FEN: "rnbqkbn1/pppppp2/8/8/8/8/PPP1PPPP/RNB1KBN1 w KQkq - 1 1",
    },
};

export const LowMaterialPercent: Story = {
    args: {
        FEN: "8/8/8/8/8/8/1K6/P7 w - - 0 1",
    },
};