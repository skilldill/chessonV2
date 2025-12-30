import { FC } from "react";
import cn from 'classnames';

type CircleProgressProps = {
    progress: number; // 0-100
    size?: number;
    strokeWidth?: number;
    className?: string;
}

export const CircleProgress: FC<CircleProgressProps> = ({
    progress,
    size = 100,
    strokeWidth = 8,
    className,
}) => {
    // Clamp progress between 0 and 100
    const clampedProgress = Math.max(0, Math.min(100, progress));
    
    // Calculate radius and circumference
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    
    // Calculate stroke-dashoffset based on progress
    // Start from top (12 o'clock position) and fill counter-clockwise
    // When progress is 0, offset is full circumference (nothing visible)
    // When progress is 100, offset is 0 (full circle visible)
    const offset = circumference - (clampedProgress / 100) * circumference;
    
    // Center of the circle
    const center = size / 2;

    // Generate unique gradient ID to avoid conflicts if multiple instances
    const gradientId = `progressGradient-${size}-${strokeWidth}`;

    return (
        <div className={cn("relative", className)} style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                style={{ transform: 'rotate(90deg) scaleX(-1)' }}
            >
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#60a5fa" stopOpacity="1" />
                        <stop offset="50%" stopColor="#4f46e5" stopOpacity="1" />
                        <stop offset="100%" stopColor="#3b5bff" stopOpacity="1" />
                    </linearGradient>
                </defs>
                
                {/* Background circle (unfilled portion) */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke="#2a2a2a"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                />
                
                {/* Progress circle with gradient - fills counter-clockwise from top */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{
                        transition: 'stroke-dashoffset 0.3s ease',
                    }}
                />
            </svg>
        </div>
    );
};

