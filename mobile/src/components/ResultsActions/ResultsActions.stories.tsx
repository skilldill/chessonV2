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
                    <h3 className="text-lg mb-4">Игровой экран (задний план)</h3>
                    <p className="text-sm text-gray-400 mb-4">
                        Компонент ResultsActions появляется поверх этого содержимого когда есть message
                    </p>
                    <div className="flex gap-4 items-center flex-wrap">
                        <PlasmaButton onClick={() => showResult('Вы выиграли!')}>
                            Показать победу
                        </PlasmaButton>
                        <PlasmaButton onClick={() => showResult('Вы проиграли!')}>
                            Показать поражение
                        </PlasmaButton>
                        <PlasmaButton onClick={() => showResult('Ничья!')}>
                            Показать ничью
                        </PlasmaButton>
                        <span className="text-sm text-gray-400">
                            Статус: {message ? 'Видим' : 'Скрыт'}
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
        message: 'Вы выиграли!',
        onClose: () => console.log('Close'),
    },
};

export const Defeat: Story = {
    args: {
        message: 'Вы проиграли!',
        onClose: () => console.log('Close'),
    },
};

export const Draw: Story = {
    args: {
        message: 'Ничья!',
        onClose: () => console.log('Close'),
    },
};
