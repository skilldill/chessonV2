import { useState, useEffect } from "react";

export type ScreenSize = "S" | "M" | "L";

export const useScreenSize = (): ScreenSize => {
	const [screenSize, setScreenSize] = useState<ScreenSize>(() => {
		if (typeof window === "undefined") return "L";
		
		const height = window.innerHeight;

		if (height > 720) return "L";
		return "S";
	});

	useEffect(() => {
		const handleResize = () => {
			const height = window.innerHeight;

			if (height > 720) {
				setScreenSize("L");
			} else {
				setScreenSize("S");
			}
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return screenSize;
};

