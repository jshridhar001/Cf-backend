export function stockKey(varietyId: string, sizeId: string, generationId: string) {
  return `${varietyId}:${sizeId}:${generationId}`;
}
