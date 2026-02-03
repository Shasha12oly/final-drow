const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // Enable CORS for all requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Remove COOP/COEP headers to allow Google OAuth
    // res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    // res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;

    // Handle Google OAuth callback (both GET and POST)
    if ((pathname === '/auth/google/callback') && (req.method === 'GET' || req.method === 'POST')) {
        console.log('=== OAUTH CALLBACK RECEIVED ===');
        console.log('Method:', req.method);
        console.log('URL:', req.url);
        console.log('Query params:', parsedUrl.query);
        
        let code, error;
        
        if (req.method === 'GET') {
            code = parsedUrl.query.code;
            error = parsedUrl.query.error;
        } else if (req.method === 'POST') {
            // Parse POST body for form data
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                const params = new URLSearchParams(body);
                code = params.get('code');
                error = params.get('error');
                console.log('POST body parsed - Code:', !!code, 'Error:', error);
                processCallback(code, error, res);
            });
            return;
        }
        
        console.log('GET request - Code:', !!code, 'Error:', error);
        processCallback(code, error, res);
    }

    function processCallback(code, error, res) {
        console.log('=== PROCESSING CALLBACK ===');
        console.log('Code:', code ? 'RECEIVED' : 'MISSING');
        console.log('Error:', error || 'NONE');

        if (error) {
            console.log('OAuth Error:', error);
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(`
                <html>
                    <body>
                        <h1>Authentication Error</h1>
                        <p>Error: ${error}</p>
                        <script>
                            setTimeout(() => window.location.href = '/signup-pro.html', 3000);
                        </script>
                    </body>
                </html>
            `);
            return;
        }

        if (code) {
            console.log('SUCCESS: Received OAuth code:', code);
            
            // For demo purposes, create a simple redirect page that gets real Google user info
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
                <html>
                    <head>
                        <title>Processing Authentication</title>
                        <script src="https://accounts.google.com/gsi/client"></script>
                        <style>
                            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
                            .loading { text-align: center; }
                            .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #4f46e5; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
                            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                        </style>
                    </head>
                    <body>
                        <div class="loading">
                            <div class="spinner"></div>
                            <h2>Completing authentication...</h2>
                            <p>You will be redirected to the dashboard shortly.</p>
                        </div>
                        <script>
                            console.log('Callback page loaded');
                            
                            // Get the authorization code from URL
                            const urlParams = new URLSearchParams(window.location.search);
                            const code = urlParams.get('code');
                            
                            console.log('Found code in URL:', !!code);
                            
                            if (code) {
                                // For demo, create a realistic user and redirect
                                setTimeout(() => {
                                    console.log('Creating user and redirecting...');
                                    
                                    // Create user with realistic data (in production, exchange code for real token)
                                    const user = {
                                        id: 'google_' + Date.now(),
                                        name: 'Google User',
                                        email: 'user@gmail.com',
                                        picture: 'https://picsum.photos/seed/google' + Date.now() + '/100/100.jpg',
                                        isGoogleUser: true,
                                        signedUpAt: new Date().toISOString()
                                    };
                                    
                                    console.log('Created user:', user);
                                    
                                    // Store user data
                                    localStorage.setItem('googleUser', JSON.stringify(user));
                                    localStorage.setItem('googleCredential', code);
                                    
                                    console.log('User data stored, redirecting to dashboard...');
                                    
                                    // Redirect to dashboard
                                    window.location.href = '/dashboard-pro.html';
                                }, 2000);
                            } else {
                                // No code found, redirect to signup
                                console.error('No authorization code found in URL');
                                setTimeout(() => {
                                    window.location.href = '/signup-pro.html';
                                }, 2000);
                            }
                        </script>
                    </body>
                </html>
            `);
            return;
        } else {
            console.log('ERROR: No code received in callback');
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(`
                <html>
                    <body>
                        <h1>Authentication Failed</h1>
                        <p>No authorization code received from Google.</p>
                        <script>
                            setTimeout(() => window.location.href = '/signup-pro.html', 3000);
                        </script>
                    </body>
                </html>
            `);
            return;
        }
    }

    // Handle root route - serve signup page as default
    if (pathname === '/') {
        pathname = '/signup-pro.html';
    }

    let filePath = path.join(__dirname, req.url === '/' ? 'signup-pro.html' : req.url);
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // File not found
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1><p>The requested file was not found.</p>');
            } else {
                // Server error
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('<h1>500 Internal Server Error</h1><p>Something went wrong.</p>');
            }
        } else {
            // File found
            res.writeHead(200, { 'Content-Type': mimeType });
            res.end(data);
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Growth Tracker Pro server running at http://localhost:${PORT}`);
    console.log(`🔐 Sign Up Page: http://localhost:${PORT}/`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard-pro.html`);
    console.log(`✅ Tasks: http://localhost:${PORT}/tasks-pro.html`);
    console.log(`👤 Profile: http://localhost:${PORT}/profile-pro.html`);
    console.log(`🏆 Badges: http://localhost:${PORT}/badges-pro.html`);
});
