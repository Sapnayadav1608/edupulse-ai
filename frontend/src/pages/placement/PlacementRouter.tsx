import React from 'react';
import { useAuth } from '../../context/AuthContext';
import PlacementDashboard from './PlacementDashboard';
import StudentPlacement   from './StudentPlacement';

const PlacementRouter = () => {
  const { user } = useAuth();
  return user?.role === 'student' ? <StudentPlacement /> : <PlacementDashboard />;
};

export default PlacementRouter;
