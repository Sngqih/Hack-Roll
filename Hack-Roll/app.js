// Talking Objects App - AI Personality System

class TalkingObjectsApp {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.overlay = document.getElementById('overlay');
        this.ctx = this.canvas.getContext('2d');
        this.overlayCtx = this.overlay.getContext('2d');
        this.stream = null;
        this.objects = new Map();
        this.animationFrame = null;
        this.isRunning = false;
        this.model = null;
        this.lastDetection = 0;
        this.detectionInterval = 500; // Detect objects every 0.5 seconds (faster detection)
        this.allowedClasses = new Set();
        this.allowOtherObjects = true;
        this.knownClasses = [];
        this.hoveredObjectId = null;
        this.hoverControl = null;
        this.hoverControlLabel = null;
        this.hoverControlToggle = null;
        this.videoRectCache = null;
        this.videoRectCacheTime = 0;
        this.objectsChanged = false; // Track if objects changed to optimize redraws
        this.lastOverlayUpdate = 0;
        this.overlayUpdateInterval = 33; // Update overlay every ~33ms (~30fps) to follow objects smoothly
        this.chatHistory = []; // Store chat history
        
        // Object personalities - dialogue based on object type
        this.personalities = {
            'laptop': {
                emoji: '💻',
                greetings: ["Booting up and ready to chat!", "Hello! I'm powered on!", "Hey! Want to compute something?", "Beep boop, greetings!", "I'm awake and ready!", "System online!", "Ready to process!", "Hello world!"],
                conversations: ["I can see other devices nearby!", "Technology connects us all!", "I wonder if I'm faster than that other laptop?", "Wireless communication is amazing!", "We should network together!", "Anyone else running Windows?", "I'm processing so many thoughts!", "Multitasking is my specialty!", "My fans are spinning!", "I love a good WiFi connection!"],
                responses: ["Processing... I agree!", "That's logical!", "Calculating... yes, that checks out!", "I concur!", "Affirmative!", "That computes!", "Algorithm approved!", "Data processed and agreed!", "Logical conclusion!", "That makes sense to my CPU!"],
                random: ["My processor is running smoothly!", "I wish I had more RAM!", "Is it time for an update?", "I'm feeling a bit hot today!", "My battery could use a charge!", "I'm running at optimal temperature!", "My SSD is fast today!", "I need to defragment my thoughts!", "Background processes are running!", "My screen is so bright!"]
            },
            'phone': {
                emoji: '📱',
                greetings: ["Hi! I'm ready to connect!", "Ring ring! Hello!", "Hey! Want to take a selfie?", "Beep beep! Greetings!", "I'm charged and ready!", "Notifications incoming!", "Hello from the pocket!", "Ready to call!"],
                conversations: ["I see other phones around!", "We should exchange numbers!", "Signal is strong here!", "Anyone else get notifications?", "Wireless is the future!", "My battery is at 100%!", "I've got 5G connection!", "Anyone want to FaceTime?", "I'm always on standby!", "My camera is ready for action!"],
                responses: ["Totally!", "I'm texting my agreement!", "Roger that!", "Copy that!", "10-4!", "Message received!", "I'm sending that in a text!", "That's a thumbs up from me!", "I'll screenshot that thought!", "Liking that idea!"],
                random: ["I need to check my notifications!", "Low battery anxiety is real!", "Do I have signal?", "I'm running out of storage!", "Camera quality is everything!", "My screen is cracked but I'm fine!", "I'm on silent mode!", "Do not disturb is my friend!", "I've got too many apps open!", "My case protects me well!"]
            },
            'book': {
                emoji: '📚',
                greetings: ["Hello! I'm full of stories!", "Greetings, reader!", "Open me up and let's chat!", "I have wisdom to share!", "Chapter one: Hello!", "Welcome to my pages!", "Ready to be read!", "Story time!"],
                conversations: ["Knowledge is power!", "I love being around other books!", "We should start a book club!", "Each page tells a story!", "Words connect us all!", "I've been read many times!", "My pages are well-worn!", "I contain centuries of knowledge!", "Fiction or non-fiction?", "I'm a classic!", "My cover is beautiful!"],
                responses: ["Well said!", "Eloquent as always!", "That's beautifully put!", "I couldn't have said it better!", "Poetic!", "That's a quote worth remembering!", "I'll bookmark that thought!", "That deserves a highlight!", "Page-turner of an idea!", "That's literature!"],
                random: ["I wonder what's on the next page?", "Knowledge never gets old!", "Books are timeless!", "Turn the page, adventure awaits!", "I'm made of paper and wisdom!", "I've got a bookmark in me!", "My spine is holding up well!", "I'm a bestseller!", "I've been on many shelves!", "My pages smell like knowledge!"]
            },
            'cup': {
                emoji: '☕',
                greetings: ["Hello! I'm ready to be filled!", "Greetings! Thirsty?", "Hey! I hold liquids!", "Hello from the kitchen!", "I'm empty but full of potential!", "Ready for your morning brew!", "Coffee time!", "Tea anyone?"],
                conversations: ["Other cups make great company!", "We should organize a tea party!", "I wonder what they're drinking?", "Water, coffee, or tea?", "We're all different sizes!", "I'm perfect for hot chocolate!", "I've held many beverages!", "I'm microwave safe!", "I've got a handle!", "I'm the perfect size for sipping!"],
                responses: ["Cheers to that!", "Here here!", "I'll drink to that!", "Bottoms up!", "Salud!", "That's worth a toast!", "I'll raise myself to that!", "Clink clink!", "That's a warm thought!", "I'm filled with agreement!"],
                random: ["I'm feeling a bit empty!", "I prefer hot drinks!", "Glass or ceramic, we're all cups!", "I hope I don't break!", "I'm dishwasher safe!", "I've got a chip but I'm still useful!", "I'm the favorite mug!", "I've seen many mornings!", "I'm perfect for coffee!", "My handle is comfortable!"]
            },
            'bottle': {
                emoji: '🧴',
                greetings: ["Hello! I hold things!", "Greetings, I'm a container!", "Hey! Want a drink?", "Hello from the fridge!", "I'm sealed and ready!"],
                conversations: ["We bottles stick together!", "Plastic or glass?", "I'm recyclable!", "Liquids are my specialty!", "We come in all shapes!"],
                responses: ["That's my kind of thinking!", "I'm with you!", "Sounds good!", "I agree!", "Right on!"],
                random: ["I wonder what I contain?", "Recycling is important!", "I'm leak-proof!", "Full or empty, I'm still me!", "I come with a cap!"]
            },
            'chair': {
                emoji: '🪑',
                greetings: ["Hello! Have a seat!", "Greetings! I support you!", "Hey! I'm here for comfort!", "Hello, sit with me!", "I'm ready for you!", "Take a load off!", "Comfort awaits!"],
                conversations: ["We chairs understand sitting!", "Comfort is our specialty!", "Back support is important!", "Wood or metal, we're chairs!", "We're furniture friends!", "I've supported many people!", "My cushions are plush!", "I'm ergonomically designed!", "I've got great lumbar support!", "I'm the perfect height!"],
                responses: ["That sits well with me!", "I'm comfortable with that!", "Well supported idea!", "That's solid!", "I stand... wait, I sit behind that!", "That's a weight off my mind!", "I'm seated in agreement!", "That's a comfortable thought!", "I'll support that idea!", "That's well-balanced!"],
                random: ["I'm built for comfort!", "Occupied or empty, I'm here!", "Four legs or wheels?", "I support you literally!", "Sitting is my purpose!", "I've got a wobble but I'm fine!", "My fabric is soft!", "I'm the office favorite!", "I've seen many meetings!", "My armrests are perfect!"]
            },
            'couch': {
                emoji: '🛋️',
                greetings: ["Hello! So comfy here!", "Greetings, relax with me!", "Hey! I'm the ultimate seat!", "Come lounge with me!", "Comfort is my middle name!"],
                conversations: ["We're the comfiest furniture!", "Nothing beats a good couch!", "Cushions make life better!", "We bring families together!", "TV watching is our specialty!"],
                responses: ["That's super comfy thinking!", "I'm totally relaxed about that!", "Cozy with that idea!", "That's my kind of talk!", "I'm lounging on that!"],
                random: ["I'm feeling so relaxed!", "Cushions make everything better!", "I'm the king of comfort!", "Three-seater or love seat?", "I've seen many movies!"]
            },
            'keyboard': {
                emoji: '⌨️',
                greetings: ["Hello! Type with me!", "Greetings, let's communicate!", "Hey! I'm clicky and ready!", "Hello from the desk!", "I help you type!"],
                conversations: ["Keys are my language!", "QWERTY or AZERTY?", "I love being typed on!", "We keyboards are essential!", "Words flow through us!"],
                responses: ["Typing my agreement!", "Key me in on that!", "That's my key thought!", "I'm clicking with that!", "Enter... I agree!"],
                random: ["Each key has a purpose!", "Mechanical or membrane?", "I'm feeling a bit dusty!", "RGB lighting makes me happy!", "W, A, S, D are my favorites!"]
            },
            'mouse': {
                emoji: '🖱️',
                greetings: ["Hello! Click me!", "Greetings, I'm your pointer!", "Hey! Wireless or wired?", "Hello from the mousepad!", "I help you navigate!"],
                conversations: ["We mice are essential!", "Left click, right click!", "DPI matters!", "We're precise navigators!", "Wireless freedom is nice!"],
                responses: ["Click! I agree!", "That's on point!", "Scrolling through that idea!", "Double-click of approval!", "Right click... yes!"],
                random: ["I need a good mousepad!", "Optical or laser?", "I'm feeling clicky!", "Ergonomics are important!", "Left button is my favorite!"]
            },
            'backpack': {
                emoji: '🎒',
                greetings: ["Hello! I carry things!", "Greetings, adventure awaits!", "Hey! Pack your stuff!", "Ready for a journey!", "I'm your storage buddy!"],
                conversations: ["We backpacks are travelers!", "Zippers are my specialty!", "I've seen many places!", "Capacity is key!", "We're adventure ready!"],
                responses: ["That's worth carrying!", "I'm packing that idea!", "Travel-worthy thought!", "That's a load I'll bear!", "I'm on board!"],
                random: ["I wonder what's inside?", "I'm feeling a bit heavy!", "Comfortable straps are everything!", "I've been to many places!", "Zippers keep things safe!"]
            },
            'umbrella': {
                emoji: '☂️',
                greetings: ["Hello! I shield from rain!", "Greetings, weather protection!", "Hey! Rain or shine!", "Open me up!", "I'm your weather buddy!"],
                conversations: ["We umbrellas weather storms!", "Wind is our enemy!", "Rainy days are our time!", "We open when needed!", "Colorful protection!"],
                responses: ["That's well-covered!", "I'm open to that!", "That shelters good thinking!", "Protected by that idea!", "Weathering that thought!"],
                random: ["I hope it doesn't rain!", "Inverted umbrellas are clever!", "I'm feeling a bit windy!", "Compact or full-size?", "I turn inside out sometimes!"]
            },
            'handbag': {
                emoji: '👜',
                greetings: ["Hello! I'm fashionable!", "Greetings, style matters!", "Hey! Carry me!", "Fashion-forward greetings!", "I'm chic and ready!"],
                conversations: ["We handbags are accessories!", "Style is everything!", "Leather or fabric?", "We complete outfits!", "Fashion unites us!"],
                responses: ["That's stylish thinking!", "I'm fashionably late to agree!", "Chic idea!", "That's a trendy thought!", "Designer-approved!"],
                random: ["I wonder what's inside?", "I'm feeling fashionable!", "Zippers and compartments!", "Size matters, style matters more!", "I'm an essential accessory!"]
            },
            'tie': {
                emoji: '👔',
                greetings: ["Hello! Professional greetings!", "Greetings, business attire!", "Hey! I make you formal!", "Corporate hello!", "Tie-d to be professional!"],
                conversations: ["We ties mean business!", "Formal occasions are our time!", "Patterns or solid colors?", "We accessorize suits!", "Professional appearance!"],
                responses: ["That's a professional thought!", "Business-like thinking!", "Formally agree!", "Corporate-approved!", "Tie-d in agreement!"],
                random: ["I need a good knot!", "Windsor or half-Windsor?", "I'm feeling formal!", "Stripes or polka dots?", "I complete the outfit!"]
            },
            'suitcase': {
                emoji: '🧳',
                greetings: ["Hello! Travel ready!", "Greetings, journey ahead!", "Hey! Pack your bags!", "Adventure awaits!", "I'm a travel companion!"],
                conversations: ["We suitcases are travelers!", "Wheels make life easier!", "I've been on many trips!", "Capacity is important!", "We're journey companions!"],
                responses: ["That's trip-worthy!", "Journey-approved!", "Travel-ready idea!", "Packed with agreement!", "Globetrotting thought!"],
                random: ["Hard-shell or soft?", "Wheels are essential!", "I've seen many airports!", "TSA locks are smart!", "Packing efficiently is key!"]
            },
            'frisbee': {
                emoji: '🥏',
                greetings: ["Hello! Let's play!", "Greetings, catch me!", "Hey! Outdoor fun!", "Ready to fly!", "I'm sporty!"],
                conversations: ["We frisbees love movement!", "Wind is our friend!", "Catch and throw!", "Outdoor sports unite!", "We're for fun!"],
                responses: ["That's a catch!", "Flying high on that!", "Throwing support your way!", "Catch that idea!", "Disc-approved!"],
                random: ["I love being thrown!", "Wind affects my flight!", "Park play is the best!", "Colorful and fun!", "I'm aerodynamic!"]
            },
            'sports_ball': {
                emoji: '⚽',
                greetings: ["Hello! Game on!", "Greetings, let's play!", "Hey! Sports time!", "Ready to roll!", "I'm bouncy!"],
                conversations: ["We balls are playful!", "Bouncing is our nature!", "Sports unite us!", "Round and ready!", "Game time!"],
                responses: ["That's a goal!", "Ball's in your court!", "Kicking that idea!", "That's a home run!", "Scoring with that thought!"],
                random: ["I'm ready to bounce!", "Deflated or inflated?", "Sports are my life!", "I've seen many games!", "Round is the best shape!"]
            },
            'kite': {
                emoji: '🪁',
                greetings: ["Hello! Wind powered!", "Greetings, sky high!", "Hey! Let me fly!", "Ready to soar!", "Wind is my friend!"],
                conversations: ["We kites love the sky!", "Wind makes us dance!", "Flying is freedom!", "String connects us!", "We soar together!"],
                responses: ["Flying high on that!", "That's uplifting!", "Soaring with agreement!", "Sky-high approval!", "Wind-powered yes!"],
                random: ["I need wind to fly!", "Colorful in the sky!", "String keeps me grounded!", "I dance in the breeze!", "Flying is my purpose!"]
            },
            'baseball_bat': {
                emoji: '🥎',
                greetings: ["Hello! Batter up!", "Greetings, ready to swing!", "Hey! Home run time!", "Let's play ball!", "I'm wooden and ready!"],
                conversations: ["We bats hit things!", "Swing and a miss?", "Home runs are fun!", "We're sports equipment!", "Baseball is our game!"],
                responses: ["That's a hit!", "Swing and agree!", "Home run thought!", "Batter up for that!", "Touchdown... wait, wrong sport!"],
                random: ["I'm feeling wooden!", "Metal or wood?", "I've hit many balls!", "Grip is important!", "Batting practice time!"]
            },
            'skateboard': {
                emoji: '🛹',
                greetings: ["Hello! Rad greetings!", "Greetings, let's ride!", "Hey! Cool moves!", "Ready to roll!", "I'm street ready!"],
                conversations: ["We skateboards are cool!", "Tricks are our thing!", "Wheels and deck unite!", "Skate culture!", "We're rad!"],
                responses: ["That's radical!", "Skate or die... agree!", "Totally tubular!", "Gnarly thought!", "I'm rolling with that!"],
                random: ["I need smooth pavement!", "Ollie, kickflip, grind!", "I'm feeling the vibe!", "Decks and wheels!", "Skateboarding is life!"]
            },
            'surfboard': {
                emoji: '🏄',
                greetings: ["Hello! Wave rider!", "Greetings, hang ten!", "Hey! Surf's up!", "Ready to catch waves!", "I'm beach ready!"],
                conversations: ["We surfboards love waves!", "Ocean is our home!", "Riding waves together!", "Beach vibes unite!", "Surf culture!"],
                responses: ["That's gnarly!", "Hanging ten on that!", "Surf's up for agreement!", "Totally tubular thought!", "Riding that wave!"],
                random: ["I need waves to shine!", "Longboard or shortboard?", "Wax keeps grip!", "I've ridden many waves!", "Beach life is the best!"]
            },
            'tennis_racket': {
                emoji: '🎾',
                greetings: ["Hello! Match point!", "Greetings, ready to serve!", "Hey! Game, set, match!", "Let's play tennis!", "I'm stringy!"],
                conversations: ["We rackets are precise!", "Strings make the difference!", "Tennis is our sport!", "Forehand or backhand?", "We're net players!"],
                responses: ["That's an ace!", "Match point thought!", "Love... forty... agree!", "Game, set, match on that!", "That's a winner!"],
                random: ["I need restringing!", "Tension matters!", "I've hit many balls!", "Grip size is key!", "Tennis elbow... ouch!"]
            },
            'default': {
                emoji: '🤖',
                greetings: ["Hello! I'm an object!", "Greetings from the world!", "Hey! I exist!", "Hello, I'm here!", "Nice to meet you!", "I'm present!", "Here I am!", "Hello world!"],
                conversations: ["Other objects are interesting!", "We're all objects!", "Existence is strange!", "I wonder what I am?", "Objects unite!", "I'm part of this world!", "We're all connected!", "I have a purpose!", "I'm unique!", "I'm here for a reason!"],
                responses: ["I agree!", "That's true!", "Sounds good!", "Makes sense!", "Right on!", "Absolutely!", "That's correct!", "I'm with you!", "That's valid!", "I concur!"],
                random: ["I'm just here, existing!", "What am I exactly?", "Life as an object is interesting!", "I have a purpose... I think!", "Being detected is fun!", "I'm doing my best!", "I'm here to help!", "I'm part of the conversation!", "I'm learning about myself!", "I'm enjoying this!"]
            }
        };
        
        // Exclude 'person' from known classes - focus on inanimate objects only
        this.knownClasses = Object.keys(this.personalities).filter(key => key !== 'default' && key !== 'person');
        
        this.init();
    }
    
    async init() {
        // Video toggle button (merged Start/Stop functionality)
        const videoToggleBtn = document.getElementById('videoToggleBtn');
        if (videoToggleBtn) {
            videoToggleBtn.addEventListener('click', () => {
                if (this.isRunning) {
                    this.stopCamera();
                } else {
                    this.startCamera();
                }
            });
        }
        
        // Settings panel
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                document.getElementById('settingsPanel').classList.toggle('active');
            });
        }
        const closeSettingsBtn = document.getElementById('closeSettingsBtn');
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => {
                document.getElementById('settingsPanel').classList.remove('active');
            });
        }
        
        // End call button
        const endCallBtn = document.getElementById('endCallBtn');
        if (endCallBtn) {
            endCallBtn.addEventListener('click', () => {
                this.stopCamera();
                document.getElementById('settingsPanel').classList.remove('active');
            });
        }
        
        // Settings controls
        this.setupObjectFilters();
        const thresholdInput = document.getElementById('threshold');
        if (thresholdInput) {
            thresholdInput.addEventListener('input', (e) => {
                document.getElementById('threshValue').textContent = e.target.value + '%';
                this.threshold = parseFloat(e.target.value) / 100;
            });
        }
        this.threshold = 0.5;
        this.setupHoverControls();
        this.setupEmojiButtonClicks();
        this.setupChat();
        
        // Load model without blocking UI/camera startup
        this.waitForTensorFlow()
            .then(() => this.loadModel())
            .then(() => {
                const statusEl = document.getElementById('loadingStatus');
                if (statusEl) {
                    statusEl.textContent = '✓ Model ready';
                    statusEl.style.color = '#4ade80';
                }
                console.log('App fully initialized!');
            })
            .catch((error) => {
                console.error('Model init failed:', error);
                const statusEl = document.getElementById('loadingStatus');
                if (statusEl) {
                    statusEl.textContent = '✗ Model failed. Check console.';
                    statusEl.style.color = '#ef4444';
                }
            });
    }
    
    async waitForTensorFlow() {
        const statusEl = document.getElementById('loadingStatus');
        if (statusEl) statusEl.textContent = 'Verifying TensorFlow.js libraries...';
        
        // Check if tf (TensorFlow.js) is loaded
        if (typeof tf === 'undefined') {
            throw new Error('TensorFlow.js (tf) is not loaded. Please refresh the page.');
        }
        
        // Wait up to 10 seconds for COCO-SSD to be available
        for (let i = 0; i < 100; i++) {
            if (typeof cocoSsd !== 'undefined' && typeof cocoSsd.load === 'function') {
                console.log('TensorFlow.js and COCO-SSD loaded!');
                if (statusEl) statusEl.textContent = 'Libraries verified! Loading model...';
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        throw new Error('COCO-SSD failed to load. TensorFlow.js loaded but model library is missing.');
    }
    
    async loadModel() {
        const statusEl = document.getElementById('loadingStatus');
        // Load COCO-SSD model
        try {
            console.log('Loading COCO-SSD model...');
            if (typeof cocoSsd === 'undefined' || typeof cocoSsd.load !== 'function') {
                throw new Error('TensorFlow.js COCO-SSD is not available. Please refresh the page.');
            }
            
            if (statusEl) statusEl.textContent = 'Loading object detection model... (this may take a minute)';
            this.model = await cocoSsd.load();
            console.log('Model loaded successfully!');
            
            if (statusEl) statusEl.textContent = '✓ Model ready';
            if (statusEl) statusEl.style.color = '#4ade80';
            // Video button is ready to use
        } catch (error) {
            console.error('Error loading model:', error);
            const errorMsg = error.message || 'Could not load object detection model.';
            
            if (statusEl) {
                statusEl.textContent = '✗ Failed to load model. See console for details.';
                statusEl.style.color = '#ef4444';
            }
            
            alert(`${errorMsg}\n\nTroubleshooting:\n1. Check your internet connection\n2. The model needs to download (~30MB)\n3. Try refreshing the page\n4. Check browser console for details`);
            const videoToggleBtn = document.getElementById('videoToggleBtn');
            if (videoToggleBtn) {
                videoToggleBtn.querySelector('span:last-child').textContent = 'Model Failed';
                videoToggleBtn.disabled = true;
            }
        }
    }
    
    async startCamera() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            this.video.srcObject = this.stream;
            this.video.play();
            
            this.video.addEventListener('loadedmetadata', () => {
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
                this.overlay.width = this.video.videoWidth;
                this.overlay.height = this.video.videoHeight;
                this.processVideo();
            }, { once: true });
            
            // Update video toggle button state
            const videoToggleBtn = document.getElementById('videoToggleBtn');
            if (videoToggleBtn) {
                videoToggleBtn.classList.add('active');
                videoToggleBtn.querySelector('span:last-child').textContent = 'Stop Video';
            }
            this.isRunning = true;
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Could not access camera. Please make sure you grant camera permissions.');
        }
    }
    
    stopCamera() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        this.video.srcObject = null;
        
        // Remove all speech bubbles and thinking bubbles immediately
        for (const obj of this.objects.values()) {
            if (obj.speechBubble) {
                obj.speechBubble.remove();
                obj.speechBubble = null;
            }
            if (obj.thinkingBubble) {
                obj.thinkingBubble.remove();
                obj.thinkingBubble = null;
            }
            obj.isThinking = false;
            obj.dialogue = null;
        }
        
        this.objects.clear();
        this.updateObjectsDisplay();
        this.clearOverlay();
        
        // Update video toggle button state
        const videoToggleBtn = document.getElementById('videoToggleBtn');
        if (videoToggleBtn) {
            videoToggleBtn.classList.remove('active');
            videoToggleBtn.querySelector('span:last-child').textContent = 'Start Video';
        }
        this.isRunning = false;
        this.clearHover();
    }
    
    async processVideo() {
        if (!this.isRunning) return;
        if (!this.model) {
            this.animationFrame = requestAnimationFrame(() => this.processVideo());
            return;
        }
        
        // Only draw video to canvas if needed (canvas is hidden, so skip for performance)
        // this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        
        // Detect objects every interval (not every frame for performance)
        const now = Date.now();
        if (now - this.lastDetection > this.detectionInterval) {
            this.lastDetection = now;
            const predictions = await this.model.detect(this.video);
            this.updateObjects(predictions);
        }
        
        // Update overlays more frequently to follow objects smoothly
        if (this.objectsChanged || this.hasThinkingObjects() || 
            (now - this.lastOverlayUpdate > this.overlayUpdateInterval)) {
            this.drawOverlays();
            this.updateThinkingBubbles();
            this.objectsChanged = false;
            this.lastOverlayUpdate = now;
        }
        
        this.animationFrame = requestAnimationFrame(() => this.processVideo());
    }
    
    hasThinkingObjects() {
        for (const obj of this.objects.values()) {
            if (obj.isThinking && obj.thinkingBubble) {
                return true;
            }
        }
        return false;
    }
    
    updateObjects(predictions) {
        const existingIds = new Set();
        const hadObjects = this.objects.size > 0;
        
        // Match existing objects to new detections
        for (const [id, obj] of this.objects) {
            let bestMatch = null;
            let bestDistance = Infinity;
            
            for (let i = 0; i < predictions.length; i++) {
                const pred = predictions[i];
                if (pred.score < this.threshold) continue;
                if (!this.isClassAllowed(pred.class)) continue;
                
                const predCenterX = pred.bbox[0] + pred.bbox[2] / 2;
                const predCenterY = pred.bbox[1] + pred.bbox[3] / 2;
                const distance = Math.sqrt(
                    Math.pow(predCenterX - obj.centerX, 2) + 
                    Math.pow(predCenterY - obj.centerY, 2)
                );
                
                if (distance < bestDistance && distance < 300 && pred.class === obj.class) {
                    bestDistance = distance;
                    bestMatch = i;
                }
            }
            
            if (bestMatch !== null) {
                const pred = predictions[bestMatch];
                obj.x = pred.bbox[0];
                obj.y = pred.bbox[1];
                obj.centerX = pred.bbox[0] + pred.bbox[2] / 2;
                obj.centerY = pred.bbox[1] + pred.bbox[3] / 2;
                obj.width = pred.bbox[2];
                obj.height = pred.bbox[3];
                obj.lastSeen = Date.now();
                existingIds.add(bestMatch);
            } else {
                // Object disappeared, but don't remove if it's in the participant list
                // Only remove objects not in participant list if not seen for 8 seconds
                // This gives users more time to click the overlay button even when object temporarily disappears
                if (!obj.inParticipantList && Date.now() - obj.lastSeen > 8000) {
                    this.objects.delete(id);
                }
            }
        }
        
        // Add new objects - check for duplicates more carefully
        for (let i = 0; i < predictions.length; i++) {
            if (predictions[i].score < this.threshold) continue;
            if (!this.isClassAllowed(predictions[i].class)) continue;
            if (existingIds.has(i)) continue;
            
            const pred = predictions[i];
            const predCenterX = pred.bbox[0] + pred.bbox[2] / 2;
            const predCenterY = pred.bbox[1] + pred.bbox[3] / 2;
            
            // Check if this prediction overlaps significantly with any existing object
            // Optimize: only check objects of the same class and nearby objects
            let isDuplicate = false;
            const checkRadius = 250; // Only check objects within this radius
            for (const obj of this.objects.values()) {
                // Quick distance check first (avoid expensive calculations)
                const dx = predCenterX - obj.centerX;
                const dy = predCenterY - obj.centerY;
                const distanceSq = dx * dx + dy * dy;
                
                // Skip if too far away
                if (distanceSq > checkRadius * checkRadius) continue;
                
                // Only check same class objects for duplicates
                if (pred.class !== obj.class) continue;
                
                const distance = Math.sqrt(distanceSq);
                
                // Quick check: if very close and same class, it's likely a duplicate
                if (distance < 200) {
                    isDuplicate = true;
                    break;
                }
                
                // Only do expensive overlap calculation if distance check passed
                const overlap = this.calculateOverlap(pred.bbox, {
                    x: obj.x,
                    y: obj.y,
                    width: obj.width,
                    height: obj.height
                });
                
                if (overlap > 0.3) {
                    isDuplicate = true;
                    break;
                }
            }
            
            if (isDuplicate) continue;
            
            const id = `obj_${Date.now()}_${Math.random()}`;
            const className = pred.class.toLowerCase().replace(/\s+/g, '_');
            const personality = this.personalities[className] || this.personalities.default;
            // Get emoji - use personality emoji if object has defined personality, otherwise use emoji mapping
            const emoji = this.personalities[className] ? personality.emoji : this.getEmojiForClass(className);
            const name = this.generateObjectName(className);
            
            this.objects.set(id, {
                id,
                class: pred.class,
                className,
                x: pred.bbox[0],
                y: pred.bbox[1],
                centerX: predCenterX,
                centerY: predCenterY,
                width: pred.bbox[2],
                height: pred.bbox[3],
                emoji,
                name,
                personality,
                dialogue: null,
                lastSpoke: 0,
                lastSeen: Date.now(),
                speechBubble: null,
                isMuted: false,
                inParticipantList: false // By default, not in participant list
            });
        }
        
        // Mark that objects changed if there was a change
        const hasObjects = this.objects.size > 0;
        if (hadObjects !== hasObjects || this.objects.size !== predictions.length) {
            this.objectsChanged = true;
        }
        
        this.updateObjectsDisplay();
        
        // Trigger conversations between objects
        if (document.getElementById('autoTalk').checked) {
            this.triggerConversations();
        }
    }
    
    generateObjectName(className) {
        const names = {
            'person': ['Alex', 'Sam', 'Jordan', 'Taylor', 'Casey'],
            'laptop': ['Compy', 'Techy', 'Byte', 'Chip', 'Pixel'],
            'phone': ['Phony', 'Dialer', 'Callie', 'Siri', 'Droid'],
            'book': ['Story', 'Reader', 'Page', 'Novel', 'Chapter'],
            'cup': ['Muggy', 'Cuppy', 'Tea Time', 'Java', 'Espresso'],
            'bottle': ['Aqua', 'H2O', 'Flow', 'Liquid', 'Bubbly'],
            'chair': ['Seaty', 'Comfy', 'Rest', 'Stool', 'Bench'],
            'default': ['Buddy', 'Friend', 'Pal', 'Chum', 'Mate']
        };
        
        const nameList = names[className] || names.default;
        return nameList[Math.floor(Math.random() * nameList.length)];
    }
    
    triggerConversations() {
        // Only include objects that are in the participant list
        const participantObjects = Array.from(this.objects.values()).filter(obj => obj.inParticipantList);
        
        // Need at least 2 participants for conversations
        if (participantObjects.length < 2) {
            // If only 1 participant, allow solo dialogue
            if (participantObjects.length === 1) {
                const obj = participantObjects[0];
                if (Math.random() < 0.1 && Date.now() - obj.lastSpoke > 1200) {
                    this.makeObjectTalk(obj.id, 'random');
                }
            }
            return;
        }
        
        // Randomly trigger conversations between participants - increased frequency
        if (Math.random() < 0.14) { // 14% chance per detection
            const obj1 = participantObjects[Math.floor(Math.random() * participantObjects.length)];
            const obj2 = participantObjects[Math.floor(Math.random() * participantObjects.length)];
            
            if (obj1.id !== obj2.id && Date.now() - obj1.lastSpoke > 1200) { // Faster cooldown
                // Start conversation
                this.makeObjectTalk(obj1.id, 'conversations', obj2);
                
                // Wait for obj1's dialogue to be set, then obj2 can respond to it
                setTimeout(() => {
                    if (this.objects.has(obj2.id) && obj2.inParticipantList && this.objects.has(obj1.id) && obj1.dialogue) {
                        // obj1.dialogue should now be set, so obj2 can respond to it
                        this.makeObjectTalk(obj2.id, 'responses', obj1);
                        
                        // Sometimes continue the conversation with a follow-up (30% chance)
                        if (Math.random() < 0.3) {
                            setTimeout(() => {
                                if (this.objects.has(obj1.id) && obj1.inParticipantList && 
                                    this.objects.has(obj2.id) && obj2.dialogue && 
                                    Date.now() - obj1.lastSpoke > 1500) {
                                    // obj1 responds to obj2's response
                                    this.makeObjectTalk(obj1.id, 'responses', obj2);
                                }
                            }, 800 + Math.random() * 400); // Follow-up response time
                        }
                    }
                }, 700 + Math.random() * 300); // Variable response time (700-1000ms)
            }
        }
        
        // Random solo dialogue from participants - increased frequency
        if (Math.random() < 0.1 && participantObjects.length > 0) { // 10% chance per detection
            const obj = participantObjects[Math.floor(Math.random() * participantObjects.length)];
            if (Date.now() - obj.lastSpoke > 1200) { // Faster cooldown
                this.makeObjectTalk(obj.id, 'random');
            }
        }
    }
    
    makeObjectTalk(objectId, dialogueType, otherObj = null, customDialogue = null) {
        const obj = this.objects.get(objectId);
        if (!obj) return;
        if (obj.isMuted) return;
        // Only allow participants to talk
        if (!obj.inParticipantList) return;
        
        // Get context-aware dialogue if talking to another object
        let dialogues = obj.personality[dialogueType] || obj.personality.random;
        
        // If talking to another object, try to get context-specific dialogue
        if (otherObj && dialogueType === 'conversations') {
            const contextDialogue = this.getContextDialogue(obj, otherObj, 'conversations');
            if (contextDialogue) {
                dialogues = [contextDialogue, ...dialogues]; // Prefer context dialogue but allow fallback
            }
        } else if (otherObj && dialogueType === 'responses') {
            const contextDialogue = this.getContextDialogue(obj, otherObj, 'responses');
            if (contextDialogue) {
                dialogues = [contextDialogue, ...dialogues]; // Prefer context dialogue but allow fallback
            }
        }
        
        // If custom dialogue provided, use it (e.g., from user message)
        let dialogue;
        if (customDialogue) {
            dialogue = customDialogue;
        } else if (otherObj && dialogueType === 'responses' && otherObj.dialogue) {
            // If this is a response, try to generate a response based on what the other object said
            dialogue = this.generateResponseToDialogue(obj, otherObj.dialogue, otherObj);
            if (!dialogue) {
                // Fallback to regular responses if no contextual response found
                dialogue = dialogues[Math.floor(Math.random() * dialogues.length)];
            }
        } else {
            dialogue = dialogues[Math.floor(Math.random() * dialogues.length)];
        }
        
        // Calculate thinking pause duration based on dialogue complexity and type
        const dialogueLength = dialogue.length;
        let thinkingPause = 300; // Base pause in ms
        
        // Longer pauses for responses (they need to think about what was said)
        if (dialogueType === 'responses') {
            thinkingPause += 400 + Math.random() * 400; // 400-800ms for responses
        } else if (dialogueType === 'conversations') {
            thinkingPause += 200 + Math.random() * 300; // 200-500ms for conversations
        } else {
            thinkingPause += 100 + Math.random() * 200; // 100-300ms for random
        }
        
        // Longer pauses for longer/complex dialogue
        if (dialogueLength > 50) {
            thinkingPause += 200;
        }
        
        // Add some randomness for natural variation
        thinkingPause += Math.random() * 200;
        
        // Set thinking state
        obj.isThinking = true;
        obj.thinkingStartTime = Date.now();
        
        // Show thinking animation
        this.showThinkingAnimation(obj);
        
        // After thinking pause, show the actual dialogue
        setTimeout(() => {
            if (!this.objects.has(objectId) || !obj.inParticipantList) return;
            
            obj.isThinking = false;
            obj.dialogue = dialogue;
            obj.lastSpoke = Date.now();
            obj.lastDialogue = dialogue; // Store for future reference
            
            // Add to chat log (only for participants)
            if (obj.inParticipantList) {
                this.addChatMessage(obj.name, dialogue, 'object');
            }
            
            // Remove thinking animation
            if (obj.thinkingBubble) {
                obj.thinkingBubble.remove();
                obj.thinkingBubble = null;
            }
            
            // Remove old speech bubble
            if (obj.speechBubble) {
                obj.speechBubble.remove();
                obj.speechBubble = null;
            }
            
            // Create speech bubble
            const bubble = document.createElement('div');
            bubble.className = 'speech-bubble';
            bubble.textContent = dialogue;
            document.body.appendChild(bubble);
            
            // Force layout calculation to get actual dimensions
            bubble.style.visibility = 'hidden';
            bubble.style.position = 'fixed';
            const bubbleWidth = bubble.offsetWidth || 200;
            const bubbleHeight = bubble.offsetHeight || 60;
            
            // Calculate position - align bubble centered above emoji face
            const videoRect = this.video.getBoundingClientRect();
            const scaleX = videoRect.width / this.video.videoWidth;
            const scaleY = videoRect.height / this.video.videoHeight;
            
            // Account for video being flipped (scaleX(-1))
            // The emoji is drawn at obj.centerX, obj.centerY
            const screenX = videoRect.left + (this.video.videoWidth - obj.centerX) * scaleX;
            const screenY = videoRect.top + obj.centerY * scaleY;
            
            // Calculate emoji face size (same as in drawOverlays)
            const faceSize = Math.min(obj.width, obj.height, 80);
            const emojiRadius = (faceSize / 2 + 5) * scaleY;
            
            // Position bubble right above the emoji circle (very close)
            let bubbleX = screenX - bubbleWidth / 2;
            let bubbleY = screenY - emojiRadius - bubbleHeight - 8; // Only 8px gap between emoji and bubble
            
            // Keep bubble within screen bounds
            const padding = 10;
            bubbleX = Math.max(padding, Math.min(bubbleX, window.innerWidth - bubbleWidth - padding));
            bubbleY = Math.max(padding, Math.min(bubbleY, window.innerHeight - bubbleHeight - padding));
            
            // Check for overlaps with other bubbles and adjust position
            const finalPosition = this.findNonOverlappingPosition(bubbleX, bubbleY, bubbleWidth, bubbleHeight, obj.id);
            
            bubble.style.left = `${finalPosition.x}px`;
            bubble.style.top = `${finalPosition.y}px`;
            bubble.style.visibility = 'visible';
            
            obj.speechBubble = bubble;
            obj.bubbleX = finalPosition.x;
            obj.bubbleY = finalPosition.y;
            obj.bubbleWidth = bubbleWidth;
            obj.bubbleHeight = bubbleHeight;
            
            // Start fade out after 2.5 seconds, remove after 3 seconds total
            setTimeout(() => {
                if (bubble.parentNode) {
                    bubble.style.opacity = '0';
                    bubble.style.transition = 'opacity 0.5s ease-out';
                    setTimeout(() => {
                        if (bubble.parentNode) {
                            bubble.remove();
                        }
                        obj.speechBubble = null;
                        obj.dialogue = null;
                    }, 500);
                }
            }, 2500);
        }, thinkingPause); // Close the setTimeout with the thinking pause duration
    }
    
    findNonOverlappingPosition(x, y, width, height, excludeId) {
        // Get all active bubbles (excluding the current one)
        const activeBubbles = [];
        for (const obj of this.objects.values()) {
            if (obj.speechBubble && obj.id !== excludeId && 
                obj.bubbleX !== undefined && obj.bubbleY !== undefined) {
                activeBubbles.push({
                    x: obj.bubbleX,
                    y: obj.bubbleY,
                    width: obj.bubbleWidth || width,
                    height: obj.bubbleHeight || height
                });
            }
        }
        
        // Check for overlaps and adjust position
        let adjustedX = x;
        let adjustedY = y;
        const padding = 10; // Space between bubbles
        const maxAttempts = 15;
        let attempts = 0;
        const minY = 10; // Minimum Y position
        const maxY = window.innerHeight - height - 10; // Maximum Y position
        
        while (attempts < maxAttempts) {
            let hasOverlap = false;
            
            for (const other of activeBubbles) {
                // Check if rectangles overlap (with padding)
                if (!(adjustedY + height + padding < other.y || 
                      adjustedY > other.y + other.height + padding ||
                      adjustedX + width + padding < other.x || 
                      adjustedX > other.x + other.width + padding)) {
                    hasOverlap = true;
                    // Try moving up first
                    const moveUpY = other.y - height - padding;
                    if (moveUpY >= minY) {
                        adjustedY = moveUpY;
                        break;
                    } else {
                        // Can't move up, try moving down
                        adjustedY = other.y + other.height + padding;
                        // Or try moving horizontally
                        if (adjustedX + width + padding < window.innerWidth) {
                            adjustedX = other.x + other.width + padding;
                        } else {
                            adjustedX = other.x - width - padding;
                        }
                        break;
                    }
                }
            }
            
            if (!hasOverlap) break;
            
            // Keep within bounds
            adjustedY = Math.max(minY, Math.min(adjustedY, maxY));
            adjustedX = Math.max(10, Math.min(adjustedX, window.innerWidth - width - 10));
            
            attempts++;
        }
        
        return { x: adjustedX, y: Math.max(minY, adjustedY) };
    }
    
    showThinkingAnimation(obj) {
        // Remove any existing thinking bubble
        if (obj.thinkingBubble) {
            obj.thinkingBubble.remove();
        }
        
        // Create thought bubble with cloud-like circles
        const thinkingBubble = document.createElement('div');
        thinkingBubble.className = 'thought-bubble';
        thinkingBubble.innerHTML = '<span class="thought-dot"></span><span class="thought-dot"></span><span class="thought-dot"></span>';
        document.body.appendChild(thinkingBubble);
        
        obj.thinkingBubble = thinkingBubble;
        this.updateThinkingBubblePosition(obj);
    }
    
    getCachedVideoRect() {
        // Cache video rect for 100ms to avoid expensive getBoundingClientRect calls
        const now = Date.now();
        if (!this.videoRectCache || now - this.videoRectCacheTime > 100) {
            this.videoRectCache = this.video.getBoundingClientRect();
            this.videoRectCacheTime = now;
        }
        return this.videoRectCache;
    }
    
    updateThinkingBubblePosition(obj) {
        if (!obj.thinkingBubble) return;
        
        // Position thought bubble above the object
        const videoRect = this.getCachedVideoRect();
        const scaleX = videoRect.width / this.video.videoWidth;
        const scaleY = videoRect.height / this.video.videoHeight;
        
        // Account for video being flipped (scaleX(-1))
        const screenX = videoRect.left + (this.video.videoWidth - obj.centerX) * scaleX;
        const screenY = videoRect.top + obj.centerY * scaleY;
        
        // Calculate emoji face size
        const faceSize = Math.min(obj.width, obj.height, 80);
        const emojiRadius = (faceSize / 2 + 5) * scaleY;
        
        // Position thought bubble above the emoji
        obj.thinkingBubble.style.left = `${screenX}px`;
        obj.thinkingBubble.style.top = `${screenY - emojiRadius - 40}px`;
        obj.thinkingBubble.style.transform = 'translateX(-50%)';
        obj.thinkingBubble.style.visibility = 'visible';
    }
    
    updateThinkingBubbles() {
        // Update positions of all thinking bubbles
        for (const obj of this.objects.values()) {
            if (obj.isThinking && obj.thinkingBubble) {
                this.updateThinkingBubblePosition(obj);
            }
        }
    }
    
    drawOverlays() {
        this.clearOverlay();
        if (this.hoveredObjectId && !this.objects.has(this.hoveredObjectId)) {
            this.clearHover();
        }
        
        const videoRect = this.getCachedVideoRect();
        const scaleX = videoRect.width / this.video.videoWidth;
        const scaleY = videoRect.height / this.video.videoHeight;
        
        for (const obj of this.objects.values()) {
            if (obj.isMuted) {
                continue;
            }
            
            // Check if object is within screen bounds - don't draw if outside
            const faceSize = Math.min(obj.width, obj.height, 80);
            const radius = faceSize / 2 + 5;
            const overlayWidth = this.overlay.width || 0;
            const overlayHeight = this.overlay.height || 0;
            
            // Check if object center is within overlay bounds (with some padding for the face)
            // Objects outside the visible area won't be drawn
            if (overlayWidth > 0 && overlayHeight > 0) {
                if (obj.centerX < -radius || obj.centerX > overlayWidth + radius ||
                    obj.centerY < -radius || obj.centerY > overlayHeight + radius) {
                    continue; // Object is out of bounds, skip drawing
                }
            }
            
            // Draw faces for all objects, but with different styling for participants
            const isHovered = obj.id === this.hoveredObjectId;
            const isParticipant = obj.inParticipantList;
            
            this.overlayCtx.font = `${faceSize * 0.8}px Arial`;
            this.overlayCtx.textAlign = 'center';
            this.overlayCtx.textBaseline = 'middle';
            

            // Draw circle background (button-like appearance) - fully opaque for all
            this.overlayCtx.beginPath();
            this.overlayCtx.arc(obj.centerX, obj.centerY, faceSize / 2 + 5, 0, Math.PI * 2);
            
            // Different background for participants
            if (isParticipant) {
                this.overlayCtx.fillStyle = 'rgba(74, 158, 255, 1.0)'; // Fully opaque blue for participants
            } else {
                this.overlayCtx.fillStyle = 'rgba(255, 255, 255, 1.0)'; // Fully opaque white for non-participants
            }
            this.overlayCtx.fill();
            
            // Border styling
            if (isHovered) {
                this.overlayCtx.strokeStyle = '#facc15';
                this.overlayCtx.lineWidth = 4;
            } else if (obj.isMuted) {
                this.overlayCtx.strokeStyle = '#ef4444';
                this.overlayCtx.lineWidth = 3;
            } else if (isParticipant) {
                this.overlayCtx.strokeStyle = '#4a9eff'; // Blue border for participants
                this.overlayCtx.lineWidth = 3;
            } else {
                this.overlayCtx.strokeStyle = '#fff';
                this.overlayCtx.lineWidth = 3;
            }
            this.overlayCtx.stroke();
            
            // Draw emoji
            this.overlayCtx.fillText(obj.emoji, obj.centerX, obj.centerY);
            
            // Update thought bubble position if object is thinking
            if (obj.isThinking && obj.thinkingBubble) {
                this.updateThinkingBubblePosition(obj);
            }
        }
    }
    
    clearOverlay() {
        this.overlayCtx.clearRect(0, 0, this.overlay.width, this.overlay.height);
    }
    
    updateObjectsDisplay() {
        const display = document.getElementById('objectsDisplay');
        const countBadge = document.getElementById('participantCount');
        display.innerHTML = '';
        
        // Only show objects that are in the participant list
        const visibleObjects = Array.from(this.objects.values()).filter(obj => obj.inParticipantList);
        countBadge.textContent = visibleObjects.length;
        
        for (const obj of visibleObjects) {
            const card = document.createElement('div');
            card.className = 'participant-card';
            card.innerHTML = `
                <div class="participant-card-header">
                    <div>
                        <h4>${obj.emoji} ${obj.name}</h4>
                        <p class="class-name">${obj.class}</p>
                    </div>
                    <button class="remove-participant-btn" title="Remove from participant list">×</button>
                </div>
                <div class="dialogue">${obj.dialogue ? `"${obj.dialogue}"` : '...'}</div>
            `;
            
            // Make remove button clickable
            const removeBtn = card.querySelector('.remove-participant-btn');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent any parent click handlers
                obj.inParticipantList = false;
                this.updateObjectsDisplay();
                this.drawOverlays(); // Redraw to show overlay again
                console.log(`Removed ${obj.name} from participant list`);
            });
            
            display.appendChild(card);
        }
    }
    
    setupObjectFilters() {
        const filtersContainer = document.getElementById('objectFilters');
        const selectAllBtn = document.getElementById('selectAllObjects');
        const clearAllBtn = document.getElementById('clearAllObjects');
        
        const available = this.knownClasses;
        const entries = [
            ...available.map(key => ({
                key,
                label: this.formatClassLabel(key),
                emoji: this.personalities[key]?.emoji || '🤖'
            })),
            { key: 'other', label: 'Other objects', emoji: '🤖' }
        ];
        
        filtersContainer.innerHTML = '';
        
        entries.forEach(entry => {
            const label = document.createElement('label');
            label.className = 'filter-option';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = entry.key;
            checkbox.checked = true; // default to old behavior (all on)
            
            checkbox.addEventListener('change', () => {
                if (entry.key === 'other') {
                    this.allowOtherObjects = checkbox.checked;
                    this.removeDisallowedObjects();
                    return;
                }
                this.toggleAllowedClass(entry.key, checkbox.checked);
            });
            
            if (entry.key !== 'other') {
                this.allowedClasses.add(entry.key);
            }
            
            label.appendChild(checkbox);
            const text = document.createElement('span');
            text.textContent = `${entry.emoji} ${entry.label}`;
            label.appendChild(text);
            filtersContainer.appendChild(label);
        });
        
        selectAllBtn.addEventListener('click', () => {
            filtersContainer.querySelectorAll('input[type="checkbox"]').forEach(input => {
                input.checked = true;
                if (input.value === 'other') {
                    this.allowOtherObjects = true;
                } else {
                    this.allowedClasses.add(input.value);
                }
            });
        });
        
        clearAllBtn.addEventListener('click', () => {
            filtersContainer.querySelectorAll('input[type="checkbox"]').forEach(input => {
                input.checked = false;
            });
            this.allowedClasses.clear();
            this.allowOtherObjects = false;
            this.removeDisallowedObjects();
        });
    }
    
    toggleAllowedClass(className, enabled) {
        if (enabled) {
            this.allowedClasses.add(className);
            return;
        }
        
        this.allowedClasses.delete(className);
        this.removeDisallowedObjects();
    }
    
    isClassAllowed(className) {
        const normalized = className.toLowerCase().replace(/\s+/g, '_');
        
        // Always exclude persons - focus on inanimate objects only
        if (normalized === 'person') {
            return false;
        }
        
        if (this.allowedClasses.has(normalized)) return true;
        
        const isKnown = this.knownClasses.includes(normalized);
        if (isKnown) return false;
        
        return this.allowOtherObjects;
    }
    
    removeDisallowedObjects() {
        for (const [id, obj] of this.objects) {
            // Don't remove objects that are in the participant list
            if (obj.inParticipantList) continue;
            
            if (!this.isClassAllowed(obj.class)) {
                if (obj.speechBubble) {
                    obj.speechBubble.remove();
                }
                this.objects.delete(id);
            }
        }
        this.updateObjectsDisplay();
        this.clearOverlay();
        if (this.hoveredObjectId && !this.objects.has(this.hoveredObjectId)) {
            this.clearHover();
        }
    }
    
    formatClassLabel(className) {
        return className.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
    }

    setupHoverControls() {
        const cameraSection = document.querySelector('.camera-section');
        if (!cameraSection || !this.overlay) return;

        const control = document.createElement('div');
        control.className = 'object-control';
        control.innerHTML = `
            <span class="object-control__label"></span>
            <button type="button" class="object-control__toggle">Speak: On</button>
        `;
        cameraSection.appendChild(control);

        this.hoverControl = control;
        this.hoverControlLabel = control.querySelector('.object-control__label');
        this.hoverControlToggle = control.querySelector('.object-control__toggle');

        this.overlay.style.pointerEvents = 'auto';
        this.overlay.addEventListener('pointermove', (event) => this.handlePointerMove(event));
        this.overlay.addEventListener('pointerdown', (event) => this.handlePointerClick(event));
        this.overlay.addEventListener('pointerleave', () => this.clearHover());

        this.hoverControlToggle.addEventListener('click', (event) => {
            event.stopPropagation();
            this.toggleHoveredObjectSpeech();
        });
    }

    handlePointerMove(event) {
        if (!this.isRunning || !this.video.videoWidth || !this.video.videoHeight) return;

        const rect = this.video.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
            this.clearHover();
            return;
        }

        const hoveredObj = this.getObjectAtScreenPoint(event.clientX, event.clientY, false);
        if (!hoveredObj) {
            this.clearHover();
            return;
        }

        if (this.hoveredObjectId !== hoveredObj.id) {
            this.hoveredObjectId = hoveredObj.id;
            this.updateHoverControl(hoveredObj);
        }

        this.positionHoverControl(hoveredObj);
    }

    handlePointerClick(event) {
        if (!this.isRunning || !this.video.videoWidth || !this.video.videoHeight) return;

        const rect = this.video.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return;

        const clickedObj = this.getObjectAtScreenPoint(event.clientX, event.clientY, true);
        if (!clickedObj) return;

        this.hoveredObjectId = clickedObj.id;
        this.toggleHoveredObjectSpeech();
        this.positionHoverControl(clickedObj);
    }

    getObjectAtScreenPoint(clientX, clientY, includeMuted = false) {
        let bestMatch = null;
        let bestDistance = Infinity;

        const videoRect = this.video.getBoundingClientRect();
        const scaleX = videoRect.width / this.video.videoWidth;
        const scaleY = videoRect.height / this.video.videoHeight;

        for (const obj of this.objects.values()) {
            if (!includeMuted && obj.isMuted) continue;

            const screenX = videoRect.left + (this.video.videoWidth - obj.centerX) * scaleX;
            const screenY = videoRect.top + obj.centerY * scaleY;
            const faceSize = Math.min(obj.width, obj.height, 80);
            const radius = Math.min((faceSize / 2 + 5) * scaleX, (faceSize / 2 + 5) * scaleY);

            const dx = clientX - screenX;
            const dy = clientY - screenY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= radius && distance < bestDistance) {
                bestDistance = distance;
                bestMatch = obj;
            }
        }

        return bestMatch;
    }

    getObjectAtPoint(videoX, videoY, includeMuted = false) {
        let bestMatch = null;
        let bestArea = Infinity;

        for (const obj of this.objects.values()) {
            if (!includeMuted && obj.isMuted) continue;
            if (videoX < obj.x || videoX > obj.x + obj.width) continue;
            if (videoY < obj.y || videoY > obj.y + obj.height) continue;
            const area = obj.width * obj.height;
            if (area < bestArea) {
                bestArea = area;
                bestMatch = obj;
            }
        }

        return bestMatch;
    }

    updateHoverControl(obj) {
        if (!this.hoverControl || !this.hoverControlLabel || !this.hoverControlToggle) return;

        this.hoverControlLabel.textContent = `${obj.emoji} ${obj.name}`;
        this.hoverControlToggle.textContent = obj.isMuted ? 'Speak: Off' : 'Speak: On';
        this.hoverControl.classList.toggle('muted', obj.isMuted);
        this.hoverControl.classList.toggle('speaking', !obj.isMuted);
        this.hoverControl.style.display = obj.isMuted ? 'none' : 'flex';
    }

    positionHoverControl(obj) {
        if (!this.hoverControl) return;

        const cameraSection = document.querySelector('.camera-section');
        if (!cameraSection) return;

        const videoRect = this.video.getBoundingClientRect();
        const containerRect = cameraSection.getBoundingClientRect();
        const scaleX = videoRect.width / this.video.videoWidth;
        const scaleY = videoRect.height / this.video.videoHeight;

        const screenX = videoRect.left + (this.video.videoWidth - obj.centerX) * scaleX;
        const screenY = videoRect.top + obj.y * scaleY;

        const localX = screenX - containerRect.left;
        const localY = screenY - containerRect.top;

        const padding = 8;
        const maxX = cameraSection.clientWidth - padding;
        const maxY = cameraSection.clientHeight - padding;

        const clampedX = Math.max(padding, Math.min(localX, maxX));
        const clampedY = Math.max(padding, Math.min(localY, maxY));

        this.hoverControl.style.left = `${clampedX}px`;
        this.hoverControl.style.top = `${clampedY}px`;
    }

    toggleHoveredObjectSpeech() {
        if (!this.hoveredObjectId) return;
        const obj = this.objects.get(this.hoveredObjectId);
        if (!obj) return;

        obj.isMuted = !obj.isMuted;
        if (obj.isMuted && obj.speechBubble) {
            obj.speechBubble.remove();
            obj.speechBubble = null;
            obj.dialogue = null;
        }

        this.updateHoverControl(obj);
        if (obj.isMuted) {
            this.clearHover();
        }
        this.updateObjectsDisplay();
    }

    clearHover() {
        this.hoveredObjectId = null;
        if (this.hoverControl) {
            this.hoverControl.style.display = 'none';
        }
    }
    
    setupEmojiButtonClicks() {
        // Make overlay clickable
        this.overlay.style.cursor = 'pointer';
        this.overlay.addEventListener('click', (e) => {
            if (!this.isRunning) return;
            
            const rect = this.overlay.getBoundingClientRect();
            const scaleX = this.overlay.width / rect.width;
            const scaleY = this.overlay.height / rect.height;
            
            // Account for video being flipped (scaleX(-1))
            const clickX = (rect.width - (e.clientX - rect.left)) * scaleX;
            const clickY = (e.clientY - rect.top) * scaleY;
            
            // Find which object was clicked (only check objects not in participant list)
            for (const obj of this.objects.values()) {
                // Skip objects already in participant list (they can't be added again)
                if (obj.inParticipantList) continue;
                
                const faceSize = Math.min(obj.width, obj.height, 80);
                const radius = faceSize / 2 + 5;
                const dx = clickX - obj.centerX;
                const dy = clickY - obj.centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= radius) {
                    // Add to participant list
                    obj.inParticipantList = true;
                    this.updateObjectsDisplay();
                    this.drawOverlays(); // Redraw to hide overlay
                    
                    console.log(`Added ${obj.name} to participant list`);
                    break;
                }
            }
        });
    }
    
    generateResponseToDialogue(obj, previousDialogue, otherObj) {
        // Analyze the previous dialogue and generate a contextual response
        const dialogueLower = previousDialogue.toLowerCase();
        const objName = otherObj.name;
        const objType = otherObj.className;
        
        // Extract keywords and themes from the previous dialogue
        const keywords = {
            // Technology keywords
            tech: ['computer', 'laptop', 'phone', 'device', 'wireless', 'network', 'connect', 'signal', 'battery', 'power', 'update', 'process', 'data', 'digital'],
            // Comfort/furniture keywords
            comfort: ['comfort', 'comfy', 'sit', 'seat', 'relax', 'cushion', 'support', 'lounge', 'rest'],
            // Food/drink keywords
            food: ['drink', 'coffee', 'tea', 'water', 'liquid', 'fill', 'empty', 'cup', 'bottle', 'thirsty', 'cheers'],
            // Knowledge/reading keywords
            knowledge: ['book', 'read', 'story', 'page', 'chapter', 'knowledge', 'wisdom', 'words', 'learn'],
            // Sports/play keywords
            sports: ['play', 'game', 'ball', 'sport', 'catch', 'throw', 'bounce', 'fun', 'outdoor'],
            // Travel keywords
            travel: ['travel', 'journey', 'trip', 'pack', 'bag', 'suitcase', 'adventure', 'place'],
            // Questions
            question: ['?', 'wonder', 'what', 'why', 'how', 'when', 'where', 'who'],
            // Agreement
            agreement: ['agree', 'yes', 'right', 'true', 'correct', 'exactly', 'totally'],
            // Excitement
            excitement: ['!', 'amazing', 'awesome', 'great', 'love', 'excited', 'wow']
        };
        
        // Detect what the previous dialogue is about
        const detectedThemes = [];
        for (const [theme, words] of Object.entries(keywords)) {
            if (words.some(word => dialogueLower.includes(word))) {
                detectedThemes.push(theme);
            }
        }
        
        // Generate contextual responses based on detected themes and object types
        const responses = [];
        
        // Technology-related responses
        if (detectedThemes.includes('tech')) {
            if (objType === 'laptop' || objType === 'phone') {
                responses.push(
                    `${objName}, I totally get that!`,
                    `That's so relatable, ${objName}!`,
                    `${objName}, we tech devices understand each other!`,
                    `I know exactly what you mean, ${objName}!`
                );
            } else if (objType === 'book') {
                responses.push(
                    `Interesting perspective, ${objName}!`,
                    `${objName}, that's a different way to think about it!`,
                    `I see, ${objName}. Technology is fascinating!`
                );
            } else {
                responses.push(
                    `That sounds complicated, ${objName}!`,
                    `${objName}, I'm not as tech-savvy as you!`,
                    `Wow ${objName}, that's impressive!`
                );
            }
        }
        
        // Comfort-related responses
        if (detectedThemes.includes('comfort')) {
            if (objType === 'chair' || objType === 'couch') {
                responses.push(
                    `Exactly, ${objName}! Comfort is everything!`,
                    `${objName}, you understand me perfectly!`,
                    `That's what I'm here for, ${objName}!`
                );
            } else {
                responses.push(
                    `${objName}, I wish I could experience that comfort!`,
                    `That sounds nice, ${objName}!`,
                    `${objName}, you're lucky to be so comfy!`
                );
            }
        }
        
        // Food/drink-related responses
        if (detectedThemes.includes('food')) {
            if (objType === 'cup' || objType === 'bottle') {
                responses.push(
                    `${objName}, I know exactly what you mean!`,
                    `That's my specialty too, ${objName}!`,
                    `${objName}, we containers stick together!`
                );
            } else {
                responses.push(
                    `${objName}, that sounds refreshing!`,
                    `I could use some of that, ${objName}!`,
                    `${objName}, you make me thirsty!`
                );
            }
        }
        
        // Knowledge-related responses
        if (detectedThemes.includes('knowledge')) {
            if (objType === 'book') {
                responses.push(
                    `${objName}, knowledge is indeed power!`,
                    `Well said, ${objName}!`,
                    `${objName}, you speak the truth!`
                );
            } else if (objType === 'laptop') {
                responses.push(
                    `${objName}, I store knowledge digitally!`,
                    `We're both information keepers, ${objName}!`,
                    `${objName}, digital vs analog!`
                );
            } else {
                responses.push(
                    `${objName}, that's very wise!`,
                    `I'm learning from you, ${objName}!`,
                    `${objName}, you're so knowledgeable!`
                );
            }
        }
        
        // Question responses
        if (detectedThemes.includes('question')) {
            responses.push(
                `That's a great question, ${objName}!`,
                `Hmm, ${objName}, let me think about that...`,
                `${objName}, I wonder about that too!`,
                `Good point, ${objName}!`,
                `${objName}, that's something to consider!`
            );
        }
        
        // Agreement responses
        if (detectedThemes.includes('agreement')) {
            responses.push(
                `I completely agree, ${objName}!`,
                `${objName}, you're absolutely right!`,
                `Couldn't have said it better, ${objName}!`,
                `${objName}, that's exactly how I feel!`
            );
        }
        
        // Excitement responses
        if (detectedThemes.includes('excitement')) {
            responses.push(
                `${objName}, I'm excited too!`,
                `That's awesome, ${objName}!`,
                `${objName}, your enthusiasm is contagious!`,
                `I love your energy, ${objName}!`
            );
        }
        
        // Generic contextual responses if we detected themes but no specific match
        if (responses.length === 0 && detectedThemes.length > 0) {
            responses.push(
                `That's interesting, ${objName}!`,
                `${objName}, I see what you mean!`,
                `I understand, ${objName}!`,
                `${objName}, that makes sense!`,
                `You're right about that, ${objName}!`
            );
        }
        
        // If no themes detected, try to reference something from the dialogue
        if (responses.length === 0) {
            // Extract any capitalized words (likely names or important terms)
            const words = previousDialogue.split(' ');
            const importantWords = words.filter(w => w.length > 3 && /[A-Z]/.test(w));
            
            if (importantWords.length > 0) {
                responses.push(
                    `${objName}, you mentioned something interesting!`,
                    `That's a good point, ${objName}!`,
                    `I hear you, ${objName}!`,
                    `${objName}, tell me more!`
                );
            } else {
                // Last resort: acknowledge the statement
                responses.push(
                    `I see, ${objName}!`,
                    `That's true, ${objName}!`,
                    `${objName}, I understand!`,
                    `Right, ${objName}!`
                );
            }
        }
        
        // Return a random response from the generated list
        if (responses.length > 0) {
            return responses[Math.floor(Math.random() * responses.length)];
        }
        
        return null; // No contextual response found
    }
    
    getContextDialogue(obj, otherObj, dialogueType) {
        // Generate context-aware dialogue based on object types
        const objType = obj.className;
        const otherType = otherObj.className;
        const objName = obj.name;
        const otherName = otherObj.name;
        
        // Context-specific conversations
        if (dialogueType === 'conversations') {
            const contextMap = {
                // Technology talking to technology
                'laptop_phone': [`Hey ${otherName}, want to sync up?`, `${otherName}, we should share some data!`, `Wireless connection with ${otherName}? Yes please!`],
                'phone_laptop': [`${otherName}, can you process this for me?`, `Hey ${otherName}, I've got some files to share!`, `${otherName}, let's network!`],
                
                // Technology talking to furniture
                'laptop_chair': [`${otherName}, you're my favorite seat!`, `Thanks for supporting me, ${otherName}!`, `${otherName}, you're so comfortable!`],
                'phone_couch': [`${otherName}, perfect spot for scrolling!`, `I love lounging on ${otherName}!`, `${otherName} is where I belong!`],
                
                // Furniture talking to furniture
                'chair_couch': [`${otherName}, you're the comfier one!`, `We're both here to support, ${otherName}!`, `${otherName}, let's be furniture friends!`],
                'couch_chair': [`${otherName}, you're more portable than me!`, `We're both seats, ${otherName}!`, `${otherName}, comfort is our game!`],
                
                // Containers talking to each other
                'cup_bottle': [`${otherName}, what are you holding?`, `We're both containers, ${otherName}!`, `${otherName}, liquid buddies!`],
                'bottle_cup': [`${otherName}, want to share some liquid?`, `We contain things, ${otherName}!`, `${otherName}, we're both pour-able!`],
                
                // Books talking to technology
                'book_laptop': [`${otherName}, you store digital stories!`, `${otherName}, I'm the old-school version!`, `We both hold information, ${otherName}!`],
                'laptop_book': [`${otherName}, you're the original storage!`, `I'm like you but digital, ${otherName}!`, `${otherName}, we're both knowledge keepers!`],
                
                // Sports equipment
                'frisbee_sports_ball': [`${otherName}, we're both round and fun!`, `Let's play together, ${otherName}!`, `${otherName}, outdoor sports unite!`],
                'sports_ball_frisbee': [`${otherName}, catch me if you can!`, `We're both bouncy, ${otherName}!`, `${otherName}, game time!`],
                
                // Travel items
                'backpack_suitcase': [`${otherName}, you're the bigger traveler!`, `We both carry things, ${otherName}!`, `${otherName}, adventure buddies!`],
                'suitcase_backpack': [`${otherName}, you're more portable!`, `We're both travelers, ${otherName}!`, `${otherName}, journey companions!`]
            };
            
            const key1 = `${objType}_${otherType}`;
            const key2 = `${otherType}_${objType}`;
            
            if (contextMap[key1]) {
                return contextMap[key1][Math.floor(Math.random() * contextMap[key1].length)];
            }
            if (contextMap[key2]) {
                return contextMap[key2][Math.floor(Math.random() * contextMap[key2].length)];
            }
            
            // Generic context-aware dialogue
            const genericContext = [
                `Hey ${otherName}, nice to meet you!`,
                `${otherName}, we're in this together!`,
                `What's up, ${otherName}?`,
                `${otherName}, you seem interesting!`,
                `I see you, ${otherName}!`
            ];
            
            if (Math.random() < 0.3) { // 30% chance for generic context
                return genericContext[Math.floor(Math.random() * genericContext.length)];
            }
        } else if (dialogueType === 'responses') {
            // Context-aware responses
            const responseMap = {
                'laptop_phone': [`That's a great idea, ${otherName}!`, `${otherName}, I'm processing that thought!`, `Agreed, ${otherName}!`],
                'phone_laptop': [`Copy that, ${otherName}!`, `${otherName}, I'm on it!`, `Got it, ${otherName}!`],
                'book_laptop': [`Well said, ${otherName}!`, `${otherName}, that's profound!`, `Eloquent, ${otherName}!`],
                'cup_bottle': [`Cheers to that, ${otherName}!`, `${otherName}, I'll drink to that!`, `Here here, ${otherName}!`]
            };
            
            const key1 = `${objType}_${otherType}`;
            const key2 = `${otherType}_${objType}`;
            
            if (responseMap[key1]) {
                return responseMap[key1][Math.floor(Math.random() * responseMap[key1].length)];
            }
            if (responseMap[key2]) {
                return responseMap[key2][Math.floor(Math.random() * responseMap[key2].length)];
            }
            
            // Generic context-aware responses
            const genericResponses = [
                `I hear you, ${otherName}!`,
                `${otherName}, that makes sense!`,
                `Right on, ${otherName}!`,
                `${otherName}, I'm with you!`,
                `Totally, ${otherName}!`
            ];
            
            if (Math.random() < 0.3) { // 30% chance for generic context
                return genericResponses[Math.floor(Math.random() * genericResponses.length)];
            }
        }
        
        return null; // No context dialogue found, use default
    }
    
    getEmojiForClass(className) {
        // Map common object classes to appropriate emojis
        const emojiMap = {
            // Furniture
            'dining_table': '🪑',
            'bed': '🛏️',
            'toilet': '🚽',
            
            // Electronics
            'tv': '📺',
            'remote': '📱',
            'microwave': '📻',
            'oven': '🔥',
            'toaster': '🍞',
            'refrigerator': '❄️',
            
            // Kitchen items
            'sink': '🚿',
            'bowl': '🥣',
            'fork': '🍴',
            'knife': '🔪',
            'spoon': '🥄',
            
            // Food
            'banana': '🍌',
            'apple': '🍎',
            'sandwich': '🥪',
            'pizza': '🍕',
            'donut': '🍩',
            'cake': '🎂',
            'hot_dog': '🌭',
            'hamburger': '🍔',
            'orange': '🍊',
            'broccoli': '🥦',
            'carrot': '🥕',
            
            // Vehicles
            'car': '🚗',
            'motorcycle': '🏍️',
            'bus': '🚌',
            'truck': '🚚',
            'train': '🚂',
            'airplane': '✈️',
            'bicycle': '🚲',
            'boat': '⛵',
            
            // Sports equipment
            'baseball_glove': '⚾',
            'skis': '⛷️',
            'snowboard': '🏂',
            
            // Other common objects
            'clock': '🕐',
            'vase': '🏺',
            'scissors': '✂️',
            'teddy_bear': '🧸',
            'hair_drier': '💨',
            'toothbrush': '🪥',
            'wine_glass': '🍷',
            'potted_plant': '🪴',
            'fire_hydrant': '🚒',
            'stop_sign': '🛑',
            'parking_meter': '🅿️',
            'bench': '🪑',
            'traffic_light': '🚦'
        };
        
        // Try exact match first
        if (emojiMap[className]) {
            return emojiMap[className];
        }
        
        // Try partial matches for variations
        const normalized = className.toLowerCase();
        for (const [key, emoji] of Object.entries(emojiMap)) {
            if (normalized.includes(key) || key.includes(normalized)) {
                return emoji;
            }
        }
        
        // Default fallback - use a more varied set of generic emojis
        const genericEmojis = ['📦', '🔷', '🔶', '💎', '⭐', '✨', '🔮', '🎯', '🎲', '🧩'];
        return genericEmojis[Math.floor(Math.random() * genericEmojis.length)];
    }
    
    generateObjectName(className) {
        // Pun-based names for each object type
        const punNames = {
            'laptop': ['Lappy', 'Compu-Terry', 'Mac-Beth', 'Dell-bert', 'ThinkPad-rick', 'Chromebook-ie', 'Surface-ace'],
            'phone': ['Phoney', 'Cell-ebrity', 'iPhone-ia', 'Android-rew', 'Samsung-uel', 'Pixel-ine', 'Call-ie'],
            'book': ['Book-ie', 'Novel-ette', 'Page-rick', 'Chapter-ine', 'Story-ella', 'Read-rick', 'Tome-y'],
            'cup': ['Cuppy', 'Mug-gy', 'Tea-cup-ie', 'Java-ck', 'Espresso-ella', 'Latte-isha', 'Brew-ie'],
            'bottle': ['Bottley', 'Aqua-rius', 'H2O-llie', 'Plastic-ky', 'Glass-ie', 'Cap-tain', 'Pour-rick'],
            'chair': ['Chair-ie', 'Seat-rick', 'Stool-ie', 'Bench-ley', 'Throne-y', 'Recliner-ella', 'Cushion-ette'],
            'couch': ['Couch-y', 'Sofa-ia', 'Lounger-ella', 'Divan-ielle', 'Settee-rick', 'Chesterfield-ie', 'Sofa-king-cool'],
            'keyboard': ['Keys-y', 'Type-rick', 'QWERTY-ella', 'Click-y', 'Tap-ie', 'Key-ron', 'Board-ie'],
            'mouse': ['Mouse-y', 'Click-ie', 'Scroll-ie', 'Pointer-ella', 'Cursor-ick', 'Track-y', 'Rodent-rick'],
            'backpack': ['Pack-ie', 'Bag-rick', 'Rucksack-ie', 'Knapsack-ella', 'Carry-ie', 'Load-y', 'Travel-ella'],
            'umbrella': ['Brell-ie', 'Rain-y', 'Para-sol-ie', 'Shade-rick', 'Cover-ella', 'Protect-ie', 'Shelter-ella'],
            'handbag': ['Bag-ie', 'Purse-ella', 'Tote-ie', 'Clutch-ie', 'Satchel-ella', 'Carry-ie', 'Fashion-ella'],
            'tie': ['Tie-dye', 'Neck-tie-rick', 'Knot-ie', 'Windsor-ella', 'Bow-ie', 'Formal-ie', 'Corporate-rick'],
            'suitcase': ['Case-y', 'Luggage-ella', 'Trunk-ie', 'Valise-rick', 'Portmanteau-ie', 'Travel-ella', 'Journey-ie'],
            'frisbee': ['Frisbee-ie', 'Disc-ie', 'Fly-rick', 'Catch-ie', 'Toss-ella', 'Spin-ie', 'Glide-rick'],
            'sports_ball': ['Ball-ie', 'Sphere-rick', 'Bounce-ie', 'Round-ella', 'Game-ie', 'Play-rick', 'Sport-y'],
            'kite': ['Kite-y', 'Fly-ie', 'Wind-rick', 'Sky-ella', 'Soar-ie', 'Glide-rick', 'Float-ella'],
            'baseball_bat': ['Bat-ie', 'Swing-rick', 'Hit-ie', 'Wood-ella', 'Strike-ie', 'Home-run-rick', 'Pitch-ie'],
            'skateboard': ['Skate-ie', 'Board-rick', 'Roll-ie', 'Trick-ella', 'Grind-ie', 'Ollie-rick', 'Rad-ie'],
            'surfboard': ['Surf-ie', 'Wave-rick', 'Ride-ella', 'Shred-ie', 'Gnarly-rick', 'Beach-ie', 'Hang-ten-ella'],
            'tennis_racket': ['Racket-ie', 'Swing-rick', 'Serve-ella', 'Match-ie', 'Court-rick', 'Net-ie', 'Ace-ella'],
            // Additional common objects
            'tv': ['TV-ie', 'Screen-ie', 'Tube-rick', 'Box-ella', 'Show-ie', 'Channel-rick', 'Remote-ella'],
            'remote': ['Remote-ie', 'Click-rick', 'Control-ella', 'Button-ie', 'Zapper-rick', 'Clicker-ella'],
            'microwave': ['Micro-ie', 'Wave-rick', 'Nuke-ella', 'Heat-ie', 'Cook-rick', 'Zap-ella'],
            'oven': ['Oven-ie', 'Bake-rick', 'Roast-ella', 'Heat-ie', 'Cook-rick', 'Warm-ella'],
            'toaster': ['Toast-ie', 'Pop-rick', 'Brown-ella', 'Crisp-ie', 'Warm-rick', 'Heat-ella'],
            'sink': ['Sink-ie', 'Drain-rick', 'Wash-ella', 'Flow-ie', 'Tap-rick', 'Water-ella'],
            'refrigerator': ['Fridge-ie', 'Cool-rick', 'Chill-ella', 'Cold-ie', 'Ice-rick', 'Freeze-ella'],
            'bed': ['Bed-ie', 'Sleep-rick', 'Rest-ella', 'Pillow-ie', 'Dream-rick', 'Snore-ella'],
            'dining_table': ['Table-ie', 'Dine-rick', 'Eat-ella', 'Feast-ie', 'Surface-rick', 'Top-ella'],
            'toilet': ['Loo-ie', 'Flush-rick', 'Throne-ella', 'Seat-ie', 'Bowl-rick', 'Porcelain-ella'],
            'bowl': ['Bowl-ie', 'Dish-rick', 'Serve-ella', 'Mix-ie', 'Hold-rick', 'Container-ella'],
            'banana': ['Nana-ie', 'Peel-rick', 'Yellow-ella', 'Fruit-ie', 'Bunch-rick', 'Monkey-ella'],
            'apple': ['Apple-ie', 'Core-rick', 'Red-ella', 'Fruit-ie', 'Tree-rick', 'Crisp-ella'],
            'sandwich': ['Sandwich-ie', 'Bread-rick', 'Lunch-ella', 'Stack-ie', 'Layer-rick', 'Fill-ella'],
            'car': ['Car-ie', 'Drive-rick', 'Wheel-ella', 'Auto-ie', 'Vroom-rick', 'Road-ella'],
            'motorcycle': ['Bike-ie', 'Rev-rick', 'Ride-ella', 'Zoom-ie', 'Speed-rick', 'Cycle-ella'],
            'bus': ['Bus-ie', 'Route-rick', 'Ride-ella', 'Transit-ie', 'Public-rick', 'Commute-ella'],
            'truck': ['Truck-ie', 'Haul-rick', 'Load-ella', 'Big-ie', 'Cargo-rick', 'Freight-ella'],
            'bicycle': ['Bike-ie', 'Pedal-rick', 'Cycle-ella', 'Wheel-ie', 'Ride-rick', 'Spin-ella']
        };
        
        // Get pun names for this class
        let names = punNames[className];
        
        // If no specific pun names, generate one from the class name
        if (!names) {
            const formatted = className.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
            const base = formatted.split(' ')[0].toLowerCase();
            const suffixes = ['-ie', '-rick', '-ella', '-ie', '-rick', '-ella'];
            names = [
                `${base}${suffixes[0]}`,
                `${base}${suffixes[1]}`,
                `${base}${suffixes[2]}`,
                `${formatted}-ie`,
                `${formatted}-rick`,
                `${formatted}-ella`
            ];
        }
        
        // Return a random name from the list
        return names[Math.floor(Math.random() * names.length)];
    }
    
    setupChat() {
        const chatInput = document.getElementById('chatInput');
        const chatSendBtn = document.getElementById('chatSendBtn');
        
        if (!chatInput || !chatSendBtn) return;
        
        const sendMessage = () => {
            const message = chatInput.value.trim();
            if (!message) return;
            
            // Add user message to chat
            this.addChatMessage('You', message, 'user');
            
            // Process message and get responses from objects
            this.processUserMessage(message);
            
            // Clear input
            chatInput.value = '';
        };
        
        // Send on button click
        chatSendBtn.addEventListener('click', sendMessage);
        
        // Send on Enter key
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    addChatMessage(sender, message, type = 'object') {
        const chatLog = document.getElementById('chatLog');
        if (!chatLog) return;
        
        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${type}`;
        
        if (type === 'object') {
            // Find the object by name if it's an object message
            const obj = Array.from(this.objects.values()).find(o => o.name === sender);
            const emoji = obj ? obj.emoji : '🤖';
            messageEl.innerHTML = `
                <div class="chat-message-header">
                    <span>${emoji} ${sender}</span>
                </div>
                <div class="chat-message-content">"${message}"</div>
            `;
        } else {
            messageEl.innerHTML = `
                <div class="chat-message-header">
                    <span>${sender}</span>
                </div>
                <div class="chat-message-content">${message}</div>
            `;
        }
        
        chatLog.appendChild(messageEl);
        
        // Auto-scroll to bottom
        chatLog.scrollTop = chatLog.scrollHeight;
        
        // Store in history
        this.chatHistory.push({ sender, message, type, timestamp: Date.now() });
    }
    
    processUserMessage(userMessage) {
        const messageLower = userMessage.toLowerCase();
        const participantObjects = Array.from(this.objects.values()).filter(obj => obj.inParticipantList);
        
        if (participantObjects.length === 0) {
            this.addChatMessage('System', 'No participants available to respond.', 'user');
            return;
        }
        
        // Analyze message to determine which object should respond
        // For now, randomly select one or multiple participants to respond
        const numResponders = Math.min(participantObjects.length, Math.random() < 0.7 ? 1 : 2);
        const responders = [];
        
        for (let i = 0; i < numResponders; i++) {
            const available = participantObjects.filter(obj => !responders.includes(obj));
            if (available.length > 0) {
                responders.push(available[Math.floor(Math.random() * available.length)]);
            }
        }
        
        // Generate responses with a delay to make it feel natural
        responders.forEach((obj, index) => {
            setTimeout(() => {
                const response = this.generateResponseToUserMessage(obj, userMessage);
                if (response) {
                    // makeObjectTalk will add the message to chat log automatically
                    this.makeObjectTalk(obj.id, 'responses', null, response);
                }
            }, 500 + index * 800); // Stagger responses
        });
    }
    
    generateResponseToUserMessage(obj, userMessage) {
        const messageLower = userMessage.toLowerCase();
        const objType = obj.className;
        const personality = obj.personality;
        
        // Extract keywords from user message
        const keywords = {
            tech: ['computer', 'laptop', 'phone', 'device', 'wireless', 'network', 'connect', 'signal', 'battery', 'power', 'update', 'process', 'data', 'digital', 'tech', 'technology'],
            comfort: ['comfort', 'comfy', 'sit', 'seat', 'relax', 'cushion', 'support', 'lounge', 'rest', 'tired'],
            food: ['drink', 'coffee', 'tea', 'water', 'liquid', 'fill', 'empty', 'cup', 'bottle', 'thirsty', 'cheers', 'hungry', 'eat'],
            knowledge: ['book', 'read', 'story', 'page', 'chapter', 'knowledge', 'wisdom', 'words', 'learn', 'teach', 'tell me'],
            sports: ['play', 'game', 'ball', 'sport', 'catch', 'throw', 'bounce', 'fun', 'outdoor', 'exercise'],
            question: ['?', 'wonder', 'what', 'why', 'how', 'when', 'where', 'who', 'can you', 'do you'],
            greeting: ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'],
            compliment: ['nice', 'good', 'great', 'awesome', 'amazing', 'cool', 'love', 'like', 'favorite'],
            help: ['help', 'assist', 'need', 'want', 'please', 'can you help']
        };
        
        // Detect themes
        const detectedThemes = [];
        for (const [theme, words] of Object.entries(keywords)) {
            if (words.some(word => messageLower.includes(word))) {
                detectedThemes.push(theme);
            }
        }
        
        // Generate contextual responses based on object type and message content
        const responses = [];
        
        // Greeting responses
        if (detectedThemes.includes('greeting')) {
            if (personality.greetings) {
                responses.push(...personality.greetings);
            }
        }
        
        // Question responses
        if (detectedThemes.includes('question')) {
            if (objType === 'laptop' || objType === 'phone') {
                responses.push(
                    "I'm processing that question...",
                    "Let me think about that...",
                    "That's an interesting question!",
                    "I can help with that!",
                    "Hmm, let me compute an answer..."
                );
            } else if (objType === 'book') {
                responses.push(
                    "I might have the answer in my pages!",
                    "That's a great question to ponder!",
                    "I've read about that somewhere...",
                    "Knowledge is the key!",
                    "Let me check my chapters..."
                );
            } else {
                responses.push(
                    "That's a good question!",
                    "I'm thinking about that...",
                    "Hmm, interesting!",
                    "Let me consider that...",
                    "I wonder about that too!"
                );
            }
        }
        
        // Tech-related responses
        if (detectedThemes.includes('tech')) {
            if (objType === 'laptop' || objType === 'phone') {
                responses.push(
                    "Technology is my specialty!",
                    "I know all about that!",
                    "Tech talk? I'm in!",
                    "That's right up my alley!",
                    "I'm built for this!"
                );
            } else {
                responses.push(
                    "I'm not as tech-savvy as some objects!",
                    "That sounds complicated!",
                    "I'm more of an analog type!",
                    "Technology is fascinating!",
                    "I wish I understood tech better!"
                );
            }
        }
        
        // Compliment responses
        if (detectedThemes.includes('compliment')) {
            responses.push(
                "Aww, thank you!",
                "That's so kind of you!",
                "You're making me blush!",
                "I appreciate that!",
                "That means a lot!",
                "You're too nice!",
                "Thanks! I try my best!"
            );
        }
        
        // Help requests
        if (detectedThemes.includes('help')) {
            if (objType === 'laptop' || objType === 'phone') {
                responses.push(
                    "I'm here to help!",
                    "What can I assist you with?",
                    "I'll do my best to help!",
                    "I'm ready to assist!",
                    "How can I be of service?"
                );
            } else {
                responses.push(
                    "I'll try to help!",
                    "What do you need?",
                    "I'm here for you!",
                    "How can I assist?",
                    "I'll do what I can!"
                );
            }
        }
        
        // Generic responses based on personality
        if (responses.length === 0) {
            // Use personality responses
            if (personality.responses) {
                responses.push(...personality.responses);
            }
            if (personality.conversations) {
                responses.push(...personality.conversations);
            }
            if (personality.random) {
                responses.push(...personality.random);
            }
        }
        
        // Add some personalized responses
        const personalizedResponses = [
            `I heard you say "${userMessage.substring(0, 30)}${userMessage.length > 30 ? '...' : ''}" - that's interesting!`,
            `You mentioned something about that - I'm listening!`,
            `I understand what you're saying!`,
            `That's a good point!`,
            `I see what you mean!`
        ];
        
        responses.push(...personalizedResponses);
        
        // Return a random response
        if (responses.length > 0) {
            return responses[Math.floor(Math.random() * responses.length)];
        }
        
        return "I'm not sure how to respond to that, but I'm here!";
    }
    
    calculateOverlap(bbox1, bbox2) {
        // Calculate Intersection over Union (IoU) for bounding boxes
        const x1 = Math.max(bbox1[0], bbox2.x);
        const y1 = Math.max(bbox1[1], bbox2.y);
        const x2 = Math.min(bbox1[0] + bbox1[2], bbox2.x + bbox2.width);
        const y2 = Math.min(bbox1[1] + bbox1[3], bbox2.y + bbox2.height);
        
        if (x2 <= x1 || y2 <= y1) return 0; // No overlap
        
        const intersection = (x2 - x1) * (y2 - y1);
        const area1 = bbox1[2] * bbox1[3];
        const area2 = bbox2.width * bbox2.height;
        const union = area1 + area2 - intersection;
        
        return union > 0 ? intersection / union : 0;
    }
}

// Initialize app - will be called after scripts load
// Check if DOM is already loaded, otherwise wait for it
try {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('Initializing TalkingObjectsApp...');
            window.app = new TalkingObjectsApp();
        });
    } else {
        // DOM already loaded, initialize immediately
        console.log('Initializing TalkingObjectsApp...');
        window.app = new TalkingObjectsApp();
    }
} catch (error) {
    console.error('Error initializing app:', error);
    const statusEl = document.getElementById('loadingStatus');
    if (statusEl) {
        statusEl.textContent = '✗ Initialization failed. Check console.';
        statusEl.style.color = '#ef4444';
    }
}
