#!/usr/bin/env python3
"""
SkyBooker - Flight Booking Web Application
Integrates with India Flight Recommendation System (flight_finder.py)
"""

import os
import sys
from flask import Flask, render_template, request, jsonify, session, send_from_directory
import pandas as pd
import random
from datetime import datetime, timedelta
import secrets

# Add the script directory to Python path for importing flight_finder
script_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'script')
sys.path.append(script_dir)

# Import the flight recommendation system
try:
    from flight_finder import IndiaFlightRecommendationSystem
except ImportError:
    print("Error: Could not import flight_finder module")
    sys.exit(1)

app = Flask(__name__, 
           template_folder='.',  # Templates are in current directory
           static_folder='.',  # Serve files from current directory
           static_url_path='')
app.secret_key = 'ai-analyser-secret-key-2025'
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False
app.config['SESSION_PERMANENT'] = False

# Initialize the flight recommendation system
flight_system = None

def init_flight_system():
    """Initialize the flight recommendation system"""
    global flight_system
    try:
        # Ensure we're in the correct directory
        original_dir = os.getcwd()
        
        # Initialize the flight system
        flight_system = IndiaFlightRecommendationSystem()
        
        # Check if dataset exists in current directory
        if os.path.exists('data/Comprehensive_India_Flights.csv'):
            flight_system.df = pd.read_csv('data/Comprehensive_India_Flights.csv')
            print(f"[SUCCESS] Loaded comprehensive all-India dataset")
            print(f"[INFO] {len(flight_system.df):,} flight records from single unified source")
            print(f"[INFO] Coverage: {flight_system.df['source_city'].nunique()} cities across India")
            print(f"[INFO] Airlines: {', '.join(sorted(flight_system.df['airline'].unique()))}")
            print(f"[INFO] Routes: {len(flight_system.df.groupby(['source_city', 'destination_city'])):,} unique routes")
        else:
            print("[ERROR] Dataset not found at data/Comprehensive_India_Flights.csv")
            return False
        
        print(f"Flight system initialized with {len(flight_system.df)} flights")
        return True
    except Exception as e:
        print(f"Error initializing flight system: {e}")
        import traceback
        traceback.print_exc()
        return False

@app.route('/')
def index():
    """Serve the main login page"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files (HTML, CSS, JS)"""
    try:
        return send_from_directory('.', filename)
    except FileNotFoundError:
        return f"File not found: {filename}", 404

@app.route('/api/login', methods=['POST'])
def login():
    """Handle user login"""
    try:
        data = request.get_json()
        email = data.get('email', '').lower()
        password = data.get('password', '')
        
        # Demo authentication - updated for AI Analyser
        if (email == 'demo@skybooker.com' and password == 'demo123') or \
           (email == 'demo@aianalyser.com' and password == 'demo123') or \
           (email == 'demo' and password == 'demo'):
            session['user'] = {
                'email': email,
                'name': 'Demo User',
                'login_time': datetime.now().isoformat()
            }
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'user': session['user']
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Invalid credentials. Use demo@skybooker.com / demo123'
            }), 401
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Login error: {str(e)}'
        }), 500

@app.route('/api/search', methods=['POST'])
def search_flights():
    """Search for flights using the terminal flight finder logic"""
    try:
        print(f"Session data: {dict(session)}")
        print(f"Session user: {session.get('user')}")
        
        if 'user' not in session:
            print("Authentication failed - no user in session")
            return jsonify({'success': False, 'message': 'Not authenticated'}), 401
        
        data = request.get_json()
        from_city = data.get('from')
        to_city = data.get('to')
        departure_date = data.get('departureDate')
        passengers = data.get('passengers', 1)
        flight_class = data.get('class', 'Economy')
        trip_type = data.get('tripType', 'roundtrip')
        
        if not flight_system:
            return jsonify({
                'success': False,
                'message': 'Flight system not initialized'
            }), 500
        
        # Use the terminal flight finder logic to get recommendations
        print(f"Searching flights from {from_city} to {to_city}")
        
        try:
            best_flights, route_stats = flight_system.analyze_route_flights(from_city, to_city)
            print(f"Flight search result: {best_flights is not None}, {len(best_flights) if best_flights is not None else 0} flights")
        except Exception as e:
            print(f"Error in analyze_route_flights: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({
                'success': False,
                'message': f'Search error: {str(e)}'
            }), 500
        
        if best_flights is None or len(best_flights) == 0:
            print(f"No flights found for route {from_city} -> {to_city}")
            return jsonify({
                'success': False,
                'message': f'No flights found from {from_city} to {to_city}'
            })
        
        # Format results for web interface using terminal logic
        results = []
        for i, (_, flight) in enumerate(best_flights.iterrows()):
            # Calculate dynamic pricing based on class and demand
            base_price = int(flight['price']) if pd.notna(flight['price']) else 5000
            class_multiplier = {
                'Economy': 1.0, 
                'Premium_Economy': 1.5, 
                'Business': 2.5, 
                'First': 4.0
            }.get(flight_class, 1.0)
            
            # Add some realistic price variation
            demand_multiplier = random.uniform(0.9, 1.2)
            final_price = int(base_price * class_multiplier * demand_multiplier)
            
            # Generate realistic flight times
            departure_times = ['06:15', '08:30', '10:45', '13:20', '15:55', '18:10', '20:25']
            departure_time = random.choice(departure_times)
            
            # Calculate arrival time based on duration
            duration = float(flight['duration']) if pd.notna(flight['duration']) else 2.5
            arrival_time = calculate_arrival_time(departure_time, duration)
            
            # Generate flight number
            airline_code = str(flight['airline'])[:2].upper() if pd.notna(flight['airline']) else 'AI'
            flight_number = f"{airline_code}{random.randint(100, 999)}"
            
            # Convert all values to JSON-serializable types
            results.append({
                'id': f"flight_{i+1}",
                'airline': str(flight['airline']) if pd.notna(flight['airline']) else 'Unknown',
                'flight_number': flight_number,
                'from': str(from_city),
                'to': str(to_city),
                'departure_time': departure_time,
                'arrival_time': arrival_time,
                'duration': str(duration),
                'stops': str(flight['stops']) if pd.notna(flight['stops']) else 'zero',
                'price': int(final_price),
                'class': str(flight_class),
                'safety_score': float(round(flight['safety_score'], 1)) if pd.notna(flight['safety_score']) else 7.0,
                'value_score': float(round(flight['value_score'], 1)) if pd.notna(flight['value_score']) else 7.0,
                'aircraft': random.choice(['Boeing 737', 'Airbus A320', 'Boeing 777', 'Airbus A380']),
                'amenities': random.sample(['WiFi', 'Meals', 'Entertainment', 'Extra Legroom', 'Priority Boarding'], 3)
            })
        
        # Convert route_stats to JSON-serializable format
        if route_stats:
            serializable_route_stats = {
                'total_flights': int(route_stats['total_flights']),
                'airlines': [str(airline) for airline in route_stats['airlines']],
                'avg_price': float(route_stats['avg_price'])
            }
        else:
            serializable_route_stats = {
                'total_flights': len(results),
                'airlines': list(set([r['airline'] for r in results])),
                'avg_price': float(sum([r['price'] for r in results]) / len(results)) if results else 0.0
            }
        
        return jsonify({
            'success': True,
            'results': results,
            'search_info': {
                'from': str(from_city),
                'to': str(to_city),
                'departure_date': str(departure_date),
                'passengers': int(passengers),
                'class': str(flight_class),
                'trip_type': str(trip_type),
                'total_results': len(results),
                'route_stats': serializable_route_stats
            }
        })
        
    except Exception as e:
        print(f"Search error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Search error: {str(e)}'
        }), 500

def calculate_arrival_time(departure_time, duration_hours):
    """Calculate arrival time based on departure time and duration"""
    try:
        # Parse departure time
        dep_hour, dep_minute = map(int, departure_time.split(':'))
        
        # Calculate total minutes
        total_minutes = dep_hour * 60 + dep_minute + (duration_hours * 60)
        
        # Calculate arrival time (handle day overflow)
        arrival_hour = int(total_minutes // 60) % 24
        arrival_minute = int(total_minutes % 60)
        
        return f"{arrival_hour:02d}:{arrival_minute:02d}"
    except:
        # Fallback calculation
        return "12:00"

@app.route('/api/cities')
def get_cities():
    """Get list of available cities from the flight system"""
    if not flight_system or flight_system.df is None:
        # Fallback city list
        cities = [
            'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad',
            'Pune', 'Ahmedabad', 'Jaipur', 'Kochi', 'Goa', 'Chandigarh',
            'Indore', 'Nagpur', 'Vadodara', 'Bhubaneswar', 'Coimbatore',
            'Vishakhapatnam', 'Thiruvananthapuram', 'Srinagar'
        ]
    else:
        # Get cities from the actual dataset
        cities = sorted(list(set(
            list(flight_system.df['source_city'].unique()) + 
            list(flight_system.df['destination_city'].unique())
        )))
    
    return jsonify({
        'success': True,
        'cities': cities
    })

@app.route('/api/booking', methods=['POST'])
def create_booking():
    """Create a flight booking"""
    try:
        if 'user' not in session:
            return jsonify({'success': False, 'message': 'Not authenticated'}), 401
        
        data = request.get_json()
        
        # Generate booking confirmation
        confirmation_number = 'SKY' + ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=6))
        
        # Store booking in session (in real app, would save to database)
        booking = {
            'confirmation_number': confirmation_number,
            'user_email': session['user']['email'],
            'flight_data': data,
            'booking_time': datetime.now().isoformat(),
            'status': 'confirmed'
        }
        
        session['last_booking'] = booking
        
        return jsonify({
            'success': True,
            'confirmation_number': confirmation_number,
            'message': 'Booking confirmed successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Booking error: {str(e)}'
        }), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    """Handle user logout"""
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully'})

def main():
    """Main function to run the web application"""
    print("AI Analyser - Flight Booking System")
    print("=" * 50)
    
    # Initialize flight system
    if not init_flight_system():
        print("Failed to initialize flight system. Exiting.")
        return
    
    print("Starting web server...")
    print("Access the application at: http://localhost:5000")
    print("Demo Login: demo@aianalyser.com / demo123 (or demo/demo)")
    print("=" * 50)
    
    try:
        app.run(host='0.0.0.0', port=5000, debug=True)
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"Server error: {e}")

if __name__ == '__main__':
    main()
