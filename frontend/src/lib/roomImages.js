const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const roomFallbacks = {
  standard: '/room-standard-1.jpg',
  deluxe: '/room-deluxe-1.jpg',
  suite: '/room-royal-1.jpg',
  presidential: '/room-presidential-1.jpg',
  family: '/room-family-1.jpg',
  garden: '/room-garden-1.jpg'
};

const bathroomFallbacks = {
  deluxe: '/room-deluxe-bath.jpg',
  suite: '/room-royal-bath.jpg',
  presidential: '/room-royal-bath.jpg'
};

export const getRoomImageFallback = (room, index = 0) => {
  if (index === 2) return bathroomFallbacks[room?.type] || '/room-deluxe-bath.jpg';
  return roomFallbacks[room?.type] || roomFallbacks.standard;
};

export const getRoomImageSource = (room, index = 0) => {
  const images = Array.isArray(room?.images) ? room.images : [];
  const image = index === 2 ? room?.bathroomImage : images[index] || images[0];
  if (typeof image !== 'string' || !image.trim()) return getRoomImageFallback(room, index);

  const source = image.trim().replace(/\\/g, '/');
  if (/^(https?:|data:|blob:)/i.test(source)) return source;

  const normalizedPath = source.replace(/^\.\//, '');
  if (/^\/?uploads\//i.test(normalizedPath)) {
    const backendOrigin = new URL(API_URL, window.location.origin).origin;
    return `${backendOrigin}/${normalizedPath.replace(/^\//, '')}`;
  }

  return normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
};

export const handleRoomImageError = (event, room, index = 0) => {
  event.currentTarget.onerror = null;
  event.currentTarget.src = getRoomImageFallback(room, index);
};
