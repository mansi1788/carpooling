import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
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
    // Get user data from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }
    loadChats();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat._id);
      // Set up polling for new messages
      const interval = setInterval(() => {
        loadMessages(selectedChat._id);
      }, 5000); // Poll every 5 seconds

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

      const response = await axios.get('http://localhost:5000/api/chats', {
        headers: {
          Authorization: `Bearer ${token}`
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
      const response = await axios.get(`http://localhost:5000/api/messages/chat/${chatId}`, {
        headers: {
          Authorization: `Bearer ${token}`
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
      await axios.post('http://localhost:5000/api/messages', {
        chat: selectedChat._id,
        content: newMessage,
        sender: userData._id
      }, {
        headers: {
          Authorization: `Bearer ${token}`
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

  return (
    <div className="messages-container">
      {showPopup && (
        <div className={`popup ${popupType}`}>
          {popupMessage}
        </div>
      )}
      
      <div className="chats-list">
        <h2>Conversations</h2>
        {chats.length > 0 ? (
          chats.map(chat => (
            <div
              key={chat._id}
              className={`chat-item ${selectedChat?._id === chat._id ? 'active' : ''}`}
              onClick={() => setSelectedChat(chat)}
            >
              <div className="chat-participant">
                {getOtherParticipant(chat)?.name || 'Unknown User'}
              </div>
              {chat.unreadCount > 0 && (
                <span className="unread-badge">{chat.unreadCount}</span>
              )}
            </div>
          ))
        ) : (
          <div className="no-chats">
            <p>No conversations yet</p>
          </div>
        )}
      </div>

      <div className="messages-panel">
        {selectedChat ? (
          <>
            <div className="messages-header">
              <h3>{getOtherParticipant(selectedChat)?.name || 'Unknown User'}</h3>
            </div>
            
            <div className="messages-list">
              {messages.length > 0 ? (
                messages.map(message => {
                  const isCurrentUser = message.sender._id === userData?._id;
                  return (
                    <div
                      key={message._id}
                      className={`message-wrapper ${isCurrentUser ? 'sent' : 'received'}`}
                    >
                      {!isCurrentUser && (
                        <div className="message-sender">
                          {message.sender.name}
                        </div>
                      )}
                      <div className="message-bubble">
                        <div className="message-content">{message.content}</div>
                        <div className="message-footer">
                          <div className="message-time">
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </div>
                          {isCurrentUser && (
                            <div className="message-status">
                              {message.readBy?.length > 1 ? (
                                <span className="read-status">✓✓</span>
                              ) : (
                                <span className="sent-status">✓</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-messages">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="message-input-form">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="message-input"
              />
              <button type="submit" className="send-button">Send</button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <p>Select a conversation to view messages</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages; 