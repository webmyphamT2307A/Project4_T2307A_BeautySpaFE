import { useState, useEffect } from 'react';
import {
    Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, TablePagination,
    Box, InputAdornment, Tooltip
} from '@mui/material';
import {
    SearchOutlined,
    CloseOutlined,
    EditOutlined,
    DeleteOutlined,
    PlusOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:8080/api/v1/branch';

const BranchManager = () => {
    // States
    const [branches, setBranches] = useState([]);
    const [filteredBranches, setFilteredBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Dialog states
    const [openDialog, setOpenDialog] = useState(false);
    const [editBranch, setEditBranch] = useState(null);
    const [branchForm, setBranchForm] = useState({ name: '', address: '', isActive: true });

    // Load all branches
    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = () => {
        setLoading(true);
        fetch(API_URL)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'SUCCESS' && Array.isArray(data.data)) {
                    setBranches(data.data);
                    setFilteredBranches(data.data);
                } else {
                    setBranches([]);
                    setFilteredBranches([]);
                    toast.error('Failed to load branches');
                }
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
                toast.error('Error loading branches');
            });
    };

    // Filter branches
    useEffect(() => {
        let results = [...branches];
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            results = results.filter(
                branch =>
                    branch.name.toLowerCase().includes(query) ||
                    branch.address.toLowerCase().includes(query)
            );
        }
        setFilteredBranches(results);
        setPage(0);
    }, [searchQuery, branches]);

    // Handlers
    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    const handleSearchChange = (event) => setSearchQuery(event.target.value);

    // CRUD handlers
    const handleOpenDialog = (branch = null) => {
        setEditBranch(branch);
        setBranchForm(branch ? { ...branch } : { name: '', address: '', isActive: true });
        setOpenDialog(true);
    };
    const handleCloseDialog = () => setOpenDialog(false);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setBranchForm(prev => ({ ...prev, [name]: value }));
    };

    // Create or update branch
    const handleSaveBranch = () => {
        if (!branchForm.name || !branchForm.address) {
            toast.error('Vui lòng nhập đầy đủ tên và địa chỉ!');
            return;
        }
        setLoading(true);
        if (editBranch) {
            // Update
            fetch(`${API_URL}/update/${editBranch.id}?BiD=${editBranch.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(branchForm)
            })
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'SUCCESS') {
                        toast.success('Cập nhật chi nhánh thành công!');
                        fetchBranches();
                        handleCloseDialog();
                    } else {
                        toast.error(data.message || 'Cập nhật thất bại');
                    }
                    setLoading(false);
                })
                .catch(() => {
                    toast.error('Lỗi khi cập nhật chi nhánh');
                    setLoading(false);
                });
        } else {
            // Create
            fetch(`${API_URL}/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(branchForm)
            })
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'SUCCESS') {
                        toast.success('Tạo chi nhánh thành công!');
                        fetchBranches();
                        handleCloseDialog();
                    } else {
                        toast.error(data.message || 'Tạo thất bại');
                    }
                    setLoading(false);
                })
                .catch(() => {
                    toast.error('Lỗi khi tạo chi nhánh');
                    setLoading(false);
                });
        }
    };

    // Delete branch (set isActive = false)
    const handleDeleteBranch = (branch) => {
        if (!window.confirm('Bạn có chắc muốn xóa chi nhánh này?')) return;
        setLoading(true);
        fetch(`${API_URL}/delete/${branch.id}?BiD=${branch.id}`, {
            method: 'PUT'
        })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'SUCCESS') {
                    toast.success('Xóa chi nhánh thành công!');
                    fetchBranches();
                } else {
                    toast.error(data.message || 'Xóa thất bại');
                }
                setLoading(false);
            })
            .catch(() => {
                toast.error('Lỗi khi xóa chi nhánh');
                setLoading(false);
            });
    };

    return (
        <MainCard title="Branch Management">
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
                <TextField
                    size="small"
                    placeholder="Search by branch name or address..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchOutlined />
                            </InputAdornment>
                        ),
                        endAdornment: searchQuery ? (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setSearchQuery('')}>
                                    <CloseOutlined />
                                </IconButton>
                            </InputAdornment>
                        ) : null
                    }}
                />
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PlusOutlined />}
                    onClick={() => handleOpenDialog()}
                >
                    Add Branch
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Branch Name</TableCell>
                            <TableCell>Address</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredBranches.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(branch => (
                            <TableRow key={branch.id}>
                                <TableCell>{branch.id}</TableCell>
                                <TableCell>{branch.name}</TableCell>
                                <TableCell>{branch.address}</TableCell>
                                <TableCell>{branch.isActive ? 'Active' : 'No active'}</TableCell>
                                <TableCell>
                                    <Tooltip title="Edit">
                                        <IconButton color="primary" onClick={() => handleOpenDialog(branch)}>
                                            <EditOutlined />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                        <IconButton color="error" onClick={() => handleDeleteBranch(branch)}>
                                            <DeleteOutlined />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[10, 20, 50]}
                component="div"
                count={filteredBranches.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{editBranch ? 'update' : 'add'}</DialogTitle>
                <DialogContent>
                    <TextField
                        margin="normal"
                        label="Branch Name"
                        name="name"
                        fullWidth
                        value={branchForm.name}
                        onChange={handleFormChange}
                    />
                    <TextField
                        margin="normal"
                        label="Address"
                        name="address"
                        fullWidth
                        value={branchForm.address}
                        onChange={handleFormChange}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="inherit">Close</Button>
                    <Button onClick={handleSaveBranch} variant="contained" color="primary" disabled={loading}>
                        {loading ? 'Đang lưu...' : 'Lưu'}
                    </Button>
                </DialogActions>
            </Dialog>
        </MainCard>
    );
};

export default BranchManager;