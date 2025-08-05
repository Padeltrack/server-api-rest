export const parseSemanasField = (semanasString: string) => {
  if (!semanasString) return [];

  return semanasString
    .split(',')
    .map(s => s.trim().match(/\d+/))
    .filter(Boolean)
    .map(n => parseInt(n![0]))
    .sort((a, b) => a - b);
};
