import { useEffect, useState, useCallback, useMemo } from 'react';

export interface ImagePreloaderState {
  isLoading: boolean;
  loadedImages: Set<string>;
  error: string | null;
  isAllLoaded: boolean;
}

export interface ImagePreloaderActions {
  preloadImages: (urls: string[]) => Promise<void>;
  clearError: () => void;
}

export type UseImagePreloaderReturn = ImagePreloaderState & ImagePreloaderActions;

/**
 * Хук для холодной прогрузки изображений
 * Позволяет предзагружать изображения в фоновом режиме
 * 
 * @param initialImages - массив URL изображений для первоначальной загрузки
 * @returns объект с состоянием загрузки и методами управления
 */
export const useImagePreloader = (initialImages: string[] = []): UseImagePreloaderReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Стабилизируем массив изображений, чтобы избежать бесконечных перерендеров
  const stableInitialImages = useMemo(() => initialImages, [initialImages.join(',')]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const preloadImages = useCallback(async (urls: string[]): Promise<void> => {
    if (urls.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const promises = urls.map(src => {
        return new Promise<string>((resolve, reject) => {
          const img = new Image();
          
          img.onload = () => {
            resolve(src);
          };
          
          img.onerror = () => {
            reject(new Error(`Failed to preload image: ${src}`));
          };
          
          img.src = src;
        });
      });

      const loadedUrls = await Promise.all(promises);
      setLoadedImages(prev => new Set([...prev, ...loadedUrls]));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred during image preloading';
      setError(errorMessage);
      console.error('Image preloading error:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Автоматическая загрузка initialImages при монтировании компонента
  useEffect(() => {
    if (stableInitialImages.length > 0) {
      preloadImages(stableInitialImages);
    }
  }, [stableInitialImages, preloadImages]);

  const isAllLoaded = !isLoading && loadedImages.size === stableInitialImages.length;

  return {
    isLoading,
    loadedImages,
    error,
    isAllLoaded,
    preloadImages,
    clearError,
  };
};
