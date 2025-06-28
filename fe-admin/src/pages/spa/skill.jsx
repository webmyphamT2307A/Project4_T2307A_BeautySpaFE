import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TextField,
} from '@mui/material';
import { AddOutlined, EditOutlined, DeleteOutlined, CloseOutlined } from '@mui/icons-material';
import MainCard from 'components/MainCard';
import axios from 'axios';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SkillManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [skills, setSkills] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bộ lọc
  const [filterEmployees, setFilterEmployees] = useState([]); // mảng id nhân viên được chọn lọc
  const [filterSkills, setFilterSkills] = useState([]);       // mảng id kỹ năng được chọn lọc

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('add'); // 'add' or 'edit'
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);

  const [saving, setSaving] = useState(false);
  const [deletingIds, setDeletingIds] = useState([]);

  // State cho dialog tạo kỹ năng mới
  const [openNewSkillDialog, setOpenNewSkillDialog] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [isCreatingSkill, setIsCreatingSkill] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get('http://localhost:8080/api/v1/user/accounts/staff'),
      axios.get('http://localhost:8080/api/v1/skills'),
      axios.get('http://localhost:8080/api/v1/user-skills'),
    ])
      .then(([employeeRes, skillRes, userSkillRes]) => {
        setEmployees(employeeRes.data);
        setSkills(skillRes.data);
        setUserSkills(userSkillRes.data);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        toast.error('Lỗi tải dữ liệu');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleOpenDialog = (type, employee = null) => {
    setDialogType(type);
    if (type === 'add') {
      setSelectedEmployeeIds([]);
      setSelectedSkills([]);
    } else {
      setSelectedEmployeeIds([employee.id]);
      setSelectedSkills(
        userSkills
          .filter((us) => us.id.userId === employee.id)
          .map((us) => us.skill.id)
      );
    }
    setSelectedEmployee(employee);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    if (!saving) {
      setOpenDialog(false);
      setSelectedEmployee(null);
      setSelectedSkills([]);
      setSelectedEmployeeIds([]);
    }
  };

  const handleSave = () => {
    const userIds = dialogType === 'edit' ? [selectedEmployee.id] : selectedEmployeeIds;

    if (userIds.length === 0) {
      toast.warn('Vui lòng chọn nhân viên');
      return;
    }

    if (selectedSkills.length === 0) {
      toast.warn('Vui lòng chọn kỹ năng');
      return;
    }

    setSaving(true);

    const requests = userIds.map((id) => {
      const payload = { userId: id, skillIds: selectedSkills };
      if (dialogType === 'add') {
        return axios.post('http://localhost:8080/api/v1/user-skills/insert', payload);
      } else {
        return axios.put(`http://localhost:8080/api/v1/user-skills/edit`, payload);
      }
    });

    Promise.all(requests)
      .then(() => axios.get('http://localhost:8080/api/v1/user-skills'))
      .then((res) => {
        setUserSkills(res.data);
        toast.success(dialogType === 'add' ? 'Gán kỹ năng thành công' : 'Cập nhật kỹ năng thành công');
        handleCloseDialog();
      })
      .catch((error) => {
        console.error('Lỗi lưu kỹ năng:', error);
        toast.error('Lưu kỹ năng thất bại');
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const handleDelete = (employeeId) => {
    setDeletingIds((prev) => [...prev, employeeId]);

    axios
      .delete(`http://localhost:8080/api/v1/user-skills/delete/${employeeId}`)
      .then(() => axios.get('http://localhost:8080/api/v1/user-skills'))
      .then((res) => {
        setUserSkills(res.data);
        toast.success('Xóa kỹ năng thành công');
      })
      .catch((error) => {
        console.error('Error deleting skills:', error);
        toast.error('Xóa kỹ năng thất bại');
      })
      .finally(() => {
        setDeletingIds((prev) => prev.filter((id) => id !== employeeId));
      });
  };

  // Handlers cho việc tạo kỹ năng mới
  const handleOpenNewSkillDialog = () => {
    setNewSkillName('');
    setOpenNewSkillDialog(true);
  };

  const handleCloseNewSkillDialog = () => {
    if (!isCreatingSkill) {
      setOpenNewSkillDialog(false);
    }
  };

  const handleSaveNewSkill = () => {
    if (!newSkillName.trim()) {
      toast.warn('Vui lòng nhập tên kỹ năng');
      return;
    }
    setIsCreatingSkill(true);
    // Giả sử API endpoint để tạo skill là POST /api/v1/skills
    axios.post('http://localhost:8080/api/v1/skills', { skillName: newSkillName })
      .then(() => {
        toast.success('Thêm kỹ năng mới thành công!');
        handleCloseNewSkillDialog();
        // Tải lại danh sách kỹ năng
        return axios.get('http://localhost:8080/api/v1/skills');
      })
      .then(res => {
        setSkills(res.data);
      })
      .catch(error => {
        console.error('Lỗi khi tạo kỹ năng mới:', error);
        toast.error(error.response?.data?.message || 'Thêm kỹ năng mới thất bại');
      })
      .finally(() => {
        setIsCreatingSkill(false);
      });
  };

  // Lọc employees hiển thị theo bộ lọc nhân viên + kỹ năng
  const filteredEmployees = employees.filter((emp) => {
    // Chỉ lấy nhân viên có skill
    if (!userSkills.some((us) => us.id.userId === emp.id)) return false;

    // Nếu filter nhân viên khác rỗng, chỉ giữ nhân viên nằm trong filter
    if (filterEmployees.length > 0 && !filterEmployees.includes(emp.id)) return false;

    // Nếu filter kỹ năng khác rỗng, chỉ giữ nhân viên có ít nhất 1 skill thuộc filterSkills
    if (filterSkills.length > 0) {
      const empSkillIds = userSkills
        .filter((us) => us.id.userId === emp.id)
        .map((us) => us.skill.id);
      if (!empSkillIds.some((skillId) => filterSkills.includes(skillId))) return false;
    }

    return true;
  });

  const availableEmployees = employees.filter(
    (emp) => !userSkills.some((us) => us.id.userId === emp.id)
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <MainCard title="Quản Lý Kỹ Năng Nhân Viên">
      {/* Filter Box */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <Box sx={{ display: 'flex', gap: 2, mb: 0 }}>
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel id="filter-employee-label">Lọc theo Nhân Viên</InputLabel>
          <Select
            labelId="filter-employee-label"
            multiple
            value={filterEmployees}
            onChange={(e) => setFilterEmployees(e.target.value)}
            renderValue={(selected) =>
              selected
                .map((id) => employees.find((emp) => emp.id === id)?.fullName)
                .join(', ')
            }
          >
            {employees.map((emp) => (
              <MenuItem key={emp.id} value={emp.id}>
                {emp.fullName}
                {filterEmployees.includes(emp.id) && (
                  <Chip label="✓" color="success" size="small" sx={{ ml: 1 }} />
                )}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel id="filter-skill-label">Lọc theo Kỹ Năng</InputLabel>
          <Select
            labelId="filter-skill-label"
            multiple
            value={filterSkills}
            onChange={(e) => setFilterSkills(e.target.value)}
            renderValue={(selected) =>
              selected
                .map((id) => skills.find((skill) => skill.id === id)?.skillName)
                .join(', ')
            }
          >
            {skills.map((skill) => (
              <MenuItem key={skill.id} value={skill.id}>
                {skill.skillName}
                {filterSkills.includes(skill.id) && (
                  <Chip label="✓" color="success" size="small" sx={{ ml: 1 }} />
                )}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 1 }}>
        <Button
            variant="contained"
            color="secondary"
            startIcon={<AddOutlined />}
            onClick={handleOpenNewSkillDialog}
            disabled={saving || isCreatingSkill}
        >
          Tạo Kỹ Năng Mới
        </Button>
        <Button
          variant="contained"
          startIcon={<AddOutlined />}
          onClick={() => handleOpenDialog('add')}
          disabled={saving}
        >
          {saving && dialogType === 'add' ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            'Gán Kỹ Năng'
          )}
        </Button>
      </Box>
      </div>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>STT</TableCell>
              <TableCell>Tên Nhân Viên</TableCell>
              <TableCell>Kỹ Năng</TableCell>
              <TableCell>Hành Động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEmployees.map((employee, index) => {
              const employeeSkills = userSkills
                .filter((us) => us.id.userId === employee.id)
                .map((us) => us.skill.skillName);

              const isDeleting = deletingIds.includes(employee.id);

              return (
                <TableRow key={employee.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{employee.fullName}</TableCell>
                  <TableCell>
                    {employeeSkills.map((skill, idx) => (
                      <Chip key={idx} label={skill} sx={{ mr: 1, mb: 1 }} />
                    ))}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenDialog('edit', employee)}
                      disabled={saving || isDeleting}
                    >
                      <EditOutlined />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(employee.id)}
                      disabled={saving || isDeleting}
                    >
                      {isDeleting ? (
                        <CircularProgress size={24} color="error" />
                      ) : (
                        <DeleteOutlined />
                      )}
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'add' ? 'Gán Kỹ Năng cho Nhân Viên' : 'Chỉnh Sửa Kỹ Năng'}
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            disabled={saving}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseOutlined />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {dialogType === 'add' && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="employee-label">Chọn Nhân Viên</InputLabel>
              <Select
                labelId="employee-label"
                multiple
                value={selectedEmployeeIds}
                onChange={(e) => setSelectedEmployeeIds(e.target.value)}
                renderValue={(selected) =>
                  selected
                    .map((id) => availableEmployees.find((emp) => emp.id === id)?.fullName)
                    .join(', ')
                }
                disabled={saving}
              >
                {availableEmployees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.fullName}
                    {selectedEmployeeIds.includes(emp.id) && (
                      <Chip
                        label="✓"
                        color="success"
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {dialogType === 'edit' && (
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Nhân Viên: {selectedEmployee?.fullName}
            </Typography>
          )}

          <FormControl fullWidth>
            <InputLabel id="skills-label">Kỹ Năng</InputLabel>
            <Select
              labelId="skills-label"
              multiple
              value={selectedSkills}
              onChange={(e) => setSelectedSkills(e.target.value)}
              renderValue={(selected) =>
                selected
                  .map((id) => skills.find((skill) => skill.id === id)?.skillName)
                  .join(', ')
              }
              disabled={saving}
            >
              {skills.map((skill) => (
                <MenuItem key={skill.id} value={skill.id}>
                  {skill.skillName}
                  {selectedSkills.includes(skill.id) && (
                    <Chip
                      label="✓"
                      color="success"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog} variant="outlined" disabled={saving}>
            Hủy
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={24} color="inherit" /> : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog tạo kỹ năng mới */}
      <Dialog open={openNewSkillDialog} onClose={handleCloseNewSkillDialog} maxWidth="xs" fullWidth>
        <DialogTitle>
          Tạo Kỹ Năng Mới
          <IconButton
              aria-label="close"
              onClick={handleCloseNewSkillDialog}
              disabled={isCreatingSkill}
              sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseOutlined />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
              autoFocus
              margin="dense"
              id="skillName"
              label="Tên Kỹ Năng"
              type="text"
              fullWidth
              variant="outlined"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              disabled={isCreatingSkill}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewSkillDialog} variant="outlined" disabled={isCreatingSkill}>
            Hủy
          </Button>
          <Button onClick={handleSaveNewSkill} variant="contained" disabled={isCreatingSkill}>
            {isCreatingSkill ? <CircularProgress size={24} color="inherit" /> : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer position="top-right" autoClose={2000} />
    </MainCard>
  );
};

export default SkillManagement;