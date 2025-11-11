import React from 'react';
import PhotographerMap from '@/components/ui/PhotographerMap';

const FrequentLocationsMap = ({ locations }) => {
  const transformedLocations = locations.map(location => ({
    $id: location.id,
    location: `${location.lat},${location.lng}`,
    name: location.name,
    description: location.description,
  }));

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg overflow-hidden h-[536px] relative">
      <div className="p-6 border-b border-gray-200 dark:border-neutral-700 z-10">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Frequent Locations</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Most visited locations by users</p>
      </div>
      <div className="absolute inset-0 z-0">
        <PhotographerMap photographers={transformedLocations} userRequests={[]} />
      </div>
    </div>
  );
};

export default FrequentLocationsMap;