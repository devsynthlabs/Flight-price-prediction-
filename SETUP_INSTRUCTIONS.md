# AI Analyser Flight Booking System - Setup Instructions

## Quick Setup Guide

### 1. Install Python
Since Python is not currently installed, follow these steps:

**Option A: Install from Microsoft Store (Recommended)**
1. Open Microsoft Store
2. Search for "Python 3.11" or "Python 3.12"
3. Click "Install"

**Option B: Download from Python.org**
1. Go to https://www.python.org/downloads/
2. Download Python 3.11 or 3.12
3. Run installer and **CHECK** "Add Python to PATH"

### 2. Verify Python Installation
Open Command Prompt and run:
```bash
python --version
```
Or try:
```bash
py --version
```

### 3. Install Required Dependencies
Navigate to the project folder and run:
```bash
cd "C:\Users\USER\Downloads\flight booking\demmo"
pip install -r requirements.txt
```

If you get permission errors, try:
```bash
pip install --user -r requirements.txt
```

### 4. Run the Application
Start the Flask web server:
```bash
python app.py
```

### 5. Access the Application
1. Open your web browser
2. Go to: http://localhost:5000
3. Login with demo credentials:
   - Email: `demo@aianalyser.com`
   - Password: `demo123`

## Troubleshooting

### Python Not Found Error
If you get "Python was not found", ensure Python is added to your PATH:
1. Search "Environment Variables" in Windows
2. Edit "Path" in System Variables
3. Add Python installation directory

### Missing Modules
If you get import errors, install missing packages:
```bash
pip install flask pandas numpy
```

### Port Already in Use
If port 5000 is busy, the app will show an error. Close other applications or modify the port in app.py.

## Application Features
- ✅ User Authentication (Demo login available)
- ✅ Flight Search across 20+ Indian cities
- ✅ Price comparison and safety scoring
- ✅ Interactive booking flow
- ✅ Comprehensive flight database with 150+ routes

## Demo Credentials
- **Email**: demo@aianalyser.com
- **Password**: demo123
- **Guest Access**: Available via "Continue as Guest"

## Technical Stack
- **Backend**: Flask Python web framework
- **Frontend**: HTML5, CSS3, JavaScript
- **Database**: CSV-based flight data (23,000+ records)
- **Features**: Session management, flight search API, booking system