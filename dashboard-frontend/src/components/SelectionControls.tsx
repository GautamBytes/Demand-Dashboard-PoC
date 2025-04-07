import React from 'react';
import { useMempool } from '../contexts/MempoolContext';
import axios from 'axios';
import {
  Button,
  ButtonGroup,
  Stack,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  AttachMoney as FeeIcon,
  Schedule as AgeIcon,
  Storage as SizeIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const SelectionControls: React.FC = () => {
  const { autoSelect, selected, refresh } = useMempool();
  const [autoSelectCount, setAutoSelectCount] = React.useState(5);

  // Job-declare dialog state
  const [openJobDlg, setOpenJobDlg] = React.useState(false);
  const [coinbase, setCoinbase] = React.useState('');
  const [jobResult, setJobResult] = React.useState<{
    job_id: string;
    header_template: string;
  } | null>(null);
  const [openResultDlg, setOpenResultDlg] = React.useState(false);

  const handleAutoSelect = (strategy: 'feeRate' | 'age' | 'size') => {
    autoSelect(strategy, autoSelectCount);
    toast.info(`Auto-selected top ${autoSelectCount} by ${strategy}`);
  };

  const onSubmitClick = () => {
    if (selected.length === 0) return;
    setOpenJobDlg(true);
  };

  const declareJob = async () => {
    try {
      const resp = await axios.post<{
        job_id: string;
        header_template: string;
      }>('http://localhost:3000/job_declare', {
        coinbase,
        txids: selected,
      });
      setJobResult(resp.data);
      setOpenJobDlg(false);
      setOpenResultDlg(true);
    } catch (err) {
      toast.error('Failed to declare job');
    }
  };

  return (
    <>
      <Stack
        direction="row"
        spacing={2}
        sx={{ mb: 3, alignItems: 'center', justifyContent: 'center', width: '100%' }}
      >
        {/* Existing auto‑select controls */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel sx={{ color: 'text.primary' }}>Select Count</InputLabel>
          <Select
            value={autoSelectCount}
            label="Select Count"
            onChange={(e) => setAutoSelectCount(Number(e.target.value))}
            sx={{
              color: 'text.primary',
              '.MuiOutlinedInput-notchedOutline': { borderColor: 'text.secondary' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
            }}
          >
            {[5, 10, 15, 20].map((num) => (
              <MenuItem key={num} value={num}>
                {num} TXs
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <ButtonGroup variant="contained">
          <Tooltip title="Select highest fee transactions" arrow>
            <Button startIcon={<FeeIcon />} onClick={() => handleAutoSelect('feeRate')}>
              Fee Rate
            </Button>
          </Tooltip>
          <Tooltip title="Select oldest transactions" arrow>
            <Button startIcon={<AgeIcon />} onClick={() => handleAutoSelect('age')}>
              Age
            </Button>
          </Tooltip>
          <Tooltip title="Select smallest transactions" arrow>
            <Button startIcon={<SizeIcon />} onClick={() => handleAutoSelect('size')}>
              Size
            </Button>
          </Tooltip>
        </ButtonGroup>

        <Button
          variant="contained"
          color="success"
          startIcon={<SendIcon />}
          onClick={onSubmitClick}
          disabled={selected.length === 0}
        >
          Declare Job ({selected.length})
        </Button>

        <Button variant="outlined" onClick={refresh} sx={{ ml: 'auto' }}>
          Refresh Data
        </Button>
      </Stack>

      {/* Coinbase input dialog */}
      <Dialog open={openJobDlg} onClose={() => setOpenJobDlg(false)}>
        <DialogTitle>Enter Coinbase Address</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Coinbase Address"
            fullWidth
            value={coinbase}
            onChange={(e) => setCoinbase(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenJobDlg(false)}>Cancel</Button>
          <Button onClick={declareJob} disabled={!coinbase.trim()} variant="contained">
            Declare
          </Button>
        </DialogActions>
      </Dialog>

      {/* Result dialog */}
      <Dialog open={openResultDlg} onClose={() => setOpenResultDlg(false)}>
        <DialogTitle>Job Declared</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Job ID"
            fullWidth
            margin="dense"
            value={jobResult?.job_id || ''}
            InputProps={{ readOnly: true }}
          />
          <TextField
            label="Header Template"
            fullWidth
            margin="dense"
            multiline
            minRows={3}
            value={jobResult?.header_template || ''}
            InputProps={{ readOnly: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResultDlg(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SelectionControls;







