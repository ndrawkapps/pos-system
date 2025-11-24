# POS System - Frontend

## Setup & Installation

1. Install dependencies:

```bash
npm install
```

2. Copy .env file and configure API URL:

```bash
cp .env.example .env
```

3. Run development server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

## Features

### Authentication

- Login with username/password
- JWT token-based authentication
- Role-based access control (Admin & Kasir)

### Kasir Page

- Product grid with categories
- Shopping cart management
- Hold/Save orders
- Multiple payment methods
- Bluetooth printing support

### Products Management

- CRUD operations
- Image upload
- Category filtering
- Stock management
- View-only mode for Kasir role

### Transaction History

- View all transactions
- Filter by date/month
- Export to Excel
- Reprint receipts

### Shift Management (Admin only)

- Open/Close shift
- Cash flow tracking
- Payment breakdown
- Summary reports

### Settings (Admin only)

- Bluetooth printer configuration
- App profile settings
- Store information

## Bluetooth Printing

This app uses Web Bluetooth API for printing. Requirements:

- HTTPS connection (or localhost for development)
- Bluetooth-enabled thermal printer with ESC/POS support
- Chrome/Edge browser (Firefox doesn't support Web Bluetooth yet)

### Connecting Printer:

1. Go to Settings > Printer
2. Click "Connect Bluetooth Printer"
3. Select your printer from the list
4. Grant permission

### Supported Print Types:

- Receipt (customer copy)
- Kitchen slip (for kitchen staff)
- Check bill (before payment)

## Project Structure

```
src/
├── components/
│   ├── common/          # Shared components
│   ├── kasir/           # Kasir page components
│   ├── products/        # Product management components
│   ├── users/           # User management components
│   └── settings/        # Settings components
├── pages/               # Page components
├── services/            # API services
├── utils/               # Utility functions
├── context/             # React context
└── App.jsx              # Main app component
```

## Environment Variables

```
VITE_API_URL=http://localhost:5000/api
```

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Limited (no Web Bluetooth)
- Safari: Limited (no Web Bluetooth)
