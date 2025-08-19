// Basecamp Integration Fix - Properly overrides existing submit functionality
// This file should be loaded AFTER the main application and basecamp-integration.js

(function() {
    console.log('Basecamp Integration Fix loading...');
    
    // Define notification functions if they don't exist
    if (typeof window.showInfo === 'undefined') {
        window.showInfo = function(message) {
            console.log('INFO:', message);
            const statusDiv = document.getElementById('statusMessage') || document.querySelector('.status-message');
            if (statusDiv) {
                statusDiv.innerHTML = message;
                statusDiv.className = 'status-message info';
                statusDiv.style.display = 'block';
                statusDiv.style.background = '#3498db';
                statusDiv.style.color = 'white';
                statusDiv.style.padding = '10px';
                statusDiv.style.borderRadius = '5px';
                statusDiv.style.marginTop = '10px';
            } else {
                // Create a temporary notification
                const notification = document.createElement('div');
                notification.innerHTML = message;
                notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #3498db; color: white; padding: 15px; border-radius: 5px; z-index: 10000; max-width: 300px;';
                document.body.appendChild(notification);
                setTimeout(() => notification.remove(), 5000);
            }
        };
    }
    
    if (typeof window.showError === 'undefined') {
        window.showError = function(message) {
            console.error('ERROR:', message);
            const statusDiv = document.getElementById('statusMessage') || document.querySelector('.status-message');
            if (statusDiv) {
                statusDiv.innerHTML = message;
                statusDiv.className = 'status-message error';
                statusDiv.style.display = 'block';
                statusDiv.style.background = '#e74c3c';
                statusDiv.style.color = 'white';
                statusDiv.style.padding = '10px';
                statusDiv.style.borderRadius = '5px';
                statusDiv.style.marginTop = '10px';
            } else {
                // Create a temporary notification
                const notification = document.createElement('div');
                notification.innerHTML = message;
                notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #e74c3c; color: white; padding: 15px; border-radius: 5px; z-index: 10000; max-width: 300px;';
                document.body.appendChild(notification);
                setTimeout(() => notification.remove(), 10000);
            }
        };
    }
    
    if (typeof window.showSuccess === 'undefined') {
        window.showSuccess = function(message) {
            console.log('SUCCESS:', message);
            const statusDiv = document.getElementById('statusMessage') || document.querySelector('.status-message');
            if (statusDiv) {
                statusDiv.innerHTML = message;
                statusDiv.className = 'status-message success';
                statusDiv.style.display = 'block';
                statusDiv.style.background = '#27ae60';
                statusDiv.style.color = 'white';
                statusDiv.style.padding = '10px';
                statusDiv.style.borderRadius = '5px';
                statusDiv.style.marginTop = '10px';
            } else {
                // Create a temporary notification
                const notification = document.createElement('div');
                notification.innerHTML = message;
                notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #27ae60; color: white; padding: 15px; border-radius: 5px; z-index: 10000; max-width: 300px;';
                document.body.appendChild(notification);
                setTimeout(() => notification.remove(), 5000);
            }
        };
    }
    
    // Wait for DOM and other scripts to load
    function initBasecampFix() {
        // Remove the Netlify form that's causing 404 errors
        const netlifyForm = document.querySelector('form[name="checklist-email"]');
        if (netlifyForm) {
            netlifyForm.remove();
            console.log('Removed Netlify form to prevent 404 errors');
        }
        
        // Override the global submitChecklist function instead of replacing button events
        const originalSubmitChecklist = window.submitChecklist;
        let isSubmitting = false; // Prevent double submissions
        
        window.submitChecklist = async function(e) {
            // Prevent any event if passed
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            // Prevent double submission
            if (isSubmitting) {
                console.log('Submission already in progress, ignoring duplicate call');
                return;
            }
            
            isSubmitting = true;
            console.log('Basecamp-enhanced submit handler triggered');
            
            // Get the submit button for UI updates
            const submitBtn = document.getElementById('submitChecklistBtn');
            const originalText = submitBtn ? submitBtn.innerHTML : '';
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            }
            
            try {
                await submitChecklistInternal();
            } finally {
                isSubmitting = false;
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            }
        };
        
        async function submitChecklistInternal() {
            // Get form data
            const store = document.getElementById('checklistStore').value;
            const manager = document.getElementById('checklistManager').value;
            const checklistDateTime = document.getElementById('checklistDate').value;
            
            if (!store || !manager) {
                showError('Please fill in store location and manager name');
                return;
            }
            
            try {
                // Always use Basecamp integration (no authentication check needed)
                if (window.BasecampIntegration) {
                    console.log('Using Basecamp integration');
                    showInfo('Uploading checklist to Basecamp...');
                    
                    // Submit to Basecamp
                    const result = await window.BasecampIntegration.submitChecklistToBasecamp(
                        currentChecklist,
                        checklistData,
                        store,
                        manager
                    );
                    
                    if (result.success) {
                        showSuccess(`Checklist uploaded to Basecamp! <a href="${result.documentUrl}" target="_blank" style="color: #fff; text-decoration: underline;">View in Basecamp</a>`);
                        
                        // Clear local data after successful submission
                        if (typeof clearChecklist === 'function') {
                            clearChecklist();
                        }
                    } else {
                        throw new Error(result.message || 'Upload failed');
                    }
                } else {
                    // Fallback to PDF download if Basecamp integration not available
                    console.log('Basecamp integration not available, falling back to PDF generation');
                    showInfo('Generating PDF for download...');
                    
                    // Generate PDF using existing function
                    if (typeof generatePDF === 'function') {
                        generatePDF();
                        showSuccess('PDF generated and downloaded successfully!');
                    } else {
                        throw new Error('PDF generation not available');
                    }
                }
            } catch (error) {
                console.error('Submission error:', error);
                showError(`Submission failed: ${error.message}`);
                
                // Offer PDF download as fallback
                if (confirm('Would you like to download the checklist as a PDF instead?')) {
                    if (typeof generatePDF === 'function') {
                        generatePDF();
                    }
                }
            }
        }
        
        console.log('Basecamp integration fix applied successfully');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBasecampFix);
    } else {
        // DOM already loaded, init immediately but wait a bit for other scripts
        setTimeout(initBasecampFix, 1000);
    }
})();