/**
 * Plant Access Middleware
 * Checks if user has access to specific plants
 */

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';

/**
 * Hook to check if user has access to a plant
 * @param {number} plantId - Plant ID to check
 * @returns {Promise<boolean>} - True if user has access
 */
export const usePlantAccess = () => {
  const user = useSelector(selectUser);

  const checkPlantAccess = async (plantId) => {
    if (!user) return false;
    
    // Admin users have access to all plants
    if (user.role === 'ADMIN') return true;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/user-plant-map/check-access/${plantId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      return data.success ? data.data.hasAccess : false;
    } catch (error) {
      console.error('Error checking plant access:', error);
      return false;
    }
  };

  return { checkPlantAccess };
};

/**
 * Higher-order component to protect plant-specific routes
 */
export const withPlantAccess = (WrappedComponent, plantId) => {
  return function PlantAccessWrapper(props) {
    const { checkPlantAccess } = usePlantAccess();
    const [hasAccess, setHasAccess] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const verifyAccess = async () => {
        setLoading(true);
        const access = await checkPlantAccess(plantId);
        setHasAccess(access);
        setLoading(false);
      };

      verifyAccess();
    }, [plantId, checkPlantAccess]);

    if (loading) {
      return <div>Loading...</div>;
    }

    if (!hasAccess) {
      return (
        <div>
          <h1>Access Denied</h1>
          <p>You don't have permission to access this plant.</p>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
};

/**
 * Filter plants based on user access
 * @param {Array} plants - All plants
 * @param {Object} user - Current user
 * @returns {Array} - Filtered plants
 */
export const filterPlantsByAccess = (plants, user) => {
  if (!user || !plants) return [];
  
  // Admin users see all plants
  if (user.role === 'ADMIN') return plants;

  // For non-admin users, we need to check userPlantMap
  // This should be handled on the backend, but as a fallback:
  return plants.filter(plant => {
    // If plant has userMaps, check if current user is assigned
    if (plant.userMaps && plant.userMaps.length > 0) {
      return plant.userMaps.some(map => map.userId === user.id);
    }
    
    // If no userMaps data, assume no access for non-admin users
    return false;
  });
};