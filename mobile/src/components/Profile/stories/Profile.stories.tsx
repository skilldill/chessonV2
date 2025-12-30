import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Profile } from '../Profile';
import Cat1AvatarPNG from './cat1.png';
import CatCryAvatarPNG from './catCry.jpg';

const meta: Meta<typeof Profile> = {
    title: 'Components/CursorProfile',
    component: (args) => (
        <div className="w-[300px] h-[200px] rounded-lg border border-gray-200/20 flex items-center justify-center">
            <Profile {...args} />
        </div>
    ),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        nickname: 'Tanya',
        color: '#155DFC',
        avatar: CatCryAvatarPNG
    },
};

export const Violet: Story = {
    args: {
        nickname: 'Sasha',
        color: '#8A2BE2',
        avatar: Cat1AvatarPNG
    },
};