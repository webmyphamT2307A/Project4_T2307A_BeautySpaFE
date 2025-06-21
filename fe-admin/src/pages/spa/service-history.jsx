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

const API_URL = 'http://localhost:8080/api/v1/serviceHistory';

const ServiceHistory = () => {
  // States
  const [serviceHistories, setServiceHistories] = useState([]);
  const [filteredHistories, setFilteredHistories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Load data from backend
  useEffect(() => {
    setLoading(true);
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'SUCCESS' && Array.isArray(data.data)) {
          setServiceHistories(data.data);
          setFilteredHistories(data.data);
        } else {
          setServiceHistories([]);
          setFilteredHistories([]);
          toast.error('Failed to load service history');
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        toast.error('Error loading service history');
      });
  }, []);

  // Filter service histories
  useEffect(() => {
    let results = [...serviceHistories];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
              results = results.filter(
          history =>
            (history.serviceName && history.serviceName.toLowerCase().includes(query)) ||
            (history.userName && history.userName.toLowerCase().includes(query)) ||
            (history.customerName && history.customerName.toLowerCase().includes(query)) ||
            (history.notes && history.notes.toLowerCase().includes(query)) ||
            (history.customerId && history.customerId.toString().includes(query))
        );
    }

    setFilteredHistories(results);
    setPage(0);
  }, [searchQuery, serviceHistories]);

  // Handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  return (
    <MainCard title="Service History Management">
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by service name, staff name, customer name, notes, or customer ID..."
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
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Service Name</TableCell>
              <TableCell>Staff</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Customer Name</TableCell>
              <TableCell>Appointment Date</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredHistories.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(history => (
              <TableRow key={history.id}>
                <TableCell>{history.id}</TableCell>
                <TableCell>{history.serviceName}</TableCell>
                <TableCell>{history.userName || 'N/A'}</TableCell>
                <TableCell>{history.price}$</TableCell>
                <TableCell>{history.customerName}</TableCell>
                <TableCell>{new Date(history.appointmentDate).toLocaleString()}</TableCell>
                <TableCell>{history.notes}</TableCell>
                <TableCell>{new Date(history.createdAt).toLocaleString()}</TableCell>
                <TableCell>{history.isActive ? 'Active' : 'Inactive'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 20, 50]}
        component="div"
        count={filteredHistories.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </MainCard>
  );
};

export default ServiceHistory;