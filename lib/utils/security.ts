export function maskSecret(secret: string, visibleTail = 4) {
  if (!secret) {
    return "";
  }

  const tail = secret.slice(-visibleTail);
  return `${"*".repeat(Math.max(secret.length - visibleTail, 4))}${tail}`;
}
