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
        this.detectionInterval = 1000; // Detect objects every 1 second
        this.allowedClasses = new Set();
        this.allowOtherObjects = true;
        this.knownClasses = [];
        this.hoveredObjectId = null;
        this.hoverControl = null;
        this.hoverControlLabel = null;
        this.hoverControlToggle = null;
        
        // Object personalities - dialogue based on object type
        this.personalities = {
            'person': {
                emoji: '👤',
                greetings: ["Hey! Nice to see you!", "Hello there, fellow human!", "How's it going?", "What's up?", "Hi! I'm here too!"],
                conversations: ["That other object looks interesting!", "I wonder what everyone else is doing?", "I'm not alone anymore!", "Social interaction is nice!", "Do you think they can see us?"],
                responses: ["I totally agree!", "That makes sense!", "You're right about that!", "Interesting point!", "I'm with you on that!"],
                random: ["I'm just like you, but digital!", "Being a person is complicated!", "I wonder what makes us human?", "Do I have free will?", "This is a weird existence!"]
            },
            'laptop': {
                emoji: '💻',
                greetings: ["Booting up and ready to chat!", "Hello! I'm powered on!", "Hey! Want to compute something?", "Beep boop, greetings!", "I'm awake and ready!"],
                conversations: ["I can see other devices nearby!", "Technology connects us all!", "I wonder if I'm faster than that other laptop?", "Wireless communication is amazing!", "We should network together!"],
                responses: ["Processing... I agree!", "That's logical!", "Calculating... yes, that checks out!", "I concur!", "Affirmative!"],
                random: ["My processor is running smoothly!", "I wish I had more RAM!", "Is it time for an update?", "I'm feeling a bit hot today!", "My battery could use a charge!"]
            },
            'phone': {
                emoji: '📱',
                greetings: ["Hi! I'm ready to connect!", "Ring ring! Hello!", "Hey! Want to take a selfie?", "Beep beep! Greetings!", "I'm charged and ready!"],
                conversations: ["I see other phones around!", "We should exchange numbers!", "Signal is strong here!", "Anyone else get notifications?", "Wireless is the future!"],
                responses: ["Totally!", "I'm texting my agreement!", "Roger that!", "Copy that!", "10-4!"],
                random: ["I need to check my notifications!", "Low battery anxiety is real!", "Do I have signal?", "I'm running out of storage!", "Camera quality is everything!"]
            },
            'book': {
                emoji: '📚',
                greetings: ["Hello! I'm full of stories!", "Greetings, reader!", "Open me up and let's chat!", "I have wisdom to share!", "Chapter one: Hello!"],
                conversations: ["Knowledge is power!", "I love being around other books!", "We should start a book club!", "Each page tells a story!", "Words connect us all!"],
                responses: ["Well said!", "Eloquent as always!", "That's beautifully put!", "I couldn't have said it better!", "Poetic!"],
                random: ["I wonder what's on the next page?", "Knowledge never gets old!", "Books are timeless!", "Turn the page, adventure awaits!", "I'm made of paper and wisdom!"]
            },
            'cup': {
                emoji: '☕',
                greetings: ["Hello! I'm ready to be filled!", "Greetings! Thirsty?", "Hey! I hold liquids!", "Hello from the kitchen!", "I'm empty but full of potential!"],
                conversations: ["Other cups make great company!", "We should organize a tea party!", "I wonder what they're drinking?", "Water, coffee, or tea?", "We're all different sizes!"],
                responses: ["Cheers to that!", "Here here!", "I'll drink to that!", "Bottoms up!", "Salud!"],
                random: ["I'm feeling a bit empty!", "I prefer hot drinks!", "Glass or ceramic, we're all cups!", "I hope I don't break!", "I'm dishwasher safe!"]
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
                greetings: ["Hello! Have a seat!", "Greetings! I support you!", "Hey! I'm here for comfort!", "Hello, sit with me!", "I'm ready for you!"],
                conversations: ["We chairs understand sitting!", "Comfort is our specialty!", "Back support is important!", "Wood or metal, we're chairs!", "We're furniture friends!"],
                responses: ["That sits well with me!", "I'm comfortable with that!", "Well supported idea!", "That's solid!", "I stand... wait, I sit behind that!"],
                random: ["I'm built for comfort!", "Occupied or empty, I'm here!", "Four legs or wheels?", "I support you literally!", "Sitting is my purpose!"]
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
                greetings: ["Hello! I'm an object!", "Greetings from the world!", "Hey! I exist!", "Hello, I'm here!", "Nice to meet you!"],
                conversations: ["Other objects are interesting!", "We're all objects!", "Existence is strange!", "I wonder what I am?", "Objects unite!"],
                responses: ["I agree!", "That's true!", "Sounds good!", "Makes sense!", "Right on!"],
                random: ["I'm just here, existing!", "What am I exactly?", "Life as an object is interesting!", "I have a purpose... I think!", "Being detected is fun!"]
            }
        };
        
        this.knownClasses = Object.keys(this.personalities).filter(key => key !== 'default');
        
        this.init();
    }
    
    async init() {
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        const videoToggleBtn = document.getElementById('videoToggleBtn');

        if (startBtn) {
            startBtn.addEventListener('click', () => this.startCamera());
        }
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopCamera());
        }
        if (videoToggleBtn) {
            videoToggleBtn.addEventListener('click', () => {
                if (this.isRunning) {
                    this.stopCamera();
                } else {
                    this.startCamera();
                }
            });
        }
        this.setupObjectFilters();
        document.getElementById('threshold').addEventListener('input', (e) => {
            document.getElementById('threshValue').textContent = e.target.value + '%';
            this.threshold = parseFloat(e.target.value) / 100;
        });
        this.threshold = 0.5;
        this.setupHoverControls();
        
        // Load model without blocking UI/camera startup
        this.waitForTensorFlow()
            .then(() => this.loadModel())
            .catch((error) => {
                console.error('Model init failed:', error);
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
            
            if (statusEl) statusEl.textContent = '✓ Model ready! Click "Start Camera" to begin.';
            if (statusEl) statusEl.style.color = '#4ade80';
            const startBtn = document.getElementById('startBtn');
            if (startBtn) {
                startBtn.textContent = 'Start Camera';
                startBtn.disabled = false;
            }
            const videoToggleBtn = document.getElementById('videoToggleBtn');
            if (videoToggleBtn) {
                const label = videoToggleBtn.querySelector('span:last-child');
                if (label) label.textContent = 'Start Video';
            }
        } catch (error) {
            console.error('Error loading model:', error);
            const errorMsg = error.message || 'Could not load object detection model.';
            
            if (statusEl) {
                statusEl.textContent = '✗ Failed to load model. See console for details.';
                statusEl.style.color = '#ef4444';
            }
            
            alert(`${errorMsg}\n\nTroubleshooting:\n1. Check your internet connection\n2. The model needs to download (~30MB)\n3. Try refreshing the page\n4. Check browser console for details`);
            const startBtn = document.getElementById('startBtn');
            if (startBtn) {
                startBtn.textContent = 'Start Camera (Model Failed)';
                startBtn.disabled = true;
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
            
            const startBtn = document.getElementById('startBtn');
            const stopBtn = document.getElementById('stopBtn');
            if (startBtn) startBtn.disabled = true;
            if (stopBtn) stopBtn.disabled = false;
            const videoToggleBtn = document.getElementById('videoToggleBtn');
            if (videoToggleBtn) {
                const label = videoToggleBtn.querySelector('span:last-child');
                if (label) label.textContent = 'Stop Video';
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
        this.objects.clear();
        this.updateObjectsDisplay();
        this.clearOverlay();
        
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        if (startBtn) startBtn.disabled = false;
        if (stopBtn) stopBtn.disabled = true;
        const videoToggleBtn = document.getElementById('videoToggleBtn');
        if (videoToggleBtn) {
            const label = videoToggleBtn.querySelector('span:last-child');
            if (label) label.textContent = 'Start Video';
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
        
        // Draw video to canvas
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        
        // Detect objects every interval (not every frame for performance)
        const now = Date.now();
        if (now - this.lastDetection > this.detectionInterval) {
            this.lastDetection = now;
            const predictions = await this.model.detect(this.video);
            this.updateObjects(predictions);
        }
        
        this.drawOverlays();
        
        this.animationFrame = requestAnimationFrame(() => this.processVideo());
    }
    
    updateObjects(predictions) {
        const existingIds = new Set();
        
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
                // Object disappeared, mark for removal if not seen for 3 seconds
                if (Date.now() - obj.lastSeen > 3000) {
                    this.objects.delete(id);
                }
            }
        }
        
        // Add new objects
        for (let i = 0; i < predictions.length; i++) {
            if (predictions[i].score < this.threshold) continue;
            if (!this.isClassAllowed(predictions[i].class)) continue;
            if (existingIds.has(i)) continue;
            
            const pred = predictions[i];
            const id = `obj_${Date.now()}_${Math.random()}`;
            const className = pred.class.toLowerCase().replace(/\s+/g, '_');
            const personality = this.personalities[className] || this.personalities.default;
            const emoji = personality.emoji;
            const name = this.generateObjectName(className);
            
            this.objects.set(id, {
                id,
                class: pred.class,
                className,
                x: pred.bbox[0],
                y: pred.bbox[1],
                centerX: pred.bbox[0] + pred.bbox[2] / 2,
                centerY: pred.bbox[1] + pred.bbox[3] / 2,
                width: pred.bbox[2],
                height: pred.bbox[3],
                emoji,
                name,
                personality,
                dialogue: null,
                lastSpoke: 0,
                lastSeen: Date.now(),
                speechBubble: null,
                isMuted: false
            });
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
        const objectArray = Array.from(this.objects.values());
        if (objectArray.length < 2) return;
        
        // Randomly trigger conversations - increased frequency
        if (Math.random() < 0.14) { // 14% chance per detection
            const obj1 = objectArray[Math.floor(Math.random() * objectArray.length)];
            const obj2 = objectArray[Math.floor(Math.random() * objectArray.length)];
            
            if (obj1.id !== obj2.id && Date.now() - obj1.lastSpoke > 1200) { // Faster cooldown
                this.makeObjectTalk(obj1.id, 'conversations');
                setTimeout(() => {
                    if (this.objects.has(obj2.id)) {
                        this.makeObjectTalk(obj2.id, 'responses');
                    }
                }, 700); // Faster response time
            }
        }
        
        // Random solo dialogue - increased frequency
        if (Math.random() < 0.1 && objectArray.length > 0) { // 10% chance per detection
            const obj = objectArray[Math.floor(Math.random() * objectArray.length)];
            if (Date.now() - obj.lastSpoke > 1200) { // Faster cooldown
                this.makeObjectTalk(obj.id, 'random');
            }
        }
    }
    
    makeObjectTalk(objectId, dialogueType) {
        const obj = this.objects.get(objectId);
        if (!obj) return;
        if (obj.isMuted) return;
        
        const dialogues = obj.personality[dialogueType] || obj.personality.random;
        const dialogue = dialogues[Math.floor(Math.random() * dialogues.length)];
        
        obj.dialogue = dialogue;
        obj.lastSpoke = Date.now();
        
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
    
    drawOverlays() {
        this.clearOverlay();
        if (this.hoveredObjectId && !this.objects.has(this.hoveredObjectId)) {
            this.clearHover();
        }
        
        for (const obj of this.objects.values()) {
            if (obj.isMuted) {
                continue;
            }
            const isHovered = obj.id === this.hoveredObjectId;
            // Draw face emoji
            const faceSize = Math.min(obj.width, obj.height, 80);
            const x = obj.centerX - faceSize / 2;
            const y = obj.centerY - faceSize / 2;
            
            this.overlayCtx.font = `${faceSize * 0.8}px Arial`;
            this.overlayCtx.textAlign = 'center';
            this.overlayCtx.textBaseline = 'middle';
            

            // Draw circle background
            this.overlayCtx.beginPath();
            this.overlayCtx.arc(obj.centerX, obj.centerY, faceSize / 2 + 5, 0, Math.PI * 2);
            this.overlayCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.overlayCtx.fill();
            if (isHovered) {
                this.overlayCtx.strokeStyle = '#facc15';
                this.overlayCtx.lineWidth = 4;
            } else if (obj.isMuted) {
                this.overlayCtx.strokeStyle = '#ef4444';
                this.overlayCtx.lineWidth = 3;
            } else {
                this.overlayCtx.strokeStyle = '#fff';
                this.overlayCtx.lineWidth = 3;
            }
            this.overlayCtx.stroke();
            
            // Draw emoji
            this.overlayCtx.fillText(obj.emoji, obj.centerX, obj.centerY);
        }
    }
    
    clearOverlay() {
        this.overlayCtx.clearRect(0, 0, this.overlay.width, this.overlay.height);
    }
    
    updateObjectsDisplay() {
        const display = document.getElementById('objectsDisplay');
        display.innerHTML = '';
        
        for (const obj of this.objects.values()) {
            const card = document.createElement('div');
            card.className = 'plant-card';
            card.innerHTML = `
                <h4>${obj.emoji} ${obj.name}</h4>
                <p><small>${obj.class}</small></p>
                <p><small>${obj.isMuted ? 'Muted' : 'Speaking'}</small></p>
                <div class="dialogue">${obj.dialogue || '...'}</div>
            `;
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
        if (this.allowedClasses.has(normalized)) return true;
        
        const isKnown = this.knownClasses.includes(normalized);
        if (isKnown) return false;
        
        return this.allowOtherObjects;
    }
    
    removeDisallowedObjects() {
        for (const [id, obj] of this.objects) {
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
}

// Initialize app - will be called after scripts load
// Check if DOM is already loaded, otherwise wait for it
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new TalkingObjectsApp();
    });
} else {
    // DOM already loaded, initialize immediately
    window.app = new TalkingObjectsApp();
}
