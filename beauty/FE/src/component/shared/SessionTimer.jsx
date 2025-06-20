import React, { useState, useEffect } from 'react';
import sessionManager from '../../utils/sessionManager';

const SessionTimer = () => {
    const [remainingTime, setRemainingTime] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const updateTimer = () => {
            const remaining = sessionManager.getRemainingTime();
            setRemainingTime(remaining);
            
            // Chỉ hiển thị khi còn ít hơn 10 phút
            setIsVisible(remaining > 0 && remaining < 10 * 60 * 1000);
        };

        // Cập nhật ngay lập tức
        updateTimer();

        // Cập nhật mỗi giây
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, []);

    const formatTime = (milliseconds) => {
        const minutes = Math.floor(milliseconds / (1000 * 60));
        const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const getTimerClass = () => {
        if (remainingTime < 2 * 60 * 1000) return 'session-timer-critical'; // < 2 phút
        if (remainingTime < 5 * 60 * 1000) return 'session-timer-warning';  // < 5 phút
        return 'session-timer-normal';
    };

    if (!isVisible) return null;

    return (
        <>
            <div className={`session-timer ${getTimerClass()}`}>
                <i className="fas fa-clock me-2"></i>
                <span className="timer-text">
                    Phiên hết hạn sau: {formatTime(remainingTime)}
                </span>
            </div>
            
            {/* CSS được add vào head để tránh styled-jsx dependency */}
            <style dangerouslySetInnerHTML={{
                __html: `
                    .session-timer {
                        position: fixed;
                        top: 70px;
                        right: 20px;
                        padding: 8px 15px;
                        border-radius: 20px;
                        font-size: 0.85rem;
                        font-weight: 600;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                        z-index: 1000;
                        backdrop-filter: blur(10px);
                        animation: slideInRight 0.3s ease;
                        transition: all 0.3s ease;
                    }

                    .session-timer-normal {
                        background: rgba(40, 167, 69, 0.9);
                        color: white;
                        border: 1px solid rgba(40, 167, 69, 0.3);
                    }

                    .session-timer-warning {
                        background: rgba(255, 193, 7, 0.9);
                        color: #333;
                        border: 1px solid rgba(255, 193, 7, 0.3);
                        animation: pulse 2s ease-in-out infinite;
                    }

                    .session-timer-critical {
                        background: rgba(220, 53, 69, 0.9);
                        color: white;
                        border: 1px solid rgba(220, 53, 69, 0.3);
                        animation: shake 0.5s ease-in-out infinite;
                    }

                    @keyframes slideInRight {
                        from {
                            transform: translateX(100%);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }

                    @keyframes pulse {
                        0%, 100% {
                            transform: scale(1);
                            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                        }
                        50% {
                            transform: scale(1.05);
                            box-shadow: 0 6px 16px rgba(255, 193, 7, 0.3);
                        }
                    }

                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        25% { transform: translateX(-5px); }
                        75% { transform: translateX(5px); }
                    }

                    .timer-text {
                        user-select: none;
                    }

                    @media (max-width: 768px) {
                        .session-timer {
                            top: 60px;
                            right: 10px;
                            font-size: 0.75rem;
                            padding: 6px 12px;
                        }
                    }

                    .session-timer:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
                    }
                `
            }} />
        </>
    );
};

export default SessionTimer; 