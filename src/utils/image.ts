/**
 * Downscales an image blob to an icon-sized square (preserving aspect ratio) and
 * returns it as a PNG data URI. Icons are stored inline in Firestore documents
 * (no file storage is configured for this project), so keeping them small matters —
 * capping the source dimension keeps each icon at a few KB, even duplicated across
 * every party member awarded that loot item.
 */
export function blobToIconDataUrl(blob: Blob, maxDimension = 64): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      URL.revokeObjectURL(objectUrl);
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read that image"));
    };
    img.src = objectUrl;
  });
}

export function imageItemFromClipboard(items: DataTransferItemList | undefined): Blob | null {
  if (!items) return null;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type.startsWith("image/")) {
      return item.getAsFile();
    }
  }
  return null;
}
