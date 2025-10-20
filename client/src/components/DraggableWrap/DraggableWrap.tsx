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
    const [translatedPosition, setTranslatedPosition] = useState<Position>();
    const [clickOffset, setClickOffset] = useState<Position>({ x: 0, y: 0 });
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
        if (!isGrabbing || !refWrap.current) return;
        setTranslatedPosition({
            x: cursporPosition.x - (refWrap.current.offsetLeft + refWrap.current.offsetWidth / 2) - clickOffset.x,
            y: cursporPosition.y - (refWrap.current.offsetTop + refWrap.current.offsetHeight / 2) - clickOffset.y,
        })
    }, [cursporPosition, isGrabbing, clickOffset, refWrap.current])

    return (
        <div
            ref={refWrap}
            onMouseDown={handleMouseDown}
            style={{
                ...externalStyles,
                cursor: isGrabbing ? 'grabbing' : 'grab',
                transform: translatedPosition ? `translate(${translatedPosition.x}px, ${translatedPosition.y}px)` : 'translate(0px, 0px)',
            }}
        >
            {children}
        </div>
    )
};