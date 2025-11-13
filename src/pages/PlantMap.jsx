/**
 * Plant Map Page
 * Interactive Google Maps view showing all solar plants with location markers
 * Refactored to use Redux for state management
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  MyLocation as MyLocationIcon,
  Layers as LayersIcon,
  Close as CloseIcon,
  Factory as PlantIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import {
  fetchPlants,
  selectPlants,
  selectPlantsLoading,
  selectPlantsError,
} from '../store/slices/plantSlice';

// Map container styling
const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

// Default center (India center coordinates as fallback)
const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629,
};

// Map options
const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: true,
  scaleControl: true,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: true,
  styles: [], // Can add custom map styling here
};

// Status color mapping
const statusColors = {
  ACTIVE: 'success',
  INACTIVE: 'default',
  MAINTENANCE: 'warning',
  OFFLINE: 'error',
};

const PlantMap = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const mapRef = useRef(null);

  // Redux selectors
  const plants = useSelector(selectPlants);
  const loading = useSelector(selectPlantsLoading);
  const reduxError = useSelector(selectPlantsError);

  // Local UI state
  const [filteredPlants, setFilteredPlants] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);

  // Map interaction state
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(5);
  const [hoveredPlantId, setHoveredPlantId] = useState(null);
  const [markerOverlays, setMarkerOverlays] = useState(new Map());
  const [showInfoBoxes, setShowInfoBoxes] = useState(true);

  // Google Maps API key
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Load plants data using Redux
  useEffect(() => {
    dispatch(fetchPlants({ page: 1, limit: 1000 }));

    // Refresh data every 60 seconds
    const interval = setInterval(() => {
      dispatch(fetchPlants({ page: 1, limit: 1000 }));
    }, 60000);
    return () => clearInterval(interval);
  }, [dispatch]);

  // Filter plants based on search and status
  useEffect(() => {
    // Filter plants that have valid location data
    let filtered = plants.filter(
      (plant) => plant.location?.latitude && plant.location?.longitude
    );

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter((plant) => plant.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((plant) =>
        plant.name.toLowerCase().includes(query) ||
        plant.location?.address?.toLowerCase().includes(query)
      );
    }

    setFilteredPlants(filtered);
  }, [plants, statusFilter, searchQuery]);

  // Fit map bounds to show all markers with centering on mean coordinates
  useEffect(() => {
    if (mapRef.current && filteredPlants.length > 0 && mapLoaded) {
      fitMapBounds();
    }
  }, [filteredPlants, mapLoaded]);

  // Manage info box overlays
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !showInfoBoxes) return;

    // Clear existing overlays
    markerOverlays.forEach((overlay) => {
      overlay.setMap(null);
    });
    const newOverlays = new Map();

    // Create overlays for all plants
    filteredPlants.forEach((plant) => {
      if (plant.location?.latitude && plant.location?.longitude) {
        const overlay = createInfoBoxOverlay(plant);
        overlay.setMap(mapRef.current);
        newOverlays.set(plant.id, overlay);
      }
    });

    setMarkerOverlays(newOverlays);

    // Cleanup function
    return () => {
      newOverlays.forEach((overlay) => {
        overlay.setMap(null);
      });
    };
  }, [filteredPlants, mapLoaded, showInfoBoxes]);

  // Toggle info boxes visibility
  const toggleInfoBoxes = () => {
    if (showInfoBoxes) {
      // Hide all overlays
      markerOverlays.forEach((overlay) => {
        overlay.setMap(null);
      });
    } else {
      // Show all overlays
      markerOverlays.forEach((overlay) => {
        overlay.setMap(mapRef.current);
      });
    }
    setShowInfoBoxes(!showInfoBoxes);
  };

  const fitMapBounds = useCallback(() => {
    if (!mapRef.current || filteredPlants.length === 0) return;

    // Calculate mean center of all markers
    let totalLat = 0;
    let totalLng = 0;
    let validPlants = 0;

    const bounds = new window.google.maps.LatLngBounds();
    filteredPlants.forEach((plant) => {
      if (plant.location?.latitude && plant.location?.longitude) {
        const lat = parseFloat(plant.location.latitude);
        const lng = parseFloat(plant.location.longitude);
        
        totalLat += lat;
        totalLng += lng;
        validPlants++;
        
        bounds.extend({ lat, lng });
      }
    });

    if (validPlants === 0) return;

    // Calculate mean center
    const meanCenter = {
      lat: totalLat / validPlants,
      lng: totalLng / validPlants,
    };

    // Set map center to mean of all coordinates
    setMapCenter(meanCenter);

    // Fit bounds to show all markers
    mapRef.current.fitBounds(bounds);

    // Adjust zoom if only one plant
    if (filteredPlants.length === 1) {
      window.google.maps.event.addListenerOnce(
        mapRef.current,
        'bounds_changed',
        () => {
          mapRef.current.setZoom(Math.min(mapRef.current.getZoom(), 12));
        }
      );
    }

    // For multiple plants, ensure reasonable zoom level
    if (filteredPlants.length > 1) {
      window.google.maps.event.addListenerOnce(
        mapRef.current,
        'bounds_changed',
        () => {
          const currentZoom = mapRef.current.getZoom();
          // Don't zoom in too far for multiple plants
          if (currentZoom > 10) {
            mapRef.current.setZoom(10);
          }
        }
      );
    }
  }, [filteredPlants]);

  const handleMapLoad = useCallback((map) => {
    mapRef.current = map;
    setMapLoaded(true);
  }, []);

  const handleMarkerClick = (plant) => {
    setSelectedPlant(plant);
    setMapCenter({
      lat: parseFloat(plant.location.latitude),
      lng: parseFloat(plant.location.longitude),
    });
  };

  const handlePlantListClick = (plant) => {
    setSelectedPlant(plant);
    setMapCenter({
      lat: parseFloat(plant.location.latitude),
      lng: parseFloat(plant.location.longitude),
    });
    setMapZoom(12);

    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const handleViewDetails = (plantId) => {
    navigate(`/plants/${plantId}`);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
  };

  // Custom marker with plant info box
  const createCustomMarker = (plant) => {
    const isHovered = hoveredPlantId === plant.id;
    const isSelected = selectedPlant?.id === plant.id;

    let color = '#4CAF50'; // Default green
    if (plant.status === 'OFFLINE') color = '#f44336';
    else if (plant.status === 'MAINTENANCE') color = '#ff9800';
    else if (plant.status === 'INACTIVE') color = '#9e9e9e';

    const scale = isHovered || isSelected ? 1.3 : 1;

    // Create custom marker with info box
    return {
      // Marker pin
      path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: isSelected ? 3 : 2,
      scale: scale * 2,
      anchor: new window.google.maps.Point(12, 24),
      // Add label for plant name
      label: {
        text: plant.name,
        color: '#333333',
        fontSize: '12px',
        fontWeight: 'bold',
        className: 'custom-marker-label'
      }
    };
  };

  // Create overlay for info box above marker
  const createInfoBoxOverlay = (plant) => {
    if (!mapRef.current) return null;

    const overlay = new window.google.maps.OverlayView();
    
    overlay.onAdd = function() {
      const div = document.createElement('div');
      div.style.cssText = `
        background: white;
        border: 2px solid ${plant.status === 'ACTIVE' ? '#4CAF50' : plant.status === 'OFFLINE' ? '#f44336' : plant.status === 'MAINTENANCE' ? '#ff9800' : '#9e9e9e'};
        border-radius: 8px;
        padding: 8px 12px;
        margin-bottom: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-family: 'Roboto', sans-serif;
        font-size: 12px;
        white-space: nowrap;
        z-index: 1000;
        transform: translateX(-50%);
        left: 50%;
        position: absolute;
      `;
      
      div.innerHTML = `
        <div style="font-weight: bold; color: #333; margin-bottom: 4px;">${plant.name}</div>
        <div style="color: #666; font-size: 11px;">${(plant.capacity / 1000).toFixed(1)} MW</div>
        <div style="color: ${plant.status === 'ACTIVE' ? '#4CAF50' : plant.status === 'OFFLINE' ? '#f44336' : plant.status === 'MAINTENANCE' ? '#ff9800' : '#9e9e9e'}; font-size: 10px; font-weight: bold;">${plant.status}</div>
      `;
      
      this.getPanes().overlayMouseTarget.appendChild(div);
      this.div = div;
    };
    
    overlay.draw = function() {
      const overlayProjection = this.getProjection();
      const position = new window.google.maps.LatLng(
        parseFloat(plant.location.latitude),
        parseFloat(plant.location.longitude)
      );
      const point = overlayProjection.fromLatLngToDivPixel(position);
      
      if (this.div) {
        this.div.style.left = point.x + 'px';
        this.div.style.top = (point.y - 60) + 'px';
      }
    };
    
    overlay.onRemove = function() {
      if (this.div) {
        this.div.parentNode.removeChild(this.div);
        this.div = null;
      }
    };
    
    return overlay;
  };

  // Statistics for sidebar
  const stats = {
    total: filteredPlants.length,
    active: filteredPlants.filter((p) => p.status === 'ACTIVE').length,
    offline: filteredPlants.filter((p) => p.status === 'OFFLINE').length,
    maintenance: filteredPlants.filter((p) => p.status === 'MAINTENANCE').length,
    totalCapacity: filteredPlants.reduce((sum, p) => sum + (p.capacity || 0), 0),
  };

  // Sidebar content
  const renderSidebar = () => (
    <Box sx={{ width: 320, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Solar Plants</Typography>
          {isMobile && (
            <IconButton onClick={() => setDrawerOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          )}
        </Box>

        {/* Search */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search plants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {/* Status Filter */}
        <TextField
          fullWidth
          select
          size="small"
          label="Filter by Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <MenuItem value="">All Status</MenuItem>
          <MenuItem value="ACTIVE">Active</MenuItem>
          <MenuItem value="INACTIVE">Inactive</MenuItem>
          <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
          <MenuItem value="OFFLINE">Offline</MenuItem>
        </TextField>

        {(searchQuery || statusFilter) && (
          <Button
            size="small"
            onClick={clearFilters}
            sx={{ mt: 1 }}
          >
            Clear Filters
          </Button>
        )}
      </Box>

      {/* Statistics */}
      <Box sx={{ p: 2, bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          STATISTICS
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip label={`${stats.total} Total`} size="small" />
          <Chip label={`${stats.active} Active`} size="small" color="success" />
          <Chip label={`${stats.offline} Offline`} size="small" color="error" />
          <Chip label={`${stats.maintenance} Maintenance`} size="small" color="warning" />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Total Capacity: {(stats.totalCapacity / 1000).toFixed(1)} MW
        </Typography>
      </Box>

      {/* Plant List */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : filteredPlants.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              No plants found
            </Typography>
          </Box>
        ) : (
          <List dense>
            {filteredPlants.map((plant) => (
              <React.Fragment key={plant.id}>
                <ListItemButton
                  selected={selectedPlant?.id === plant.id}
                  onClick={() => handlePlantListClick(plant)}
                  onMouseEnter={() => setHoveredPlantId(plant.id)}
                  onMouseLeave={() => setHoveredPlantId(null)}
                >
                  <ListItemIcon>
                    <PlantIcon color={plant.status === 'ACTIVE' ? 'success' : 'disabled'} />
                  </ListItemIcon>
                  <ListItemText
                    primary={plant.name}
                    secondary={
                      <>
                        <Typography variant="caption" display="block">
                          {plant.location?.address || 'No address'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                          <Chip
                            label={plant.status}
                            size="small"
                            color={statusColors[plant.status]}
                            sx={{ height: 18, fontSize: '0.65rem' }}
                          />
                          <Chip
                            label={`${(plant.capacity / 1000).toFixed(1)} MW`}
                            size="small"
                            variant="outlined"
                            sx={{ height: 18, fontSize: '0.65rem' }}
                          />
                        </Box>
                      </>
                    }
                  />
                </ListItemButton>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>

      {/* Actions */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => dispatch(fetchPlants({ page: 1, limit: 1000 }))}
          disabled={loading}
        >
          Refresh Data
        </Button>
      </Box>
    </Box>
  );

  // Check if API key is configured
  if (!googleMapsApiKey || googleMapsApiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Plant Locations
        </Typography>
        <Alert severity="error">
          Google Maps API key is not configured. Please add your API key to the .env file as VITE_GOOGLE_MAPS_API_KEY.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      {/* Custom styles for map markers */}
      <style>
        {`
          .custom-marker-label {
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 2px 6px;
            margin-top: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            white-space: nowrap;
            transform: translateX(-50%);
            left: 50%;
            position: absolute;
          }
          
          .gm-style .custom-marker-label {
            border: none;
            background: transparent;
            text-shadow: 1px 1px 2px rgba(255,255,255,0.8);
            font-weight: bold;
            font-size: 12px;
          }
        `}
      </style>

      {/* Header */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Plant Locations</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isMobile && (
            <IconButton onClick={() => setDrawerOpen(!drawerOpen)}>
              <FilterIcon />
            </IconButton>
          )}
          <IconButton onClick={fitMapBounds} title="Fit all markers">
            <LayersIcon />
          </IconButton>
          <IconButton onClick={toggleInfoBoxes} title={showInfoBoxes ? "Hide info boxes" : "Show info boxes"}>
            <InfoIcon color={showInfoBoxes ? "primary" : "disabled"} />
          </IconButton>
        </Box>
      </Box>

      {/* Error Alert */}
      {reduxError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {reduxError}
        </Alert>
      )}

      {/* No location data warning */}
      {!loading && plants.length > 0 && filteredPlants.length === 0 && !statusFilter && !searchQuery && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No plants with location data found. Please add location coordinates to plants.
        </Alert>
      )}

      {/* Map Container */}
      <Box sx={{ flexGrow: 1, display: 'flex', position: 'relative', borderRadius: 1, overflow: 'hidden' }}>
        {/* Sidebar Drawer */}
        {isMobile ? (
          <Drawer
            anchor="left"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            variant="temporary"
          >
            {renderSidebar()}
          </Drawer>
        ) : (
          <Box
            sx={{
              width: drawerOpen ? 320 : 0,
              transition: 'width 0.3s',
              overflow: 'hidden',
              borderRight: drawerOpen ? 1 : 0,
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            {renderSidebar()}
          </Box>
        )}

        {/* Google Map */}
        <Box sx={{ flexGrow: 1, position: 'relative' }}>
          <LoadScript googleMapsApiKey={googleMapsApiKey}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={mapZoom}
              options={mapOptions}
              onLoad={handleMapLoad}
            >
              {/* Plant Markers */}
              {filteredPlants.map((plant) => (
                <Marker
                  key={plant.id}
                  position={{
                    lat: parseFloat(plant.location.latitude),
                    lng: parseFloat(plant.location.longitude),
                  }}
                  onClick={() => handleMarkerClick(plant)}
                  onMouseOver={() => setHoveredPlantId(plant.id)}
                  onMouseOut={() => setHoveredPlantId(null)}
                  icon={createCustomMarker(plant)}
                  title={plant.name}
                  label={{
                    text: plant.name,
                    color: '#333333',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    className: 'custom-marker-label'
                  }}
                />
              ))}

              {/* Info Window */}
              {selectedPlant && (
                <InfoWindow
                  position={{
                    lat: parseFloat(selectedPlant.location.latitude),
                    lng: parseFloat(selectedPlant.location.longitude),
                  }}
                  onCloseClick={() => setSelectedPlant(null)}
                >
                  <Card elevation={0} sx={{ minWidth: 250 }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="h6" gutterBottom>
                        {selectedPlant.name}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {selectedPlant.location.address}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip
                          label={selectedPlant.status}
                          size="small"
                          color={statusColors[selectedPlant.status]}
                        />
                        <Chip
                          label={`${(selectedPlant.capacity / 1000).toFixed(1)} MW`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" display="block" color="text.secondary">
                          Devices: {selectedPlant._count?.devices || 0}
                        </Typography>
                        {selectedPlant._count?.alarms > 0 && (
                          <Typography variant="caption" display="block" color="error.main">
                            Active Alarms: {selectedPlant._count.alarms}
                          </Typography>
                        )}
                      </Box>

                      <Button
                        fullWidth
                        variant="contained"
                        size="small"
                        onClick={() => handleViewDetails(selectedPlant.id)}
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                </InfoWindow>
              )}
            </GoogleMap>
          </LoadScript>

          {/* Loading Overlay */}
          {loading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255, 255, 255, 0.8)',
                zIndex: 1000,
              }}
            >
              <CircularProgress />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default PlantMap;
