import React from 'react';
import { useMempool } from '../contexts/MempoolContext';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Tooltip,
  LinearProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import InfoIcon from '@mui/icons-material/Info';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  CartesianGrid,
  Cell
} from 'recharts';

const StatItem = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0px 4px 20px rgba(0,0,0,0.06)',
  transition: 'transform 0.3s',
  '&:hover': { transform: 'scale(1.03)' },
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '4px',
    height: '100%',
    backgroundColor: theme.palette.primary.main,
  },
}));

// Bitcoin block subsidy in sats (6.25 BTC)
const BLOCK_SUBSIDY_SATS = 625_000_000;
// Number of bins for the histogram
const BIN_COUNT = 15;
// Bar colors
const DEFAULT_BAR_COLOR = '#8884d8';
const ACCENT_BAR_COLOR = '#ff4081';

const StatsPanel: React.FC = () => {
  const { transactions, selected, loading } = useMempool();

  const {
    totalSelected,
    totalFees,
    totalSize,
    avgFeeRate,
    maxFeeRate,
    projectedRewardBTC,
    histogramData
  } = React.useMemo(() => {
    const selectedTxs = transactions.filter(tx => selected.includes(tx.txid));
    const totalFees = selectedTxs.reduce((acc, tx) => acc + tx.fee_rate * tx.size, 0);
    const totalSize = selectedTxs.reduce((acc, tx) => acc + tx.size, 0);
    const avgFeeRate = selectedTxs.length
      ? selectedTxs.reduce((acc, tx) => acc + tx.fee_rate, 0) / selectedTxs.length
      : 0;
    const maxFeeRate = selectedTxs.length
      ? Math.max(...selectedTxs.map(tx => tx.fee_rate))
      : 0;
    const projectedRewardBTC = (totalFees + BLOCK_SUBSIDY_SATS) / 1e8;

    // Build histogram over all transactions
    const rates = transactions.map(tx => tx.fee_rate);
    const minRate = Math.min(...rates);
    const maxRate = Math.max(...rates);
    const binSize = (maxRate - minRate) / BIN_COUNT || 1;

    // Determine selected range
    const selectedRates = selectedTxs.map(tx => tx.fee_rate);
    const selMin = Math.min(...selectedRates, Infinity);
    const selMax = Math.max(...selectedRates, -Infinity);

    const bins = Array.from({ length: BIN_COUNT }, (_, i) => {
      const start = minRate + i * binSize;
      const end = start + binSize;
      return {
        range: `${start.toFixed(0)}–${end.toFixed(0)}`,
        count: 0,
        isSelected: selectedRates.length > 0 && end >= selMin && start <= selMax
      };
    });
    rates.forEach(rate => {
      const idx = Math.min(
        BIN_COUNT - 1,
        Math.floor((rate - minRate) / binSize)
      );
      bins[idx].count++;
    });

    return {
      totalSelected: selectedTxs.length,
      totalFees,
      totalSize,
      avgFeeRate,
      maxFeeRate,
      projectedRewardBTC,
      histogramData: bins
    };
  }, [transactions, selected]);

  // % of a 1 MB block
  const blockUsagePercent = Math.min((totalSize / 1_000_000) * 100, 100);

  return (
    <Box sx={{ flexGrow: 1, mb: 4, position: 'relative', width: '100%' }}>
      {loading && (
        <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} />
      )}

      <Typography
        variant="h6"
        gutterBottom
        sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}
      >
        Fee‑Rate Distribution
      </Typography>
      <Box sx={{ height: 200, mb: 4 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={histogramData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <ReTooltip />
            <Bar dataKey="count">
              {histogramData.map((entry, idx) => (
                <Cell
                  key={`cell-${idx}`}
                  fill={entry.isSelected ? ACCENT_BAR_COLOR : DEFAULT_BAR_COLOR}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>

      <Typography
        variant="h6"
        gutterBottom
        sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}
      >
        Selected Transactions Summary
      </Typography>

      <Grid container spacing={3}>
        {[
          {
            value: totalSelected,
            label: 'Transactions Selected',
            tooltip: 'Number of transactions in current selection',
            unit: '',
          },
          {
            value: totalFees,
            label: 'Total Fees',
            tooltip: 'Sum of all fees in current selection',
            unit: 'sat',
            format: (v: number) => v.toLocaleString(),
          },
          {
            value: avgFeeRate,
            label: 'Average Fee Rate',
            tooltip: 'Average fee rate across selected transactions',
            unit: 'sat/vB',
            format: (v: number) => v.toFixed(1),
          },
          {
            value: maxFeeRate,
            label: 'Max Fee Rate',
            tooltip: 'Highest fee rate in selection',
            unit: 'sat/vB',
            format: (v: number) => v.toFixed(1),
          },
          {
            value: totalSize,
            label: 'Total Size',
            tooltip: 'Combined size of selected transactions',
            unit: 'bytes',
            format: (v: number) => v.toLocaleString(),
          },
          {
            value: projectedRewardBTC,
            label: 'Projected Reward',
            tooltip: 'Total fees + subsidy in BTC',
            unit: 'BTC',
            format: (v: number) => v.toFixed(5),
          },
        ].map((stat, idx) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={idx}>
            <StatItem elevation={0}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {stat.label}
                <Tooltip title={stat.tooltip} arrow>
                  <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                </Tooltip>
              </Typography>
              <Typography
                variant="h4"
                component="div"
                sx={{ fontWeight: 700, color: 'text.primary' }}
              >
                {stat.format ? stat.format(stat.value) : stat.value}
                {stat.unit && (
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    {stat.unit}
                  </Typography>
                )}
              </Typography>
            </StatItem>
          </Grid>
        ))}
      </Grid>

      {/* Block size usage gauge */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Block Size Usage ({blockUsagePercent.toFixed(1)}% of 1 MB)
        </Typography>
        <LinearProgress
          variant="determinate"
          value={blockUsagePercent}
          sx={{ height: 10, borderRadius: 5 }}
        />
      </Box>
    </Box>
  );
};

export default StatsPanel;









