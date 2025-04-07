import React from 'react';
import { MempoolProvider } from './contexts/MempoolContext';
import TransactionList from './components/TransactionList';
import SelectionControls from './components/SelectionControls';
import StatsPanel from './components/StatsPanel';
import { Container, AppBar, Toolbar, Typography, Box, Paper, Grid } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DiamondIcon from '@mui/icons-material/Diamond';
import InfoIcon from '@mui/icons-material/Info';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const App: React.FC = () => {
  return (
    <MempoolProvider>
      {/* Full-width AppBar */}
      <AppBar
        position="static"
        color="primary"
        sx={{
          boxShadow: '0px 4px 12px rgba(0,0,0,0.1)',
          transition: 'background-color 0.3s',
          backgroundColor: '#ff4081',
          width: '100%',
        }}
      >
        <Toolbar>
          <DiamondIcon sx={{ mr: 2 }} />
          <Typography
            variant="h6"
            component="div"
            sx={{
              width: '100%',
              textAlign: 'center',
              fontWeight: 600,
              fontFamily: '"Poppins", sans-serif',
            }}
          >
            DMND Pool Transaction Dashboard
          </Typography>
          <DiamondIcon sx={{ ml: 2 }} />
        </Toolbar>
      </AppBar>

      {/* Main content with sidebars */}
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          background: 'linear-gradient(135deg, #ffffff 0%, #f0f2f5 100%)',
          minHeight: 'calc(100vh - 64px)',
          p: 3,
        }}
      >
        {/* Left sidebar */}
        <Paper
          elevation={2}
          sx={{
            width: '20%',
            mr: 2,
            p: 2,
            borderRadius: 2,
            display: { xs: 'none', md: 'block' },
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
            <InfoIcon sx={{ mr: 1 }} /> Pool Stats
          </Typography>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">Total Transactions</Typography>
            <Typography variant="h5">1,245</Typography>
          </Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">Average Block Size</Typography>
            <Typography variant="h5">3.45 KB</Typography>
          </Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">Network Fee Rate</Typography>
            <Typography variant="h5">21.3 sat/vB</Typography>
          </Box>
        </Paper>

        {/* Main content */}
        <Container
          maxWidth="md"
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            borderRadius: 3,
            p: 4,
            boxShadow: '0px 6px 30px rgba(0,0,0,0.1)',
            transition: 'transform 0.3s',
            '&:hover': { transform: 'scale(1.005)' },
          }}
        >
          <StatsPanel />
          <SelectionControls />
          <TransactionList />
        </Container>

        {/* Right sidebar */}
        <Paper
          elevation={2}
          sx={{
            width: '20%',
            ml: 2,
            p: 2,
            borderRadius: 2,
            display: { xs: 'none', md: 'block' },
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
            <TrendingUpIcon sx={{ mr: 1 }} /> Recent Activity
          </Typography>
          <Box sx={{ mb: 2, pb: 2, borderBottom: '1px solid #eee' }}>
            <Typography variant="body2" color="text.secondary">2 minutes ago</Typography>
            <Typography variant="body1">New block mined: #784521</Typography>
          </Box>
          <Box sx={{ mb: 2, pb: 2, borderBottom: '1px solid #eee' }}>
            <Typography variant="body2" color="text.secondary">15 minutes ago</Typography>
            <Typography variant="body1">Fee rate spiked to 85.2 sat/vB</Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">32 minutes ago</Typography>
            <Typography variant="body1">57 transactions confirmed</Typography>
          </Box>
        </Paper>
      </Box>

      {/* Toast Notifications */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </MempoolProvider>
  );
};

export default App;

