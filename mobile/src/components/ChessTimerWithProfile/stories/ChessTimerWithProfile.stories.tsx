import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ChessTimerWithProfile } from '../ChessTimerWithProfile';
import Cat1AvatarPNG from './cat1.png';


const meta: Meta<typeof ChessTimerWithProfile> = {
    title: 'Components/ChessTimerWithProfile',
    component: (args) => (
        <div className="w-[375px] h-[200px] rounded-lg border border-gray-200/20 flex items-center justify-center">
            <div className="w-full p-[16px]">
                <ChessTimerWithProfile {...args} />
            </div>
        </div>
    ),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        initSeconds: 300,
        seconds: 300,
        nickname: 'Tanya',
        color: 'white',
        avatar: Cat1AvatarPNG,
        active: true,
        isRightProfile: false,
    },
};

export const Reversed: Story = {
    args: {
        initSeconds: 300,
        seconds: 200,
        nickname: 'Tanya',
        color: 'black',
        avatar: Cat1AvatarPNG,
        active: true,
        isRightProfile: true,
    },
};

export const NotActive: Story = {
    args: {
        initSeconds: 300,
        seconds: 200,
        nickname: 'Tanya',
        color: 'black',
        avatar: Cat1AvatarPNG,
        active: false,
        isRightProfile: true,
    },
};
