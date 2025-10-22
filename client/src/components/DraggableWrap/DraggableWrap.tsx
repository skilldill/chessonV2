import React, { useEffect, useRef, useState, type CSSProperties, type PropsWithChildren } from 'react';

type Position = {
    x: number;
    y: number;
}

type DraggableWrapProps = {
    styles?: CSSProperties;
}

export const DraggableWrap: React.FC<PropsWithChildren<DraggableWrapProps>> = ({ children, styles }) => {
    const [isGrabbing, setIsGrabbing] = useState(false);
    const [cursporPosition, setCursporPosition] = useState<Position>({ x: 0, y: 0 });
    const [translatedPosition, setTranslatedPosition] = useState<Position>({ x: 0, y: 0 });
    const [dragStartPosition, setDragStartPosition] = useState<Position>({ x: 0, y: 0 });
    const refWrap = useRef<HTMLDivElement>(null);

    const externalStyles = styles || {};

    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (!refWrap.current) return;

        const { clientX, clientY } = event;
        const rect = refWrap.current.getBoundingClientRect();
        const relativeY = clientY - rect.top;
        const draggableAreaHeight = rect.height * 0.9;
        
        if (relativeY < draggableAreaHeight) {
            // Сохраняем позицию мыши в момент начала перетаскивания
            setDragStartPosition({ x: clientX, y: clientY });
            setIsGrabbing(true);
        }
    }

    const handleMouseUp = () => {
        setIsGrabbing(false);
    }

    const handleMouseMove = (event: MouseEvent) => {
        const { clientX, clientY } = event;
        setCursporPosition({ x: clientX, y: clientY });
    }

    useEffect(() => {
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mousemove', handleMouseMove);
        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mousemove', handleMouseMove);
        }
    }, [])

    useEffect(() => {
        if (!isGrabbing) return;
        
        // Вычисляем смещение от начальной позиции мыши
        const deltaX = cursporPosition.x - dragStartPosition.x;
        const deltaY = cursporPosition.y - dragStartPosition.y;
        
        setTranslatedPosition({
            x: translatedPosition.x + deltaX,
            y: translatedPosition.y + deltaY,
        });
        
        // Обновляем начальную позицию мыши для следующего кадра
        setDragStartPosition({ x: cursporPosition.x, y: cursporPosition.y });
    }, [cursporPosition, isGrabbing])

    return (
        <div
            ref={refWrap}
            onMouseDown={handleMouseDown}
            style={{
                ...externalStyles,
                cursor: isGrabbing ? 'grabbing' : 'grab',
                transform: `translate(${translatedPosition.x}px, ${translatedPosition.y}px)`,
            }}
        >
            {children}
        </div>
    )
};