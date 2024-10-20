import React from 'react';
import { motion } from 'framer-motion';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-neutral-800 py-4 px-6 flex justify-between items-center">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        © {new Date().getFullYear()} Momentam Ltd. All rights reserved.
      </div>
      <div className="flex items-center">
        <div className="relative mr-2">
          <motion.div
            className="w-2 h-2 bg-green-500 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-0 left-0 w-2 h-2 bg-green-500 rounded-full"
            animate={{
              scale: [1, 2],
              opacity: [0.5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400">All systems operational</span>
      </div>
    </footer>
  );
};

export default Footer;
