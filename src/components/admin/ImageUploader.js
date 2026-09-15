'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { PiArrowLeft, PiArrowRight, PiCloudArrowUp, PiTrash, PiWarningCircle } from 'react-icons/pi';
import { uploadImage } from '@/services/upload';
import styles from './ImageUploader.module.css';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Manage an ordered list of images: `value` is [{ url, publicId, alt }],
 * `onChange` receives an updater function. The first image is the cover.
 * Removed Cloudinary assets are deleted on the server when the form is saved.
 */
export default function ImageUploader({ value, onChange, target = 'products', multiple = true, max = 12, label }) {
  const inputRef = useRef(null);
  const [uploads, setUploads] = useState([]);
  const [dragging, setDragging] = useState(false);

  const updateUpload = (id, patch) => setUploads((current) => current.map((u) => (u.id === id ? { ...u, ...patch } : u)));

  const uploadFile = async (file) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const preview = URL.createObjectURL(file);
    setUploads((current) => [...current, { id, name: file.name, preview, progress: 0, error: null }]);

    if (!ACCEPTED.includes(file.type)) {
      updateUpload(id, { error: 'Use JPG, PNG, WebP or AVIF.' });
      return;
    }
    if (file.size > MAX_BYTES) {
      updateUpload(id, { error: 'Images must be 10 MB or smaller.' });
      return;
    }

    try {
      const image = await uploadImage(file, target, (progress) => updateUpload(id, { progress }));
      onChange((current) => (multiple ? [...current, image] : [image]));
      setUploads((current) => current.filter((u) => u.id !== id));
      URL.revokeObjectURL(preview);
    } catch (error) {
      updateUpload(id, { error: error.message });
    }
  };

  const handleFiles = (fileList) => {
    const files = [...fileList];
    const room = multiple ? Math.max(0, max - value.length - uploads.length) : 1;
    files.slice(0, room).forEach(uploadFile);
  };

  const move = (index, delta) =>
    onChange((current) => {
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item);
      return next;
    });

  const remove = (index) => onChange((current) => current.filter((_, i) => i !== index));

  const dismissUpload = (upload) => {
    URL.revokeObjectURL(upload.preview);
    setUploads((current) => current.filter((u) => u.id !== upload.id));
  };

  const canAdd = multiple ? value.length + uploads.length < max : value.length === 0 && uploads.length === 0;

  return (
    <div className={styles.uploader}>
      <div className={`${styles.grid} ${multiple ? '' : styles.single}`}>
        {value.map((image, index) => (
          <figure key={image.publicId || image.url} className={styles.tile}>
            <Image src={image.url} alt={image.alt || ''} fill sizes="160px" className={styles.image} />
            {multiple && index === 0 && <span className={styles.cover}>Cover</span>}
            <div className={styles.tools}>
              {multiple && (
                <>
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move left">
                    <PiArrowLeft />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === value.length - 1}
                    aria-label="Move right"
                  >
                    <PiArrowRight />
                  </button>
                </>
              )}
              <button type="button" onClick={() => remove(index)} aria-label="Remove image" className={styles.danger}>
                <PiTrash />
              </button>
            </div>
          </figure>
        ))}

        {uploads.map((upload) => (
          <figure key={upload.id} className={`${styles.tile} ${upload.error ? styles.failed : ''}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
            <img src={upload.preview} alt="" className={styles.preview} />
            <div className={styles.progress}>
              {upload.error ? (
                <>
                  <span className={styles.errorText}>
                    <PiWarningCircle aria-hidden="true" /> {upload.error}
                  </span>
                  <button type="button" className={styles.dismiss} onClick={() => dismissUpload(upload)}>
                    Dismiss
                  </button>
                </>
              ) : (
                <>
                  <span>{upload.progress}%</span>
                  <ProgressBar now={upload.progress} visuallyHidden />
                </>
              )}
            </div>
          </figure>
        ))}

        {canAdd && (
          <button
            type="button"
            className={`${styles.drop} ${dragging ? styles.dragging : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              handleFiles(event.dataTransfer.files);
            }}
          >
            <PiCloudArrowUp aria-hidden="true" />
            <strong>{label ?? (multiple ? 'Upload images' : 'Upload image')}</strong>
            <small>Drag & drop or click · JPG, PNG, WebP · max 10 MB</small>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        multiple={multiple}
        hidden
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = '';
        }}
      />
    </div>
  );
}
