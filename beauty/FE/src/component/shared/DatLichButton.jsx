import React from 'react';

const DatLichButton = ({ onClick, isHovered }) => {
  const baseStyle = {
    background: isHovered
        ? '#fff'
        : 'linear-gradient(135deg, #FDB5B9, #f89ca0)',
    border: isHovered
        ? '2px solid #FAD0C4'
        : '2px solid #f89ca0',
    boxShadow: isHovered
        ? '0 0 20px rgba(255, 120, 150, 0.55), 0 10px 24px rgba(255, 165, 140, 0.35)'
        : '0 6px 16px rgba(255, 150, 160, 0.25)',
    color: isHovered ? "#FDB5B9" : 'white',
    borderRadius: '50px',
    padding: '12px 28px',
    fontSize: '1.05rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    outline: 'none',
    textDecoration: 'none',
    display: 'inline-block',
    position: 'relative',
    zIndex: 2,
    letterSpacing: '0.4px',
    transform: isHovered ? 'translateY(-3px) scale(1.01)' : 'translateY(0) scale(1)',
    backdropFilter: isHovered ? 'blur(1px)' : 'none',
  };

  return (
      <button
          style={baseStyle}
          onClick={onClick}
          type="button"
      >
        Đặt Lịch Ngay
      </button>
  );
};

export default DatLichButton;
