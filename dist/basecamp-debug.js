// Basecamp Debug Helper
// This adds debugging tools to help troubleshoot Basecamp integration

(function() {
    console.log('Basecamp Debug Helper loaded');
    
    // Add debug panel
    function addDebugPanel() {
        const debugPanel = document.createElement('div');
        debugPanel.id = 'basecampDebugPanel';
        debugPanel.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: #2c3e50;
            color: white;
            padding: 15px;
            border-radius: 8px;
            max-width: 400px;
            z-index: 10000;
            font-family: monospace;
            font-size: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        `;
        
        debugPanel.innerHTML = `
            <h3 style="margin-top: 0; color: #3498db;">🔧 Basecamp Debug Panel</h3>
            <div id="debugInfo" style="margin: 10px 0;">
                <p>Loading status...</p>
            </div>
            <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                <button onclick="testBasecampConnection()" style="padding: 5px 10px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">Test Connection</button>
                <button onclick="testBasecampAuth()" style="padding: 5px 10px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer;">Authenticate</button>
                <button onclick="testPDFGeneration()" style="padding: 5px 10px; background: #e67e22; color: white; border: none; border-radius: 4px; cursor: pointer;">Test PDF</button>
                <button onclick="testFullUpload()" style="padding: 5px 10px; background: #9b59b6; color: white; border: none; border-radius: 4px; cursor: pointer;">Test Full Upload</button>
                <button onclick="clearBasecampTokens()" style="padding: 5px 10px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">Clear Tokens</button>
                <button onclick="closeDebugPanel()" style="padding: 5px 10px; background: #95a5a6; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
            </div>
            <div id="debugOutput" style="margin-top: 10px; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 4px; max-height: 300px; overflow-y: auto;">
                <div style="color: #95a5a6;">Output will appear here...</div>
            </div>
        `;
        
        document.body.appendChild(debugPanel);
        updateDebugInfo();
    }
    
    // Update debug info
    function updateDebugInfo() {
        const info = document.getElementById('debugInfo');
        if (!info) return;
        
        const hasToken = window.BasecampIntegration && window.BasecampIntegration.hasValidToken();
        const token = window.BasecampIntegration && window.BasecampIntegration.getAccessToken();
        const tokenExpiry = localStorage.getItem('basecamp_token_expiry');
        const expiryDate = tokenExpiry ? new Date(parseInt(tokenExpiry)).toLocaleString() : 'N/A';
        
        info.innerHTML = `
            <p><strong>Status:</strong> ${hasToken ? '✅ Connected' : '❌ Not Connected'}</p>
            <p><strong>Token:</strong> ${token ? token.substring(0, 20) + '...' : 'None'}</p>
            <p><strong>Expires:</strong> ${expiryDate}</p>
            <p><strong>jsPDF:</strong> ${window.jspdf ? '✅ Loaded' : '❌ Not Loaded'}</p>
            <p><strong>Checklist Data:</strong> ${window.checklistData ? '✅ Available' : '❌ Not Available'}</p>
        `;
    }
    
    // Test connection
    window.testBasecampConnection = function() {
        const output = document.getElementById('debugOutput');
        output.innerHTML = '<div style="color: #3498db;">Testing connection...</div>';
        
        if (!window.BasecampIntegration) {
            output.innerHTML = '<div style="color: #e74c3c;">❌ BasecampIntegration not loaded!</div>';
            return;
        }
        
        const hasToken = window.BasecampIntegration.hasValidToken();
        const token = window.BasecampIntegration.getAccessToken();
        
        if (hasToken && token) {
            output.innerHTML = '<div style="color: #27ae60;">✅ Connection valid! Token present.</div>';
        } else {
            output.innerHTML = '<div style="color: #e67e22;">⚠️ No valid connection. Please authenticate.</div>';
        }
        
        updateDebugInfo();
    };
    
    // Test authentication
    window.testBasecampAuth = async function() {
        const output = document.getElementById('debugOutput');
        output.innerHTML = '<div style="color: #3498db;">Starting authentication...</div>';
        
        try {
            await window.BasecampIntegration.authenticate();
            output.innerHTML = '<div style="color: #27ae60;">✅ Authentication successful!</div>';
            updateDebugInfo();
        } catch (error) {
            output.innerHTML = `<div style="color: #e74c3c;">❌ Authentication failed: ${error.message}</div>`;
        }
    };
    
    // Test PDF generation
    window.testPDFGeneration = function() {
        const output = document.getElementById('debugOutput');
        output.innerHTML = '<div style="color: #3498db;">Testing PDF generation...</div>';
        
        if (!window.jspdf || !window.jspdf.jsPDF) {
            output.innerHTML = '<div style="color: #e74c3c;">❌ jsPDF not loaded!</div>';
            return;
        }
        
        try {
            // Create test data
            const testData = {
                openingchecklist: {
                    'clean-entrance': true,
                    'lights-on': true,
                    'music-playing': false
                }
            };
            
            const pdfBase64 = window.BasecampIntegration.generateChecklistPDF(
                'Test Checklist',
                testData,
                'Test Store',
                'Test Manager',
                new Date().toLocaleDateString()
            );
            
            output.innerHTML = `<div style="color: #27ae60;">✅ PDF generated! Base64 length: ${pdfBase64.length}</div>`;
            
            // Create download link
            const link = document.createElement('a');
            link.href = 'data:application/pdf;base64,' + pdfBase64;
            link.download = 'test-checklist.pdf';
            link.innerHTML = 'Download Test PDF';
            link.style.color = '#3498db';
            link.style.textDecoration = 'underline';
            link.style.display = 'block';
            link.style.marginTop = '10px';
            output.appendChild(link);
            
        } catch (error) {
            output.innerHTML = `<div style="color: #e74c3c;">❌ PDF generation failed: ${error.message}</div>`;
            console.error('PDF generation error:', error);
        }
    };
    
    // Test full upload
    window.testFullUpload = async function() {
        const output = document.getElementById('debugOutput');
        output.innerHTML = '<div style="color: #3498db;">Starting full upload test...</div>';
        
        if (!window.BasecampIntegration) {
            output.innerHTML = '<div style="color: #e74c3c;">❌ BasecampIntegration not loaded!</div>';
            return;
        }
        
        if (!window.BasecampIntegration.hasValidToken()) {
            output.innerHTML = '<div style="color: #e67e22;">⚠️ Not authenticated. Please authenticate first.</div>';
            return;
        }
        
        try {
            // Create test data
            const testData = {
                openingchecklist: {
                    'test-item-1': true,
                    'test-item-2': 'Test value',
                    'test-item-3': 5
                }
            };
            
            output.innerHTML += '<div style="color: #3498db;">Submitting test checklist...</div>';
            
            const result = await window.BasecampIntegration.submitChecklistToBasecamp(
                'Debug Test',
                testData,
                'Test Store',
                'Debug Tester'
            );
            
            if (result.success) {
                output.innerHTML = `
                    <div style="color: #27ae60;">✅ Upload successful!</div>
                    <div style="margin-top: 10px;">
                        <a href="${result.documentUrl}" target="_blank" style="color: #3498db; text-decoration: underline;">
                            View in Basecamp
                        </a>
                    </div>
                `;
            } else {
                output.innerHTML = `<div style="color: #e74c3c;">❌ Upload failed: ${result.message}</div>`;
            }
            
        } catch (error) {
            output.innerHTML = `<div style="color: #e74c3c;">❌ Upload error: ${error.message}</div>`;
            console.error('Full upload test error:', error);
        }
    };
    
    // Clear tokens
    window.clearBasecampTokens = function() {
        const output = document.getElementById('debugOutput');
        
        if (window.BasecampIntegration) {
            window.BasecampIntegration.clearTokens();
            output.innerHTML = '<div style="color: #27ae60;">✅ Tokens cleared!</div>';
            updateDebugInfo();
        } else {
            output.innerHTML = '<div style="color: #e74c3c;">❌ BasecampIntegration not loaded!</div>';
        }
    };
    
    // Close panel
    window.closeDebugPanel = function() {
        const panel = document.getElementById('basecampDebugPanel');
        if (panel) {
            panel.remove();
        }
    };
    
    // Initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addDebugPanel);
    } else {
        setTimeout(addDebugPanel, 1000);
    }
    
    // Add keyboard shortcut to toggle panel (Ctrl+Shift+D)
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            const panel = document.getElementById('basecampDebugPanel');
            if (panel) {
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            } else {
                addDebugPanel();
            }
        }
    });
    
})();