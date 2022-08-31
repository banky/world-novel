export const removeTrailingPeriod = (text: string) => {
  if (text[text.length - 1] === ".") {
    return text.substring(0, text.length - 1);
  }
  return text;
};
