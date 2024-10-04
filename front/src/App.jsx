import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:5000');

const App = () => {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [isNameSet, setIsNameSet] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null); // Ref for the last message

  useEffect(() => {
    const savedMessages = JSON.parse(localStorage.getItem('messages')) || [];
    setMessages(savedMessages);

    socket.on('receiveMessage', (newMessage) => {
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, newMessage];
        //setting the msg to local storage
        localStorage.setItem('messages', JSON.stringify(updatedMessages));
        return updatedMessages;
      });
    });

    socket.on('userConnected', (userList) => {
      setUsers(userList);
      setError('');
    });

    socket.on('userDisconnected', (userList) => {
      setUsers(userList);
    });

    socket.on('userLimitReached', () => {
      setError('User limit reached. Please try again later.');
      setIsNameSet(false);
      setTimeout(() => setError(''), 5000);
    });

    return () => {
      socket.off('receiveMessage');
      socket.off('userConnected');
      socket.off('userDisconnected');
      socket.off('userLimitReached');
    };
  }, []);

  useEffect(() => {
    // Scroll to the bottom 
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!isNameSet) return;
    const newMessage = { user: name, text: message };
    socket.emit('sendMessage', newMessage);
    setMessage('');
  };

  const handleSetName = (e) => {
    e.preventDefault();
    if (name.trim()) {
      socket.emit('setUser', name);
      setIsNameSet(true);
    }
  };

  return (
    <div>
      <h1>Chat Application</h1>
      {!isNameSet ? (
        <form onSubmit={handleSetName}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name..."
            required
          />
          <button type="submit">Set Name</button>
        </form>
      ) : (
        <>
          {error && <p className="error-message">{error}</p>}
          <div>
            <h2>Users In Conversation ({users.length}/5)</h2>
            <ul>
              {users.map((user) => (
                <li key={user}>{user}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2>Messages</h2>
            <div className="message-list">
              <ul>
                {messages.map((msg, index) => (
                  <li key={index} className={`message ${msg.user === name ? 'sent' : 'received'}`}>
                    <strong>{msg.user}:</strong> {msg.text}
                  </li>
                ))}
                <div ref={messagesEndRef} /> 
              </ul>
            </div>
          </div>
          <form onSubmit={handleSendMessage}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              required
            />
            
            <button type="submit">Send</button>
            
          </form>
        </>
      )}
    </div>
  );
};

export default App;
