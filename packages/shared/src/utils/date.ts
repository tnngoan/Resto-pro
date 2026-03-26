export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

export function formatDateVN(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${date}`);
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

export function formatTimeVN(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${date}`);
  }

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

export function formatDateTimeVN(date: Date | string): string {
  const dateStr = formatDateVN(date);
  const timeStr = formatTimeVN(date);
  return `${dateStr} ${timeStr}`;
}

export function toVietnamTime(utcDate: Date): Date {
  // Convert UTC to Vietnam time (UTC+7)
  const vietnamOffset = 7 * 60; // 7 hours in minutes
  const utcOffset = utcDate.getTimezoneOffset();
  const vietnamTime = new Date(utcDate.getTime() + (vietnamOffset + utcOffset) * 60 * 1000);
  return vietnamTime;
}

export function toUTC(vietnamDate: Date): Date {
  // Convert Vietnam time (UTC+7) to UTC
  const vietnamOffset = 7 * 60; // 7 hours in minutes
  const utcOffset = vietnamDate.getTimezoneOffset();
  const utcTime = new Date(vietnamDate.getTime() - (vietnamOffset + utcOffset) * 60 * 1000);
  return utcTime;
}

export function getStartOfDayVN(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  const vietnamDate = toVietnamTime(d);
  vietnamDate.setHours(0, 0, 0, 0);
  return toUTC(vietnamDate);
}

export function getEndOfDayVN(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  const vietnamDate = toVietnamTime(d);
  vietnamDate.setHours(23, 59, 59, 999);
  return toUTC(vietnamDate);
}

export function formatElapsedTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}
