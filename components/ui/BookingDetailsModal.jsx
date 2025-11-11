// import React from 'react';
// import { motion } from 'framer-motion';
// import Image from 'next/image';
// import { format } from 'date-fns';
// import { safeFormatDate } from '@/utils/dateUtils';
// import { IconX, IconUser, IconMail, IconPhone, IconMapPin, IconCurrencyDollar, 
//          IconCalendar, IconClock, IconPhoto } from '@tabler/icons-react';

// const InfoItem = ({ icon: Icon, label, value }) => (
//   <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-neutral-700/50">
//     <Icon size={20} className="text-blue-500 dark:text-blue-400" />
//     <div>
//       <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
//       <p className="text-base text-gray-900 dark:text-white">{value}</p>
//     </div>
//   </div>
// );

// const BookingDetailsModal = ({ booking, onClose }) => {
//   return (
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       exit={{ opacity: 0 }}
//       className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
//       onClick={onClose}
//     >
//       <motion.div
//         initial={{ scale: 0.95, opacity: 0 }}
//         animate={{ scale: 1, opacity: 1 }}
//         exit={{ scale: 0.95, opacity: 0 }}
//         className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-4xl overflow-y-auto max-h-[90vh]"
//         onClick={e => e.stopPropagation()}
//       >
//         {/* Header */}
//         <div className="p-6 border-b border-gray-200 dark:border-neutral-700">
//           <div className="flex justify-between items-center">
//             <div>
//               <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
//                 Booking Details
//               </h2>
//               <p className="text-sm text-gray-500 dark:text-gray-400">
//                 {booking.package}
//               </p>
//             </div>
//             <div className="flex items-center space-x-4">
//               <span className={`px-3 py-1 rounded-full text-sm font-medium ${
//                 booking.status === 'completed' 
//                   ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400'
//                   : booking.status === 'pending'
//                   ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400'
//                   : booking.status === 'active'
//                   ? 'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400'
//                   : 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400'
//               }`}>
//                 {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
//               </span>
//               <button
//                 onClick={onClose}
//                 className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full"
//               >
//                 <IconX size={20} />
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Content */}
//         <div className="p-6 space-y-6">
//           {/* Client & Photographer Info */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {/* Client */}
//             <div className="space-y-4">
//               <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Client</h3>
//               <div className="flex items-center space-x-4 mb-4">
//                 <div className="relative w-16 h-16">
//                   <Image
//                     src={booking.client.avatar || '/default-avatar.png'}
//                     alt={booking.client.name}
//                     layout="fill"
//                     className="rounded-full"
//                   />
//                 </div>
//                 <div>
//                   <p className="font-medium text-gray-900 dark:text-white">{booking.client.name}</p>
//                   <p className="text-sm text-gray-500 dark:text-gray-400">{booking.client.email}</p>
//                 </div>
//               </div>
//               <InfoItem icon={IconPhone} label="Phone" value={booking.client.phone || 'N/A'} />
//             </div>

//             {/* Photographer */}
//             <div className="space-y-4">
//               <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Photographer</h3>
//               <div className="flex items-center space-x-4 mb-4">
//                 <div className="relative w-16 h-16">
//                   <Image
//                     src={booking.photographer.avatar || '/default-avatar.png'}
//                     alt={booking.photographer.name}
//                     layout="fill"
//                     className="rounded-full"
//                   />
//                 </div>
//                 <div>
//                   <p className="font-medium text-gray-900 dark:text-white">{booking.photographer.name}</p>
//                   <p className="text-sm text-gray-500 dark:text-gray-400">{booking.photographer.email}</p>
//                 </div>
//               </div>
//               <InfoItem icon={IconPhone} label="Phone" value={booking.photographer.phone || 'N/A'} />
//             </div>
//           </div>

//           {/* Booking Details */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <InfoItem icon={IconCalendar} label="Date" value={safeFormatDate(booking.$createdAt || booking.created || booking.date, 'PPP')} />
//             <InfoItem icon={IconClock} label="Time" value={safeFormatDate(booking.$createdAt || booking.created || booking.date, 'p')} />
//             <InfoItem icon={IconMapPin} label="Location" value={booking.location} />
//             <InfoItem icon={IconCurrencyDollar} label="Price" value={`TZS ${parseFloat(booking.price).toLocaleString()}`} />
//           </div>

//           {/* Photos Section */}
//           {booking.uploadedPhotos && booking.uploadedPhotos.length > 0 && (
//             <div className="space-y-4">
//               <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Uploaded Photos</h3>
//               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
//                 {booking.uploadedPhotos.map((photo, index) => (
//                   <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
//                     <Image
//                       src={photo.photoUrl}
//                       alt={`Photo ${index + 1}`}
//                       layout="fill"
//                       objectFit="cover"
//                       className="hover:scale-110 transition-transform duration-300"
//                     />
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Footer */}
//         <div className="p-6 bg-gray-50 dark:bg-neutral-700/50 border-t border-gray-200 dark:border-neutral-700">
//           <div className="flex justify-end">
//             <button
//               onClick={onClose}
//               className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
//             >
//               Close
//             </button>
//           </div>
//         </div>
//       </motion.div>
//     </motion.div>
//   );
// };

// export default BookingDetailsModal; 