// Forked from https://www.npmjs.com/package/just-safe-get
export function get(obj, propsArg, defaultValue) {
  if (!obj) {
    return defaultValue;
  }

  let props;
  let prop;

  if (Array.isArray(propsArg)) {
    props = [...propsArg];
  } else if (typeof propsArg === "string") {
    props = propsArg.split(".");
  } else if (typeof propsArg === "symbol") {
    props = [propsArg];
  }

  if (!Array.isArray(props)) {
    throw new TypeError(
      `Expected props to be an array, a string or a symbol, got ${typeof props}`,
    );
  }

  while (props.length) {
    prop = props.shift();
    if (!obj) {
      return defaultValue;
    }
    obj = obj[prop];
    if (obj === undefined) {
      return defaultValue;
    }
  }

  return obj;
}
