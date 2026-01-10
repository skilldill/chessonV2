import { useState, useEffect } from "react";

export const useScreenHeightForChessboard = (): string => {
    const [gridColsClass, setGridColsClass] = useState(() => {
        if (typeof window === "undefined") return "grid-cols-[1fr_720px_1fr]";
        
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Breakpoints по высоте имеют приоритет
        if (height < 720) {
            return "grid-cols-[1fr_560px_1fr]";
        }
        if (height < 820) {
            return "grid-cols-[1fr_600px_1fr]";
        }

        // Breakpoints по ширине
        if (width >= 1920) {
            return "grid-cols-[1fr_minmax(900px,_1fr)_1fr]";
        }
        if (width >= 1440) {
            return "grid-cols-[1fr_780px_1fr]";
        }
        return "grid-cols-[1fr_720px_1fr]";
    });

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            // Breakpoints по высоте имеют приоритет
            if (height < 720) {
                setGridColsClass("grid-cols-[1fr_560px_1fr]");
                return;
            }
            if (height < 820) {
                setGridColsClass("grid-cols-[1fr_600px_1fr]");
                return;
            }

            // Breakpoints по ширине
            if (width >= 1920) {
                setGridColsClass("grid-cols-[1fr_minmax(900px,_1fr)_1fr]");
            } else if (width >= 1440) {
                setGridColsClass("grid-cols-[1fr_780px_1fr]");
            } else {
                setGridColsClass("grid-cols-[1fr_720px_1fr]");
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return gridColsClass;
};
