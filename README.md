# GACC Website - Local Development Setup

This is a full-stack application with a React client and Express server, using PostgreSQL for the database.

## Prerequisites

- **Node.js**: Version 16.13.1 (as specified in package.json)
- **PostgreSQL**: Running locally or accessible database
- **npm**: Version 8.1.2 or compatible

## Quick Start

### 1. Install Dependencies

```bash
# Install root/server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 2. Database Setup

#### Option A: Using Local PostgreSQL

1. Create a PostgreSQL database:
```bash
createdb gacc_db
```

2. Update `config/config.json` with your database credentials:
```json
{
  "development": {
    "username": "your_username",
    "password": "your_password",
    "database": "gacc_db",
    "host": "localhost",
    "dialect": "postgres"
  }
}
```

Or set environment variables (recommended):
```bash
export DB_USERNAME=your_username
export DB_PASSWORD=your_password
export DB_NAME=gacc_db
export DB_HOST=localhost
```

3. Run migrations:
```bash
npx sequelize-cli db:migrate
```

#### Option B: Using Environment Variables

Set `DATABASE_URL`:
```bash
export DATABASE_URL=postgres://username:password@localhost:5432/gacc_db
```

### 3. Environment Variables

Create a `.env` file in the root directory:

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Database (if not using config.json)
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_NAME=gacc_db
DB_HOST=localhost

# Blockchain Provider URLs
INFURA_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
# OR
ALCHEMY_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# Contract Addresses
REACT_APP_MACC_ADDRESS=0xYourMACCContractAddress
KITTEN_CONTRACT_ADDRESS=0xYourKittenContractAddress

# Client Environment Variables (must be prefixed with REACT_APP_)
REACT_APP_BASE_API_URL=http://localhost:3001
REACT_APP_ALCHEMY_API_KEY=your_alchemy_api_key
REACT_APP_ALCHEMY_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
REACT_APP_GACC_ADDRESS=0xYourGACCContractAddress
REACT_APP_MACC_ADDRESS=0xYourMACCContractAddress
REACT_APP_KITTEN_ADDRESS=0xYourKittenContractAddress
REACT_APP_LUNAGEM_ADDRESS=0xYourLunagemContractAddress
```

**Note**: Client environment variables must be prefixed with `REACT_APP_` to be accessible in the browser.

### 4. Running the Application

#### Option A: Development Mode (Recommended)

Run the client and server separately:

**Terminal 1 - Server:**
```bash
npm start
```
Server will run on `http://localhost:3001`

**Terminal 2 - Client:**
```bash
cd client
npm start
```
Client will run on `http://localhost:3000` and automatically proxy API requests to the server.

#### Option B: Production Build

Build the client and run the server:

```bash
# Build the React app
cd client
npm run build
cd ..

# Start the server (serves the built client)
npm start
```

The server will serve the built React app at `http://localhost:3001`

### 5. Access the Application

- **Client (dev mode)**: http://localhost:3000
- **Server API**: http://localhost:3001
- **Full app (production mode)**: http://localhost:3001

## Project Structure

```
gacc-website/
├── client/              # React frontend application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── redux/       # Redux store and actions
│   │   └── ...
│   └── package.json
├── server/              # Express backend
│   ├── index.js        # Main server file
│   ├── abi/            # Smart contract ABIs
│   └── ranks/          # NFT ranking data
├── models/             # Sequelize database models
├── migrations/         # Database migrations
├── config/             # Configuration files
└── package.json        # Root package.json
```

## Node Version Issue (OpenSSL Error)

If you see `ERR_OSSL_EVP_UNSUPPORTED` when starting the client, you're using Node.js 17+ but the project requires Node 16.13.1.

### Solution 1: Use Node 16.13.1 (Recommended)

Install and use the correct Node version with `nvm`:

```bash
# Install Node 16.13.1
nvm install 16.13.1

# Use it for this project
nvm use 16.13.1

# Verify version
node -v  # Should show v16.13.1

# Then try starting again
cd client && npm start
```

### Solution 2: Legacy OpenSSL Provider (Quick Fix)

If you can't switch Node versions, add this to your `client/package.json` scripts:

```json
"scripts": {
  "start": "NODE_OPTIONS=--openssl-legacy-provider react-scripts start"
}
```

Or run directly:
```bash
cd client
NODE_OPTIONS=--openssl-legacy-provider npm start
```

**Note**: This is a workaround. Using Node 16.13.1 is recommended for full compatibility.

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running: `pg_isready`
- Check database credentials in `config/config.json` or environment variables
- Verify the database exists: `psql -l`

### Port Already in Use

- Change `PORT` in `.env` or use: `PORT=3002 npm start`

### Client Build Errors

- Clear node_modules and reinstall:
  ```bash
  rm -rf node_modules client/node_modules
  npm install
  cd client && npm install
  ```

### Environment Variables Not Working

- Client variables must start with `REACT_APP_`
- Restart the dev server after changing `.env` files
- Check that `.env` is in the root directory (not in `client/`)

## Development Tips

- The server serves the built React app in production mode
- In development, run client and server separately for hot reloading
- API endpoints are available at `/api/*`
- The server serves static files from `client/build/` when built

## Node Version

This project uses Node.js 16.13.1. If you're using `nvm`:

```bash
nvm install 16.13.1
nvm use 16.13.1
```

