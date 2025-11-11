"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { IconUserPlus, IconSearch, IconFilter, IconDownload, IconRefresh, IconCamera } from '@tabler/icons-react';
import dynamic from 'next/dynamic';
import { getSession } from "next-auth/react";
import { getAllPhotographers, editPhotographer, deletePhotographer } from './_action'
import { toast } from 'sonner';

// Dynamically load UI components
const PhotographersTable = dynamic(() => import('@/components/ui/PhotographersTable'), { ssr: false });
const PhotographerDetailsModal = dynamic(() => import('@/components/ui/PhotographerDetailsModal'), { ssr: false });
const EditPhotographerModal = dynamic(() => import('@/components/ui/EditPhotographerModal'), { ssr: false });
const DeleteConfirmationModal = dynamic(() => import('@/components/ui/DeleteConfirmationModal'), { ssr: false });

const PhotographersPage = () => {
  // State Declarations
  const [photographers, setPhotographers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [selectedPhotographers, setSelectedPhotographers] = useState([]);
  const [selectedPhotographer, setSelectedPhotographer] = useState(null);
  const [editingPhotographer, setEditingPhotographer] = useState(null);
  const [photographerToDelete, setPhotographerToDelete] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const photographersPerPage = 10;

  const fetchPhotographers = useCallback(async () => {
    try {
      setIsLoading(true);
      const session = await getSession();
      if (!session?.accessToken) throw new Error("Not authenticated");
      const result = await getAllPhotographers(session.accessToken);
      setPhotographers(result);
      setTotalPages(Math.ceil(result.length / photographersPerPage));
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch photographers");
    } finally {
      setIsLoading(false);
    }
  }, [])

  // Load on mount
  useEffect(() => {
    fetchPhotographers();
  }, [fetchPhotographers]);

  // Pagination Logic
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(currentPage - 1, 2);
      let end = Math.min(currentPage + 1, totalPages - 1);
      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  // Event Handlers
  // Handle editing a photographer
  const handleEditPhotographer = async (updatedData) => {
    try {
      const session = await getSession();
      if (!session?.accessToken) throw new Error("Not authenticated");
      await editPhotographer(editingPhotographer._id, updatedData, session.accessToken);
      toast.success("Photographer updated successfully");
      setEditingPhotographer(null);
      fetchPhotographers();
    } catch (error) {
      toast.error("Failed to update photographer");
      console.error(error);
    }
  };

  // Handle deleting a photographer
  const handleDeletePhotographer = async () => {
    try {
      const session = await getSession();
      if (!session?.accessToken) throw new Error("Not authenticated");
      await deletePhotographer(photographerToDelete._id, session.accessToken);
      toast.success("Photographer deleted successfully");
      setPhotographerToDelete(null);
      fetchPhotographers();
    } catch (error) {
      toast.error("Failed to delete photographer");
      console.error(error);
    }
  };

  // Handle Refresh photographers list 
  const handleRefresh = async () => {
    toast.loading("Refreshing photographers...");
    await fetchPhotographers();
    toast.dismiss();
    toast.success("Photographers list updated!");
  };

  return (
    <div className="p-6 bg-gray-100 dark:bg-neutral-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Photographers
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage photographers and their portfolios
        </p>
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
            <IconSearch
              className="absolute right-3 top-2.5 text-gray-400"
              size={20}
            />
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
            onClick={handleRefresh}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <IconRefresh size={20} />
          </button>
          <button
            onClick={() => toast.warning("Export feature coming soon")}
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
          setSelectedPhotographers((prev) =>
            prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
          );
        }}
        onSelectAll={() => {
          setSelectedPhotographers((prev) =>
            prev.length === photographers.length
              ? []
              : photographers.map((p) => p._id || p.$id)
          );
        }}
        isLoading={isLoading}
      />

      {/* Update Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg ${currentPage === 1
              ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-neutral-700 dark:text-gray-500"
              : "bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700"
              }`}
          >
            Previous
          </button>

          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {typeof page === "number" ? (
                <button
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg ${currentPage === page
                    ? "bg-blue-500 text-white"
                    : "bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700"
                    }`}
                >
                  {page}
                </button>
              ) : (
                <span className="px-2 text-gray-500">...</span>
              )}
            </React.Fragment>
          ))}

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-lg ${currentPage === totalPages
              ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-neutral-700 dark:text-gray-500"
              : "bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700"
              }`}
          >
            Next
          </button>
        </div>
      )}

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
            onUpdatePhotographer={handleEditPhotographer}
          />
        )}
        {photographerToDelete && (
          <DeleteConfirmationModal
            isOpen={!!photographerToDelete}
            onClose={() => setPhotographerToDelete(null)}
            onConfirm={handleDeletePhotographer}
            userName={photographerToDelete.name}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhotographersPage;