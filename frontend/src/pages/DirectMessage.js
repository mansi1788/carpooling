import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './DirectMessage.css';

const DirectMessage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socket = useRef(null);
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    socket.current = io('http://localhost:5000');
    
    socket.current.on('message', handleNewMessage);
    socket.current.on('typing', handleTyping);
    socket.current.on('stopTyping', handleStopTyping);
    
    loadConversations();
    
    return () => {
      socket.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat._id);
      socket.current.emit('joinChat', selectedChat._id);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/messages/conversations/${userId}`);
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadMessages = async (chatId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/messages/${chatId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleNewMessage = (message) => {
    setMessages(prev => [...prev, message]);
  };

  const handleTyping = ({ userId: typingUserId, chatId }) => {
    if (selectedChat?._id === chatId) {
      setTypingUsers(prev => ({ ...prev, [typingUserId]: true }));
    }
  };

  const handleStopTyping = ({ userId: typingUserId, chatId }) => {
    if (selectedChat?._id === chatId) {
      setTypingUsers(prev => ({ ...prev, [typingUserId]: false }));
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const messageData = {
        chatId: selectedChat._id,
        sender: userId,
        content: newMessage,
        timestamp: new Date()
      };

      socket.current.emit('sendMessage', messageData);
      setMessages(prev => [...prev, messageData]);
      setNewMessage('');
      setIsTyping(false);
      socket.current.emit('stopTyping', { chatId: selectedChat._id, userId });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTypingChange = () => {
    if (!isTyping) {
      setIsTyping(true);
      socket.current.emit('typing', { chatId: selectedChat._id, userId });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.current.emit('stopTyping', { chatId: selectedChat._id, userId });
    }, 2000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setFilteredUsers([]);
      return;
    }
    try {
      const response = await axios.get(`http://localhost:5000/api/users/search?q=${query}`);
      setFilteredUsers(response.data);
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  const startNewChat = async (userId) => {
    try {
      const response = await axios.post('http://localhost:5000/api/messages/start', {
        participants: [userId, localStorage.getItem('userId')]
      });
      setConversations(prev => [response.data, ...prev]);
      setSelectedChat(response.data);
      setShowUserSearch(false);
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to start new chat:', error);
    }
  };

  return (
    <div className="dm-container">
      <div className="dm-sidebar">
        <div className="dm-header">
          <h2>Messages</h2>
          <button 
            className="new-chat-btn"
            onClick={() => setShowUserSearch(true)}
          >
            New Message
          </button>
        </div>

        {showUserSearch && (
          <div className="user-search">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchUsers(e.target.value);
              }}
            />
            <div className="search-results">
              {filteredUsers.map(user => (
                <div 
                  key={user._id} 
                  className="user-result"
                  onClick={() => startNewChat(user._id)}
                >
                  <img src={user.profilePic || '/default-avatar.png'} alt={user.name} />
                  <span>{user.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="conversations-list">
          {conversations.map(chat => (
            <div
              key={chat._id}
              className={`conversation-item ${selectedChat?._id === chat._id ? 'active' : ''}`}
              onClick={() => setSelectedChat(chat)}
            >
              <img 
                src={chat.participants.find(p => p._id !== userId)?.profilePic || '/default-avatar.png'} 
                alt="avatar" 
              />
              <div className="conversation-info">
                <h4>{chat.participants.find(p => p._id !== userId)?.name}</h4>
                <p className="last-message">{chat.lastMessage?.content || 'No messages yet'}</p>
              </div>
              {chat.unreadCount > 0 && (
                <span className="unread-badge">{chat.unreadCount}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="dm-main">
        {selectedChat ? (
          <>
            <div className="chat-header">
              <img 
                src={selectedChat.participants.find(p => p._id !== userId)?.profilePic || '/default-avatar.png'} 
                alt="avatar" 
              />
              <h3>{selectedChat.participants.find(p => p._id !== userId)?.name}</h3>
            </div>

            <div className="messages-container">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`message ${message.sender === userId ? 'sent' : 'received'}`}
                >
                  <div className="message-content">
                    {message.content}
                    <span className="message-time">
                      {new Date(message.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              ))}
              {Object.values(typingUsers).some(Boolean) && (
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="message-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTypingChange();
                }}
                placeholder="Type a message..."
              />
              <button type="submit" disabled={!newMessage.trim()}>
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <h3>Select a conversation or start a new one</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectMessage; 