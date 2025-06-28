import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// material-ui
import {
  FormControl,
  InputAdornment,
  OutlinedInput,
  Box,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  Popper,
  Paper
} from '@mui/material';

// project-imports
import Transitions from 'components/@extended/Transitions';
import {
  SearchOutlined
} from '@ant-design/icons';

// menu items
import menuItems from 'menu-items';

// ==============================|| HEADER CONTENT - SEARCH ||============================== //

// Recursive function to search for menu items
const searchMenu = (items, query) => {
  let results = [];
  const lowerCaseQuery = query.toLowerCase();

  items.forEach(item => {
    if (item.children) {
      results = results.concat(searchMenu(item.children, query));
    }
    if (item.title && item.title.toLowerCase().includes(lowerCaseQuery) && item.url) {
      results.push(item);
    }
  });

  return results;
};


export default function Search() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);


  const handleSearch = (event) => {
    const newValue = event.target.value;
    setValue(newValue);

    if (newValue) {
      const results = searchMenu(menuItems.items, newValue);
      setSearchResults(results);
      setOpen(true);
      setAnchorEl(event.currentTarget);
    } else {
      setOpen(false);
      setSearchResults([]);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setValue('');
    setSearchResults([]);
  };

  const handleMenuItemClick = (url) => {
    handleClose();
    if (url) {
      navigate(url);
    }
  };


  return (
    <Box sx={{ width: '100%', ml: { xs: 0, md: 1 } }}>
      <FormControl sx={{ width: { xs: '100%', md: 224 } }}>
        <OutlinedInput
          size="small"
          id="header-search"
          value={value}
          onChange={handleSearch}
          placeholder="Tìm kiếm menu..."
          startAdornment={
            <InputAdornment position="start" sx={{ mr: -0.5 }}>
              <SearchOutlined />
            </InputAdornment>
          }
          aria-describedby="header-search-text"
          inputProps={{
            'aria-label': 'weight'
          }}
        />
      </FormControl>

      <Popper
        open={open}
        anchorEl={anchorEl}
        placement="bottom-start"
        style={{ zIndex: 1202 }}
        popperOptions={{
          modifiers: [{
            name: 'offset',
            options: {
              offset: [0, 5]
            },
          }, ],
        }}
      >
        <Paper
          sx={{
            width: anchorEl ? anchorEl.clientWidth : 224,
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto',
          }}
        >
          <Transitions type="fade" in={open}>
            <List>
              {searchResults.length > 0 ? (
                searchResults.map((item) => (
                  <ListItemButton key={item.id} onClick={() => handleMenuItemClick(item.url)}>
                    {item.icon && (
                      <ListItemIcon sx={{ minWidth: 35 }}>
                        <item.icon />
                      </ListItemIcon>
                    )}
                    <ListItemText primary={item.title} />
                  </ListItemButton>
                ))
              ) : (
                <ListItemButton disabled>
                  <ListItemText primary="Không tìm thấy kết quả" />
                </ListItemButton>
              )}
            </List>
          </Transitions>
        </Paper>
      </Popper>
    </Box>
  );
}
