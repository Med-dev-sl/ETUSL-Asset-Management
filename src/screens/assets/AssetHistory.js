import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { getAssetHistory, getAssetById } from '../../firebase/assetService';

const getTimelineIcon = (type) => {
  switch (type) {
    case 'created':
      return <AddIcon />;
    case 'updated':
      return <EditIcon />;
    case 'disposed':
      return <DeleteIcon />;
    default:
      return <EditIcon />;
  }
};

const getTimelineColor = (type) => {
  switch (type) {
    case 'created':
      return 'success';
    case 'updated':
      return 'primary';
    case 'disposed':
      return 'error';
    default:
      return 'grey';
  }
};

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp.seconds * 1000).toLocaleString();
};

const AssetHistory = () => {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAssetAndHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadAssetAndHistory = async () => {
    try {
      const [assetData, historyData] = await Promise.all([
        getAssetById(id),
        getAssetHistory(id)
      ]);
      setAsset(assetData);
      setHistory(historyData);
    } catch (error) {
      console.error('Error loading asset history:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Asset History
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Asset Details
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <Typography><strong>Name:</strong> {asset?.name}</Typography>
          <Typography><strong>Category:</strong> {asset?.category}</Typography>
          <Typography><strong>Serial Number:</strong> {asset?.serialNumber}</Typography>
          <Typography><strong>Status:</strong> {asset?.status}</Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          History Timeline
        </Typography>

        <Timeline position="alternate">
          {history.map((event) => (
            <TimelineItem key={event.id}>
              <TimelineOppositeContent color="text.secondary">
                {formatDate(event.timestamp)}
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot color={getTimelineColor(event.type)}>
                  {getTimelineIcon(event.type)}
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" component="span">
                    {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                  </Typography>
                  <Typography>{event.details}</Typography>
                  {event.changes && (
                    <Box sx={{ mt: 1 }}>
                      {event.type === 'updated' ? (
                        Object.entries(event.changes.after).map(([key, value]) => (
                          <Typography key={key} variant="body2">
                            <strong>{key}:</strong> {event.changes.before[key]} → {value}
                          </Typography>
                        ))
                      ) : event.type === 'disposed' ? (
                        <Typography variant="body2">
                          <strong>Reason:</strong> {event.changes.reason}
                        </Typography>
                      ) : null}
                    </Box>
                  )}
                </Paper>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </Paper>
    </Box>
  );
};

export default AssetHistory;
