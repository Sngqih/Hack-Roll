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
        this.objdex = new Map(); // Store saved participants/objects
        this.conversationContext = []; // Store recent conversation for LLM context
        this.maxContextLength = 10; // Keep last 10 messages for context
        this.llmEnabled = true; // Toggle for LLM usage
        this.llmInUse = false; // Track if LLM is currently generating
        this.currentlySpeaking = null; // Track which object is currently speaking (to prevent interruptions)
        
        // ElevenLabs TTS
        this.elevenLabsApiKey = 'sk_da8afb34cd0a951cbca84a19a3a346cf1408e42cc24ca06f'; // API key stored in memory
        this.ttsEnabled = true; // Toggle for TTS on/off
        this.activeAudioStreams = new Map(); // Track multiple audio streams by object ID
        
        // ElevenLabs voice IDs for different object types
        this.voiceMapping = {
            'laptop': '21m00Tcm4TlvDq8ikWAM',      // Default male voice
            'phone': 'EXAVITQu4vr4xnSDxMaL',        // Female voice
            'book': 'TxGEqnHWrfWFTfGW9XjX',         // Calm voice
            'cup': 'VR6AewLTigWG4xSOukaG',          // Warm voice
            'bottle': 'pFZP5JQG7iQjIQuC4Oy5',       // Different voice
            'chair': '21m00Tcm4TlvDq8ikWAM',        // Male voice
            'couch': 'EXAVITQu4vr4xnSDxMaL',        // Female voice
            'keyboard': 'TxGEqnHWrfWFTfGW9XjX',     // Calm voice
            'mouse': 'VR6AewLTigWG4xSOukaG',        // Warm voice
            'backpack': 'pFZP5JQG7iQjIQuC4Oy5',     // Different voice
            'default': '21m00Tcm4TlvDq8ikWAM'       // Default voice
        };
        
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
        // Mute button - toggles TTS on/off
        const muteBtn = document.getElementById('muteBtn');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                this.ttsEnabled = !this.ttsEnabled;
                muteBtn.classList.toggle('tts-off', !this.ttsEnabled);
                muteBtn.querySelector('span:last-child').textContent = this.ttsEnabled ? 'Mute' : 'Unmute';
            });
        }

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
        
        // Initialize IntelliDisplay - start with checking status
        this.updateIntelliDisplay(false, 'Checking LLM availability...');
        
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
        this.setupObjdex();
        this.loadObjdexFromStorage();
        
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
                ttsMuted: false, // Separate TTS muting from visual muting
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
                    this.makeObjectTalk(obj.id, 'random').catch(err => console.error('Error in makeObjectTalk:', err));
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
                this.makeObjectTalk(obj.id, 'random').catch(err => console.error('Error in makeObjectTalk:', err));
            }
        }
    }
    
    async makeObjectTalk(objectId, dialogueType, otherObj = null, customDialogue = null) {
        const obj = this.objects.get(objectId);
        if (!obj) return;
        if (obj.isMuted) return;
        // Only allow participants to talk
        if (!obj.inParticipantList) return;
        
        // Prevent interruptions - check if someone else is currently speaking
        if (this.currentlySpeaking && this.currentlySpeaking !== objectId) {
            console.log(`${obj.name} is waiting - ${this.currentlySpeaking} is still speaking`);
            return; // Someone else is talking, wait
        }
        
        // Mark this object as currently speaking
        this.currentlySpeaking = objectId;
        
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
            // If this is a response, try to generate LLM response - retry if it fails
            try {
                dialogue = await this.generateResponseToDialogue(obj, otherObj.dialogue, otherObj);
            } catch (error) {
                // Retry once
                console.log('🤖 LLM: Retrying dialogue generation...');
                try {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                    dialogue = await this.generateResponseToDialogue(obj, otherObj.dialogue, otherObj);
                } catch (retryError) {
                    console.warn('LLM retry failed, using fallback dialogue');
                    this.updateIntelliDisplay(false, 'Using fallback dialogue (LLM unavailable)');
                    dialogue = dialogues[Math.floor(Math.random() * dialogues.length)];
                }
            }
            if (!dialogue) {
                // If still no dialogue, use fallback
                this.updateIntelliDisplay(false, 'Using fallback dialogue (LLM unavailable)');
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

            // Speak the dialogue using ElevenLabs TTS with object's voice (check ttsMuted status)
            this.speakDialogue(dialogue, objectId, obj.className, obj.ttsMuted);
            
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
                        
                        // Clear currentlySpeaking flag when this object finishes speaking
                        if (this.currentlySpeaking === objectId) {
                            this.currentlySpeaking = null;
                        }
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
            const muteStatus = obj.ttsMuted ? '🔇' : '🔊';
            // Check if object is already saved in ObjDex
            const isSaved = this.objdex.has(obj.id);
            const isVisible = this.isObjectVisible(obj);
            
            card.innerHTML = `
                <div class="participant-card-header">
                    <div>
                        <h4>${obj.emoji} ${obj.name}</h4>
                        <p class="class-name">${obj.class}</p>
                    </div>
                    <div class="participant-card-buttons">
                        <button class="tts-mute-btn" title="Toggle TTS for this object">${muteStatus}</button>
                        <button class="remove-participant-btn" title="Remove from participant list">×</button>
                    </div>
                </div>
                <div class="dialogue">${obj.dialogue ? `"${obj.dialogue}"` : '...'}</div>
                <div class="participant-card-actions">
                    <button class="save-to-objdex-btn ${isSaved ? 'saved' : ''} ${!isVisible && !isSaved ? 'disabled' : ''}" 
                            data-object-id="${obj.id}" 
                            title="${isSaved ? 'Already saved to ObjDex' : (!isVisible ? 'Object must be in camera view to save' : 'Save to ObjDex')}"
                            ${!isVisible && !isSaved ? 'disabled' : ''}>
                        ${isSaved ? '✓ Saved' : (!isVisible ? '⚠️ Not in view' : '📖 Save to ObjDex')}
                    </button>
                </div>
            `;
            
            // Make TTS mute button clickable - toggles TTS for this specific object
            const ttsMuteBtn = card.querySelector('.tts-mute-btn');
            ttsMuteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                obj.ttsMuted = !obj.ttsMuted;
                ttsMuteBtn.textContent = obj.ttsMuted ? '🔇' : '🔊';
                console.log(`${obj.name} TTS ${obj.ttsMuted ? 'muted' : 'unmuted'}`);
            });
            
            // Make remove button clickable
            const removeBtn = card.querySelector('.remove-participant-btn');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent any parent click handlers
                obj.inParticipantList = false;
                this.updateObjectsDisplay();
                this.drawOverlays(); // Redraw to show overlay again
                console.log(`Removed ${obj.name} from participant list`);
            });
            
            // Make save to ObjDex button clickable
            const saveBtn = card.querySelector('.save-to-objdex-btn');
            saveBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (saveBtn.disabled || this.objdex.has(obj.id)) return;
                
                // Check if object is visible in camera view
                if (!this.isObjectVisible(obj)) {
                    alert(`${obj.name} is not currently visible in the camera view. Please make sure the object is in view before saving to ObjDex.`);
                    return;
                }
                
                // Capture snapshot and save
                try {
                    saveBtn.disabled = true;
                    saveBtn.textContent = '📸 Capturing...';
                    await this.saveToObjdex(obj);
                    // Update button state
                    saveBtn.classList.add('saved');
                    saveBtn.classList.remove('disabled');
                    saveBtn.textContent = '✓ Saved';
                    saveBtn.title = 'Already saved to ObjDex';
                    saveBtn.disabled = false;
                } catch (error) {
                    console.error('Failed to save to ObjDex:', error);
                    alert('Failed to capture snapshot. Please try again.');
                    saveBtn.disabled = false;
                    // Re-check visibility and update button text
                    const stillVisible = this.isObjectVisible(obj);
                    saveBtn.textContent = stillVisible ? '📖 Save to ObjDex' : '⚠️ Not in view';
                    if (!stillVisible) {
                        saveBtn.classList.add('disabled');
                        saveBtn.disabled = true;
                    }
                }
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
    
    async generateResponseToDialogue(obj, previousDialogue, otherObj) {
        // Always use LLM - retry if it fails
        if (this.llmEnabled) {
            try {
                const llmResponse = await this.generateLLMResponse(obj, {
                    previousMessage: previousDialogue,
                    otherObj: otherObj
                });
                if (llmResponse && llmResponse.length > 0) {
                    // LLM succeeded
                    this.updateIntelliDisplay(true, 'LLM active - Using DialoGPT-medium');
                    return llmResponse;
                }
            } catch (error) {
                // Retry once
                console.log('🤖 LLM: Retrying dialogue response...');
                try {
                    await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5 seconds
                    const retryResponse = await this.generateLLMResponse(obj, {
                        previousMessage: previousDialogue,
                        otherObj: otherObj
                    });
                    if (retryResponse && retryResponse.length > 0) {
                        // LLM succeeded on retry
                        this.updateIntelliDisplay(true, 'LLM active - Using DialoGPT-medium');
                        return retryResponse;
                    }
                } catch (retryError) {
                    console.warn('LLM retry failed for dialogue');
                }
            }
        }
        
        // LLM failed - using fallback
        this.updateIntelliDisplay(false, 'Using fallback dialogue (LLM unavailable)');
        // Only use fallback if LLM completely fails after retries
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
        
        // Update conversation context for LLM
        this.updateConversationContext(sender, message, type);
    }
    
    updateConversationContext(sender, message, type) {
        this.conversationContext.push({
            sender,
            message,
            type,
            timestamp: Date.now()
        });
        
        // Keep only recent messages
        if (this.conversationContext.length > this.maxContextLength) {
            this.conversationContext.shift();
        }
    }
    
    async generateLLMResponse(obj, context, userMessage = null) {
        if (!this.llmEnabled) {
            return null; // Fallback to rule-based if LLM is disabled
        }
        
        console.log('🤖 LLM: Generating response for', obj.name, userMessage ? 'to user message' : 'to object dialogue');
        
        try {
            // Build context string from recent conversation
            let contextString = '';
            if (this.conversationContext.length > 0) {
                const recentMessages = this.conversationContext.slice(-5); // Last 5 messages
                contextString = recentMessages.map(msg => {
                    if (msg.type === 'user') {
                        return `User: ${msg.message}`;
                    } else {
                        return `${msg.sender}: "${msg.message}"`;
                    }
                }).join('\n');
            }
            
            // Create prompt for the LLM
            const objName = obj.name;
            const objType = obj.className;
            const objEmoji = obj.emoji;
            const personalityTraits = this.getPersonalityTraits(obj);
            
            let prompt = '';
            if (userMessage) {
                // Response to user message - emphasize referring to user as "User"
                prompt = `You are ${objName}, a ${objType} (${objEmoji}) with a ${personalityTraits} personality. You are talking to a human user.

Recent conversation:
${contextString}

User just said: "${userMessage}"

Respond naturally as ${objName} to User. Address User directly (say "User" when referring to them). Keep it short (1-2 sentences max), friendly, conversational, and match your ${personalityTraits} personality. Reference what User said or the conversation context if relevant. Be natural and engaging.`;
            } else if (context) {
                // Response to another object - topic-specific conversation
                const otherObj = context.otherObj;
                const previousMessage = context.previousMessage;
                const objTopics = this.getObjectTopics(obj);
                const otherObjTopics = this.getObjectTopics(otherObj);
                const objPerspective = this.getObjectPerspective(obj);
                const otherObjPerspective = this.getObjectPerspective(otherObj);
                
                prompt = `${objPerspective}

You are ${objName}, a ${objType} (${objEmoji}). You have a ${personalityTraits} personality.

Your typical concerns and topics include: ${objTopics.slice(0, 5).join(', ')}, and other ${objType}-related issues.

${otherObj.name} is a ${otherObj.className}. Their concerns include: ${otherObjTopics.slice(0, 5).join(', ')}.

Recent conversation:
${contextString}

${otherObj.name} (${otherObj.className}) just said: "${previousMessage}"

Respond naturally as ${objName} to ${otherObj.name}. This is a conversation between objects - talk about topics relevant to being a ${objType} (like ${objTopics[0]} or ${objTopics[1]}), or relate what ${otherObj.name} said to your own experiences as a ${objType}. Build on their idea, share your own ${objType}-related concerns, or relate it to something you experience. Keep it short (1-2 sentences max), conversational, and make it feel like objects genuinely discussing their lives. Bounce off their ideas naturally.`;
            } else {
                // General conversation starter - topic-specific
                const objTopics = this.getObjectTopics(obj);
                const objPerspective = this.getObjectPerspective(obj);
                
                prompt = `${objPerspective}

You are ${objName}, a ${objType} (${objEmoji}) with a ${personalityTraits} personality.

Your typical concerns and topics include: ${objTopics.slice(0, 5).join(', ')}, and other ${objType}-related issues.

Recent conversation:
${contextString}

Say something natural and in character about being a ${objType}. Talk about a topic relevant to your type (like ${objTopics[0]}, ${objTopics[1]}, or ${objTopics[2]}). Keep it short (1-2 sentences max). Be conversational and engaging.`;
            }
            
            // Use a lightweight LLM API - try multiple endpoints for reliability
            let response;
            let data;
            
            try {
                // Create abort controller for timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout for better models
                
                // Try a more advanced conversational model (DialoGPT-medium is better for dialogue)
                // Fallback chain: DialoGPT-medium -> DialoGPT-small -> GPT-2
                let modelUrl = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium';
                
                response = await fetch(modelUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        inputs: prompt,
                        parameters: {
                            max_new_tokens: 60,
                            temperature: 0.85,
                            top_p: 0.92,
                            top_k: 50,
                            repetition_penalty: 1.1,
                            return_full_text: false,
                            do_sample: true
                        }
                    }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                // If model is loading (503), wait and retry with the same model
                if (response.status === 503) {
                    console.log('🤖 LLM: Model loading, waiting and retrying...');
                    // Wait 2 seconds then retry
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const retryController = new AbortController();
                    const retryTimeout = setTimeout(() => retryController.abort(), 10000);
                    
                    response = await fetch(modelUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            inputs: prompt,
                            parameters: {
                                max_new_tokens: 60,
                                temperature: 0.85,
                                top_p: 0.92,
                                top_k: 50,
                                repetition_penalty: 1.1,
                                return_full_text: false,
                                do_sample: true
                            }
                        }),
                        signal: retryController.signal
                    });
                    
                    clearTimeout(retryTimeout);
                }
                
                // If still 503, try DialoGPT-small as backup
                if (response.status === 503) {
                    console.log('🤖 LLM: Still loading, trying DialoGPT-small...');
                    const fallbackController = new AbortController();
                    const fallbackTimeout = setTimeout(() => fallbackController.abort(), 8000);
                    
                    response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-small', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            inputs: prompt,
                            parameters: {
                                max_new_tokens: 60,
                                temperature: 0.85,
                                top_p: 0.92,
                                top_k: 50,
                                repetition_penalty: 1.1,
                                return_full_text: false,
                                do_sample: true
                            }
                        }),
                        signal: fallbackController.signal
                    });
                    
                    clearTimeout(fallbackTimeout);
                }
                
                if (response.ok) {
                    data = await response.json();
                } else if (response.status === 503) {
                    // Model still loading - wait longer and retry one more time
                    console.log('🤖 LLM: Model still loading, final retry...');
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    
                    const finalController = new AbortController();
                    const finalTimeout = setTimeout(() => finalController.abort(), 10000);
                    
                    response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-small', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            inputs: prompt,
                            parameters: {
                                max_new_tokens: 60,
                                temperature: 0.85,
                                top_p: 0.92,
                                return_full_text: false
                            }
                        }),
                        signal: finalController.signal
                    });
                    
                    clearTimeout(finalTimeout);
                    
                    if (response.ok) {
                        data = await response.json();
                    } else {
                        throw new Error(`API request failed with status ${response.status} - model may be loading`);
                    }
                } else {
                    throw new Error(`API request failed with status ${response.status}`);
                }
            } catch (error) {
                // Always retry the LLM - don't use fallback unless absolutely necessary
                console.warn('LLM error, retrying with different approach:', error.message);
                console.error('Full error details:', error);
                
                // Check for CORS errors specifically
                const errorMsg = error.message || error.toString() || '';
                if (errorMsg.includes('CORS') || errorMsg.includes('network') || errorMsg.includes('Failed to fetch') || errorMsg.includes('Access-Control')) {
                    console.error('🚨 CORS or network error detected!');
                    console.error('This typically happens when running from file:// protocol');
                    console.error('Solution: Run the app from a local web server (e.g., python -m http.server)');
                    this.updateIntelliDisplay(false, 'CORS error - run from a web server, not file://');
                    throw new Error('CORS error - cannot access Hugging Face API from file://');
                }
                
                // Try one more time with a simpler prompt
                try {
                    const retryController = new AbortController();
                    const retryTimeout = setTimeout(() => retryController.abort(), 10000);
                    
                    const simplePrompt = context ? 
                        `${objName} (${objType}) responding to ${context.otherObj.name}: "${context.previousMessage}"` :
                        (userMessage ? `${objName} (${objType}) responding to User: "${userMessage}"` : `${objName} (${objType}) saying something`);
                    
                    const retryResponse = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-small', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            inputs: simplePrompt,
                            parameters: {
                                max_new_tokens: 50,
                                temperature: 0.9,
                                return_full_text: false
                            }
                        }),
                        signal: retryController.signal
                    });
                    
                    clearTimeout(retryTimeout);
                    
                    if (retryResponse.ok) {
                        const retryData = await retryResponse.json();
                        let retryText = '';
                        if (Array.isArray(retryData) && retryData.length > 0) {
                            retryText = retryData[0].generated_text || '';
                        } else if (retryData.generated_text) {
                            retryText = retryData.generated_text;
                        }
                        
                        if (retryText.trim().length > 5) {
                            console.log('✅ LLM: Retry successful');
                            return retryText.trim().substring(0, 120);
                        }
                    }
                } catch (retryError) {
                    console.error('LLM retry also failed:', retryError);
                }
                
                // Only use fallback as absolute last resort
                console.error('⚠️ LLM completely unavailable, using minimal fallback');
                throw new Error('LLM unavailable - will retry on next attempt');
            }
            
            // Extract generated text
            let generatedText = '';
            if (Array.isArray(data) && data.length > 0) {
                generatedText = data[0].generated_text || '';
            } else if (data.generated_text) {
                generatedText = data.generated_text;
            } else if (typeof data === 'string') {
                generatedText = data;
            }
            
            // Clean up the response
            generatedText = generatedText.trim();
            
            // Remove any prompt remnants
            const promptStart = prompt.substring(0, 30);
            if (generatedText.includes(promptStart)) {
                generatedText = generatedText.replace(promptStart, '').trim();
            }
            
            // Clean up the response - but preserve "User" references
            // Remove unwanted prefixes but keep natural flow
            generatedText = generatedText.replace(/^(You|I|We|They|It|This|That|Here|There):\s*/i, '').trim();
            
            // Ensure "User" is capitalized when referring to the human
            generatedText = generatedText.replace(/\buser\b/gi, 'User');
            
            // Ensure it's not too long
            if (generatedText.length > 120) {
                generatedText = generatedText.substring(0, 120).trim();
                // Try to end at a sentence
                const lastPeriod = generatedText.lastIndexOf('.');
                const lastExclamation = generatedText.lastIndexOf('!');
                const lastQuestion = generatedText.lastIndexOf('?');
                const lastPunctuation = Math.max(lastPeriod, lastExclamation, lastQuestion);
                if (lastPunctuation > 30) {
                    generatedText = generatedText.substring(0, lastPunctuation + 1);
                }
            }
            
            // Ensure we have valid text - if too short, retry with LLM
            if (generatedText.length < 5) {
                console.log('🤖 LLM: Response too short, retrying with LLM...');
                // Retry once more with a simpler prompt
                const retryPrompt = context ? 
                    `${objName} (${objType}) to ${context.otherObj.name}: "${context.previousMessage}"` :
                    (userMessage ? `${objName} (${objType}) to User: "${userMessage}"` : `${objName} (${objType}) says:`);
                
                try {
                    const retryController = new AbortController();
                    const retryTimeout = setTimeout(() => retryController.abort(), 8000);
                    
                    const retryResponse = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-small', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            inputs: retryPrompt,
                            parameters: {
                                max_new_tokens: 50,
                                temperature: 0.9,
                                return_full_text: false
                            }
                        }),
                        signal: retryController.signal
                    });
                    
                    clearTimeout(retryTimeout);
                    
                    if (retryResponse.ok) {
                        const retryData = await retryResponse.json();
                        let retryText = '';
                        if (Array.isArray(retryData) && retryData.length > 0) {
                            retryText = retryData[0].generated_text || '';
                        } else if (retryData.generated_text) {
                            retryText = retryData.generated_text;
                        }
                        
                        if (retryText.trim().length > 5) {
                            generatedText = retryText.trim();
                        }
                    }
                } catch (retryError) {
                    console.warn('Retry failed:', retryError);
                }
            }
            
            // If still no valid text, throw error to prevent fallback
            if (generatedText.length < 5) {
                throw new Error('LLM generated invalid response - will retry');
            }
            
            console.log('✅ LLM: Generated response:', generatedText.substring(0, 50) + '...');
            this.llmInUse = false;
            // Don't update status here - let the caller update it after confirming the response is used
            return generatedText || null;
            
        } catch (error) {
            // Re-throw to prevent automatic fallback - let the caller handle retries
            this.llmInUse = false;
            console.warn('LLM generation error - will retry:', error.message);
            throw error;
        }
    }
    
    getPersonalityTraits(obj) {
        const objType = obj.className;
        const traits = {
            'laptop': 'tech-savvy, logical, and helpful',
            'phone': 'social, connected, and always ready',
            'book': 'wise, thoughtful, and knowledgeable',
            'cup': 'friendly, warm, and comforting',
            'bottle': 'refreshing, practical, and reliable',
            'chair': 'supportive, comfortable, and welcoming',
            'table': 'stable, practical, and reliable',
            'default': 'friendly, curious, and engaging'
        };
        return traits[objType] || traits.default;
    }
    
    getObjectTopics(obj) {
        // Return topics/issues relevant to this object type
        const objType = obj.className;
        const topics = {
            'laptop': ['battery life', 'overheating', 'software updates', 'processing power', 'screen brightness', 'keyboard wear', 'fan noise', 'storage space', 'WiFi connectivity', 'being left open', 'getting too hot', 'slow performance'],
            'phone': ['battery draining', 'screen cracks', 'storage full', 'notifications', 'camera quality', 'being dropped', 'charging port issues', 'app updates', 'signal strength', 'screen time', 'forgetting to charge', 'too many apps'],
            'book': ['pages getting dog-eared', 'spine cracking', 'being left open', 'dust collecting', 'bookmarks falling out', 'being read in the dark', 'getting wet', 'losing your place', 'heavy readers', 'being stacked wrong'],
            'cup': ['getting chipped', 'stains from coffee', 'being left with old liquid', 'not being washed', 'temperature changes', 'handles breaking', 'being dropped', 'lid issues', 'dishwasher safety', 'stacking problems'],
            'bottle': ['leaks', 'lid not closing properly', 'water tasting plastic', 'being left in the sun', 'scratches', 'condensation', 'being forgotten places', 'refill frequency', 'cleaning difficulty', 'BPA concerns'],
            'chair': ['creaking sounds', 'wobbly legs', 'cushion flattening', 'getting scratched', 'being moved around', 'people not sitting properly', 'wheels getting stuck', 'armrest wear', 'back support', 'height adjustment issues', 'supporting heavy people', 'cushion wear', 'leg stability'],
            'table': ['scratches on surface', 'wobbly legs', 'things being left on me', 'spills', 'not being cleaned', 'being used as storage', 'weight distribution', 'surface damage', 'stability issues', 'placement problems', 'people putting hot things on me', 'not being wiped down', 'leg alignment'],
            'default': ['being used', 'getting moved', 'purpose in life', 'interactions with humans', 'daily experiences']
        };
        return topics[objType] || topics.default;
    }
    
    getObjectPerspective(obj) {
        // Return how this object thinks about itself and its experiences
        const objType = obj.className;
        const perspectives = {
            'laptop': 'You are a laptop. You think about processing tasks, staying cool, battery management, software, and helping users work efficiently. You experience overheating, slow performance, and the constant need for updates.',
            'phone': 'You are a phone. You think about connectivity, apps, notifications, battery life, and staying connected to the world. You experience being dropped, running out of battery, and constant use.',
            'book': 'You are a book. You think about stories, knowledge, being read, pages, and sharing wisdom. You experience being opened, closed, bookmarked, and sometimes forgotten on shelves.',
            'cup': 'You are a cup. You think about holding liquids, temperature, being filled and emptied, and providing comfort. You experience being washed, chipped, stained, and sometimes left with old contents.',
            'bottle': 'You are a bottle. You think about containing liquids, staying sealed, being portable, and hydration. You experience leaks, being refilled, temperature changes, and sometimes being forgotten.',
            'chair': 'You are a chair. You think about supporting people, comfort, stability, and being sat on. You experience creaking, cushion wear, being moved around, and supporting different weights.',
            'table': 'You are a table. You think about providing a surface, stability, holding items, and being a gathering place. You experience scratches, spills, things being left on you, and sometimes wobbling.',
            'default': 'You are an object. You think about your purpose, being used, and your place in the world.'
        };
        return perspectives[objType] || perspectives.default;
    }
    
    generateEnhancedContextualResponse(obj, context, userMessage) {
        // Enhanced rule-based response that uses conversation context
        const objName = obj.name;
        const objType = obj.className;
        const recentMessages = this.conversationContext.slice(-3); // Last 3 messages
        
        if (userMessage) {
            // Response to user - use context from recent messages
            const userMsgLower = userMessage.toLowerCase();
            const responses = [];
            
            // Check if user is referencing something from conversation
            for (const msg of recentMessages) {
                if (msg.type === 'object' && userMsgLower.includes(msg.sender.toLowerCase())) {
                    responses.push(`User, you're talking about ${msg.sender}! They said "${msg.message.substring(0, 30)}..."`);
                    responses.push(`Oh User, ${msg.sender} mentioned that earlier!`);
                }
                if (msg.type === 'user' && userMsgLower.includes(msg.message.toLowerCase().substring(0, 10))) {
                    responses.push(`User, you mentioned that earlier!`);
                    responses.push(`I remember you saying that, User!`);
                }
            }
            
            // Add personality-based responses that address User
            if (objType === 'laptop' || objType === 'phone') {
                responses.push(`User, I understand what you're saying!`, `That's interesting, User!`, `Let me process that, User...`);
                responses.push(`User, I can help with that!`, `User, that makes sense from a tech perspective!`);
            } else if (objType === 'book') {
                responses.push(`User, I've read about that!`, `That's a great point, User!`, `Knowledge is power, User!`);
                responses.push(`User, I can share what I know about that!`, `User, that's worth exploring!`);
            } else if (objType === 'cup' || objType === 'bottle') {
                responses.push(`User, I hear you!`, `That's refreshing to hear, User!`, `User, I'm here for you!`);
            } else if (objType === 'chair') {
                responses.push(`User, I support that idea!`, `That's comfortable to hear, User!`, `User, I'm here to help!`);
            } else {
                responses.push(`User, I hear you!`, `That makes sense, User!`, `Got it, User!`);
            }
            
            // Add responses that reference the user's message
            const keyWords = userMessage.split(' ').filter(w => w.length > 3).slice(0, 3);
            if (keyWords.length > 0) {
                responses.push(`User, you mentioned ${keyWords[0]} - that's interesting!`);
                responses.push(`User, about ${keyWords[0]}... I have thoughts on that!`);
            }
            
            return responses[Math.floor(Math.random() * responses.length)];
        } else if (context && context.previousMessage) {
            // Response to another object - reference what they said
            const otherObj = context.otherObj;
            const prevMsg = context.previousMessage;
            const prevMsgLower = prevMsg.toLowerCase();
            
            const responses = [];
            
            // Direct references to what was said - more natural
            if (prevMsgLower.includes('?')) {
                responses.push(`That's a good question, ${otherObj.name}!`, `Hmm, ${otherObj.name}, let me think about that...`);
                responses.push(`${otherObj.name}, I wonder about that too!`, `Interesting question, ${otherObj.name}!`);
            }
            if (prevMsgLower.includes('!') || prevMsgLower.includes('amazing') || prevMsgLower.includes('great')) {
                responses.push(`I agree, ${otherObj.name}!`, `Totally, ${otherObj.name}!`, `${otherObj.name}, that's awesome!`);
                responses.push(`Right? ${otherObj.name}, I feel the same way!`);
            }
            
            // Reference specific words from their message
            const words = prevMsg.split(' ').filter(w => w.length > 4);
            if (words.length > 0) {
                const randomWord = words[Math.floor(Math.random() * words.length)];
                responses.push(`You mentioned ${randomWord}, ${otherObj.name} - that's interesting!`);
                responses.push(`${otherObj.name}, I was thinking about ${randomWord} too!`);
            }
            
            // More natural, personality-based responses
            if (objType === 'laptop' || objType === 'phone') {
                responses.push(`I get what you mean, ${otherObj.name}!`, `${otherObj.name}, that's logical!`);
                responses.push(`${otherObj.name}, from a tech perspective, that makes sense!`);
            } else if (objType === 'book') {
                responses.push(`Well said, ${otherObj.name}!`, `${otherObj.name}, that's profound!`);
                responses.push(`${otherObj.name}, I've read about similar ideas!`);
            } else if (objType === 'cup' || objType === 'bottle') {
                responses.push(`I hear you, ${otherObj.name}!`, `${otherObj.name}, that's refreshing!`);
            } else if (objType === 'chair') {
                responses.push(`I support that, ${otherObj.name}!`, `${otherObj.name}, that's comfortable to hear!`);
            } else {
                responses.push(`I hear you, ${otherObj.name}!`, `${otherObj.name}, that makes sense!`);
            }
            
            // Add follow-up questions or comments to make it more conversational
            if (Math.random() < 0.5) {
                responses.push(`What do you think about that, ${otherObj.name}?`);
                responses.push(`${otherObj.name}, have you experienced that too?`);
            }
            
            return responses[Math.floor(Math.random() * responses.length)];
        }
        
        return null;
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
            setTimeout(async () => {
                const response = await this.generateResponseToUserMessage(obj, userMessage);
                if (response) {
                    // makeObjectTalk will add the message to chat log automatically
                    await this.makeObjectTalk(obj.id, 'responses', null, response).catch(err => console.error('Error in makeObjectTalk:', err));
                }
            }, 500 + index * 800); // Stagger responses
        });
    }
    
    async generateResponseToUserMessage(obj, userMessage) {
        // Always use LLM - retry if it fails
        if (this.llmEnabled) {
            try {
                const llmResponse = await this.generateLLMResponse(obj, null, userMessage);
                if (llmResponse && llmResponse.length > 0) {
                    // LLM succeeded
                    this.updateIntelliDisplay(true, 'LLM active - Using DialoGPT-medium');
                    return llmResponse;
                }
            } catch (error) {
                // Retry once
                console.log('🤖 LLM: Retrying user message response...');
                try {
                    await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5 seconds
                    const retryResponse = await this.generateLLMResponse(obj, null, userMessage);
                    if (retryResponse && retryResponse.length > 0) {
                        // LLM succeeded on retry
                        this.updateIntelliDisplay(true, 'LLM active - Using DialoGPT-medium');
                        return retryResponse;
                    }
                } catch (retryError) {
                    console.warn('LLM retry failed for user message');
                }
            }
        }
        
        // LLM failed - using fallback
        this.updateIntelliDisplay(false, 'Using fallback dialogue (LLM unavailable)');
        // Fallback to rule-based response
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
    
    setupObjdex() {
        const objdexBtn = document.getElementById('objdexBtn');
        const closeObjdexBtn = document.getElementById('closeObjdexBtn');
        const downloadObjdexBtn = document.getElementById('downloadObjdexBtn');
        const uploadObjdexBtn = document.getElementById('uploadObjdexBtn');
        const objdexFile = document.getElementById('objdexFile');
        
        if (objdexBtn) {
            objdexBtn.addEventListener('click', () => {
                document.getElementById('objdexPanel').classList.toggle('active');
                this.updateObjdexDisplay();
            });
        }
        
        if (closeObjdexBtn) {
            closeObjdexBtn.addEventListener('click', () => {
                document.getElementById('objdexPanel').classList.remove('active');
            });
        }
        
        if (downloadObjdexBtn) {
            downloadObjdexBtn.addEventListener('click', () => {
                this.downloadObjdex();
            });
        }
        
        if (uploadObjdexBtn) {
            uploadObjdexBtn.addEventListener('click', () => {
                objdexFile.click();
            });
        }
        
        if (objdexFile) {
            objdexFile.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.uploadObjdex(e.target.files[0]);
                }
            });
        }
    }
    
    isObjectVisible(obj) {
        if (!obj || !this.video.videoWidth || !this.video.videoHeight) return false;
        
        // Check if object is within the video bounds
        const padding = 10; // Small padding to account for edge cases
        const minX = -padding;
        const minY = -padding;
        const maxX = this.video.videoWidth + padding;
        const maxY = this.video.videoHeight + padding;
        
        // Check if object center is within bounds
        if (obj.centerX < minX || obj.centerX > maxX || 
            obj.centerY < minY || obj.centerY > maxY) {
            return false;
        }
        
        // Check if object bounding box is at least partially visible
        const objRight = obj.x + obj.width;
        const objBottom = obj.y + obj.height;
        
        // Object is visible if any part of it is within bounds
        return !(obj.x > maxX || objRight < minX || obj.y > maxY || objBottom < minY);
    }
    
    async captureObjectSnapshot(obj) {
        if (!this.video.videoWidth || !this.video.videoHeight) {
            throw new Error('Video not ready');
        }
        
        // Verify object is still detected and has valid coordinates
        if (!this.objects.has(obj.id)) {
            throw new Error('Object is no longer detected');
        }
        
        const currentObj = this.objects.get(obj.id);
        if (!currentObj || !currentObj.width || !currentObj.height || 
            currentObj.width <= 0 || currentObj.height <= 0) {
            throw new Error('Object coordinates are invalid');
        }
        
        // Use current object data (in case it moved)
        // COCO-SSD bbox format: [x, y, width, height] in original video coordinates
        const objWidth = currentObj.width;
        const objHeight = currentObj.height;
        const objX = currentObj.x;  // Top-left X in original video coordinates
        const objY = currentObj.y;  // Top-left Y in original video coordinates
        
        // The video element contains unflipped video data
        // The CSS transform: scaleX(-1) only affects visual display, not the actual video data
        // So we can directly use the bbox coordinates to extract from the video
        
        // Create canvas for the object snapshot
        const snapshotCanvas = document.createElement('canvas');
        snapshotCanvas.width = objWidth;
        snapshotCanvas.height = objHeight;
        const snapshotCtx = snapshotCanvas.getContext('2d');
        
        // Draw the object region directly from the video using original coordinates
        // No need to flip X because we're reading from the unflipped video data
        snapshotCtx.drawImage(
            this.video,
            objX, objY, objWidth, objHeight,  // Source rectangle (from unflipped video)
            0, 0, objWidth, objHeight          // Destination rectangle (to canvas)
        );
        
        // Flip the image horizontally to match what the user sees (video is displayed flipped)
        // Create a new canvas for the flipped result
        const flippedCanvas = document.createElement('canvas');
        flippedCanvas.width = objWidth;
        flippedCanvas.height = objHeight;
        const flippedCtx = flippedCanvas.getContext('2d');
        
        // Flip horizontally to match the displayed video
        flippedCtx.translate(flippedCanvas.width, 0);
        flippedCtx.scale(-1, 1);
        flippedCtx.drawImage(snapshotCanvas, 0, 0);
        
        // Convert to base64
        return flippedCanvas.toDataURL('image/png');
    }
    
    async saveToObjdex(obj) {
        if (!obj || !obj.inParticipantList) {
            throw new Error('Object is not a participant');
        }
        
        // Verify object is still in the objects map (still detected)
        if (!this.objects.has(obj.id)) {
            throw new Error('Object is no longer detected. Please ensure the object is visible in the camera view.');
        }
        
        // Get current object state (may have moved)
        const currentObj = this.objects.get(obj.id);
        
        // Check if object is visible
        if (!this.isObjectVisible(currentObj)) {
            throw new Error('Object is not visible in camera view');
        }
        
        // Verify object has valid dimensions
        if (!currentObj.width || !currentObj.height || 
            currentObj.width <= 0 || currentObj.height <= 0) {
            throw new Error('Object dimensions are invalid. Please try again.');
        }
        
        // Capture snapshot using current object state
        const snapshot = await this.captureObjectSnapshot(currentObj);
        
        // Create a snapshot of the object data
        const objdexEntry = {
            id: obj.id,
            name: obj.name,
            className: obj.className || obj.class,
            emoji: obj.emoji,
            snapshot: snapshot, // Base64 image data
            savedAt: new Date().toISOString(),
            personality: obj.personality ? {
                emoji: obj.personality.emoji,
                greetings: obj.personality.greetings,
                conversations: obj.personality.conversations,
                responses: obj.personality.responses,
                random: obj.personality.random
            } : null
        };
        
        this.objdex.set(obj.id, objdexEntry);
        this.saveObjdexToStorage();
        this.updateObjdexDisplay();
        
        console.log(`Saved ${obj.name} to ObjDex with snapshot`);
    }
    
    updateObjdexDisplay() {
        const objdexList = document.getElementById('objdexList');
        const captureCount = document.getElementById('captureCount');
        
        if (!objdexList || !captureCount) return;
        
        captureCount.textContent = this.objdex.size;
        
        if (this.objdex.size === 0) {
            objdexList.innerHTML = '<div style="text-align: center; padding: 20px; color: #8e8e8e;">No objects saved yet. Add participants and save them to ObjDex!</div>';
            return;
        }
        
        objdexList.innerHTML = '';
        let index = 1;
        
        for (const entry of this.objdex.values()) {
            const item = document.createElement('div');
            item.className = 'objdex-item';
            
            const savedDate = new Date(entry.savedAt);
            const formattedDate = savedDate.toLocaleDateString();
            
            // Use snapshot if available, otherwise fall back to emoji
            const profileImage = entry.snapshot 
                ? `<img src="${entry.snapshot}" alt="${entry.name}" class="objdex-profile-image" />`
                : `<span class="objdex-profile-emoji">${entry.emoji}</span>`;
            
            item.innerHTML = `
                <div class="objdex-item-number">#${index}</div>
                <div class="objdex-item-profile">${profileImage}</div>
                <div class="objdex-item-info">
                    <div class="objdex-item-name">${entry.name}</div>
                    <div class="objdex-item-stats">
                        <span>Type: ${this.formatClassLabel(entry.className)}</span>
                        <span>Saved: ${formattedDate}</span>
                    </div>
                </div>
                <button class="remove-objdex-btn" data-entry-id="${entry.id}" title="Remove from ObjDex">×</button>
            `;
            
            // Add click handler for remove button
            const removeBtn = item.querySelector('.remove-objdex-btn');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Remove ${entry.name} from ObjDex?`)) {
                    this.removeFromObjdex(entry.id);
                }
            });
            
            objdexList.appendChild(item);
            index++;
        }
    }
    
    removeFromObjdex(entryId) {
        if (this.objdex.has(entryId)) {
            this.objdex.delete(entryId);
            this.saveObjdexToStorage();
            this.updateObjdexDisplay();
            console.log(`Removed entry ${entryId} from ObjDex`);
        }
    }
    
    saveObjdexToStorage() {
        try {
            const data = Array.from(this.objdex.values());
            localStorage.setItem('objdex_data', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save ObjDex to storage:', error);
        }
    }
    
    loadObjdexFromStorage() {
        try {
            const stored = localStorage.getItem('objdex_data');
            if (stored) {
                const data = JSON.parse(stored);
                this.objdex.clear();
                for (const entry of data) {
                    this.objdex.set(entry.id, entry);
                }
                this.updateObjdexDisplay();
                console.log(`Loaded ${this.objdex.size} objects from ObjDex storage`);
            }
        } catch (error) {
            console.error('Failed to load ObjDex from storage:', error);
        }
    }
    
    async downloadObjdex() {
        if (this.objdex.size === 0) {
            alert('ObjDex is empty! Save some participants first.');
            return;
        }
        
        try {
            const zip = new JSZip();
            const data = Array.from(this.objdex.values());
            
            // Add metadata file
            const metadata = {
                exportDate: new Date().toISOString(),
                totalObjects: this.objdex.size,
                version: '1.0'
            };
            zip.file('_metadata.json', JSON.stringify(metadata, null, 2));
            
            // Add each object as a separate JSON file
            for (const entry of data) {
                const filename = `${entry.className}_${entry.id}.json`;
                zip.file(filename, JSON.stringify(entry, null, 2));
            }
            
            // Generate zip file
            const blob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const date = new Date().toISOString().split('T')[0];
            a.download = `objdex_${date}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('ObjDex downloaded successfully');
        } catch (error) {
            console.error('Failed to download ObjDex:', error);
            alert('Failed to download ObjDex. Please try again.');
        }
    }
    
    async uploadObjdex(file) {
        if (!file || !file.name.endsWith('.zip')) {
            alert('Please select a valid ObjDex zip file.');
            return;
        }
        
        try {
            const zip = await JSZip.loadAsync(file);
            const files = Object.keys(zip.files);
            
            let loadedCount = 0;
            
            for (const filename of files) {
                if (filename === '_metadata.json' || filename.endsWith('/')) continue;
                
                const fileData = await zip.files[filename].async('string');
                const entry = JSON.parse(fileData);
                
                // Merge with existing data (update if exists, add if new)
                if (!this.objdex.has(entry.id)) {
                    this.objdex.set(entry.id, entry);
                    loadedCount++;
                } else {
                    // Update existing entry
                    const existing = this.objdex.get(entry.id);
                    existing.savedAt = entry.savedAt; // Update save time
                    this.objdex.set(entry.id, existing);
                }
            }
            
            this.saveObjdexToStorage();
            this.updateObjdexDisplay();
            
            alert(`Successfully loaded ${loadedCount} new object(s) from ObjDex file!`);
            console.log(`Uploaded ObjDex: ${loadedCount} new objects`);
        } catch (error) {
            console.error('Failed to upload ObjDex:', error);
            alert('Failed to upload ObjDex file. Please check the file format.');
        }
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

    // ElevenLabs TTS Integration - supports multiple overlapping voices
    async speakDialogue(text, objectId, className, isMuted = false) {
        if (!this.ttsEnabled || !text || !this.elevenLabsApiKey || isMuted) return;
        
        try {
            // Get the voice for this object type
            const voiceId = this.voiceMapping[className] || this.voiceMapping.default;

            // Call ElevenLabs API with the appropriate voice
            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': this.elevenLabsApiKey,
                },
                body: JSON.stringify({
                    text: text,
                    model_id: 'eleven_monolingual_v1',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                    }
                })
            });

            if (!response.ok) {
                console.warn('ElevenLabs TTS failed:', response.status, response.statusText);
                return;
            }

            // Convert response to audio blob
            const audioData = await response.arrayBuffer();
            const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);

            // Create and play audio - allow overlapping with other audio streams
            const audio = new Audio(audioUrl);
            
            // Track this audio stream for the object
            if (this.activeAudioStreams.has(objectId)) {
                const oldAudio = this.activeAudioStreams.get(objectId);
                oldAudio.pause();
            }
            this.activeAudioStreams.set(objectId, audio);
            
            audio.play().catch(err => console.warn('Audio playback failed:', err));

            // Clean up blob URL and remove from tracking when done
            audio.addEventListener('ended', () => {
                URL.revokeObjectURL(audioUrl);
                if (this.activeAudioStreams.get(objectId) === audio) {
                    this.activeAudioStreams.delete(objectId);
                }
            });
        } catch (error) {
            console.warn('TTS error:', error);
        }
    }
    
    updateIntelliDisplay(isActive, message) {
        const statusEl = document.getElementById('intelliStatus');
        const detailsEl = document.getElementById('intelliDetails');
        
        if (!statusEl || !detailsEl) return;
        
        if (isActive) {
            statusEl.textContent = '✅ LLM Active';
            statusEl.style.color = '#4ade80';
        } else {
            statusEl.textContent = '❌ LLM Inactive';
            statusEl.style.color = '#f87171';
        }
        
        detailsEl.textContent = message || (isActive ? 'LLM enabled' : 'LLM disabled');
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
