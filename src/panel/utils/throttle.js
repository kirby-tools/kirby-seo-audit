export function throttle(fn, limit) {
  let lasFn;
  let lastRan;

  return (...args) => {
    if (!lastRan) {
      fn(...args);
      lastRan = Date.now();
    } else {
      clearTimeout(lasFn);
      lasFn = setTimeout(
        () => {
          if (Date.now() - lastRan >= limit) {
            fn(...args);
            lastRan = Date.now();
          }
        },
        limit - (Date.now() - lastRan),
      );
    }
  };
}
