import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Avatar } from '@mui/material';
import { UserOutlined } from '@ant-design/icons';
import { formatImageUrl } from '../utils/imageHelper';

/**
 * A robust Avatar component that handles image loading, errors, and fallbacks.
 * It uses the formatImageUrl helper to construct a valid URL and displays a
 * loading state and a fallback icon.
 */
const ImageAvatar = ({ src, alt, sx, ...otherProps }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (!src) {
      setLoading(false);
      setError(true);
      return;
    }

    const formattedUrl = formatImageUrl(src);
    setImageUrl(formattedUrl);

    // Create a new image to test loading
    const img = new Image();
    img.onload = () => {
      setLoading(false);
      setError(false);
    };
    img.onerror = () => {
      setLoading(false);
      setError(true);
    };
    img.src = formattedUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  if (error || !imageUrl) {
    return (
      <Avatar sx={{ ...sx, bgcolor: '#f5f5f5' }} {...otherProps}>
        <UserOutlined style={{ color: '#bdbdbd' }} />
      </Avatar>
    );
  }

  return (
    <Avatar
      src={imageUrl}
      alt={alt}
      sx={{
        ...sx,
        animation: loading ? 'pulse 1.5s ease-in-out infinite' : 'none'
      }}
      {...otherProps}
    />
  );
};

ImageAvatar.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  sx: PropTypes.object
};

export default ImageAvatar; 