import type { Meta, StoryObj } from '@storybook/react';
import { DrawOfferActions } from './DrawOfferActions';
import { useState } from 'react';
import { PlasmaButton } from '../PlasmaButton/PlasmaButton';

const meta: Meta<typeof DrawOfferActions> = {
    title: 'Components/DrawOfferActions',
    component: () => {
        const [offeredDraw, setOfferedDraw] = useState(false);

        const handleAcceptDraw = () => {
            console.log('Accept draw');
            setOfferedDraw(false);
        };

        const handleDeclineDraw = () => {
            console.log('Decline draw');
            setOfferedDraw(false);
        };

        const toggleDrawOffer = () => {
            setOfferedDraw((prev) => !prev);
        };

        return (
            <div className="w-full h-screen bg-back-primary relative">
                <div className="p-8 text-white z-10 relative">
                    <h3 className="text-lg mb-4">Игровой экран (задний план)</h3>
                    <p className="text-sm text-gray-400 mb-4">
                        Компонент DrawOfferActions появляется поверх этого содержимого когда offeredDraw === true
                    </p>
                    <div className="flex gap-4 items-center">
                        <PlasmaButton onClick={toggleDrawOffer}>
                            {offeredDraw ? 'Скрыть' : 'Показать'} предложение ничьей
                        </PlasmaButton>
                        <span className="text-sm text-gray-400">
                            Статус: {offeredDraw ? 'Видим' : 'Скрыт'}
                        </span>
                    </div>
                </div>
                <DrawOfferActions
                    offeredDraw={offeredDraw}
                    onAcceptDraw={handleAcceptDraw}
                    onDeclineDraw={handleDeclineDraw}
                />
            </div>
        );
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Hidden: Story = {
    args: {
        offeredDraw: false,
        onAcceptDraw: () => console.log('Accept draw'),
        onDeclineDraw: () => console.log('Decline draw'),
    },
};

export const Visible: Story = {
    args: {
        offeredDraw: true,
        onAcceptDraw: () => console.log('Accept draw'),
        onDeclineDraw: () => console.log('Decline draw'),
    },
};

