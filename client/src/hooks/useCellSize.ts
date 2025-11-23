export const useCellSize = (defaultValue: number) => {
	if (typeof window === undefined) return defaultValue;
	// if (window.innerWidth <= 460) return 36;
	// if (window.innerWidth < 1144) return 44;
	if (window.innerWidth < 1441) return 84;
	return defaultValue;
}