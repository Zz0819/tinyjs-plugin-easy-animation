export const parsePercent = (percentValue) => {
  return percentValue.slice(0, -1) / 100;
};

export const isUndefined = (value) => {
  return value === void 0;
};
