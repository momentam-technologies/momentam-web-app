import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { IconClock, IconCheck, IconX } from "@tabler/icons-react";
import { safeFormatDate } from "@/utils/dateUtils";

const BookingsTable = ({
  bookings,
  onViewBooking,
  onUpdateStatus,
  isLoading,
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400";
      case "active":
        return "bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400";
      case "accepted":
        return "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-400";
    }
  };


  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-neutral-700">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Client
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Photographer
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Package
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Status
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Price
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Date
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-gray-700">
          {bookings.map((booking) => {
            const client = booking.userDetails || {};
            const photographer = booking.photographerSnapshot || {};

            return (
              <motion.tr
                key={booking._id || booking.$id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-colors"
              >
                {/* Client */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 relative">
                      <Image
                        src={client.avatarUrl || "/default-avatar.png"}
                        alt={client.name || "Client"}
                        layout="fill"
                        className="rounded-full"
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{client.name || "Unknown Client"}</div>
                      {/* <div className="text-sm text-gray-500 dark:text-gray-400">{client.email || "-"}</div> */}
                    </div>
                  </div>
                </td>
                {/* Photographer */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 relative">
                      <Image
                        src={photographer.avatarUrl || "/default-avatar.png"}
                        alt={photographer.name || "Photographer"}
                        layout="fill"
                        className="rounded-full"
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{photographer.name || "Unknown Photographer"}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{photographer.phone || "-"}</div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {booking.package}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {booking.location
                      ? `Lat: ${booking.location.coordinates[1]}, Lng: ${booking.location.coordinates[0]}`
                      : "-"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}
                  >
                    {booking.status.charAt(0).toUpperCase() +
                      booking.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  TZS {parseFloat(booking.price).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {safeFormatDate(booking.$createdAt || booking.created || booking.date, "PPp")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {booking.status === "pending" && (
                    <>
                      <button
                        onClick={() =>
                          onUpdateStatus(booking._id || booking.$id, "active")
                        }
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                      >
                        <IconCheck size={20} />
                      </button>
                      <button
                        onClick={() =>
                          onUpdateStatus(booking._id || booking.$id, "cancelled")
                        }
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <IconX size={20} />
                      </button>
                    </>
                  )}
                </td>
              </motion.tr>
            )
          })}
        </tbody>
      </table>

      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
          />
        </div>
      )}

      {!isLoading && bookings.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <IconClock size={48} className="mb-4 opacity-50" />
          <p>No bookings found</p>
        </div>
      )}
    </div>
  );
};

export default BookingsTable;
