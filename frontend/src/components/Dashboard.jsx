import React, { useState, useEffect, useRef, Suspense } from 'react';
import axios from 'axios';
import { Search, LogOut, MapPin, Loader2, AlertCircle, LogIn, Globe2 } from 'lucide-react';

// Lazy load the MapComponent so it doesn't initialize on page load
const MapComponent = React.lazy(() => import('./MapComponent'));

const Dashboard = () => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('demo_auth_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rateLimitWarning, setRateLimitWarning] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  const searchCache = useRef({});
  const mapRef = useRef(null);
  const searchTimer = useRef(null);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginName, setLoginName] = useState('');

  // User is initialized lazily in useState to avoid setState in effect

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!loginName.trim()) return;
    
    const newUser = {
      name: loginName,
      avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(loginName)}&background=3B82F6&color=fff`
    };
    
    localStorage.setItem('demo_auth_user', JSON.stringify(newUser));
    setUser(newUser);
    setShowLoginModal(false);
    setLoginName('');
  };

  const handleLogout = () => {
    localStorage.removeItem('demo_auth_user');
    setUser(null);
    setResults([]);
    setQuery('');
    setSelectedLocation(null);
    setHasSearched(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery) return;
    
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    // Debounce API request
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      setRateLimitWarning(false);
      setSelectedLocation(null);
      setHasSearched(true);

      if (searchCache.current[trimmedQuery]) {
        setResults(searchCache.current[trimmedQuery]);
        // Update map location with cached first result
        const first = searchCache.current[trimmedQuery][0];
        if (first && mapRef.current) {
          mapRef.current.updateLocation(parseFloat(first.lat), parseFloat(first.lon));
        }
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: { 
            q: trimmedQuery, 
            format: 'json', 
            addressdetails: 1, 
            limit: 5 
          },
          headers: { 
            'User-Agent': 'LocationFinderDashboard/1.0',
            'Accept-Language': 'en'
          }
        });
        
        if (response.data && Array.isArray(response.data)) {
          setResults(response.data);
          searchCache.current[trimmedQuery] = response.data;
          // Update map with first result and select it
          const first = response.data[0];
          if (first && mapRef.current) {
            mapRef.current.updateLocation(parseFloat(first.lat), parseFloat(first.lon));
            setSelectedLocation(first);
          }
        }
      } catch (err) {
        console.error('Search error:', err);
        if (err.response && err.response.status === 429) {
          setRateLimitWarning(true);
          setError('Rate limit exceeded from mapping service. Please slow down.');
        } else {
          setError('An error occurred during search. The mapping service might be unreachable.');
        }
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  return (
    <div className="dashboard-container fade-in relative">
      {/* SVG Defs for Gradients */}
      <svg width="0" height="0">
        <defs>
          <linearGradient id="neon-blue-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop stopColor="#3B82F6" offset="0%" />
            <stop stopColor="#00FF9D" offset="100%" />
          </linearGradient>
        </defs>
      </svg>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="modal-overlay fade-in">
          <div className="modal-content">
            <h2 className="modal-title">Authentication</h2>
            <p className="modal-subtitle">Establish secure link to Location Finder network.</p>
            <form onSubmit={handleLoginSubmit}>
              <input 
                type="text" 
                placeholder="Enter operator designation (e.g. John Doe)" 
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                className="modal-input"
                autoFocus
              />
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowLoginModal(false)}>Abort</button>
                <button type="submit" className="btn-gradient">Authorize</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="dashboard-header">
        <div className="header-logo">
          <MapPin size={28} />
          <h2>LocationFinder</h2>
        </div>
        <div className="header-user">
          {user ? (
            <>
              <img src={user.avatar_url} alt="avatar" className="avatar" />
              <span className="user-name">{user.name}</span>
              <button className="btn-icon" onClick={handleLogout} title="Logout">
                <LogOut size={22} />
              </button>
            </>
          ) : (
            <button className="btn-gradient btn-small" onClick={() => setShowLoginModal(true)}>
              <LogIn size={18} />
              <span>Connect</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="search-section">
          <h1 className="search-title">Explore Any Location Worldwide</h1>
          <p className="search-subtitle">Search cities, landmarks, coordinates, and discover locations instantly.</p>
          <form onSubmit={handleSearch} className="search-bar">
            <Search className="text-secondary" size={24} />
            <input 
              type="text" 
              placeholder="Search database..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn-gradient" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Search'}
            </button>
          </form>

          {/* Error / Rate Limit Warning */}
          {error && (
            <div className={`alert ${rateLimitWarning ? 'alert-warning' : 'alert-error'} fade-in`}>
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Results (Details Card first) */}
        <div className="results-section">
          {results.length > 0 ? (
            <div className="results-grid">
              {results.map((result, idx) => {
                const isCountry = result.addresstype === 'country' || result.type === 'country';
                const countryName = result.address?.country || 'Not Available';
                let regionName = result.address?.state || result.address?.region || result.address?.county || 'Not Available';
                let addressText = result.display_name;
                
                if (isCountry) {
                  regionName = 'Country Level Location';
                  addressText = result.name || countryName;
                }

                return (
                  <div 
                    key={idx} 
                    className={`result-card modern-card fade-in ${selectedLocation === result ? 'selected-card' : ''}`} 
                    style={{ animationDelay: `${idx * 0.05}s` }}
                    onClick={() => setSelectedLocation(result)}
                  >
                    <div className="result-header">
                      <MapPin size={24} />
                      <h3 className="result-name">{result.name || result.display_name.split(',')[0]}</h3>
                    </div>
                    <div className="result-details" style={{ marginBottom: '12px', fontSize: '0.9rem', color: '#94A3B8' }}>
                      <p><strong>Country:</strong> {countryName}</p>
                      <p><strong>{isCountry ? 'Region' : 'State/Region'}:</strong> {regionName}</p>
                      <p><strong>Address:</strong> {addressText}</p>
                    </div>
                    <div className="result-coords">
                      <span className="coord-badge">Lat: {parseFloat(result.lat).toFixed(4)}</span>
                      <span className="coord-badge">Lon: {parseFloat(result.lon).toFixed(4)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            !loading && query && !error && user && hasSearched && (
              <div className="no-results fade-in">
                <Search size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                <p>No locations matching query. Try a different search term.</p>
              </div>
            )
          )}
        </div>

        {/* Map Section */}
        <div style={{
          transition: 'opacity 0.6s ease',
          opacity: hasSearched ? 1 : 0,
          display: hasSearched ? 'block' : 'none',
          marginTop: '20px'
        }}>
          {hasSearched && (
            <div className="map-section-card fade-in">
              <div className="map-header">
                <Globe2 size={24} />
                <h3>Interactive World Map</h3>
              </div>
              <Suspense fallback={
                <div className="modern-card flex-center" style={{ height: '50vh', minHeight: '350px', maxHeight: '600px', borderRadius: '16px' }}>
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin" size={32} style={{ color: '#00FF9D' }} />
                    <span className="text-sm text-secondary">Establishing uplink to map engine...</span>
                  </div>
                </div>
              }>
                <MapComponent ref={mapRef} results={results} selectedLocation={selectedLocation} loading={loading} />
              </Suspense>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
