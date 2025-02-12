export const stringify2 = (
  value: any,
  valueCharacterLimit: number = 1024,
): string => {
  const processedObject = Object.fromEntries(
    Object.entries(value)
      .filter(([, val]) => val !== undefined)
      .map(([key, val]) => [
        key,
        val === null
          ? 'null'
          : JSON.stringify(val, null, 2).slice(0, valueCharacterLimit),
      ]),
  );

  return JSON.stringify(processedObject, null, 2);
};
