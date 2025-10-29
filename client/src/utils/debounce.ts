export const debounce = (fn: (...params: any) => any, ms: number = 600) => {
    let fnAvailable = true;

    return (...args: any) => {
        if (fnAvailable) {
            fn(args);
            fnAvailable = false;

            const timeout = setTimeout(() => {
                fnAvailable = true;
                clearTimeout(timeout);
            }, ms);
        }
    }
}
