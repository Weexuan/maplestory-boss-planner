import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { Modal } from "./Modal";
import { GiftIcon } from "./icons/GiftIcon";
import { blobToIconDataUrl, imageItemFromClipboard } from "../utils/image";

interface ImagePickerProps {
  imageUrl?: string;
  onChange: (imageUrl: string | undefined) => void;
  /** Button swatch size in pixels (square). Defaults to a small icon-sized swatch. */
  size?: number;
  maxDimension?: number;
  modalTitle?: string;
  placeholderIcon?: ReactNode;
}

export function ImagePicker({
  imageUrl,
  onChange,
  size = 36,
  maxDimension = 64,
  modalTitle = "Set image",
  placeholderIcon = <GiftIcon className="h-5 w-5" />,
}: ImagePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Set image"
        style={{ width: size, height: size }}
        className="flex shrink-0 items-center justify-center rounded-md border border-white/10 bg-[#0f1115] text-lg hover:border-indigo-500"
      >
        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-full w-full object-contain p-1" />
        ) : (
          placeholderIcon
        )}
      </button>
      {open && (
        <ImageUploadModal
          imageUrl={imageUrl}
          maxDimension={maxDimension}
          title={modalTitle}
          placeholderIcon={placeholderIcon}
          onSelect={(url) => {
            onChange(url);
            setOpen(false);
          }}
          onClear={() => {
            onChange(undefined);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function ImageUploadModal({
  imageUrl,
  maxDimension,
  title,
  placeholderIcon,
  onSelect,
  onClear,
  onClose,
}: {
  imageUrl?: string;
  maxDimension: number;
  title: string;
  placeholderIcon: ReactNode;
  onSelect: (imageUrl: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const [preview, setPreview] = useState<string | undefined>(imageUrl);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBlob = async (blob: Blob | null) => {
    if (!blob) {
      setError("That didn't look like an image. Try copying an image (not a link or file path).");
      return;
    }
    try {
      setPreview(await blobToIconDataUrl(blob, maxDimension));
      setError(null);
    } catch {
      setError("Couldn't read that image. Try a different one.");
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-3">
        <div
          tabIndex={0}
          onPaste={(e) => void handleBlob(imageItemFromClipboard(e.clipboardData?.items))}
          onDragOver={(e: DragEvent) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e: DragEvent) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file?.type.startsWith("image/")) void handleBlob(file);
            else setError("Drop an image file.");
          }}
          className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center outline-none ${
            dragOver ? "border-indigo-500 bg-indigo-500/5" : "border-white/15"
          }`}
        >
          {preview ? (
            <img src={preview} alt="" className="h-16 w-16 object-contain" />
          ) : (
            <span className="text-3xl text-gray-500 [&_svg]:h-8 [&_svg]:w-8">{placeholderIcon}</span>
          )}
          <p className="text-sm text-gray-300">Click here, then press Ctrl+V to paste an image</p>
          <p className="text-xs text-gray-500">or drag an image file in, or</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
          >
            browse a file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleBlob(e.target.files?.[0] ?? null)}
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-between pt-2">
          <button
            type="button"
            onClick={onClear}
            className="rounded-md px-3 py-1.5 text-sm text-gray-400 hover:bg-white/10"
          >
            Remove image
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-sm text-gray-300 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!preview}
              onClick={() => preview && onSelect(preview)}
              className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              Use this image
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
