export const errorToString = (error: unknown): string => {
  if (error instanceof Error) {
    return `${error.constructor.name}: ${error.message}`;
  } else {
    return JSON.stringify(error);
  }
};
