# ChitChat - Real-time Chat Application

A modern, feature-rich chat application built with React, Node.js, and MongoDB. ChitChat offers a seamless real-time messaging experience with a beautiful, responsive interface.

![ChitChat Screenshot](https://images.pexels.com/photos/3182833/pexels-photo-3182833.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2)

## ✨ Features

- **Real-time Messaging**
  - Instant message delivery
  - Typing indicators
  - Online/offline status
  - Read receipts

- **User Authentication**
  - Secure signup/login
  - JWT-based authentication
  - Protected routes

- **Modern UI/UX**
  - Responsive design
  - Dark/light mode
  - Clean, intuitive interface
  - Smooth animations

- **Profile Management**
  - Customizable avatars
  - User bio
  - Online status

## 🚀 Tech Stack

- **Frontend**
  - React 18
  - Vite
  - Tailwind CSS
  - Socket.IO Client

- **Backend**
  - Node.js
  - Express
  - MongoDB
  - Socket.IO

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/chitchat.git
   cd chitchat
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```env
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173
   MONGO_URI=mongodb://localhost:27017/chatapp
   JWT_SECRET=your_jwt_secret_key_change_in_production
   ```

4. Start the development servers:
   ```bash
   npm run dev:all
   ```

## 🛠️ Development

- `npm run dev` - Start the Vite development server
- `npm run server` - Start the Node.js backend server
- `npm run dev:all` - Start both frontend and backend servers
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 📱 Screenshots

### Light Mode
![Light Mode](https://images.pexels.com/photos/3182834/pexels-photo-3182834.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2)

### Dark Mode
![Dark Mode](https://images.pexels.com/photos/3182835/pexels-photo-3182835.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2)

## 🔒 Security

- Passwords are hashed using bcrypt
- JWT for secure authentication
- Protected API routes
- CORS enabled
- Environment variables for sensitive data

## 🤝 Contributing

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👏 Acknowledgments

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Socket.IO](https://socket.io/)
- [MongoDB](https://www.mongodb.com/)