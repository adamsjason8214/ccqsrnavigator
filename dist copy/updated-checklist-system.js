// Updated Checklist System with Modern Format
// This replaces the existing checklist functionality with the new format

// Complete checklist data structure matching the new format
const checklistsNew = {
    'opening': {
        title: 'Opening Manager Checklist',
        sections: [
            {
                title: 'Store Setup',
                items: [
                    { id: 'closing-rating', label: 'Rate the closing shift from last night', type: 'rating', min: 1, max: 5 },
                    { id: 'crew-uniform', label: 'Crew rocking the Jet\'s look?', type: 'checkbox', details: 'Clean shirt, black pants/shorts, Jet\'s hat' },
                    { id: 'oven-temps', label: 'Snap a pic of oven temps & times', type: 'photo', required: true },
                    { id: 'dough-scale', label: 'Snap a pic of calibrated dough scale', type: 'photo', required: true },
                    { id: 'driver-sign', label: 'AM Driver\'s car with delivery sign ON & LIT', type: 'photo', required: true },
                    { id: 'soda-cooler', label: 'Stocked soda cooler', type: 'photo', required: true },
                    { id: 'day-dotted-bins', label: 'Day-dotted, flipped bins for rotation', type: 'photo', required: true }
                ]
            },
            {
                title: 'Food Preparation',
                items: [
                    { id: 'makeline-portions', label: 'Portion cups in the makeline', type: 'photo', required: true },
                    { id: 'salad-portions', label: 'Portion cups in salad station', type: 'photo', required: true },
                    { id: 'cheese-scale', label: 'Calibrated cheese scale', type: 'photo', required: true },
                    { id: 'chicken-scale', label: 'Calibrated chicken scale', type: 'photo', required: true },
                    { id: 'dough-book', label: 'Completed Dough Book Wizard', type: 'photo', required: true },
                    { id: 'prep-list', label: 'Completed Prep List', type: 'photo', required: true }
                ]
            },
            {
                title: 'Dough Preparation',
                items: [
                    { id: 'small-square', label: 'Pressed small square dough', type: 'photo', required: true },
                    { id: 'large-square', label: 'Pressed large square dough', type: 'photo', required: true },
                    { id: 'xl-square', label: 'Pressed XL square dough', type: 'photo', required: true },
                    { id: 'round-dough', label: 'Wrapped round dough trays', type: 'photo', required: true },
                    { id: 'dough-mixer', label: 'Cleaned dough mixer (18+ required)', type: 'photo', required: true }
                ]
            },
            {
                title: 'Final Setup',
                items: [
                    { id: 'slice-setup', label: 'Slice tray setup with tracking method', type: 'photo', required: true },
                    { id: 'store-front', label: 'Store front with signage', type: 'photo', required: true },
                    { id: 'whiteboard', label: 'Whiteboard with tasks outlined', type: 'photo', required: true }
                ]
            },
            {
                title: 'Shift Evaluation',
                items: [
                    { id: 'product-quality', label: 'Rate the product quality', type: 'rating', min: 1, max: 5 },
                    { id: 'customer-service', label: 'Rate the customer service', type: 'rating', min: 1, max: 5 },
                    { id: 'teamwork', label: 'Rate the teamwork', type: 'rating', min: 1, max: 5 },
                    { id: 'operations', label: 'Rate store operations', type: 'rating', min: 1, max: 5 },
                    { id: 'improvements', label: 'What could we do better?', type: 'textarea' },
                    { id: 'went-well', label: 'What went well?', type: 'textarea' }
                ]
            }
        ]
    },
    'closing': {
        title: 'Closing Manager Checklist',
        sections: [
            {
                title: 'Evening Setup',
                items: [
                    { id: 'opening-rating', label: 'Rate the opening shift', type: 'rating', min: 1, max: 5 },
                    { id: 'store-front-pm', label: 'Store front photo', type: 'photo', required: true },
                    { id: 'position-chart', label: 'Position chart filled out', type: 'photo', required: true },
                    { id: 'driver-sign-pm', label: 'PM Driver\'s car with delivery sign ON & LIT', type: 'photo', required: true },
                    { id: 'uniform-check', label: 'Crew uniform check', type: 'checkbox' }
                ]
            },
            {
                title: 'Burns Tracking',
                items: [
                    { id: 'small-burns', label: 'Small square burns', type: 'text' },
                    { id: 'large-burns', label: 'Large square burns', type: 'text' },
                    { id: 'xl-burns', label: 'XL square burns', type: 'text' }
                ]
            },
            {
                title: 'Equipment & Service',
                items: [
                    { id: 'slice-setup-pm', label: 'Slice tray setup', type: 'photo', required: true },
                    { id: 'oven-temps-pm', label: 'Oven temps & times', type: 'photo', required: true }
                ]
            },
            {
                title: 'Cleaning & Maintenance',
                items: [
                    { id: 'makeline-clean', label: 'Sparkling clean makeline', type: 'photo', required: true },
                    { id: 'salad-station-clean', label: 'Cleaned salad station', type: 'photo', required: true },
                    { id: 'cut-table-clean', label: 'Cleaned cut table', type: 'photo', required: true },
                    { id: 'oven-trays-clean', label: 'Cleaned oven & drop trays', type: 'photo', required: true },
                    { id: 'lobby-clean', label: 'Cleaned lobby', type: 'photo', required: true },
                    { id: 'soda-cooler-pm', label: 'Stocked soda cooler', type: 'photo', required: true }
                ]
            },
            {
                title: 'End of Day',
                items: [
                    { id: 'labor-stats', label: 'POS Labor Stats', type: 'photo', required: true },
                    { id: 'station-cleaning', label: 'Station cleaning checklists completed', type: 'checkbox' },
                    { id: 'drivers-cashed', label: 'All drivers returned and cashed out', type: 'checkbox' },
                    { id: 'safe-counted', label: 'Safe counted, drawers counted, POS day end ran', type: 'checkbox' },
                    { id: 'secured', label: 'Ovens off, lights off, alarm set, doors locked', type: 'checkbox' }
                ]
            },
            {
                title: 'Shift Evaluation',
                items: [
                    { id: 'product-quality-pm', label: 'Rate the product quality', type: 'rating', min: 1, max: 5 },
                    { id: 'customer-service-pm', label: 'Rate the customer service', type: 'rating', min: 1, max: 5 },
                    { id: 'teamwork-pm', label: 'Rate the teamwork', type: 'rating', min: 1, max: 5 },
                    { id: 'operations-pm', label: 'Rate store operations', type: 'rating', min: 1, max: 5 },
                    { id: 'improvements-pm', label: 'What could we do better?', type: 'textarea' },
                    { id: 'went-well-pm', label: 'What went well?', type: 'textarea' }
                ]
            }
        ]
    },
    'weekly': {
        title: 'Weekly Store Profile (RM)',
        sections: [
            {
                title: 'Store Information',
                items: [
                    { id: 'management-team', label: 'Management Team Members', type: 'textarea' }
                ]
            },
            {
                title: 'Front Lobby Area',
                items: [
                    { id: 'windows-clean', label: 'Windows clean', type: 'pass-fail' },
                    { id: 'front-door', label: 'Front door clean/handle secure', type: 'pass-fail' },
                    { id: 'proper-signage', label: 'Proper signage', type: 'pass-fail' },
                    { id: 'floors-clean', label: 'Floors clean', type: 'pass-fail' },
                    { id: 'wall-tile', label: 'Wall tile clean', type: 'pass-fail' },
                    { id: 'pop-cooler', label: 'Pop cooler clean & stocked', type: 'pass-fail' },
                    { id: 'rugs-clean', label: 'Rugs clean', type: 'pass-fail' },
                    { id: 'sneeze-guard', label: 'Sneeze guard clean', type: 'pass-fail' },
                    { id: 'hot-box', label: 'Hot box clean', type: 'pass-fail' },
                    { id: 'menu-tvs', label: 'Menu TVs on', type: 'pass-fail' },
                    { id: 'lobby-photo', label: 'Take pic of lobby', type: 'photo', required: true },
                    { id: 'lobby-rating', label: 'Lobby rating', type: 'rating', min: 1, max: 5 },
                    { id: 'lobby-notes', label: 'Lobby improvement notes', type: 'textarea' }
                ]
            },
            {
                title: 'Kitchen Stations',
                items: [
                    { id: 'stations-stocked', label: 'Stations fully stocked/round dough rotated', type: 'pass-fail' },
                    { id: 'cabinets-clean', label: 'Make line/salad station cabinets cleaned', type: 'pass-fail' },
                    { id: 'topping-cups', label: 'Cups for toppings in tables', type: 'pass-fail' },
                    { id: 'slices-ready', label: 'Slices ready/slice timer used', type: 'pass-fail' },
                    { id: 'freezers-organized', label: 'Freezers clean and organized', type: 'pass-fail' },
                    { id: 'wing-bowls', label: 'Wing bowls', type: 'pass-fail' },
                    { id: 'slice-boxes', label: 'Slice boxes (single for combos)', type: 'pass-fail' },
                    { id: 'cutside-setup', label: 'Wing bowls/cutside set up', type: 'pass-fail' },
                    { id: 'boxes-stocked', label: 'Boxes and inserts stocked', type: 'pass-fail' },
                    { id: 'ovens-on', label: 'Ovens on at 9:30am', type: 'pass-fail' },
                    { id: 'kitchen-photo', label: 'Take pic of kitchen', type: 'photo', required: true },
                    { id: 'kitchen-rating', label: 'Kitchen rating', type: 'rating', min: 1, max: 5 },
                    { id: 'kitchen-notes', label: 'Kitchen improvement notes', type: 'textarea' }
                ]
            },
            {
                title: 'Back of House',
                items: [
                    { id: 'delivery-station', label: 'Delivery station clean, mapping screen working', type: 'pass-fail' },
                    { id: 'delivery-signs', label: 'Store has enough delivery signs', type: 'pass-fail' },
                    { id: 'copilot-running', label: 'Co-Pilot up and running', type: 'pass-fail' },
                    { id: 'delivery-bags', label: 'Enough delivery bags, clean and organized', type: 'pass-fail' },
                    { id: 'walkin-cooler', label: 'Walk-in cooler clean and organized', type: 'pass-fail' },
                    { id: 'driver-cooler', label: 'Driver cooler stocked (if applicable)', type: 'pass-fail' },
                    { id: 'backroom-photo', label: 'Take pic of back room', type: 'photo', required: true },
                    { id: 'boh-rating', label: 'Back of house rating', type: 'rating', min: 1, max: 5 },
                    { id: 'boh-notes', label: 'BOH improvement notes', type: 'textarea' }
                ]
            },
            {
                title: 'Prep',
                items: [
                    { id: 'dough-pressed', label: 'Dough pressed and rotated properly (by 11am)', type: 'pass-fail' },
                    { id: 'prep-day-dotted', label: 'Prep day dotted', type: 'pass-fail' },
                    { id: 'prep-rotated', label: 'Prep rotated, not over prepping chopped veggies', type: 'pass-fail' },
                    { id: 'prep-charts', label: 'Prep charts used', type: 'pass-fail' },
                    { id: 'dough-wizard', label: 'Dough Book Wizard used', type: 'pass-fail' },
                    { id: 'pressed-dough-photo', label: 'Pic of pressed dough', type: 'photo', required: true },
                    { id: 'prep-rating', label: 'Prep rating', type: 'rating', min: 1, max: 5 },
                    { id: 'prep-notes', label: 'Prep improvement notes', type: 'textarea' }
                ]
            },
            {
                title: 'Management',
                items: [
                    { id: 'proper-staffing', label: 'Proper staffing/scheduling', type: 'pass-fail' },
                    { id: 'schedule-posted', label: 'Schedule posted', type: 'pass-fail' },
                    { id: 'marketing-calendar', label: 'Marketing calendar posted', type: 'pass-fail' },
                    { id: 'lights-working', label: 'Lights working and on by 10am', type: 'pass-fail' },
                    { id: 'employees-uniform', label: 'Employees uniform', type: 'pass-fail' },
                    { id: 'door-chime', label: 'Door chime working', type: 'pass-fail' },
                    { id: 'phones-checked', label: 'Phones checked, staff feedback', type: 'pass-fail' },
                    { id: 'online-ordering', label: 'Online ordering checked, delivery radius, 3rd party', type: 'pass-fail' },
                    { id: 'google-reviews', label: 'Google reviews checked', type: 'pass-fail' },
                    { id: 'quoted-times', label: 'Quoted times checked, POS report', type: 'pass-fail' },
                    { id: 'wages-updated', label: 'Wages up to date in POS, roster in payroll', type: 'pass-fail' },
                    { id: 'gift-cards', label: 'Gift cards in store', type: 'pass-fail' },
                    { id: 'doordash-bags', label: 'Door Dash bags for 3rd party orders', type: 'pass-fail' },
                    { id: 'schedule-photo', label: 'Take pic of posted schedule', type: 'photo', required: true },
                    { id: 'staff-photo', label: 'Staff group pic', type: 'photo', required: true },
                    { id: 'management-rating', label: 'Management rating', type: 'rating', min: 1, max: 5 },
                    { id: 'safe-total', label: 'Safe total', type: 'text' },
                    { id: 'otd', label: 'OTD', type: 'text' },
                    { id: 'quoted-times-notes', label: 'Quoted times notes', type: 'textarea' },
                    { id: 'net-sales', label: 'Net sales', type: 'text' },
                    { id: 'food-cost', label: 'Food cost %', type: 'text' },
                    { id: 'labor-cost', label: 'Labor cost %', type: 'text' }
                ]
            }
        ]
    },
    'monthly': {
        title: 'Monthly Store Inspection',
        sections: [
            {
                title: 'Exterior',
                items: [
                    { id: 'ext-windows-door', label: 'Windows/Front door', type: 'pass-fail', details: 'clean, updated signage, hours' },
                    { id: 'ext-windows-door-photo', label: 'Photo of storefront', type: 'photo' },
                    { id: 'ext-doors', label: 'Doors', type: 'pass-fail', details: 'proper color, fire retardant paint, maintained' },
                    { id: 'ext-parking', label: 'Parking lot', type: 'pass-fail', details: 'lighting, litter, etc.' },
                    { id: 'ext-parking-photo', label: 'Photo of parking lot issues', type: 'photo' },
                    { id: 'ext-signs', label: 'Signs', type: 'pass-fail', details: 'LED working, professional trademark' },
                    { id: 'ext-signs-photo', label: 'Photo of signage', type: 'photo' }
                ]
            },
            {
                title: 'Lobby',
                items: [
                    { id: 'lobby-sneeze', label: 'Sneeze guard', type: 'pass-fail', details: 'clean/75% open glass' },
                    { id: 'lobby-menu', label: 'Menu board/updated signage', type: 'pass-fail', details: 'on, updated' },
                    { id: 'lobby-unapproved', label: 'Any unapproved items/objects', type: 'pass-fail' },
                    { id: 'lobby-unapproved-photo', label: 'Photo of unapproved items', type: 'photo' },
                    { id: 'lobby-seating', label: 'Seating/tables', type: 'pass-fail', details: 'approved/clean, proper colors' },
                    { id: 'lobby-restrooms', label: 'Restrooms', type: 'pass-fail', details: 'clean & organized' },
                    { id: 'lobby-counter', label: 'Front counter', type: 'pass-fail', details: 'clean & organized' },
                    { id: 'lobby-counter-photo', label: 'Photo of front counter', type: 'photo' },
                    { id: 'lobby-maintenance', label: 'Maintenance', type: 'pass-fail', details: 'doors, tiles, gates, baseboards' },
                    { id: 'lobby-maintenance-photo', label: 'Photo of maintenance issues', type: 'photo' },
                    { id: 'lobby-cleanliness', label: 'Cleanliness', type: 'pass-fail', details: 'walls, floors, corners, ceiling' },
                    { id: 'lobby-lighting', label: 'Lighting', type: 'pass-fail', details: 'broken covers, burnt bulbs' },
                    { id: 'lobby-pop-cooler', label: 'Pop cooler', type: 'pass-fail', details: 'clean, filled, proper temp' },
                    { id: 'lobby-overview-photo', label: 'Overall lobby photo', type: 'photo' }
                ]
            },
            {
                title: 'Make Area',
                items: [
                    { id: 'make-hotbox', label: 'Hot box(es)', type: 'pass-fail', details: 'maintained, clean, display working' },
                    { id: 'make-hotbox-photo', label: 'Photo of hot box issues', type: 'photo' },
                    { id: 'make-temperature', label: 'Temperature', type: 'pass-fail', details: 'proper holding temp, regulations' },
                    { id: 'make-freezer', label: 'Freezer', type: 'pass-fail', details: 'clean, organized, gaskets clean' },
                    { id: 'make-freezer-photo', label: 'Photo of freezer gaskets', type: 'photo' },
                    { id: 'make-tables', label: 'Make/salad tables', type: 'pass-fail', details: 'clean, gaskets clean' },
                    { id: 'make-tables-photo', label: 'Photo of table gaskets', type: 'photo' },
                    { id: 'make-handsink', label: 'Side hand sink', type: 'pass-fail', details: 'clean, soap, towels, caulked' },
                    { id: 'make-handsink-photo', label: 'Photo of hand sink area', type: 'photo' },
                    { id: 'make-worktables', label: 'Work tables', type: 'pass-fail', details: 'clean, organized, maintained' },
                    { id: 'make-cleanliness', label: 'Cleanliness', type: 'pass-fail', details: 'ceiling, vents, walls, floors' },
                    { id: 'make-cleanliness-photo', label: 'Photo of cleanliness issues', type: 'photo' },
                    { id: 'make-lights', label: 'Lights', type: 'pass-fail', details: 'broken covers, burnt bulbs' },
                    { id: 'make-sheeter', label: 'Dough sheeter', type: 'pass-fail', details: 'working, clean, proper settings' },
                    { id: 'make-cutside', label: 'Cut side', type: 'pass-fail', details: 'heat lamps, table clean, organized' },
                    { id: 'make-oven', label: 'Oven', type: 'pass-fail', details: 'clean, catch trays, utensils, filters' },
                    { id: 'make-oven-photo', label: 'Photo of oven condition', type: 'photo' },
                    { id: 'make-hood', label: 'Hood unit', type: 'pass-fail', details: 'clean, lights on, working' },
                    { id: 'make-oven-temp', label: 'Oven time & temperature', type: 'pass-fail', details: 'using enough ovens' },
                    { id: 'make-area-overview', label: 'Make area overview photo', type: 'photo' }
                ]
            },
            {
                title: 'Back of Store',
                items: [
                    { id: 'back-cleanliness', label: 'Cleanliness', type: 'pass-fail', details: 'ceiling, walls, floors, nothing on floor' },
                    { id: 'back-cleanliness-photo', label: 'Photo of back area cleanliness', type: 'photo' },
                    { id: 'back-phone', label: 'Phone area', type: 'pass-fail', details: 'organized, signs posted, coupons' },
                    { id: 'back-walkin', label: 'Walk-in cooler', type: 'pass-fail', details: 'clean, organized, proper temp' },
                    { id: 'back-walkin-photo', label: 'Photo of walk-in cooler', type: 'photo' },
                    { id: 'back-sink', label: '3 compartment sink/hand sink', type: 'pass-fail', details: 'clean, caulked' },
                    { id: 'back-sink-photo', label: 'Photo of sink area', type: 'photo' },
                    { id: 'back-canopener', label: 'Can opener/electric mixer', type: 'pass-fail', details: 'clean, working' },
                    { id: 'back-hobart', label: 'Hobart & dough bowl', type: 'pass-fail', details: 'clean, no buildup' },
                    { id: 'back-hobart-photo', label: 'Photo of Hobart mixer', type: 'photo' },
                    { id: 'back-grinder', label: 'Cheese grinder & veggie chopper', type: 'pass-fail', details: 'clean, proper blades' }
                ]
            }
        ]
    },
    'fieldmanager': {
        title: 'Jet\'s Pizza Field Manager Shift Visit Report',
        sections: [
            {
                title: 'Shift Details',
                items: [
                    { id: 'fm-shift-8-11', label: 'Shift: 8am-11am', type: 'checkbox' },
                    { id: 'fm-shift-5-8', label: 'Shift: 5pm-8pm', type: 'checkbox' },
                    { id: 'fm-shift-7-10', label: 'Shift: 7pm-10pm', type: 'checkbox' }
                ]
            },
            {
                title: 'Training & Product Execution',
                items: [
                    { id: 'fm-trained-rounds', label: 'Trained staff on rounds', type: 'checkbox' },
                    { id: 'fm-saucing-technique', label: 'Saucing technique and cheese/topping distribution', type: 'checkbox' },
                    { id: 'fm-portion-control', label: 'Portion control & product rotation', type: 'checkbox' },
                    { id: 'fm-oven-loading', label: 'Oven loading & round screens practice', type: 'checkbox' },
                    { id: 'fm-proper-bake', label: 'Proper bake on pizzas', type: 'checkbox' },
                    { id: 'fm-oven-management', label: 'Oven management techniques', type: 'checkbox' },
                    { id: 'fm-cut-table', label: 'Cut table technique & pizza packaging', type: 'checkbox' },
                    { id: 'fm-ticket-management', label: 'Ticket management & slice packaging', type: 'checkbox' },
                    { id: 'fm-register-coaching', label: 'Register/customer service coaching', type: 'checkbox' },
                    { id: 'fm-salad-portion', label: 'Salad portioning & packaging', type: 'checkbox' },
                    { id: 'fm-phone-upsell', label: 'Phone upselling & order practice', type: 'checkbox' },
                    { id: 'fm-dough-procedures', label: 'Dough procedures: temp, consistency, pressing, wrapping', type: 'checkbox' },
                    { id: 'fm-slice-procedure', label: 'Train staff on slice procedure, fresh slices available every hour', type: 'checkbox' },
                    { id: 'fm-prep-rotation', label: 'Prep rotation & inventory management', type: 'checkbox' },
                    { id: 'fm-training-notes', label: 'Additional Notes', type: 'textarea' },
                    { id: 'fm-training-photo-1', label: 'Training Photo 1', type: 'photo' },
                    { id: 'fm-training-photo-2', label: 'Training Photo 2', type: 'photo' },
                    { id: 'fm-training-photo-3', label: 'Training Photo 3', type: 'photo' }
                ]
            },
            {
                title: 'Time Management & Prep',
                items: [
                    { id: 'fm-opening-procedures', label: 'Opening procedures & dough prep', type: 'checkbox' },
                    { id: 'fm-timed-batches', label: 'Timed dough batches (<12 min goal)', type: 'checkbox' },
                    { id: 'fm-square-dough', label: 'Square dough pressed by 10am', type: 'checkbox' },
                    { id: 'fm-prep-management', label: 'Prep management: one task at a time', type: 'checkbox' },
                    { id: 'fm-morning-rush', label: 'Morning rush prep (sauces, cheese, tables stocked)', type: 'checkbox' },
                    { id: 'fm-major-prep', label: 'Major prep stops by 11am', type: 'checkbox' },
                    { id: 'fm-delivery-management', label: 'Delivery management coaching', type: 'checkbox' },
                    { id: 'fm-evening-rush', label: 'Evening rush prep (sauces, cheese, boxes, etc.)', type: 'checkbox' },
                    { id: 'fm-closing-procedures', label: 'Closing procedures & checklist review', type: 'checkbox' },
                    { id: 'fm-make-table-timing', label: 'Make table/lobby closing timing', type: 'checkbox' },
                    { id: 'fm-time-notes', label: 'Notes', type: 'textarea' },
                    { id: 'fm-time-photo-1', label: 'Time Management Photo 1', type: 'photo' },
                    { id: 'fm-time-photo-2', label: 'Time Management Photo 2', type: 'photo' },
                    { id: 'fm-time-photo-3', label: 'Time Management Photo 3', type: 'photo' }
                ]
            },
            {
                title: 'Management Coaching',
                items: [
                    { id: 'fm-delivery-assignment', label: 'Delivery assignment coaching (no triples)', type: 'checkbox' },
                    { id: 'fm-driver-signage', label: 'Driver signage checks', type: 'checkbox' },
                    { id: 'fm-position-chart', label: 'Daily position chart completion', type: 'checkbox' },
                    { id: 'fm-dough-book', label: 'Dough book & prep par review', type: 'checkbox' },
                    { id: 'fm-portion-coaching', label: 'Portion control coaching', type: 'checkbox' },
                    { id: 'fm-inventory-control', label: 'Inventory control & budgeted ordering', type: 'checkbox' },
                    { id: 'fm-scheduling-review', label: 'Scheduling & budgeting review', type: 'checkbox' },
                    { id: 'fm-uniform-standards', label: 'Uniform standards enforced', type: 'checkbox' },
                    { id: 'fm-jetsu-forms', label: 'JetsU/JOT forms in use', type: 'checkbox' },
                    { id: 'fm-training-docs', label: 'Training documentation review', type: 'checkbox' },
                    { id: 'fm-labor-stats', label: 'Labor stats & staff cut timing', type: 'checkbox' },
                    { id: 'fm-marketing-calendar', label: 'Marketing calendar posted', type: 'checkbox' },
                    { id: 'fm-prep-charts', label: 'Prep charts updated', type: 'checkbox' },
                    { id: 'fm-store-systems', label: 'Store systems/tech checked (lights, chime, phones, online orders)', type: 'checkbox' },
                    { id: 'fm-google-reviews', label: 'Google reviews checked', type: 'checkbox' },
                    { id: 'fm-pos-roster', label: 'POS/roster/gift cards/DoorDash bags checked', type: 'checkbox' },
                    { id: 'fm-sign-return', label: 'Coach management team to ask for all signs and bags to be returned', type: 'checkbox' },
                    { id: 'fm-management-notes', label: 'Notes', type: 'textarea' },
                    { id: 'fm-management-photo-1', label: 'Management Photo 1', type: 'photo' },
                    { id: 'fm-management-photo-2', label: 'Management Photo 2', type: 'photo' },
                    { id: 'fm-management-photo-3', label: 'Management Photo 3', type: 'photo' }
                ]
            },
            {
                title: 'Store Cleanliness & Organization',
                items: [
                    { id: 'fm-deep-clean-stations', label: 'Deep cleaned stations & tables', type: 'checkbox' },
                    { id: 'fm-walkin-organized', label: 'Walk-in, soda cooler, cut table organized', type: 'checkbox' },
                    { id: 'fm-lobby-deep-clean', label: 'Lobby/walls deep cleaned', type: 'checkbox' },
                    { id: 'fm-sinks-bathroom', label: 'Sinks/mop/bathroom deep cleaned', type: 'checkbox' },
                    { id: 'fm-wing-pans', label: 'Wing/cinnamon pans cleaned', type: 'checkbox' },
                    { id: 'fm-dough-mixer-area', label: 'Dough mixer/sink area cleaned', type: 'checkbox' },
                    { id: 'fm-equipment-fixed', label: 'Broken equipment/bulbs fixed', type: 'checkbox' },
                    { id: 'fm-cleanliness-notes', label: 'Notes', type: 'textarea' },
                    { id: 'fm-cleanliness-photo-1', label: 'Cleanliness Photo 1', type: 'photo' },
                    { id: 'fm-cleanliness-photo-2', label: 'Cleanliness Photo 2', type: 'photo' },
                    { id: 'fm-cleanliness-photo-3', label: 'Cleanliness Photo 3', type: 'photo' }
                ]
            },
            {
                title: 'Additional Comments / Follow-ups',
                items: [
                    { id: 'fm-additional-comments', label: 'Additional Comments / Follow-ups', type: 'textarea' }
                ]
            }
        ]
    }
};

// Enhanced rendering function with modern styling
function renderChecklistContentNew() {
    const checklist = checklistsNew[currentChecklist];
    const content = document.getElementById('checklistContent');
    
    if (!checklist) {
        content.innerHTML = '<p style="color: #e74c3c;">Checklist not found</p>';
        return;
    }
    
    let html = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    padding: 20px; border-radius: 15px; margin-bottom: 30px; color: white; text-align: center;">
            <h2 style="margin: 0; font-size: 28px; font-weight: 700;">${checklist.title}</h2>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Complete all sections below</p>
        </div>
    `;
    
    checklist.sections.forEach((section, sectionIndex) => {
        html += `
            <div style="background: #f8f9fa; border-radius: 12px; padding: 25px; margin-bottom: 25px; 
                        box-shadow: 0 2px 10px rgba(0,0,0,0.08); transition: all 0.3s ease;">
                <h3 style="color: #2c3e50; font-size: 20px; font-weight: 600; margin-bottom: 20px; 
                          border-bottom: 2px solid #e0e0e0; padding-bottom: 10px;">
                    <span style="background: #667eea; color: white; border-radius: 50%; 
                                padding: 5px 10px; margin-right: 10px; font-size: 14px;">
                        ${sectionIndex + 1}
                    </span>
                    ${section.title}
                </h3>
                <div style="space-y: 15px;">
        `;
        
        section.items.forEach(item => {
            html += `<div style="background: white; padding: 15px; border-radius: 8px; 
                                margin-bottom: 15px; border-left: 4px solid #667eea; 
                                transition: all 0.2s ease; position: relative;"
                         onmouseover="this.style.boxShadow='0 4px 12px rgba(102,126,234,0.15)'"
                         onmouseout="this.style.boxShadow='none'">`;
            
            // Label with details
            html += `
                <label style="display: block; margin-bottom: 10px; font-weight: 500; color: #2c3e50;">
                    ${item.label}
                    ${item.details ? `<span style="display: block; font-size: 12px; color: #7f8c8d; font-weight: normal; margin-top: 5px;">${item.details}</span>` : ''}
                </label>
            `;
            
            // Input based on type
            switch (item.type) {
                case 'checkbox':
                    html += `
                        <div style="display: flex; align-items: center;">
                            <input type="checkbox" id="${item.id}" 
                                   onchange="handleChecklistChange('${item.id}', this.checked)"
                                   style="width: 20px; height: 20px; cursor: pointer; margin-right: 10px;">
                            <label for="${item.id}" style="cursor: pointer; color: #34495e;">
                                Mark as complete
                            </label>
                        </div>
                    `;
                    break;
                    
                case 'pass-fail':
                    html += `
                        <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                            <label style="display: flex; align-items: center; cursor: pointer; 
                                         padding: 8px 15px; border-radius: 25px; background: #e8f5e9; 
                                         border: 2px solid transparent; transition: all 0.2s;"
                                   onmouseover="this.style.borderColor='#4caf50'"
                                   onmouseout="this.style.borderColor='transparent'">
                                <input type="radio" name="${item.id}" value="pass" 
                                       onchange="handleChecklistChange('${item.id}', this.value)"
                                       style="margin-right: 8px;">
                                <span style="color: #2e7d32; font-weight: 600;">Pass</span>
                            </label>
                            <label style="display: flex; align-items: center; cursor: pointer; 
                                         padding: 8px 15px; border-radius: 25px; background: #fff3e0; 
                                         border: 2px solid transparent; transition: all 0.2s;"
                                   onmouseover="this.style.borderColor='#ff9800'"
                                   onmouseout="this.style.borderColor='transparent'">
                                <input type="radio" name="${item.id}" value="needs-work" 
                                       onchange="handleChecklistChange('${item.id}', this.value)"
                                       style="margin-right: 8px;">
                                <span style="color: #f57c00; font-weight: 600;">Needs Work</span>
                            </label>
                            <label style="display: flex; align-items: center; cursor: pointer; 
                                         padding: 8px 15px; border-radius: 25px; background: #ffebee; 
                                         border: 2px solid transparent; transition: all 0.2s;"
                                   onmouseover="this.style.borderColor='#f44336'"
                                   onmouseout="this.style.borderColor='transparent'">
                                <input type="radio" name="${item.id}" value="fail" 
                                       onchange="handleChecklistChange('${item.id}', this.value)"
                                       style="margin-right: 8px;">
                                <span style="color: #c62828; font-weight: 600;">Fail</span>
                            </label>
                        </div>
                    `;
                    break;
                    
                case 'rating':
                    html += `
                        <div class="star-rating" data-item-id="${item.id}" style="display: flex; gap: 5px;">
                            ${[1,2,3,4,5].map(star => `
                                <span class="star" data-value="${star}" 
                                      onclick="setRating('${item.id}', ${star})"
                                      style="font-size: 28px; cursor: pointer; color: #ddd; 
                                             transition: all 0.2s; user-select: none;"
                                      onmouseover="hoverRating('${item.id}', ${star})"
                                      onmouseout="resetRating('${item.id}')">
                                    ★
                                </span>
                            `).join('')}
                            <span style="margin-left: 10px; color: #7f8c8d; font-size: 14px;" 
                                  id="${item.id}-rating-text">Not rated</span>
                        </div>
                    `;
                    break;
                    
                case 'text':
                    html += `
                        <input type="text" id="${item.id}" 
                               onchange="handleChecklistChange('${item.id}', this.value)"
                               placeholder="Enter value..."
                               style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; 
                                      border-radius: 8px; font-size: 14px; transition: all 0.2s;
                                      outline: none;"
                               onfocus="this.style.borderColor='#667eea'"
                               onblur="this.style.borderColor='#e0e0e0'">
                    `;
                    break;
                    
                case 'textarea':
                    html += `
                        <textarea id="${item.id}" 
                                  onchange="handleChecklistChange('${item.id}', this.value)"
                                  placeholder="Enter your response..."
                                  rows="4"
                                  style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; 
                                         border-radius: 8px; font-size: 14px; resize: vertical;
                                         transition: all 0.2s; outline: none; font-family: inherit;"
                                  onfocus="this.style.borderColor='#667eea'"
                                  onblur="this.style.borderColor='#e0e0e0'"></textarea>
                    `;
                    break;
                    
                case 'photo':
                    html += `
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <label for="${item.id}-input" 
                                   style="display: inline-flex; align-items: center; gap: 8px;
                                          padding: 10px 20px; background: #667eea; color: white;
                                          border-radius: 8px; cursor: pointer; font-weight: 500;
                                          transition: all 0.2s; box-shadow: 0 2px 5px rgba(102,126,234,0.3);"
                                   onmouseover="this.style.background='#5a67d8'"
                                   onmouseout="this.style.background='#667eea'">
                                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
                                </svg>
                                ${item.required ? 'Upload Photo (Required)' : 'Upload Photo (Optional)'}
                            </label>
                            <input type="file" id="${item.id}-input" 
                                   accept="image/*" capture="environment"
                                   onchange="handlePhotoUpload('${item.id}', this)"
                                   style="display: none;">
                            ${item.required ? '<span style="color: #e74c3c; font-size: 18px;">*</span>' : ''}
                            <div id="${item.id}-preview" style="display: flex; align-items: center; gap: 10px;"></div>
                        </div>
                    `;
                    break;
                    
                case 'date':
                    html += `
                        <input type="date" id="${item.id}" 
                               onchange="handleChecklistChange('${item.id}', this.value)"
                               style="padding: 10px; border: 2px solid #e0e0e0; 
                                      border-radius: 8px; font-size: 14px; transition: all 0.2s;
                                      outline: none;"
                               onfocus="this.style.borderColor='#667eea'"
                               onblur="this.style.borderColor='#e0e0e0'">
                    `;
                    break;
            }
            
            html += `</div>`;
        });
        
        html += `</div></div>`;
    });
    
    content.innerHTML = html;
    
    // Auto-populate date/time if not already set
    const dateInput = document.getElementById('checklistDate');
    if (dateInput && !dateInput.value) {
        dateInput.value = getCurrentDateTime();
    }
    
    // Load saved data
    loadChecklistData();
}

// Enhanced rating functions with visual feedback
function setRating(itemId, value) {
    const stars = document.querySelectorAll(`[data-item-id="${itemId}"] .star`);
    stars.forEach((star, index) => {
        if (index < value) {
            star.style.color = '#ffc107';
            star.style.transform = 'scale(1.1)';
        } else {
            star.style.color = '#ddd';
            star.style.transform = 'scale(1)';
        }
    });
    
    const ratingText = document.getElementById(`${itemId}-rating-text`);
    if (ratingText) {
        const ratings = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
        ratingText.textContent = `${value} star${value !== 1 ? 's' : ''} - ${ratings[value]}`;
        ratingText.style.color = value >= 4 ? '#4caf50' : value >= 3 ? '#ff9800' : '#f44336';
    }
    
    handleChecklistChange(itemId, value);
}

function hoverRating(itemId, value) {
    const stars = document.querySelectorAll(`[data-item-id="${itemId}"] .star`);
    stars.forEach((star, index) => {
        if (index < value) {
            star.style.color = '#ffd700';
            star.style.transform = 'scale(1.2)';
        }
    });
}

function resetRating(itemId) {
    const currentValue = checklistData[currentChecklist]?.[itemId] || 0;
    setRating(itemId, currentValue);
}

// Update the existing switchChecklist function to use new rendering
window.switchChecklist = function(checklistType) {
    currentChecklist = checklistType;
    
    // Update tab UI
    document.querySelectorAll('[data-checklist]').forEach(tab => {
        tab.classList.remove('active');
        tab.style.background = '';
        tab.style.color = '';
    });
    
    const activeTab = document.querySelector(`[data-checklist="${checklistType}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
        activeTab.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        activeTab.style.color = 'white';
    }
    
    // Use new rendering function
    renderChecklistContentNew();
};

// Initialize the new checklist system
document.addEventListener('DOMContentLoaded', function() {
    // Replace the old checklists with new ones
    window.checklists = checklistsNew;
    
    // Update the rendering function
    window.renderChecklistContent = renderChecklistContentNew;
    
    // Add modern tab styling
    const style = document.createElement('style');
    style.textContent = `
        .checklist-tab {
            transition: all 0.3s ease;
            border-radius: 8px 8px 0 0;
            padding: 12px 24px !important;
            font-weight: 600;
        }
        
        .checklist-tab:hover {
            background: rgba(102, 126, 234, 0.1);
            transform: translateY(-2px);
        }
        
        .checklist-tab.active {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important;
            box-shadow: 0 -2px 10px rgba(102, 126, 234, 0.3);
        }
        
        .star-rating .star {
            text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        
        .form-group {
            animation: fadeIn 0.5s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        input[type="checkbox"]:checked {
            background: #667eea;
            border-color: #667eea;
        }
        
        input[type="radio"]:checked {
            background: currentColor;
            border-color: currentColor;
        }
    `;
    document.head.appendChild(style);
});