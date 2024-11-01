import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { format } from 'date-fns';
import { IconSend } from '@tabler/icons-react';

const BookingChat = ({ messages, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-[400px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-start space-x-3 ${
              message.isAdmin ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div className="flex-shrink-0 w-8 h-8 relative">
              <Image
                src={message.avatar || '/default-avatar.png'}
                alt=""
                layout="fill"
                className="rounded-full"
              />
            </div>
            <div className={`flex flex-col ${message.isAdmin ? 'items-end' : ''}`}>
              <div className={`px-4 py-2 rounded-lg max-w-md ${
                message.isAdmin 
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-neutral-700'
              }`}>
                <p>{message.text}</p>
              </div>
              <span className="text-xs text-gray-500 mt-1">
                {format(new Date(message.timestamp), 'PPp')}
              </span>
            </div>
          </motion.div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={handleSend} className="p-4 border-t dark:border-neutral-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <IconSend size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingChat; 