export const NoDataUpdate = <T>(data: T): boolean => {
  return Object.keys(data).length === 0;
};
