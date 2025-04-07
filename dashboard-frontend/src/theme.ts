import { createTheme } from '@mui/material/styles';

export const customTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#ff4081', // vibrant pink accent
    },
    secondary: {
      main: '#536dfe', // cool blue
    },
    background: {
      default: '#f0f2f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#555555',
    },
  },
  typography: {
    htmlFontSize: 16,
    fontSize: 14,
    fontFamily: '"Poppins", "Roboto", sans-serif',
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingTop: '32px',
          paddingBottom: '32px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: '12px',
          boxShadow: '0px 4px 20px rgba(0,0,0,0.06)',
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 0,
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0px 2px 10px rgba(0,0,0,0.05)',
          transition: 'box-shadow 0.3s',
          '&:hover': { boxShadow: '0px 4px 20px rgba(0,0,0,0.1)' },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
          boxShadow: '0px 2px 8px rgba(0,0,0,0.08)',
          transition: 'background-color 0.3s, box-shadow 0.3s',
          '&:hover': { boxShadow: '0px 4px 12px rgba(0,0,0,0.12)' },
        },
      },
    },
  },
});





