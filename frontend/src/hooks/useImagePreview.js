import {useEffect, useMemo} from 'react';
import {resolveAssetUrl} from '../lib/apiClient';

const createObjectUrl = (file) => {
  if (!file) {
    return null;
  }
  return URL.createObjectURL(file);
};

export function useImagePreview(file, url) {
  const objectUrl = useMemo(() => createObjectUrl(file), [file]);
  useEffect(() => () => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  }, [objectUrl]);
  return objectUrl ?? resolveAssetUrl(url);
}
