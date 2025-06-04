import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import config from '../config';
import './Messages.css';

const Messages = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('');
  const [userData, setUserData] = useState(null);

  const showNotification = (message, type) => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
    setTimeout(() => {
      setShowPopup(false);
    }, 3000);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }
    loadChats();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat._id);
      const interval = setInterval(() => {
        loadMessages(selectedChat._id);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  const loadChats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${config.API_URL}/api/chats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setChats(response.data);
    } catch (error) {
      console.error('Error loading chats:', error);
      setError('Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.API_URL}/api/messages/chat/${chatId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
      showNotification('Failed to load messages', 'error');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${config.API_URL}/api/messages`, {
        chat: selectedChat._id,
        content: newMessage,
        sender: userData._id
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setNewMessage('');
      loadMessages(selectedChat._id);
    } catch (error) {
      console.error('Error sending message:', error);
      showNotification('Failed to send message', 'error');
    }
  };

  const getOtherParticipant = (chat) => {
    if (!userData) return null;
    return chat.participants.find(p => p._id !== userData._id);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading messages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="messages-container">
      {showPopup && (
        <div className={`popup ${popupType}`}>
          {popupMessage}
        </div>
      )}
      
      <div className="chats-list">
        <h2>Messages</h2>
        {chats.length === 0 ? (
          <p className="no-chats">No conversations yet</p>
        ) : (
          chats.map(chat => {
            const otherParticipant = getOtherParticipant(chat);
            return (
              <div
                key={chat._id}
                className={`chat-item ${selectedChat?._id === chat._id ? 'active' : ''}`}
                onClick={() => setSelectedChat(chat)}
              >
                <div className="chat-preview">
                  <div className="chat-info">
                    <h3>{otherParticipant?.name || 'Unknown User'}</h3>
                    <p className="last-message">
                      {chat.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                </div>
                {chat.unreadCount?.[userData?._id] > 0 && (
                  <span className="unread-badge">
                    {chat.unreadCount[userData._id]}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="messages-panel">
        {selectedChat ? (
          <>
            <div className="messages-header">
              <h3>{getOtherParticipant(selectedChat)?.name || 'Unknown User'}</h3>
            </div>
            
            <div className="messages-list">
              {messages.map(message => (
                <div
                  key={message._id}
                  className={`message-wrapper ${message.sender._id === userData?._id ? 'sent' : 'received'}`}
                >
                  <div className="message-bubble">
                    <div className="message-content">
                      {message.content}
                    </div>
                    <div className="message-footer">
                      <span className="message-time">
                        {new Date(message.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      {message.sender._id === userData?._id && (
                        <span className="message-status">
                          {message.read ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form className="message-input-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="message-input"
              />
              <button type="submit" className="send-button">
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages; 