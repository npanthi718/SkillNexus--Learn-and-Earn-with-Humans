export const parseList = (input) => {
  const s = typeof input === "string" ? input : "";
  return s
    .split(/[,|;\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);
};
