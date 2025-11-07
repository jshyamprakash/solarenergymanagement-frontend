<<<<<<< HEAD
# Solar Energy Monitoring System - Frontend

React-based frontend application for the Solar Energy Monitoring System.

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x or higher
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env with your actual values

# Start development server
npm run dev
```

The application will be running at `http://localhost:5173`

## 📁 Project Structure

```
/frontend
  /src
    /components          ← Reusable UI components
    /pages              ← Page components
    /services           ← API service layer
    /hooks              ← Custom React hooks
    /contexts           ← React context providers
    /utils              ← Utility functions
    /theme              ← Material-UI theme configuration
    /assets             ← Static assets (images, fonts)
  /public               ← Public static files
```

## 🔧 Available Scripts

- `npm run dev` - Start development server (http://localhost:5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

## 🎭 Mock Data Mode

The frontend supports development with mock data before the backend is ready.

### Enable Mock Data

```bash
# In .env file
VITE_USE_MOCK_DATA=true
```

When enabled, the frontend will use hardcoded mock data instead of making API calls.

### Switching to Real Data

```bash
# In .env file
VITE_USE_MOCK_DATA=false
VITE_API_BASE_URL=http://localhost:3000/api
```

## 🎨 Technology Stack

- **React 19.1** - UI library
- **Material-UI v5** - Component library
- **React Router v6** - Routing
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **Google Maps API** - Map integration
- **Socket.io Client** - Real-time updates
- **Zustand** - State management
- **Vite** - Build tool

## 📄 Key Features

- **Dashboard** - Real-time overview of all solar plants
- **Plant Management** - Create, update, and monitor plants
- **Device Monitoring** - Track device status and performance
- **Data Visualization** - Interactive charts and graphs
- **Map View** - Geographic visualization of plants
- **Alarm Management** - Real-time alerts and notifications
- **User Management** - Role-based access control
- **Reports** - Generate and export reports

## 🔐 Authentication

The app uses JWT-based authentication. Login credentials for development:

```
Admin:
  Email: admin@solar.com
  Password: Admin123!

Manager:
  Email: manager@solar.com
  Password: Manager123!

Viewer:
  Email: viewer@solar.com
  Password: Viewer123!
```

## 🌍 Environment Variables

See [.env.example](.env.example) for all available configuration options.

Key variables:
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_USE_MOCK_DATA` - Enable/disable mock data
- `VITE_GOOGLE_MAPS_API_KEY` - Google Maps API key
- `VITE_WEBSOCKET_URL` - WebSocket server URL

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## 📝 Development Notes

- All environment variables must be prefixed with `VITE_`
- The dev server proxies `/api` requests to `http://localhost:3000`
- Material-UI theme is configured in `src/theme/`
- API services are organized in `src/services/`

## 🔗 Related Documentation

- [EXECUTION_PLAN.md](../EXECUTION_PLAN.md) - Complete project plan
- [Backend README](../backend/README.md) - Backend documentation
- [MOCK_DATA_SPECIFICATION.md](../MOCK_DATA_SPECIFICATION.md) - Mock data details

## 📄 License

ISC
=======
# solarenergymanagement-frontend
>>>>>>> ed49f7f18a5d6a940c70ced77966ed8d82ef2a05
