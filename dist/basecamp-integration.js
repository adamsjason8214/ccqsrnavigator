// Basecamp Integration for CCQSR Navigator
// This module handles OAuth authentication and PDF uploads to Basecamp

console.log('Loading Basecamp Integration module...');

const BasecampIntegration = {
    // Configuration
    config: {
        accountId: '6023243',
        projectId: '43545521',
        defaultVaultId: '8971236791', // Default vault for any other checklists
        openingVaultId: '8971352076', // Specific vault for opening manager checklists
        closingVaultId: '8971352307', // Specific vault for closing checklists
        weeklyVaultId: '8971352953',  // Specific vault for weekly checklists
        monthlyVaultId: '8971352839', // Specific vault for monthly checklists
        fieldManagerVaultId: '8971288702', // Specific vault for field manager checklists
        scheduleVaultId: '8971651842', // Specific vault for schedules
        clientId: '10bd625f81072c1c1a309471bc11ad022b1fc77e'
    },
    
    // Get the appropriate vault ID based on checklist type
    getVaultId(checklistType) {
        const cleanType = checklistType.toLowerCase().replace(/\s+/g, '').replace('-', '');
        
        // Check if this is an opening manager checklist
        if (cleanType === 'opening' || cleanType === 'openingmanager') {
            return this.config.openingVaultId;
        }
        
        // Check if this is a closing checklist
        if (cleanType === 'closing' || cleanType === 'closingmanager') {
            return this.config.closingVaultId;
        }
        
        // Check if this is a weekly checklist
        if (cleanType === 'weekly' || cleanType === 'weeklychecklist') {
            return this.config.weeklyVaultId;
        }
        
        // Check if this is a monthly checklist
        if (cleanType === 'monthly' || cleanType === 'monthlychecklist') {
            return this.config.monthlyVaultId;
        }
        
        // Check if this is a field manager checklist
        if (cleanType === 'fieldmanager' || cleanType === 'fieldmanagerchecklist') {
            return this.config.fieldManagerVaultId;
        }
        
        // Check if this is a schedule
        if (cleanType === 'schedule' || cleanType === 'weekschedule' || cleanType === 'weeklyschedule') {
            return this.config.scheduleVaultId;
        }
        
        // Use default vault for any other checklists
        return this.config.defaultVaultId;
    },

    // Simplified - no client-side authentication needed
    // All authentication is handled server-side

    // Generate PDF from checklist data
    generateChecklistPDF(checklistType, checklistData, storeLocation, managerName, date) {
        // Check if jsPDF is available
        if (!window.jspdf || !window.jspdf.jsPDF) {
            console.error('jsPDF not loaded');
            throw new Error('PDF library not available');
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // The checklistType passed might be different from the key used in checklistPhotos
        // Try to find the correct key by looking at window.currentChecklist or deriving it
        let photoKey = checklistType.toLowerCase().replace(/\s+/g, '').replace('-', '');
        
        // For field manager, the key is 'fieldmanager' not 'field-manager'
        if (photoKey === 'fieldmanager' || checklistType.toLowerCase().includes('field')) {
            photoKey = 'fieldmanager';
        }
        
        console.log('Looking for photos with key:', photoKey);
        console.log('Available photo keys:', window.checklistPhotos ? Object.keys(window.checklistPhotos) : 'none');
        
        // Get photos from the global checklistPhotos object
        const photos = window.checklistPhotos && window.checklistPhotos[photoKey] ? 
                       window.checklistPhotos[photoKey] : 
                       (window.checklistPhotos && window.checklistPhotos[window.currentChecklist] ? 
                        window.checklistPhotos[window.currentChecklist] : {});
        
        console.log('Found photos:', Object.keys(photos).length, 'items');
        
        // Header
        doc.setFontSize(20);
        doc.text(`${checklistType} Checklist`, 20, 20);
        
        doc.setFontSize(12);
        doc.text(`Store: ${storeLocation}`, 20, 35);
        doc.text(`Manager: ${managerName}`, 20, 42);
        doc.text(`Date: ${date}`, 20, 49);
        
        // Checklist content
        let yPos = 65;
        // Handle different checklist type formats
        const checklistKey = checklistType.toLowerCase().replace(/\s+/g, '').replace('-', '');
        const checklistDef = (window.checklistsNew || window.checklists || {})[checklistKey];
        
        if (checklistDef) {
            checklistDef.sections.forEach(section => {
                // Section title
                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.text(section.title, 20, yPos);
                yPos += 10;
                
                doc.setFont(undefined, 'normal');
                doc.setFontSize(11);
                
                section.items.forEach(item => {
                    const value = checklistData[checklistKey]?.[item.id] || checklistData[item.id];
                    let displayValue = 'Not completed';
                    
                    // Check if this item is a photo type
                    const isPhotoItem = item.type === 'photo';
                    // Get photo from the photos object
                    const photoData = isPhotoItem ? photos[item.id] : null;
                    
                    if (item.type === 'checkbox' && value === true) {
                        displayValue = '✓ Complete';
                    } else if (item.type === 'pass-fail' && value) {
                        displayValue = value;
                    } else if (item.type === 'rating' && value) {
                        displayValue = `${value} stars`;
                    } else if (isPhotoItem && photoData) {
                        displayValue = 'Photo included below';
                    } else if ((item.type === 'text' || item.type === 'textarea') && value) {
                        displayValue = value;
                    }
                    
                    // Check if we need a new page
                    if (yPos > 260) {
                        doc.addPage();
                        yPos = 20;
                    }
                    
                    // Item label and value
                    const lines = doc.splitTextToSize(`• ${item.label}: ${displayValue}`, 170);
                    lines.forEach(line => {
                        doc.text(line, 25, yPos);
                        yPos += 6;
                    });
                    
                    // If there's a photo, try to add it to the PDF
                    if (isPhotoItem && photoData) {
                        try {
                            console.log(`Adding photo for ${item.id}, data length: ${photoData.length}`);
                            
                            // Check if photoData is a base64 image
                            if (typeof photoData === 'string' && photoData.startsWith('data:image')) {
                                // Extract image format from the data URL
                                const format = photoData.match(/data:image\/(\w+);/)?.[1] || 'jpeg';
                                
                                // Add some space before the image
                                yPos += 5;
                                
                                // Check if we need a new page for the image
                                if (yPos > 180) {
                                    doc.addPage();
                                    yPos = 20;
                                }
                                
                                // Add image to PDF
                                // Use JPEG format explicitly as photos are compressed to JPEG
                                try {
                                    doc.addImage(photoData, 'JPEG', 30, yPos, 120, 90);
                                    console.log(`Successfully added photo ${item.id} to PDF`);
                                } catch (imgError) {
                                    // Try with original format if JPEG fails
                                    console.log(`JPEG failed, trying ${format.toUpperCase()}`);
                                    doc.addImage(photoData, format.toUpperCase(), 30, yPos, 120, 90);
                                }
                                
                                // Move position after image
                                yPos += 95; // Space for image plus margin
                            } else {
                                console.warn(`Photo data for ${item.id} is not in expected format`);
                            }
                        } catch (photoError) {
                            console.error(`Failed to add photo ${item.id} to PDF:`, photoError);
                            // Continue without the photo
                        }
                    } else if (isPhotoItem) {
                        console.log(`No photo data found for item ${item.id}`);
                    }
                });
                
                yPos += 5; // Space between sections
            });
        }
        
        // Footer
        doc.setFontSize(10);
        doc.text('Generated by CCQSR Navigator', 20, 280);
        doc.text(`Page ${doc.internal.getNumberOfPages()}`, 190, 280, { align: 'right' });
        
        return doc.output('datauristring').split(',')[1]; // Return base64
    },

    // Submit checklist to Basecamp
    async submitChecklistToBasecamp(checklistType, checklistData, storeLocation, managerName) {
        console.log('=== Starting Basecamp submission ===');
        console.log('Checklist Type:', checklistType);
        console.log('Store Location:', storeLocation);
        console.log('Manager Name:', managerName);
        
        try {
            
            // Generate PDF
            console.log('Generating PDF...');
            const date = new Date().toLocaleDateString();
            const pdfBase64 = this.generateChecklistPDF(
                checklistType,
                checklistData,
                storeLocation,
                managerName,
                date
            );
            console.log('PDF generated, base64 length:', pdfBase64 ? pdfBase64.length : 0);
            
            // Prepare filename
            const fileName = `${checklistType}_${storeLocation}_${date.replace(/\//g, '-')}.pdf`;
            
            // Upload to Basecamp
            console.log('Uploading to Basecamp...');
            console.log('Filename:', fileName);
            
            // Get the appropriate vault ID for this checklist type
            const vaultId = this.getVaultId(checklistType);
            console.log('Using vault ID:', vaultId, 'for checklist type:', checklistType);
            
            const uploadPayload = {
                pdfBase64,
                fileName,
                checklistType,
                storeLocation,
                managerName,
                date,
                vaultId // Pass the specific vault ID
            };
            console.log('Upload payload size:', JSON.stringify(uploadPayload).length);
            
            const response = await fetch('/.netlify/functions/basecamp-upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(uploadPayload)
            });
            console.log('Upload response status:', response.status);
            
            const result = await response.json();
            console.log('Upload result:', result);
            
            if (result.success) {
                console.log('Upload successful! Document URL:', result.documentUrl);
                // Also save to database for tracking
                await this.saveToDatabase(checklistType, storeLocation, managerName, result.documentUrl);
                
                return {
                    success: true,
                    message: 'Checklist uploaded to Basecamp successfully',
                    documentUrl: result.documentUrl
                };
            } else {
                console.error('Upload failed:', result.error, result.details);
                throw new Error(result.error || 'Upload failed');
            }
            
        } catch (error) {
            console.error('=== Basecamp submission error ===');
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            throw error;
        }
    },

    // Save submission record to database
    async saveToDatabase(checklistType, storeLocation, managerName, basecampUrl) {
        try {
            // Get current user from localStorage
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            
            // Only save to database if we have a valid user ID
            if (!currentUser.id) {
                console.log('No user ID found, skipping database save. Checklist still uploaded to Basecamp.');
                return;
            }
            
            // Make sure we have a numeric user ID
            const userId = parseInt(currentUser.id);
            if (isNaN(userId)) {
                console.log('Invalid user ID format, skipping database save. Checklist still uploaded to Basecamp.');
                return;
            }
            
            // Save with numeric user_id as the database expects an integer
            await DB_API.apiCall('/checklists', 'POST', {
                user_id: userId, // Using numeric ID that exists in users table
                location: storeLocation,
                checklist_type: checklistType,
                checklist_data: { 
                    basecamp_url: basecampUrl,
                    manager_name: managerName,
                    manager_email: currentUser.email || managerName,
                    submitted_at: new Date().toISOString()
                },
                basecamp_project_id: this.config.projectId,
                submission_status: 'sent'
            });
            console.log('Checklist submission saved to database');
        } catch (error) {
            console.error('Database save error:', error);
            // Don't throw - this is not critical for the main submission flow
            // The checklist was still successfully uploaded to Basecamp
        }
    },

    // Generate Schedule PDF with enhanced reporting
    generateSchedulePDF(scheduleData, weekStartDate, location, brand, salesData) {
        // Check if jsPDF is available
        if (!window.jspdf || !window.jspdf.jsPDF) {
            console.error('jsPDF not loaded');
            throw new Error('PDF library not available');
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape', 'pt', 'letter');
        
        // Header
        doc.setFontSize(20);
        doc.text('Weekly Schedule Report', 40, 40);
        
        doc.setFontSize(12);
        doc.text(`Brand: ${brand || 'N/A'}`, 40, 60);
        doc.text(`Location: ${location || 'N/A'}`, 40, 75);
        doc.text(`Week Starting: ${weekStartDate}`, 40, 90);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 105);
        
        // Check if this is a Doughnut brand location
        const isDoughnutBrand = brand === 'Doughnut' || (location && location.toUpperCase().startsWith('ODT'));
        
        // Initialize tracking variables with 5 shift categories
        const createShiftStructure = () => {
            if (isDoughnutBrand) {
                return { gm: 0, barista: 0, foh: 0, den: 0, kitchen: 0 };
            } else {
                return { managers: 0, drivers: 0, crew: 0 };
            }
        };
        
        const shiftAnalysis = {
            mon: { morning: createShiftStructure(), lunch: createShiftStructure(), midday: createShiftStructure(), dinner: createShiftStructure(), closing: createShiftStructure() },
            tue: { morning: createShiftStructure(), lunch: createShiftStructure(), midday: createShiftStructure(), dinner: createShiftStructure(), closing: createShiftStructure() },
            wed: { morning: createShiftStructure(), lunch: createShiftStructure(), midday: createShiftStructure(), dinner: createShiftStructure(), closing: createShiftStructure() },
            thu: { morning: createShiftStructure(), lunch: createShiftStructure(), midday: createShiftStructure(), dinner: createShiftStructure(), closing: createShiftStructure() },
            fri: { morning: createShiftStructure(), lunch: createShiftStructure(), midday: createShiftStructure(), dinner: createShiftStructure(), closing: createShiftStructure() },
            sat: { morning: createShiftStructure(), lunch: createShiftStructure(), midday: createShiftStructure(), dinner: createShiftStructure(), closing: createShiftStructure() },
            sun: { morning: createShiftStructure(), lunch: createShiftStructure(), midday: createShiftStructure(), dinner: createShiftStructure(), closing: createShiftStructure() }
        };
        
        let totalWeeklyHours = 0;
        let totalWeeklyLabor = 0;
        const employeeHours = {};
        
        // Track hours by role
        let totalCrewHours = 0;
        let totalDriverHours = 0;
        let totalGMHours = 0;
        let totalHourlyManagerHours = 0;
        let totalOvertimeHours = 0;
        
        // Doughnut-specific role hours
        let totalBaristaHours = 0;
        let totalFOHHours = 0;
        let totalDenHours = 0;
        let totalKitchenHours = 0;
        
        // Days of week
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        
        // Table headers
        let yPos = 130;
        const colWidth = 90;
        const firstColWidth = 120;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        
        // Draw table headers
        doc.text('Employee', 40, yPos);
        let xPos = 40 + firstColWidth;
        days.forEach(day => {
            doc.text(day.substring(0, 3), xPos, yPos);
            xPos += colWidth;
        });
        doc.text('Total', xPos, yPos);
        
        // Draw line under headers
        yPos += 5;
        doc.line(40, yPos, 750, yPos);
        yPos += 15;
        
        doc.setFont(undefined, 'normal');
        
        // First pass - collect data for analysis
        Object.keys(scheduleData).forEach(empId => {
            const empData = scheduleData[empId];
            if (empData && empData.name) {
                let empTotalHours = 0;
                
                // Determine employee role category
                const role = (empData.role || '').toLowerCase();
                let roleCategory = 'crew';
                let isGM = false;
                let isHourlyManager = false;
                let isSalaried = false;
                
                // Check if this is a Taco or Doughnut brand location
                const isTacoBrand = brand === 'Taco' || (location && location.toLowerCase().includes('taco'));
                
                if (isTacoBrand) {
                    // Taco brand specific role categories
                    if (role.includes('general manager') || role.includes('gm')) {
                        roleCategory = 'managers';
                        isGM = true;
                        isSalaried = true; // GMs are typically salaried
                    } else if (role === '!bartender') {
                        roleCategory = 'managers'; // !Bartender counts as manager
                        isHourlyManager = true;
                    } else if (role === '!cook') {
                        roleCategory = 'managers'; // !Cook counts as manager
                        isHourlyManager = true;
                    } else if (role === 'bartender') {
                        roleCategory = 'crew'; // Regular Bartender counts as crew
                    } else if (role === 'cook') {
                        roleCategory = 'crew'; // Regular Cook counts as crew
                    }
                } else if (isDoughnutBrand) {
                    // Doughnut brand specific role categories
                    if (role.includes('gm')) {
                        roleCategory = 'managers';
                        isGM = true;
                        isSalaried = true; // GMs are typically salaried
                    } else if (role === 'barista') {
                        roleCategory = 'crew';
                    } else if (role === 'foh' || role.includes('front of house')) {
                        roleCategory = 'crew';
                    } else if (role === 'den') {
                        roleCategory = 'crew';
                    } else if (role === 'kitchen') {
                        roleCategory = 'crew';
                    }
                } else if (role.includes('general manager') || role.includes('gm')) {
                    roleCategory = 'managers';
                    isGM = true;
                    isSalaried = true; // GMs are typically salaried
                } else if (role.includes('manager') || role.includes('mgr') || role.includes('assistant')) {
                    roleCategory = 'managers';
                    isHourlyManager = true;
                    // Check if salaried based on pay type
                    isSalaried = empData.payType === 'weekly' || empData.payType === 'salary';
                } else if (role.includes('driver') || role.includes('delivery')) {
                    roleCategory = 'drivers';
                }
                
                // Analyze each day
                dayKeys.forEach(day => {
                    const shift = empData[day] || 'OFF';
                    
                    if (shift !== 'OFF' && shift.includes('-')) {
                        const parts = shift.split('-');
                        if (parts.length === 2) {
                            const start = this.parseTime(parts[0]);
                            const end = this.parseTime(parts[1]);
                            
                            if (start !== null && end !== null) {
                                // Calculate hours
                                let hours = (end - start) / 60;
                                if (hours < 0) hours += 24; // Handle overnight shifts
                                empTotalHours += hours;
                                
                                // Check which shifts this employee overlaps with
                                // Define shift periods in minutes from midnight
                                const shiftPeriods = {
                                    morning: { start: 5 * 60, end: 10 * 60 },   // 5am-10am (300-600)
                                    lunch: { start: 10 * 60, end: 14 * 60 },    // 10am-2pm (600-840)
                                    midday: { start: 14 * 60, end: 17 * 60 },   // 2pm-5pm (840-1020)
                                    dinner: { start: 17 * 60, end: 21 * 60 },   // 5pm-9pm (1020-1260)
                                    closing: { start: 21 * 60, end: 24 * 60 }   // 9pm-12am (1260-1440)
                                };
                                
                                // For each shift period, check if employee's shift overlaps
                                Object.entries(shiftPeriods).forEach(([shiftName, period]) => {
                                    // Check for overlap: employee ends after shift starts AND employee starts before shift ends
                                    let employeeEnd = end;
                                    
                                    // Handle overnight shifts
                                    if (end < start) {
                                        // If shift goes past midnight and we're checking evening/closing shifts
                                        if (period.start >= 16 * 60) {
                                            // Use the end time as is for evening/closing
                                            employeeEnd = end + 24 * 60;
                                        }
                                    }
                                    
                                    // Check if there's an overlap
                                    if (employeeEnd > period.start && start < period.end) {
                                        // Employee works during this shift period
                                        if (shiftAnalysis[day] && shiftAnalysis[day][shiftName]) {
                                            if (isDoughnutBrand) {
                                                // Track specific Doughnut roles
                                                const doughnutRole = role.toLowerCase();
                                                
                                                // Debug: Log each person being counted
                                                if (empData.name) {
                                                    console.log(`Counting ${empData.name} (${doughnutRole}) for ${day} ${shiftName} shift`);
                                                }
                                                if (doughnutRole.includes('gm')) {
                                                    shiftAnalysis[day][shiftName].gm++;
                                                } else if (doughnutRole === 'barista') {
                                                    shiftAnalysis[day][shiftName].barista++;
                                                } else if (doughnutRole === 'foh' || doughnutRole.includes('front of house')) {
                                                    shiftAnalysis[day][shiftName].foh++;
                                                } else if (doughnutRole === 'den') {
                                                    shiftAnalysis[day][shiftName].den++;
                                                } else if (doughnutRole === 'kitchen') {
                                                    shiftAnalysis[day][shiftName].kitchen++;
                                                }
                                            } else {
                                                shiftAnalysis[day][shiftName][roleCategory]++;
                                            }
                                        }
                                    }
                                });
                            }
                        }
                    }
                });
                
                employeeHours[empData.name] = empTotalHours;
                totalWeeklyHours += empTotalHours;
                
                // Track hours by role type
                if (isDoughnutBrand) {
                    // Track Doughnut-specific roles
                    const doughnutRole = role.toLowerCase();
                    if (doughnutRole.includes('gm')) {
                        totalGMHours += empTotalHours;
                    } else if (doughnutRole === 'barista') {
                        totalBaristaHours += empTotalHours;
                    } else if (doughnutRole === 'foh' || doughnutRole.includes('front of house')) {
                        totalFOHHours += empTotalHours;
                    } else if (doughnutRole === 'den') {
                        totalDenHours += empTotalHours;
                    } else if (doughnutRole === 'kitchen') {
                        totalKitchenHours += empTotalHours;
                    }
                } else if (isGM) {
                    totalGMHours += empTotalHours;
                } else if (isHourlyManager) {
                    totalHourlyManagerHours += empTotalHours;
                } else if (roleCategory === 'drivers') {
                    totalDriverHours += empTotalHours;
                } else {
                    totalCrewHours += empTotalHours;
                }
                
                // Calculate overtime for hourly workers (not salaried)
                // Example: If employee works 45 hours -> 5 hours of overtime
                if (!isSalaried && empTotalHours > 40) {
                    totalOvertimeHours += (empTotalHours - 40);
                }
                
                // Calculate labor cost if pay rate available
                if (empData.payRate) {
                    const rate = parseFloat(empData.payRate) || 0;
                    if (empData.payType === 'weekly') {
                        totalWeeklyLabor += rate;
                    } else {
                        totalWeeklyLabor += rate * empTotalHours;
                    }
                }
            }
        });
        
        // Employee Schedule Section
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Employee Schedule', 40, yPos);
        yPos += 20;
        
        doc.setFontSize(10);
        
        // Draw table headers
        doc.text('Employee', 40, yPos);
        xPos = 40 + firstColWidth;  // xPos already declared above
        days.forEach(day => {
            doc.text(day.substring(0, 3), xPos, yPos);
            xPos += colWidth;
        });
        doc.text('Total Hrs', xPos, yPos);
        
        // Draw line under headers
        yPos += 5;
        doc.line(40, yPos, 750, yPos);
        yPos += 15;
        
        doc.setFont(undefined, 'normal');
        
        // Employee rows
        Object.keys(scheduleData).forEach(empId => {
            const empData = scheduleData[empId];
            if (empData && empData.name) {
                // Check if we need a new page
                if (yPos > 520) {
                    doc.addPage();
                    yPos = 40;
                    
                    // Redraw headers on new page
                    doc.setFont(undefined, 'bold');
                    doc.text('Employee', 40, yPos);
                    xPos = 40 + firstColWidth;
                    days.forEach(day => {
                        doc.text(day.substring(0, 3), xPos, yPos);
                        xPos += colWidth;
                    });
                    doc.text('Total', xPos, yPos);
                    yPos += 5;
                    doc.line(40, yPos, 750, yPos);
                    yPos += 15;
                    doc.setFont(undefined, 'normal');
                }
                
                // Employee name and role
                const displayName = `${empData.name} (${empData.role || 'Crew'})`;
                doc.text(displayName, 40, yPos);
                
                // Shifts for each day
                xPos = 40 + firstColWidth;
                
                dayKeys.forEach(day => {
                    const shift = empData[day] || 'OFF';
                    doc.setFontSize(9);
                    doc.text(shift, xPos, yPos);
                    doc.setFontSize(10);
                    xPos += colWidth;
                });
                
                // Total hours for this employee
                const empHours = employeeHours[empData.name] || 0;
                doc.text(`${empHours.toFixed(1)}h`, xPos, yPos);
                yPos += 20;
            }
        });
        
        // Add Shift Analysis Section on new page
        doc.addPage();
        yPos = 40;
        
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Shift Analysis Report', 40, yPos);
        yPos += 30;
        
        // Shift breakdown by day
        doc.setFontSize(12);
        doc.text('Staff Count by Shift and Role', 40, yPos);
        yPos += 20;
        
        doc.setFontSize(10);
        
        // Create shift analysis table with 5 shifts
        const shifts = ['Morning (5am-10am)', 'Lunch (10am-2pm)', 'Midday (2pm-5pm)', 'Dinner (5pm-9pm)', 'Closing (9pm-12am)'];
        const shiftKeys = ['morning', 'lunch', 'midday', 'dinner', 'closing'];
        
        days.forEach((day, dayIndex) => {
            const dayKey = dayKeys[dayIndex];
            
            doc.setFont(undefined, 'bold');
            doc.text(day, 40, yPos);
            yPos += 15;
            doc.setFont(undefined, 'normal');
            
            shiftKeys.forEach((shiftKey, index) => {
                const shiftData = shiftAnalysis[dayKey][shiftKey];
                const shiftLabel = shifts[index];
                
                // Check if this is a Taco or Doughnut brand location
                const isTacoBrand = brand === 'Taco' || (location && location.toLowerCase().includes('taco'));
                
                doc.text(`  ${shiftLabel}:`, 60, yPos);
                
                if (isTacoBrand) {
                    // For Taco locations, show different role breakdown
                    doc.text(`!Bar/!Cook: ${shiftData.managers}`, 210, yPos);
                    doc.text(`Bar/Cook: ${shiftData.crew}`, 320, yPos);
                    doc.text(`Total: ${shiftData.managers + shiftData.crew}`, 420, yPos);
                } else if (isDoughnutBrand) {
                    // For Doughnut locations, show each position separately
                    doc.text(`GM: ${shiftData.gm || 0}`, 190, yPos);
                    doc.text(`Barista: ${shiftData.barista || 0}`, 250, yPos);
                    doc.text(`FOH: ${shiftData.foh || 0}`, 320, yPos);
                    doc.text(`Den: ${shiftData.den || 0}`, 380, yPos);
                    doc.text(`Kitchen: ${shiftData.kitchen || 0}`, 430, yPos);
                    const total = (shiftData.gm || 0) + (shiftData.barista || 0) + (shiftData.foh || 0) + (shiftData.den || 0) + (shiftData.kitchen || 0);
                    doc.text(`Total: ${total}`, 500, yPos);
                } else {
                    // Regular locations show standard roles
                    doc.text(`Mgrs: ${shiftData.managers}`, 210, yPos);
                    doc.text(`Drvrs: ${shiftData.drivers}`, 280, yPos);
                    doc.text(`Crew: ${shiftData.crew}`, 350, yPos);
                    doc.text(`Total: ${shiftData.managers + shiftData.drivers + shiftData.crew}`, 420, yPos);
                }
                yPos += 15;
            });
            
            yPos += 10;
            
            // Check if need new page
            if (yPos > 500) {
                doc.addPage();
                yPos = 40;
            }
        });
        
        // Add Budget Information Section
        yPos += 20;
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Budget Information & Hours Summary', 40, yPos);
        yPos += 20;
        
        // Hours breakdown by role
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Hours by Role:', 40, yPos);
        yPos += 15;
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        
        // Check if this is a Taco or Doughnut brand location  
        const isTacoBrand = brand === 'Taco' || (location && location.toLowerCase().includes('taco'));
        
        doc.text(`Total Weekly Hours: ${totalWeeklyHours.toFixed(1)} hours`, 60, yPos);
        yPos += 15;
        
        if (isTacoBrand) {
            // For Taco locations, show Taco-specific role labels
            doc.text(`Total Weekly Bartender/Cook Hours: ${totalCrewHours.toFixed(1)} hours`, 60, yPos);
            yPos += 15;
            doc.text(`Total Weekly !Bartender/!Cook Hours: ${totalHourlyManagerHours.toFixed(1)} hours`, 60, yPos);
            yPos += 15;
            doc.text(`Total Weekly GM Hours: ${totalGMHours.toFixed(1)} hours`, 60, yPos);
            yPos += 15;
        } else if (isDoughnutBrand) {
            // For Doughnut locations, show each position separately
            doc.text(`Total Weekly GM Hours: ${totalGMHours.toFixed(1)} hours`, 60, yPos);
            yPos += 15;
            doc.text(`Total Weekly Barista Hours: ${totalBaristaHours.toFixed(1)} hours`, 60, yPos);
            yPos += 15;
            doc.text(`Total Weekly FOH Hours: ${totalFOHHours.toFixed(1)} hours`, 60, yPos);
            yPos += 15;
            doc.text(`Total Weekly Den Hours: ${totalDenHours.toFixed(1)} hours`, 60, yPos);
            yPos += 15;
            doc.text(`Total Weekly Kitchen Hours: ${totalKitchenHours.toFixed(1)} hours`, 60, yPos);
            yPos += 15;
        } else {
            // Regular locations show standard roles
            doc.text(`Total Weekly Crew Hours: ${totalCrewHours.toFixed(1)} hours`, 60, yPos);
            yPos += 15;
            doc.text(`Total Weekly Driver Hours: ${totalDriverHours.toFixed(1)} hours`, 60, yPos);
            yPos += 15;
            doc.text(`Total Weekly GM Hours: ${totalGMHours.toFixed(1)} hours`, 60, yPos);
            yPos += 15;
            doc.text(`Total Weekly Hourly Manager Hours: ${totalHourlyManagerHours.toFixed(1)} hours`, 60, yPos);
            yPos += 15;
        }
        
        // Overtime section
        doc.setFont(undefined, 'bold');
        doc.text(`Total Overtime Hours: ${totalOvertimeHours.toFixed(1)} hours`, 60, yPos);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        doc.text(`(Sum of hours over 40 for each hourly employee)`, 70, yPos + 12);
        doc.setFontSize(11);
        yPos += 25;
        
        // Labor costs
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Labor Costs:', 40, yPos);
        yPos += 15;
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.text(`Total Weekly Labor Cost: $${totalWeeklyLabor.toFixed(2)}`, 60, yPos);
        yPos += 15;
        
        // Sales data if available
        if (salesData) {
            const totalSales = Object.values(salesData).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
            if (totalSales > 0) {
                doc.text(`Projected Weekly Sales: $${totalSales.toFixed(2)}`, 60, yPos);
                yPos += 15;
                const laborPercent = totalSales > 0 ? (totalWeeklyLabor / totalSales * 100).toFixed(2) : 0;
                doc.setFont(undefined, 'bold');
                doc.text(`Labor Percentage: ${laborPercent}%`, 60, yPos);
                doc.setFont(undefined, 'normal');
                yPos += 15;
            }
        }
        
        // Average hours per employee
        const employeeCount = Object.keys(employeeHours).length;
        if (employeeCount > 0) {
            const avgHours = totalWeeklyHours / employeeCount;
            doc.text(`Average Hours per Employee: ${avgHours.toFixed(1)} hours`, 60, yPos);
            yPos += 15;
        }
        
        // Footer
        doc.setFontSize(10);
        doc.text('Generated by CCQSR Navigator', 40, 550);
        doc.text(`Page ${doc.internal.getNumberOfPages()}`, 700, 550, { align: 'right' });
        
        return doc.output('datauristring').split(',')[1]; // Return base64
    },
    
    // Helper function to parse time
    parseTime(timeStr) {
        if (!timeStr) return null;
        const cleaned = timeStr.trim().toUpperCase();
        const match = cleaned.match(/(\d{1,2})(?::(\d{2}))?(\s*[AP]M)?/);
        if (!match) return null;
        
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2] || '0');
        const period = match[3];
        
        if (period) {
            if (period.includes('PM') && hours !== 12) hours += 12;
            if (period.includes('AM') && hours === 12) hours = 0;
        }
        
        return hours * 60 + minutes;
    },

    // Submit schedule to Basecamp
    async submitScheduleToBasecamp(scheduleData, weekStartDate, location, brand, salesData) {
        console.log('=== Starting Schedule Basecamp submission ===');
        console.log('Week Start:', weekStartDate);
        console.log('Location:', location);
        console.log('Brand:', brand);
        
        try {
            // Generate PDF with sales data
            console.log('Generating Schedule PDF...');
            const pdfBase64 = this.generateSchedulePDF(
                scheduleData,
                weekStartDate,
                location,
                brand,
                salesData
            );
            console.log('Schedule PDF generated, base64 length:', pdfBase64 ? pdfBase64.length : 0);
            
            // Prepare filename
            const fileName = `Schedule_${brand}_${location}_${weekStartDate.replace(/\//g, '-')}.pdf`;
            
            // Upload to Basecamp
            console.log('Uploading schedule to Basecamp...');
            console.log('Filename:', fileName);
            
            // Use the schedule vault ID
            const vaultId = this.config.scheduleVaultId;
            console.log('Using schedule vault ID:', vaultId);
            
            const uploadPayload = {
                pdfBase64,
                fileName,
                checklistType: 'Schedule',
                storeLocation: `${brand} - ${location}`,
                managerName: 'Schedule System',
                date: weekStartDate,
                vaultId
            };
            console.log('Upload payload size:', JSON.stringify(uploadPayload).length);
            
            const response = await fetch('/.netlify/functions/basecamp-upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(uploadPayload)
            });
            console.log('Upload response status:', response.status);
            
            const result = await response.json();
            console.log('Upload result:', result);
            
            if (result.success) {
                console.log('Schedule upload successful! Document URL:', result.documentUrl);
                return {
                    success: true,
                    message: 'Schedule uploaded to Basecamp successfully',
                    documentUrl: result.documentUrl
                };
            } else {
                console.error('Schedule upload failed:', result.error, result.details);
                throw new Error(result.error || 'Schedule upload failed');
            }
            
        } catch (error) {
            console.error('=== Schedule Basecamp submission error ===');
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            throw error;
        }
    }
};

// Integrate with existing checklist submission
function enhanceChecklistSubmission() {
    // Override the existing submit function
    const originalSubmit = window.submitChecklist;
    
    window.submitChecklist = async function() {
        const store = document.getElementById('checklistStore').value;
        const manager = document.getElementById('checklistManager').value;
        const checklistDateTime = document.getElementById('checklistDate').value;
        
        if (!store || !manager) {
            showError('Please fill in store location and manager name');
            return;
        }
        
        try {
            showInfo('Uploading checklist to Basecamp...');
            
            // Submit to Basecamp
            const result = await BasecampIntegration.submitChecklistToBasecamp(
                currentChecklist,
                checklistData,
                store,
                manager
            );
            
            if (result.success) {
                showSuccess(`Checklist uploaded to Basecamp! <a href="${result.documentUrl}" target="_blank" style="color: #fff; text-decoration: underline;">View in Basecamp</a>`);
                
                // Clear local data after successful submission
                clearChecklist();
            } else {
                throw new Error(result.message || 'Upload failed');
            }
            
        } catch (error) {
            console.error('Submission error:', error);
            
            showError(`Basecamp upload failed: ${error.message}`);
            console.error('Upload error details:', error);
        }
    };
}

// Status indicator removed - no user authentication needed

// Connection prompts removed - no user authentication needed

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Enhance checklist submission
    enhanceChecklistSubmission();
});

// Export for use in other modules (move outside DOMContentLoaded)
if (typeof window !== 'undefined') {
    window.BasecampIntegration = BasecampIntegration;
    console.log('BasecampIntegration attached to window:', window.BasecampIntegration ? 'Success' : 'Failed');
    console.log('Available methods:', Object.keys(BasecampIntegration));
}