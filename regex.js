export const uxFilePathRegex = /^([\\\/]{1}[a-zA-Z0-9_\-\.]+)+$/;
export const fileNameRegex = /^[a-zA-Z0-9_\-\.]+$/;
export function escape(str) {
    return str.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
}
