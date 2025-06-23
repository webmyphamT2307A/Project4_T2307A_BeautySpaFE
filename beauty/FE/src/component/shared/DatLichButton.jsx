import React from 'react';

const DatLichButton = ({ onClick }) => {
  const buttonStyle = {
    background: 'linear-gradient(135deg, #FDB5B9, #f89ca0)',
    border: 'none',
    boxShadow: '0 6px 20px rgba(253, 181, 185, 0.3)',
    color: 'white',
    borderRadius: '50px',
    padding: '10px 25px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    outline: 'none',
    textDecoration: 'none',
    display: 'inline-block',
    position: 'relative',
    zIndex: 2,
    letterSpacing: '0.3px'
  };

  const handleMouseEnter = (e) => {
    e.target.style.background = 'linear-gradient(135deg, #F7A8B8, #E589A3)';
    e.target.style.transform = 'translateY(-3px) scale(1.05)';
    e.target.style.boxShadow = '0 12px 30px rgba(253, 181, 185, 0.5)';
  };

  const handleMouseLeave = (e) => {
    e.target.style.background = 'linear-gradient(135deg, #FDB5B9, #f89ca0)';
    e.target.style.transform = 'translateY(0) scale(1)';
    e.target.style.boxShadow = '0 6px 20px rgba(253, 181, 185, 0.3)';
  };

  const handleMouseDown = (e) => {
    e.target.style.transform = 'translateY(-1px) scale(1.02)';
  };

  const handleMouseUp = (e) => {
    e.target.style.transform = 'translateY(-3px) scale(1.05)';
  };

  return (
    <button
      style={buttonStyle}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      type="button"
    >
      Đặt Lịch Ngay
    </button>
  );
};

export default DatLichButton; 