export const APP_NAME = 'VanishChat';
export const APP_TAGLINE = 'Messages that vanish. Privacy that doesn\'t.';

export const USER_ID_LENGTH = 6;
export const ROOM_CODE_LENGTH = 6;

export const MIN_DURATION_MINUTES = 1;
export const MAX_DURATION_MINUTES = 1440;

export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const MAX_PRIVATE_MEMBERS = 2;
export const MAX_GROUP_MEMBERS = 10;

export const TYPING_TIMEOUT_MS = 3000;
export const READ_RECEIPT_BATCH_INTERVAL_MS = 2000;
export const TIMER_WARNING_SECONDS = 60;

export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  SYSTEM: 'system',
};

export const TOAST_TYPES = {
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info',
};

export const TOAST_DURATION_MS = 4000;
