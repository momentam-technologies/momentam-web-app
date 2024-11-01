"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconUserPlus, IconSearch, IconFilter, IconDownload, IconRefresh, IconCamera } from '@tabler/icons-react';
import {
  getPhotographers,
  updatePhotographer,
  deletePhotographer,
  verifyPhotographer,
  getPhotographerDetails
} from '@/lib/photographers';
import dynamic from 'next/dynamic';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

// Dynamically import components
const PhotographersTable = dynamic(() => import('@/components/ui/PhotographersTable'), { ssr: false });
const PhotographerDetailsModal = dynamic(() => import('@/components/ui/PhotographerDetailsModal'), { ssr: false });
const EditPhotographerModal = dynamic(() => import('@/components/ui/EditPhotographerModal'), { ssr: false });
const DeleteConfirmationModal = dynamic(() => import('@/components/ui/DeleteConfirmationModal'), { ssr: false });

const PhotographersPage = () => {
  const [photographers, setPhotographers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhotographers, setSelectedPhotographers] = useState([]);
  const [selectedPhotographer, setSelectedPhotographer] = useState(null);
  const [editingPhotographer, setEditingPhotographer] = useState(null);
  const [photographerToDelete, setPhotographerToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPhotographers, setTotalPhotographers] = useState(0);
  const [filterType, setFilterType] = useState('all');
  const photographersPerPage = 10;

  const fetchPhotographers = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getPhotographers(photographersPerPage, (currentPage - 1) * photographersPerPage);
      setPhotographers(result.photographers);
      setTotalPhotographers(result.total);
    } catch (error) {
      toast.error('Failed to fetch photographers');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchPhotographers();
  }, [fetchPhotographers]);

  // ... Add handlers for CRUD operations, filtering, and search

  return (
    <div className="p-6 bg-gray-100 dark:bg-neutral-900 min-h-screen">
      <Toaster />
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Photographers</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage photographers and their portfolios</p>
      </div>

      {/* Action Bar */}
      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
        {/* Search and Filter Section */}
        <div className="flex flex-1 gap-4 min-w-[280px]">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search photographers..."
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <IconSearch className="absolute right-3 top-2.5 text-gray-400" size={20} />
          </div>
          <select
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Photographers</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={fetchPhotographers}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <IconRefresh size={20} />
          </button>
          <button
            onClick={() => {}} // Add export functionality
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <IconDownload size={20} />
          </button>
        </div>
      </div>

      {/* Photographers Table */}
      <PhotographersTable
        photographers={photographers}
        onViewPhotographer={setSelectedPhotographer}
        onEditPhotographer={setEditingPhotographer}
        onDeletePhotographer={setPhotographerToDelete}
        selectedPhotographers={selectedPhotographers}
        onSelectPhotographer={(id) => {
          setSelectedPhotographers(prev => 
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
          );
        }}
        onSelectAll={() => {
          setSelectedPhotographers(prev => 
            prev.length === photographers.length ? [] : photographers.map(p => p.$id)
          );
        }}
        isLoading={isLoading}
      />

      {/* Modals */}
      <AnimatePresence>
        {selectedPhotographer && (
          <PhotographerDetailsModal
            photographer={selectedPhotographer}
            onClose={() => setSelectedPhotographer(null)}
          />
        )}
        {editingPhotographer && (
          <EditPhotographerModal
            isOpen={!!editingPhotographer}
            onClose={() => setEditingPhotographer(null)}
            photographer={editingPhotographer}
            onUpdatePhotographer={async (data) => {
              try {
                await updatePhotographer(editingPhotographer.$id, data);
                toast.success('Photographer updated successfully');
                fetchPhotographers();
                setEditingPhotographer(null);
              } catch (error) {
                toast.error('Failed to update photographer');
                console.error(error);
              }
            }}
          />
        )}
        {photographerToDelete && (
          <DeleteConfirmationModal
            isOpen={!!photographerToDelete}
            onClose={() => setPhotographerToDelete(null)}
            onConfirm={async () => {
              try {
                await deletePhotographer(photographerToDelete.$id);
                toast.success('Photographer deleted successfully');
                fetchPhotographers();
                setPhotographerToDelete(null);
              } catch (error) {
                toast.error('Failed to delete photographer');
                console.error(error);
              }
            }}
            userName={photographerToDelete.name}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhotographersPage;