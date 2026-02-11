import type { Meta, StoryObj } from '@storybook/react';
import { ResultsActions } from './ResultsActions';
import { useState } from 'react';
import { PlasmaButton } from '../PlasmaButton/PlasmaButton';

const meta: Meta<typeof ResultsActions> = {
    title: 'Components/ResultsActions',
    component: () => {
        const [message, setMessage] = useState<string | undefined>(undefined);

        const handleClose = () => {
            console.log('Close and return to main screen');
            setMessage(undefined);
        };

        const showResult = (msg: string) => {
            setMessage(msg);
        };

        return (
            <div className="w-full h-screen bg-back-primary relative">
                <div className="p-8 text-white z-10 relative">
                    <h3 className="text-lg mb-4">Game screen (background)</h3>
                    <p className="text-sm text-gray-400 mb-4">
                        The ResultsActions component appears over this content when message exists
                    </p>
                    <div className="flex gap-4 items-center flex-wrap">
                        <PlasmaButton onClick={() => showResult('You won!')}>
                            Show victory
                        </PlasmaButton>
                        <PlasmaButton onClick={() => showResult('You lost!')}>
                            Show defeat
                        </PlasmaButton>
                        <PlasmaButton onClick={() => showResult('Draw!')}>
                            Show draw
                        </PlasmaButton>
                        <span className="text-sm text-gray-400">
                            Status: {message ? 'Visible' : 'Hidden'}
                        </span>
                    </div>
                </div>
                <ResultsActions
                    message={message}
                    onClose={handleClose}
                />
            </div>
        );
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Hidden: Story = {
    args: {
        message: undefined,
        onClose: () => console.log('Close'),
    },
};

export const Victory: Story = {
    args: {
        message: 'You won!',
        onClose: () => console.log('Close'),
    },
};

export const Defeat: Story = {
    args: {
        message: 'You lost!',
        onClose: () => console.log('Close'),
    },
};

export const Draw: Story = {
    args: {
        message: 'Draw!',
        onClose: () => console.log('Close'),
    },
};
