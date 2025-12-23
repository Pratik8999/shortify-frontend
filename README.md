# Shortify Frontend

A modern, responsive web interface for the Shortify URL shortening service. Built with React and designed for a seamless user experience.

## ✨ Features

- **Clean Landing Page** - User-friendly interface for creating short links
- **User Dashboard** - Manage and monitor your shortened URLs
- **Analytics Visualization** - View clicks, locations, devices, and referrers
- **URL History** - Browse and search through your link collection
- **JWT Authentication** - Secure login and registration system
- **Responsive Design** - Optimized for desktop and mobile devices
- **Real-time Updates** - Instant feedback on URL operations
- **Context-based State** - Efficient state management with React Context

## 🛠️ Tech Stack

- **React** - Modern UI library for building interactive interfaces
- **Vite** - Lightning-fast build tool and dev server
- **React Router** - Client-side routing for seamless navigation
- **Axios** - HTTP client for API communication
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Context API** - Built-in state management solution

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend ([Repository](https://github.com/Pratik8999/shortify))

### Installation

```bash
# Clone the repository
git clone https://github.com/Pratik8999/shortify-frontend.git
cd shortify-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Access the application at `http://localhost:5173`

### Build for Production

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

## 📦 Project Structure

```
.
├── public/            # Static assets
├── src/
│   ├── components/    # React components
│   │   ├── LandingPage.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Analytics.jsx
│   │   └── History.jsx
│   ├── contexts/      # React Context providers
│   │   └── AuthContext.jsx
│   ├── hooks/         # Custom React hooks
│   │   └── usePageTitle.js
│   ├── assets/        # Images and static files
│   ├── App.jsx        # Main application component
│   └── main.jsx       # Application entry point
├── Dockerfile         # Docker configuration
└── vite.config.js     # Vite configuration
```

## 🔧 Configuration

The application expects the backend API to be available. Update the API endpoint in your axios configuration as needed.

## 🐳 Docker Support

```bash
# Build Docker image
docker build -t shortify-frontend .

# Run container
docker run -p 80:80 shortify-frontend
```

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🔗 Related

- [Backend Repository](https://github.com/Pratik8999/shortify) - FastAPI backend service
