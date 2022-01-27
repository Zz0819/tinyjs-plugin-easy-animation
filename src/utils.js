const xEval = (localValue, operation) => {
  const FN = Function;

  if (typeof localValue === 'number') {
    return (new FN(`return ${localValue}${operation}`))();
  }

  return {
    x: (new FN(`return ${localValue.x}${operation}`))(),
    y: (new FN(`return ${localValue.y}${operation}`))(),
  };
};

export const parsePercent = (percentValue) => {
  return percentValue.slice(0, -1) / 100;
};

export const isUndefined = (value) => {
  return value === void 0;
};

export const isObject = (target) => {
  return Object.prototype.toString.call(target) === '[object Object]';
};

export const deepCloneConfig = (config) => {
  let configClone = {};

  for (const key in config) {
    if (config.hasOwnProperty(key)) {
      if (config[ key ] && typeof config[ key ] === 'object') {
        if (Array.isArray(config[ key ])) {
          configClone[ key ] = config[ key ].map(item => {
            if (typeof item === 'object') {
              return deepCloneConfig(item);
            }

            return item;
          });
        } else {
          configClone[ key ] = deepCloneConfig(config[ key ]);
        }
      } else {
        configClone[ key ] = config[ key ];
      }
    }
  }

  return configClone;
};

export const xRequestAnimationFrame = (callback) => {
  if (navigator.canUseBinding) {
    return setTimeout(() => {
      callback && callback();
    }, 0);
  } else {
    return window.requestAnimationFrame(() => {
      callback && callback();
    });
  }
};

export const xCancelAnimationFrame = (handler) => {
  if (navigator.canUseBinding) {
    clearTimeout(handler);
  } else {
    window.cancelAnimationFrame(handler);
  }
};

export const getParentRelativePosValue = (displayObject, property, targetValue, toValue, clipIndex) => {
  // 更新一下 displayObject 的 transform 保证能拿到正确的。
  displayObject.displayObjectUpdateTransform();

  const operator = toValue < targetValue ? '-' : '+';
  let localValue;
  let deltaValue = toValue - targetValue;

  if (property === 'position.x') {
    localValue = displayObject.localTransform.tx;
  } else if (property === 'position.y') {
    localValue = displayObject.localTransform.ty;
  } else {
    localValue = { x: displayObject.localTransform.tx, y: displayObject.localTransform.ty };
  }

  toValue = `${operator}${Math.abs(deltaValue)}`;

  if (clipIndex === 0) {
    displayObject.__easyAnimationOperation = toValue;
    return {
      targetValue: localValue,
      toValue: typeof localValue === 'object' ? { x: toValue, y: toValue } : toValue,
    };
  } else {
    const targetValue = xEval(localValue, displayObject.__easyAnimationOperation);
    displayObject.__easyAnimationOperation += toValue;
    return {
      targetValue,
      toValue: typeof localValue === 'object' ? { x: toValue, y: toValue } : toValue,
    };
  }
};
