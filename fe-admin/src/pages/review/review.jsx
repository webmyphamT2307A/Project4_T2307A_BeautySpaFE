import { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Tooltip, CircularProgress, FormControl, InputLabel, Select, MenuItem, Box
} from '@mui/material';
import { DeleteOutlined } from '@ant-design/icons';
import MainCard from 'components/MainCard';
import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:8080/api/v1';

const ReviewList = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');

    // Lấy tất cả review cho admin
    const fetchReviews = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/reviews/findAll`);
            const data = await res.json();
            if (data.status === 'SUCCESS') {
                setReviews(Array.isArray(data.data) ? data.data : []);
            } else toast.error(data.message || 'Failed to load reviews');
        } catch {
            toast.error('Error loading reviews');
        }
        setLoading(false);
    };

    useEffect(() => { fetchReviews(); }, []);

    // Xóa review
    const handleDelete = async (id) => {
        if (!window.confirm('Delete this review?')) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/reviews/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.status === 'SUCCESS') {
                toast.success('Deleted!');
                fetchReviews();
            } else toast.error(data.message || 'Failed');
        } catch {
            toast.error('Error');
        }
        setLoading(false);
    };

    // Lọc theo status (isActive)
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
            {loading && <CircularProgress />}
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Author</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Related ID</TableCell>
                            <TableCell>Rating</TableCell>
                            <TableCell>Comment</TableCell>
                            <TableCell>Created At</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredReviews.map((r) => (
                            <TableRow key={r.id}>
                                <TableCell>{r.id}</TableCell>
                                <TableCell>{r.authorName || r.customerId || 'N/A'}</TableCell>
                                <TableCell>{r.type}</TableCell>
                                <TableCell>{r.relatedId}</TableCell>
                                <TableCell>{r.rating}</TableCell>
                                <TableCell>{r.comment}</TableCell>
                                <TableCell>{r.createdAt?.slice(0, 10)}</TableCell>
                                <TableCell>
                                    {r.active === false || r.active === 0 ? (
                                        <span style={{ color: 'red' }}>Inactive</span>
                                    ) : (
                                        <span style={{ color: 'green' }}>Active</span>
                                    )}
                                </TableCell>
                                <TableCell align="center">
                                    <Tooltip title="Delete">
                                        <IconButton color="error" onClick={() => handleDelete(r.id)}>
                                            <DeleteOutlined />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredReviews.length === 0 && <TableRow><TableCell colSpan={9} align="center">No reviews.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </TableContainer>
        </MainCard>
    );
};

export default ReviewList;