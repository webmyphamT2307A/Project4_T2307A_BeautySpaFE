const API_BASE_URL = 'http://localhost:8080';

/**
 * Formats an image URL from the backend to be a full, valid URL.
 * Handles:
 * - null or undefined paths
 * - data:image URIs
 * - full URLs that are already correct
 * - relative paths (e.g., /uploads/image.png)
 * - malformed paths (e.g., 8080/uploads/image.png)
 *
 * @param {string | null | undefined} path The raw path from the backend.
 * @returns {string} A valid, full image URL or an empty string if the path is invalid.
 */
export const formatImageUrl = (path) => {
  if (!path) {
    return '';
  }

  // If it's a data URI, return it as is. It's already a valid source.
  if (path.startsWith('data:image')) {
    return path;
  }

  // If it's already a full URL, return it.
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  let cleanPath = path;

  // Handle malformed paths like "8080/uploads/..." or ":8080/uploads/..."
  if (cleanPath.startsWith('8080/') || cleanPath.startsWith(':8080/')) {
    cleanPath = cleanPath.replace(/^:?8080\//, '');
  }

  // Remove any leading slashes
  cleanPath = cleanPath.replace(/^\/+/, '');

  // Construct the full URL
  return `${API_BASE_URL}/${cleanPath}`;
}; 