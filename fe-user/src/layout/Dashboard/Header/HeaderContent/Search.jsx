import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

// material-ui
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';

// assets
import SearchOutlined from '@ant-design/icons/SearchOutlined';

// project import
import menuItems from 'menu-items'; // Corrected import path

// ==============================|| HEADER CONTENT - SEARCH ||============================== //

// Function to flatten the menu items
const flattenMenuItems = (items) => {
  let flat = [];
  items.forEach((item) => {
    if (item.children) {
      flat = flat.concat(flattenMenuItems(item.children));
    } else {
      flat.push({
        label: item.title,
        url: item.url
      });
    }
  });
  return flat;
};

export default function Search() {
  const navigate = useNavigate();
  const [value, setValue] = useState(null);
  const [inputValue, setInputValue] = useState('');

  const options = flattenMenuItems(menuItems.items);

  return (
    <Box sx={{ width: '100%', ml: { xs: 0, md: 1 } }}>
      <FormControl sx={{ width: { xs: '100%', md: 224 } }}>
        <Autocomplete
          value={value}
          onChange={(event, newValue) => {
            if (newValue && newValue.url) {
              navigate(newValue.url);
              setValue(null); 
            }
          }}
          inputValue={inputValue}
          onInputChange={(event, newInputValue) => {
            setInputValue(newInputValue);
          }}
          id="header-search-autocomplete"
          options={options}
          getOptionLabel={(option) => option.label || ''}
          isOptionEqualToValue={(option, value) => option.url === value.url}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              placeholder="Tìm kiếm chức năng..."
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start" sx={{ mr: -0.5 }}>
                    <SearchOutlined />
                  </InputAdornment>
                )
              }}
            />
          )}
        />
      </FormControl>
    </Box>
  );
}
