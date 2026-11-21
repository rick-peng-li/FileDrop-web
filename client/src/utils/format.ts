export function truncateString(input: string, maxLength = 30): string {
  if (input.length <= maxLength) {
    return input;
  }
  const head = input.slice(0, maxLength - 3);
  const tail = input.slice(-3);
  return `${head}...${tail}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ["KB", "MB", "GB", "TB"];
  let size = bytes / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
