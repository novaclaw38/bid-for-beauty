"use client";

import { upload } from "@vercel/blob/client";
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

type Photo = { id: string; url: string };

const MAX_PHOTOS = 12;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function PhotoGallery({ photos: initialPhotos }: { photos: Photo[] }) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Please choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Photos must be under 8MB.");
      return;
    }
    if (photos.length >= MAX_PHOTOS) {
      toast.error(`You can upload up to ${MAX_PHOTOS} photos.`);
      return;
    }

    setUploading(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/profile/photos/upload-url",
      });

      const res = await fetch("/api/profile/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: blob.url }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const created = (await res.json()) as { id: string; url: string };

      setPhotos((prev) => [...prev, { id: created.id, url: created.url }]);
      toast.success("Photo added.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't upload that photo.");
    } finally {
      setUploading(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    setBusyId(id);
    const snapshot = photos;
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    try {
      const res = await fetch(`/api/profile/photos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Photo removed.");
    } catch (err) {
      setPhotos(snapshot);
      toast.error(err instanceof Error ? err.message : "Couldn't remove that photo.");
    } finally {
      setBusyId(null);
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;

    const reordered = [...photos];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const snapshot = photos;
    setPhotos(reordered);

    try {
      const res = await fetch("/api/profile/photos/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: reordered.map((p) => p.id) }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
    } catch (err) {
      setPhotos(snapshot);
      toast.error(err instanceof Error ? err.message : "Couldn't reorder photos.");
    }
  }

  if (photos.length === 0 && !uploading) {
    return (
      <>
        <EmptyState
          icon={ImagePlus}
          title="No photos yet"
          description="Add a few photos of your work so clients can see what you do."
          action={
            <Button onClick={() => fileInputRef.current?.click()}>
              <ImagePlus className="size-4" />
              Add photo
            </Button>
          }
        />
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="sr-only"
          onChange={handleFileChange}
        />
      </>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((photo, i) => (
          <div
            key={photo.id}
            className="group relative aspect-square overflow-hidden rounded-2xl border border-line bg-surface"
          >
            <Image
              src={photo.url}
              alt="Work sample"
              fill
              sizes="(max-width: 640px) 50vw, 220px"
              className="object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-night/0 opacity-0 transition-all group-hover:bg-night/40 group-hover:opacity-100">
              <button
                type="button"
                aria-label="Move earlier"
                disabled={i === 0 || busyId === photo.id}
                onClick={() => void move(i, -1)}
                className="flex size-8 items-center justify-center rounded-full bg-surface/90 text-ink transition-opacity hover:bg-surface disabled:opacity-40"
              >
                <ArrowUp className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Move later"
                disabled={i === photos.length - 1 || busyId === photo.id}
                onClick={() => void move(i, 1)}
                className="flex size-8 items-center justify-center rounded-full bg-surface/90 text-ink transition-opacity hover:bg-surface disabled:opacity-40"
              >
                <ArrowDown className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Delete photo"
                disabled={busyId === photo.id}
                onClick={() => setPendingDeleteId(photo.id)}
                className="flex size-8 items-center justify-center rounded-full bg-surface/90 text-danger transition-opacity hover:bg-danger-soft disabled:opacity-40"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}

        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong bg-paper text-sm font-medium text-ink-2 transition-colors hover:border-brand hover:text-brand",
              uploading && "pointer-events-none opacity-60",
            )}
          >
            <ImagePlus className="size-5" />
            {uploading ? "Uploading..." : "Add photo"}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="sr-only"
        onChange={handleFileChange}
      />

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete this photo?"
        description="This removes it from your profile and any bids clients see. This can't be undone."
        confirmLabel="Delete photo"
        tone="danger"
      />
    </div>
  );
}
