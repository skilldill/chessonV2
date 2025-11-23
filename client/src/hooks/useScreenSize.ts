import { useState, useEffect } from "react";

export type ScreenSize = "S" | "M" | "L";

export const useScreenSize = (): ScreenSize => {
	const [screenSize, setScreenSize] = useState<ScreenSize>(() => {
		if (typeof window === "undefined") return "M";
		
		const width = window.innerWidth;
		const height = window.innerHeight;

		if (width > 1440 && height > 1150) return "L";
		if (width > 1080) return "M";
		return "S";
	});

	useEffect(() => {
		const handleResize = () => {
			const width = window.innerWidth;
			const height = window.innerHeight;

			if (width > 1440 && height > 1150) {
				setScreenSize("L");
			} else if (width > 1080) {
				setScreenSize("M");
			} else {
				setScreenSize("S");
			}
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return screenSize;
};

