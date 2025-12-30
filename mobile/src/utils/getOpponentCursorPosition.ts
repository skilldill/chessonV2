import type { CursorPosition, ScreenSize } from "../types";


/**
 * Преобразует позицию курсора оппонента в позицию для экрана игрока
 * 
 * @param position - позиция курсора оппонента (x, y)
 * @param screenSize - размер экрана оппонента (width, height)
 * @returns позиция курсора, масштабированная и зеркально отображенная для экрана игрока
 */
export function getOpponentCursorPosition(
    position: CursorPosition,
    screenSize: ScreenSize,
): CursorPosition {
    // Получаем размер экрана игрока
    const playerScreenWidth = window.innerWidth;
    const playerScreenHeight = window.innerHeight;

    // Вычисляем коэффициенты масштабирования для каждой оси
    const widthScale = playerScreenWidth / screenSize.width;
    const heightScale = playerScreenHeight / screenSize.height;

    // Масштабируем позицию курсора оппонента относительно размера экрана игрока
    const scaledX = position.x * widthScale;
    const scaledY = position.y * heightScale;

    // Зеркально отображаем позицию по обеим осям, так как все отображено зеркально
    const mirroredX = playerScreenWidth - scaledX;
    const mirroredY = playerScreenHeight - scaledY;

    return {
        x: mirroredX,
        y: mirroredY
    };
}

