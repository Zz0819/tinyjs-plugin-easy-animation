export const parsePercent = (percentValue) => {
  return percentValue.slice(0, -1) / 100;
};

export const isUndefined = (value) => {
  return value === void 0;
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
