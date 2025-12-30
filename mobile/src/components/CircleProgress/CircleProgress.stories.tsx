import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CircleProgress } from './CircleProgress';

const meta: Meta<typeof CircleProgress> = {
    title: 'Components/CircleProgress',
    component: CircleProgress,
    parameters: {
        layout: 'centered',
        backgrounds: {
            default: 'dark',
            values: [
                {
                    name: 'dark',
                    value: '#000000',
                },
            ],
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        progress: 75,
    },
};

export const Empty: Story = {
    args: {
        progress: 0,
    },
};

export const Full: Story = {
    args: {
        progress: 100,
    },
};

export const Quarter: Story = {
    args: {
        progress: 25,
    },
};

export const Half: Story = {
    args: {
        progress: 50,
    },
};

export const ThreeQuarters: Story = {
    args: {
        progress: 75,
    },
};

export const Small: Story = {
    args: {
        progress: 60,
        size: 60,
        strokeWidth: 6,
    },
};

export const Large: Story = {
    args: {
        progress: 80,
        size: 150,
        strokeWidth: 12,
    },
};

export const Thin: Story = {
    args: {
        progress: 65,
        size: 100,
        strokeWidth: 4,
    },
};

export const Thick: Story = {
    args: {
        progress: 45,
        size: 100,
        strokeWidth: 16,
    },
};

export const MultipleSizes: Story = {
    render: () => (
        <div className="flex flex-col items-center gap-8 p-8">
            <div className="flex items-center gap-8">
                <div className="flex flex-col items-center gap-2">
                    <CircleProgress progress={25} size={60} strokeWidth={6} />
                    <span className="text-white text-sm">25%</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <CircleProgress progress={50} size={80} strokeWidth={8} />
                    <span className="text-white text-sm">50%</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <CircleProgress progress={75} size={100} strokeWidth={10} />
                    <span className="text-white text-sm">75%</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <CircleProgress progress={100} size={120} strokeWidth={12} />
                    <span className="text-white text-sm">100%</span>
                </div>
            </div>
        </div>
    ),
};

