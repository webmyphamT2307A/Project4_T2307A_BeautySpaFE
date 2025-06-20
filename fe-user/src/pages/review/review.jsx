import { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Tooltip, CircularProgress, FormControl, InputLabel, Select, MenuItem, Box,
    Modal, Typography, TextField, Button, Paper
} from '@mui/material';
import { DeleteOutlined, ReadFilled } from '@ant-design/icons'; 
import MainCard from 'components/MainCard';
import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:8080/api/v1';

// Style cho Modal
const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
};

const ReviewList = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');

    // State để quản lý modal phản hồi
    const [replyModalOpen, setReplyModalOpen] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);


    // Lấy tất cả review cho admin
    const fetchReviews = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/reviews/findAll`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.status === 'SUCCESS') {
                const reviewsData = Array.isArray(data.data) ? data.data : [];
                // Fetch detailed info for each review to get replies
                const reviewsWithDetails = await Promise.all(
                    reviewsData.map(async (review) => {
                        try {
                            const detailRes = await fetch(`${API_BASE_URL}/reviews/${review.id}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            const detailData = await detailRes.json();
                            if (detailData.status === 'SUCCESS' && detailData.data.replies) {
                                return { ...review, replies: detailData.data.replies };
                            }
                            return { ...review, replies: [] };
                        } catch {
                            return { ...review, replies: [] };
                        }
                    })
                );
                setReviews(reviewsWithDetails);
            } else toast.error(data.message || 'Failed to load reviews');
        } catch {
            toast.error('Error loading reviews');
        }
        setLoading(false);
    };

    useEffect(() => { fetchReviews(); }, []);

    // Các hàm xử lý modal
    const handleOpenReplyModal = (review) => {
        setSelectedReview(review);
        setReplyModalOpen(true);
    };

    const handleCloseReplyModal = () => {
        setReplyModalOpen(false);
        setSelectedReview(null);
        setReplyContent('');
    };

    const handleSubmitReply = async () => {
        if (!replyContent.trim()) {
            toast.warn('Please enter a reply.');
            return;
        }
        setIsSubmittingReply(true);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`${API_BASE_URL}/reviews/${selectedReview.id}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ comment: replyContent })
            });

            const data = await res.json();
            if (res.ok && data.status === 'SUCCESS') {
                toast.success('Reply submitted successfully!');
                handleCloseReplyModal();
                fetchReviews(); // Tải lại danh sách để cập nhật
            } else {
                toast.error(data.message || 'Failed to submit reply');
            }
        } catch (error) {
            toast.error('An error occurred while submitting the reply.');
        } finally {
            setIsSubmittingReply(false);
        }
    };


    // Xóa review (soft-delete)
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to change the status of this review?')) return;
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/reviews/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.status === 'SUCCESS') {
                toast.success('Review status changed!');
                fetchReviews();
            } else toast.error(data.message || 'Failed');
        } catch {
            toast.error('Error');
        }
        setLoading(false);
    };

    const filteredReviews = reviews.filter(r => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'active') return r.active === true || r.active === 1;
        if (statusFilter === 'inactive') return r.active === false || r.active === 0;
        return true;
    });

    return (
        <MainCard title="All Reviews">
            <Box mb={2} display="flex" justifyContent="flex-end">
                <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                        value={statusFilter}
                        label="Status"
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                </FormControl>
            </Box>
            {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>}
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Author</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Comment / Reply</TableCell>
                            <TableCell>Rating</TableCell>
                            <TableCell>Created At</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredReviews.map((r) => (
                            <TableRow key={r.id}>
                                <TableCell>{r.id}</TableCell>
                                <TableCell>{r.authorName || 'N/A'}</TableCell>
                                <TableCell>{r.type}</TableCell>
                                <TableCell sx={{ minWidth: 250 }}>
                                    {/* // <<< THAY ĐỔI: Hiển thị comment và reply tại đây */}
                                    <Box>
                                        <Typography variant="body2">{r.comment}</Typography>
                                        {r.replies && r.replies.length > 0 && (
                                            <Paper variant="outlined" sx={{ mt: 1, p: 1, bgcolor: '#f5f5f5', borderLeft: '3px solid #1890ff' }}>
                                                <Typography variant="caption" component="div" sx={{ fontWeight: 'bold', color: '#1890ff' }}>
                                                    Replied by: {r.replies[0].authorName}
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                                    "{r.replies[0].comment}"
                                                </Typography>
                                            </Paper>
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell>{r.rating}</TableCell>
                                <TableCell>{r.createdAt?.slice(0, 10)}</TableCell>
                                <TableCell>
                                    {r.active === false || r.active === 0 ? (
                                        <span style={{ color: 'red' }}>Inactive</span>
                                    ) : (
                                        <span style={{ color: 'green' }}>Active</span>
                                    )}
                                </TableCell>
                                <TableCell align="center">
                                    {/* // <<< THAY ĐỔI: Thêm nút Reply */}
                                    <Tooltip title="Reply">
                                        <span> {/* Bọc trong span để tooltip hoạt động khi button bị disabled */}
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleOpenReplyModal(r)}
                                                disabled={r.replies && r.replies.length > 0} // Vô hiệu hóa nút nếu đã có reply
                                            >
                                                <ReadFilled />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Tooltip title="Change Status">
                                        <IconButton color="error" onClick={() => handleDelete(r.id)}>
                                            <DeleteOutlined />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredReviews.length === 0 && !loading && <TableRow><TableCell colSpan={9} align="center">No reviews found.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Modal để nhập phản hồi */}
            <Modal
                open={replyModalOpen}
                onClose={handleCloseReplyModal}
                aria-labelledby="reply-modal-title"
            >
                <Box sx={modalStyle}>
                    <Typography id="reply-modal-title" variant="h6" component="h2">
                        Reply to Review by {selectedReview?.authorName}
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        margin="normal"
                        label="Your Reply"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                    />
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button onClick={handleCloseReplyModal} sx={{ mr: 1 }}>Cancel</Button>
                        <Button
                            variant="contained"
                            onClick={handleSubmitReply}
                            disabled={isSubmittingReply}
                        >
                            {isSubmittingReply ? <CircularProgress size={24} /> : 'Submit Reply'}
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </MainCard>
    );
};

export default ReviewList;