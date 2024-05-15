export const sleep = (time: number) => {
    if (time < 0)
        time = 0;
    return new Promise<void>(resolve => {
        setTimeout(() => {
            resolve()
        }, time);
    });
}