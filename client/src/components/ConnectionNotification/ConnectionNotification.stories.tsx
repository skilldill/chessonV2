import type { Meta, StoryObj } from '@storybook/react';
import { ConnectionNotification } from './ConnectionNotification';
import { useState } from 'react';
import { PlasmaButton } from '../PlasmaButton/PlasmaButton';

const meta: Meta<typeof ConnectionNotification> = {
    title: 'Components/ConnectionNotification',
    component: () => {
        const [show, setShow] = useState(false);
        const [message, setMessage] = useState('Соединение прервано');

        const toggleNotification = () => {
            setShow((prev) => !prev);
        };

        return (
            <div className="w-full h-screen bg-back-primary relative">
                <div className="p-8 text-white z-10 relative">
                    <h3 className="text-lg mb-4">Игровой экран (задний план)</h3>
                    <p className="text-sm text-gray-400 mb-4">
                        Компонент ConnectionNotification появляется в правом верхнем углу когда show === true
                    </p>
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-4 items-center flex-wrap">
                            <PlasmaButton onClick={toggleNotification}>
                                {show ? 'Скрыть' : 'Показать'} уведомление
                            </PlasmaButton>
                            <span className="text-sm text-gray-400">
                                Статус: {show ? 'Видим' : 'Скрыт'}
                            </span>
                        </div>
                        <div className="flex gap-4 items-center flex-wrap">
                            <label className="text-sm text-gray-400">
                                Сообщение:
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="ml-2 px-2 py-1 bg-gray-800 text-white rounded border border-gray-600"
                                />
                            </label>
                        </div>
                    </div>
                </div>
                <ConnectionNotification
                    message={message}
                    show={show}
                />
            </div>
        );
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Hidden: Story = {
    args: {
        message: 'Соединение прервано',
        show: false,
    },
};

export const Visible: Story = {
    args: {
        message: 'Соединение прервано',
        show: true,
    },
};

export const CustomMessage: Story = {
    args: {
        message: 'Потеряно соединение с сервером',
        show: true,
    },
};

export const LongMessage: Story = {
    args: {
        message: 'Соединение с сервером было прервано. Пожалуйста, проверьте ваше интернет-соединение.',
        show: true,
    },
};

