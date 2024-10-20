"use client";
import React, { useState, useEffect, useRef } from 'react';
import { IconSend, IconLoader, IconUser, IconPaperclip, IconMoodSmile } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';

const MessagesPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const searchParams = useSearchParams();

  // Demo data
  const demoConversations = [
    { id: 1, name: 'John Doe', lastMessage: 'Hello, I have a question about my booking.' },
    { id: 2, name: 'Jane Smith', lastMessage: 'Can you help me with my account?' },
    { id: 3, name: 'Mike Johnson', lastMessage: 'Thanks for your quick response!' },
  ];

  const demoMessages = [
    { id: 1, content: 'Hello, how can I help you?', sender: 'me', timestamp: '10:00 AM' },
    { id: 2, content: 'I have a question about my booking.', sender: 'other', timestamp: '10:02 AM' },
    { id: 3, content: 'Sure, what would you like to know?', sender: 'me', timestamp: '10:05 AM' },
    { id: 4, content: 'Can I change the date of my photoshoot?', sender: 'other', timestamp: '10:07 AM' },
    { id: 5, content: 'Of course! Let me check the available dates for you.', sender: 'me', timestamp: '10:10 AM' },
  ];

  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    setConversations(demoConversations);
    if (conversationId) {
      const conversation = demoConversations.find(c => c.id === parseInt(conversationId));
      if (conversation) {
        setSelectedConversation(conversation);
      }
    }
    setIsLoading(false);
  }, [searchParams, demoConversations]);

  useEffect(() => {
    if (selectedConversation) {
      setMessages(demoMessages);
      scrollToBottom();
    }
  }, [selectedConversation, demoMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedConversation) {
      const newMsg = {
        id: messages.length + 1,
        content: newMessage,
        sender: 'me',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...messages, newMsg]);
      setNewMessage('');
      setTimeout(scrollToBottom, 100);
    }
  };

  const messageVariants = {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 }
  };

  const bubbleVariants = {
    initial: { scale: 0 },
    animate: { scale: 1, transition: { type: "spring", stiffness: 500, damping: 30 } },
    hover: { scale: 1.05, transition: { duration: 0.2 } }
  };

  if (isLoading) {
    return (
      <motion.div 
        className="flex h-full items-center justify-center bg-gray-100 dark:bg-neutral-900"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          animate={{
            rotate: 360,
            transition: { duration: 1, repeat: Infinity, ease: "linear" }
          }}
        >
          <IconLoader className="text-blue-500" size={48} />
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="flex h-full overflow-hidden bg-gray-100 dark:bg-neutral-900"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Conversation list */}
      <motion.div 
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
        className="w-[20%] bg-white dark:bg-neutral-800 overflow-y-auto overflow-x-hidden scrollbar-hide"
      >
        {demoConversations.map((conversation, index) => (
          <motion.div
            key={conversation.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            className={`p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700 ${
              selectedConversation?.id === conversation.id ? 'bg-gray-200 dark:bg-neutral-600' : ''
            }`}
            onClick={() => setSelectedConversation(conversation)}
          >
            <h3 className="font-bold text-gray-800 dark:text-gray-200">{conversation.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{conversation.lastMessage}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Message area */}
      <motion.div 
        className="flex-1 flex flex-col bg-gray-50 dark:bg-neutral-900 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {selectedConversation ? (
          <>
            {/* Messages */}
            <motion.div 
              className="flex-1 overflow-y-auto scrollbar-hide p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    variants={messageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className={`mb-4 flex ${
                      message.sender === 'me' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <motion.div
                      variants={bubbleVariants}
                      initial="initial"
                      animate="animate"
                      whileHover="hover"
                      className={`max-w-xs lg:max-w-md xl:max-w-lg ${
                        message.sender === 'me'
                          ? 'bg-blue-500 text-white rounded-l-lg rounded-br-lg'
                          : 'bg-white dark:bg-neutral-700 text-gray-800 dark:text-gray-200 rounded-r-lg rounded-bl-lg'
                      } p-3 shadow`}
                    >
                      <p>{message.content}</p>
                      <p className="text-xs mt-1 opacity-70">{message.timestamp}</p>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </motion.div>

            {/* Message input */}
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="p-4 bg-white dark:bg-neutral-800"
            >
              <div className="flex items-center">
                <motion.input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 border rounded-full py-2 px-4 dark:bg-neutral-700 dark:border-neutral-600 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type a message..."
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                />
                <motion.button
                  onClick={handleSendMessage}
                  className="bg-blue-500 text-white rounded-full p-2 ml-2 hover:bg-blue-600 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <IconSend size={20} />
                </motion.button>
              </div>
            </motion.div>
          </>
        ) : (
          <motion.div 
            className="flex-1 flex items-center justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-gray-500 dark:text-gray-400">Select a conversation to start messaging</p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default MessagesPage;
