import React from 'react';
import { motion } from 'framer-motion';
import { IconCamera, IconClock, IconList } from '@tabler/icons-react';

const PackageDetails = ({ packageDetails }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="p-4 bg-gray-50 dark:bg-neutral-700/50 rounded-lg">
        <div className="flex items-center space-x-3 mb-4">
          <IconCamera size={24} className="text-blue-500" />
          <h3 className="text-lg font-semibold">{packageDetails.name}</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {packageDetails.description}
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Duration</p>
            <div className="flex items-center space-x-2 mt-1">
              <IconClock size={16} className="text-blue-500" />
              <p className="font-medium">{packageDetails.duration}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Price</p>
            <p className="font-medium">TZS {parseFloat(packageDetails.price).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {packageDetails.includes && packageDetails.includes.length > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-neutral-700/50 rounded-lg">
          <div className="flex items-center space-x-3 mb-4">
            <IconList size={24} className="text-blue-500" />
            <h3 className="text-lg font-semibold">Package Includes</h3>
          </div>
          <ul className="space-y-2">
            {packageDetails.includes.map((item, index) => (
              <li key={index} className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
};

export default PackageDetails; 