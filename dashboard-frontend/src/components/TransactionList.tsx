import React, { useState } from 'react';
import { useMempool, Transaction } from '../contexts/MempoolContext';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, Typography, Dialog, DialogTitle, DialogContent, DialogContentText, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const columns: GridColDef[] = [
  { 
    field: 'txid', 
    headerName: 'TXID', 
    width: 180,
    renderCell: (params) => (
      <Typography fontFamily="monospace">
        {params.value.slice(0, 8)}...{params.value.slice(-4)}
      </Typography>
    )
  },
  { 
    field: 'fee_rate', 
    headerName: 'Fee Rate (sat/vB)', 
    width: 150,
    valueFormatter: (params) => params.value.toFixed(1)
  },
  { 
    field: 'size', 
    headerName: 'Size (bytes)', 
    width: 120,
    valueFormatter: (params) => params.value.toLocaleString()
  },
  { field: 'age', headerName: 'Age (min)', width: 100 },
  { field: 'inputs', headerName: 'Inputs', width: 90 },
  { field: 'outputs', headerName: 'Outputs', width: 90 },
];

const TransactionList: React.FC = () => {
  const { transactions, selected, setSelected } = useMempool();
  const [open, setOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const handleRowClick = (params: any) => {
    const tx = transactions.find((t) => t.txid === params.row.txid);
    if (tx) {
      setSelectedTx(tx);
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedTx(null);
  };

  return (
    <Box sx={{ height: 600, width: '100%', mt: 2 }}>
      <DataGrid
        rows={transactions}
        columns={columns}
        getRowId={(row) => row.txid}
        checkboxSelection
        disableRowSelectionOnClick
        onRowSelectionModelChange={(ids: string[]) => {
          setSelected(ids);
        }}
        onRowClick={handleRowClick}
        rowSelectionModel={selected}
        sx={{
          backgroundColor: 'background.paper',
          color: 'text.primary',
          border: 0,
          borderRadius: '12px',
          transition: 'box-shadow 0.3s',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'rgba(0,0,0,0.03)',
            fontWeight: 'bold',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'rgba(255,64,129,0.08)',
            cursor: 'pointer',
          },
          '& .Mui-selected': {
            backgroundColor: 'rgba(255,64,129,0.25) !important',
          },
        }}
        localeText={{
          noRowsLabel: 'No transactions in mempool',
          footerRowSelected: (count) =>
            `${count.toLocaleString()} transaction${count !== 1 ? 's' : ''} selected`,
        }}
      />

      <Dialog open={open} onClose={handleClose} PaperProps={{ sx: { borderRadius: 3, p: 2 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>
          Transaction Details
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'text.secondary',
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedTx ? (
            <Box>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>TXID:</strong> {selectedTx.txid}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Fee Rate:</strong> {selectedTx.fee_rate.toFixed(1)} sat/vB
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Size:</strong> {selectedTx.size} bytes
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Inputs:</strong> {selectedTx.inputs}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Outputs:</strong> {selectedTx.outputs}
              </Typography>
              <Typography variant="body1">
                <strong>Age:</strong> {selectedTx.age} minutes
              </Typography>
            </Box>
          ) : (
            <DialogContentText>No transaction selected.</DialogContentText>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default TransactionList;





