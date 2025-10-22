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
    const [clickOffset, setClickOffset] = useState<Position>({ x: 0, y: 0 });
    const [initialPosition, setInitialPosition] = useState<Position>({ x: 0, y: 0 });
    const refWrap = useRef<HTMLDivElement>(null);

    const externalStyles = styles || {};

    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (!refWrap.current) return;

        const { clientX, clientY } = event;
        const rect = refWrap.current.getBoundingClientRect();
        const relativeY = clientY - rect.top;
        const draggableAreaHeight = rect.height * 0.9;
        
        if (relativeY < draggableAreaHeight) {
            // Сохраняем смещение от точки клика до центра элемента
            const offsetX = clientX - (rect.left + rect.width / 2);
            const offsetY = clientY - (rect.top + rect.height / 2);
            setClickOffset({ x: offsetX, y: offsetY });
            
            // Сохраняем текущую позицию центра элемента (с учетом предыдущих перемещений)
            setInitialPosition({ 
                x: rect.left + rect.width / 2, 
                y: rect.top + rect.height / 2 
            });
            
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
        
        setTranslatedPosition({
            x: cursporPosition.x - initialPosition.x - clickOffset.x,
            y: cursporPosition.y - initialPosition.y - clickOffset.y,
        })
    }, [cursporPosition, isGrabbing, clickOffset, initialPosition])

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