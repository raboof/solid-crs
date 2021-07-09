/**
 * Debounce a function.
 *
 * @param func Function to debounce.
 * @param wait Timeout in milliseconds.
 * @returns The debounced function.
 */
export const debounce = (func: () => void, wait: number) => {

  let timeout: NodeJS.Timeout;

  return (...args: unknown[]) => {

    clearTimeout(timeout);
    // eslint-disable-next-line no-console
    timeout = setTimeout(() => { console.log('=== Executed'); func.apply(this, args); }, wait);

  };

};
