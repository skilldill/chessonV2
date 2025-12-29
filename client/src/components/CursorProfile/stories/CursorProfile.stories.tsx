import type { Meta, StoryObj } from '@storybook/react';
import { CursorProfile } from '../CursorProfile';
import Cat1AvatarPNG from './cat1.png';
import CatCryAvatarPNG from './catCry.jpg';

const meta: Meta<typeof CursorProfile> = {
    title: 'Components/CursorProfile',
    component: (args) => (
        <div className="w-[300px] h-[200px] rounded-lg border border-gray-200/20 flex items-center justify-center">
            <CursorProfile {...args} />
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