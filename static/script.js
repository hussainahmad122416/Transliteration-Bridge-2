document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const themeBtn = document.getElementById('theme-btn');
    const clearBtn = document.getElementById('clear-btn');
    const transliterateBtn = document.getElementById('transliterate-btn');
    const copyBtn = document.getElementById('copy-btn');
    const downloadTxtBtn = document.getElementById('download-txt');
    const downloadDocxBtn = document.getElementById('download-docx');

    const playInputBtn = document.getElementById('play-input-btn');
    const pauseInputBtn = document.getElementById('pause-input-btn');
    const stopInputBtn = document.getElementById('stop-input-btn');

    const playOutputBtn = document.getElementById('play-output-btn');
    const pauseOutputBtn = document.getElementById('pause-output-btn');
    const stopOutputBtn = document.getElementById('stop-output-btn');

    const shahmukhiInput = document.getElementById('shahmukhi-input');
    const gurmukhiOutput = document.getElementById('gurmukhi-output');

    const dropZone = document.getElementById('drop-zone');
    const fileUpload = document.getElementById('file-upload');
    const fileNameDisplay = document.getElementById('file-name-display');
    const loadingOverlay = document.getElementById('loading-overlay');

    const wordCountDisplay = document.getElementById('word-count');
    const charCountDisplay = document.getElementById('char-count');
    const processTimeDisplay = document.getElementById('process-time');

    // Navigation & Auth Elements
    const authNav = document.getElementById('auth-nav');
    const loginNavBtn = document.getElementById('login-nav-btn');
    const userMenu = document.getElementById('user-menu');
    const userEmailDisplay = document.getElementById('user-email-display');
    const logoutBtn = document.getElementById('logout-btn');
    const navHistory = document.getElementById('nav-history');
    const historySection = document.getElementById('history-section');
    // Auth Modal Elements
    const authModal = document.getElementById('auth-modal');
    const closeAuthBtn = document.getElementById('close-auth-btn');
    const googleLoginBtn = document.getElementById('google-login-btn');

    // Profile Modal Elements
    const profileModal = document.getElementById('profile-modal');
    const closeProfileBtn = document.getElementById('close-profile-btn');
    const profileEmailDisplay = document.getElementById('profile-email-display');
    const profileHistoryCount = document.getElementById('profile-history-count');
    const modalLogoutBtn = document.getElementById('modal-logout-btn');

    // Theme Management handled via getPreferredTheme() at bottom of file

    // ========== UI Elements ==========
    const root = document.documentElement;

    // Navigation Views
    const mainNavLinks = document.querySelectorAll('#main-nav a');
    const workspaceView = document.getElementById('workspace-view');
    const authView = document.getElementById('auth-view');
    const historyView = document.getElementById('history-view');

    // Auth UI Forms
    const authForm = document.getElementById('auth-form');
    const authTitle = document.getElementById('auth-title');
    const authToggleMsg = document.getElementById('auth-toggle-msg');
    const authToggleLink = document.getElementById('auth-toggle-link');
    const authEmail = document.getElementById('auth-email');
    const authPassword = document.getElementById('auth-password');

    // Translation Workspace
    const sourceInput = document.getElementById('source-input');
    const inputLangLabel = document.getElementById('input-lang-label');
    const outputLangLabel = document.getElementById('output-lang-label');
    const swapDirBtn = document.getElementById('swap-dir-btn');
    const directionIndicatorText = document.getElementById('direction-indicator-text');
    const resultPanel = document.querySelector('.result-panel');

    // Stats and output actions
    const downloadPdfBtn = document.getElementById('download-pdf');

    // Helpers
    const toast = document.getElementById('toast');

    // ========== State ==========
    let currentDirection = 'shahmukhi_to_gurmukhi';
    uploadedFile = null; // Resetting from previous scope
    let isLoginMode = true;
    let authToken = localStorage.getItem('translit_token');
    let currentUser = null;

    // Inject result box
    const resultBox = document.createElement('div');
    resultBox.className = 'result-box';
    resultBox.id = 'gurmukhi-output'; // Reusing the ID for consistency
    resultBox.setAttribute('placeholder', 'Transliteration will appear here...');
    resultPanel.insertBefore(resultBox, document.querySelector('.stats-bar'));

    // Overlay
    loadingOverlay.className = 'overlay hidden'; // Reusing the existing loadingOverlay
    loadingOverlay.innerHTML = '<div class="spinner"></div><p>Processing...</p>';
    resultBox.parentNode.appendChild(loadingOverlay);

    // ========== Animated Quotes Logic ==========
    const quotes = [
        { text: "Language is the road map of a culture.", author: "Rita Mae Brown" },
        { text: "To have another language is to possess a second soul.", author: "Charlemagne" },
        { text: "Preserving our heritage, one script at a time.", author: "Transliteration Bridge" },
        { text: "Knowledge of languages is the doorway to wisdom.", author: "Roger Bacon" },
        { text: "A different language is a different vision of life.", author: "Federico Fellini" }
    ];
    let currentQuoteIndex = 0;
    const dynamicQuoteText = document.getElementById('dynamic-quote-text');
    const dynamicQuoteAuthor = document.getElementById('dynamic-quote-author');

    const initQuotes = () => {
        if (!dynamicQuoteText || !dynamicQuoteAuthor) return;
        setInterval(() => {
            dynamicQuoteText.style.opacity = 0;
            dynamicQuoteAuthor.style.opacity = 0;
            
            setTimeout(() => {
                currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
                dynamicQuoteText.textContent = `"${quotes[currentQuoteIndex].text}"`;
                dynamicQuoteAuthor.textContent = `- ${quotes[currentQuoteIndex].author}`;
                dynamicQuoteText.style.opacity = 1;
                dynamicQuoteAuthor.style.opacity = 1;
            }, 500); // Wait for fade out
        }, 6000); // Rotate every 6 seconds
    };

    // ========== Initialization ==========
    const checkAuth = async () => {
        if (!authToken) {
            updateAuthUI();
            return;
        }
        try {
            const res = await fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (res.ok) {
                currentUser = await res.json();
                updateAuthUI();
            } else {
                logout();
            }
        } catch {
            logout();
        }
    };

    const updateAuthUI = () => {
        if (currentUser) {
            loginNavBtn.classList.add('hidden');
            userMenu.classList.remove('hidden');
            navHistory.classList.remove('hidden');
            historySection.classList.remove('hidden');
            userEmailDisplay.textContent = currentUser.email;
            loadHistory();
        } else {
            loginNavBtn.classList.remove('hidden');
            userMenu.classList.add('hidden');
            navHistory.classList.add('hidden');
            historySection.classList.add('hidden');
            userEmailDisplay.textContent = '';
        }
    };

    const showToast = (message, isError = false) => {
        toast.textContent = message;
        toast.style.backgroundColor = isError ? 'var(--danger-color)' : 'var(--text-color)';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    };

    // ========== Text-To-Speech (TTS) Logic ==========
    let currentAudio = null;
    let activeTTSBtnPlay = null;
    let activeTTSBtnPause = null;
    let activeTTSBtnStop = null;

    const stopAudio = () => {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }
        resetTTSButtons();
    };

    const resetTTSButtons = () => {
        if (activeTTSBtnPlay) activeTTSBtnPlay.classList.remove('hidden');
        if (activeTTSBtnPause) activeTTSBtnPause.classList.add('hidden');
        if (activeTTSBtnStop) activeTTSBtnStop.classList.add('hidden');
        
        activeTTSBtnPlay = null;
        activeTTSBtnPause = null;
        activeTTSBtnStop = null;
    };

    const playText = async (text, langCode, playBtn, pauseBtn, stopBtn) => {
        if (!text) {
            showToast('No text available to read');
            return;
        }
        
        // If resuming
        if (currentAudio && activeTTSBtnPlay === playBtn && currentAudio.paused) {
            currentAudio.play();
            playBtn.classList.add('hidden');
            pauseBtn.classList.remove('hidden');
            return;
        }

        stopAudio();
        
        showToast('Generating Audio...');
        loadingOverlay.classList.remove('hidden');
        
        activeTTSBtnPlay = playBtn;
        activeTTSBtnPause = pauseBtn;
        activeTTSBtnStop = stopBtn;
        
        try {
            const res = await fetch('/api/tts', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({text: text, lang: langCode})
            });
            if (!res.ok) throw new Error('TTS server error');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            currentAudio = new Audio(url);
            
            // Wait for audio to be buffered enough to play before showing controls
            currentAudio.addEventListener('canplay', () => {
                loadingOverlay.classList.add('hidden');
                playBtn.classList.add('hidden');
                pauseBtn.classList.remove('hidden');
                stopBtn.classList.remove('hidden');
            });
            
            currentAudio.onended = () => resetTTSButtons();
            currentAudio.onerror = (e) => {
                loadingOverlay.classList.add('hidden');
                resetTTSButtons();
                const currentSrc = currentAudio ? currentAudio.src : url;
                console.error("Audio Error Event triggered:", e, "Src:", currentSrc);
                showToast('Failed to play audio segment. Please try again.', true);
            };

            await currentAudio.play();
        } catch(e) {
            loadingOverlay.classList.add('hidden');
            console.error(e);
            resetTTSButtons();
            showToast('Playback blocked or server error.', true);
        }
    };

    const pauseAudio = () => {
        if (currentAudio && !currentAudio.paused) {
            currentAudio.pause();
            if (activeTTSBtnPause) activeTTSBtnPause.classList.add('hidden');
            if (activeTTSBtnPlay) activeTTSBtnPlay.classList.remove('hidden');
        }
    };

    playInputBtn.addEventListener('click', () => {
        const text = sourceInput.value.trim();
        const lang = currentDirection === 'shahmukhi_to_gurmukhi' ? 'ur' : 'pa';
        playText(text, lang, playInputBtn, pauseInputBtn, stopInputBtn);
    });
    pauseInputBtn.addEventListener('click', pauseAudio);
    stopInputBtn.addEventListener('click', stopAudio);

    playOutputBtn.addEventListener('click', () => {
        const text = resultBox.textContent.trim();
        const lang = currentDirection === 'shahmukhi_to_gurmukhi' ? 'pa' : 'ur';
        playText(text, lang, playOutputBtn, pauseOutputBtn, stopOutputBtn);
    });
    pauseOutputBtn.addEventListener('click', pauseAudio);
    stopOutputBtn.addEventListener('click', stopAudio);

    // ========== Auth Logic ==========
    authToggleLink.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        authTitle.textContent = isLoginMode ? 'Welcome Back' : 'Create Account';
        document.getElementById('auth-subtitle').textContent = isLoginMode ? 'Login to save your translations history safely' : 'Join our linguistics platform today';
        document.getElementById('auth-submit-btn').innerHTML = isLoginMode ? '<span>Sign In</span> <i class="fa-solid fa-arrow-right"></i>' : '<span>Sign Up</span> <i class="fa-solid fa-user-plus"></i>';
        authToggleMsg.textContent = isLoginMode ? "Don't have an account?" : "Already have an account?";
        authToggleLink.textContent = isLoginMode ? 'Sign Up' : 'Login';
    });

    document.getElementById('forgot-password-link').addEventListener('click', async (e) => {
        e.preventDefault();
        const email = authEmail.value;
        if (!email) {
            showToast('Enter your email first to reset password', true);
            return;
        }
        showToast('Processing...');
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            showToast(data.msg, !res.ok);
            if (data.msg && data.msg.includes('reset to:')) {
                authPassword.value = data.msg.split(': ')[1];
            }
        } catch (err) {
            showToast('Failed to connect to reset server.', true);
        }
    });

    document.getElementById('google-login-btn').addEventListener('click', async (e) => {
        e.preventDefault();
        showToast('Initializing Google Sign-In...');
        try {
            const res = await fetch('/api/auth/google-login');
            const data = await res.json();
            if (res.ok && data.access_token) {
                localStorage.setItem('translit_token', data.access_token);
                showToast(data.msg);
                checkAuth();
            } else {
                throw new Error(data.detail || 'Google login failed');
            }
        } catch (err) {
            showToast('Google login error.', true);
        }
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = authEmail.value;
        const password = authPassword.value;
        const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/signup';

        try {
            let options = { method: 'POST' };
            if (isLoginMode) {
                const fd = new URLSearchParams();
                fd.append('username', email);
                fd.append('password', password);
                options.body = fd.toString();
                options.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
            } else {
                options.headers = { 'Content-Type': 'application/json' };
                options.body = JSON.stringify({ email, password });
            }

            const res = await fetch(endpoint, options);
            const data = await res.json();

            if (!res.ok) throw new Error(data.detail || 'Authentication failed');

            if (!isLoginMode) {
                // successful signup, switch to login mode and alert user
                isLoginMode = true;
                authToggleLink.click();
                showToast("Account Created! Please Login.");
                return;
            }

            authToken = data.access_token;
            localStorage.setItem('translit_token', authToken);
            await checkAuth();
            showToast('Logged in successfully');
            closeAuthModal();
        } catch (err) {
            showToast(err.message, true);
        }
    });

    const logout = () => {
        authToken = null;
        currentUser = null;
        localStorage.removeItem('translit_token');
        updateAuthUI();
        showToast('Logged out');
        closeProfileModal();
    };

    modalLogoutBtn.addEventListener('click', logout);
    
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => {
            showToast('Google login coming soon!', false);
        });
    }

    // ========== Workspace Logic ==========
    swapDirBtn.addEventListener('click', () => {
        if (currentDirection === 'shahmukhi_to_gurmukhi') {
            currentDirection = 'gurmukhi_to_shahmukhi';
            inputLangLabel.textContent = 'Gurmukhi';
            outputLangLabel.textContent = 'Shahmukhi';
            directionIndicatorText.textContent = 'G → S';
            sourceInput.dir = 'ltr'; // Gurmukhi is LTR
        } else {
            currentDirection = 'shahmukhi_to_gurmukhi';
            inputLangLabel.textContent = 'Shahmukhi';
            outputLangLabel.textContent = 'Gurmukhi';
            directionIndicatorText.textContent = 'S → G';
            sourceInput.dir = 'rtl'; // Shahmukhi is RTL
        }
        // Retransliterate if text exists
        if (sourceInput.value.trim()) {
            performTransliteration(sourceInput.value.trim(), null, false);
        }
    });

    const updateStats = (text, time) => {
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        wordCountDisplay.textContent = words.toLocaleString();
        charCountDisplay.textContent = text.length.toLocaleString();
        processTimeDisplay.textContent = `${time}ms`;
    };

    const saveToHistory = async (inputText, outputText, direction) => {
        if (!currentUser) return; // Only save if logged in
        try {
            await fetch('/api/history/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ input_text: inputText, output_text: outputText, direction })
            });
        } catch (e) { console.error('History save error', e); }
    };    let allHistories = [];

    const renderHistory = () => {
        const container = document.getElementById('history-list-container');
        const searchTerm = (document.getElementById('history-search')?.value || '').toLowerCase();
        const filterVal = document.getElementById('history-filter')?.value || 'all';
        const sortVal = document.getElementById('history-sort')?.value || 'newest';

        let filtered = [...allHistories];

        // Search
        if (searchTerm) {
            filtered = filtered.filter(h => 
                h.input_text.toLowerCase().includes(searchTerm) || 
                h.output_text.toLowerCase().includes(searchTerm)
            );
        }

        // Filter
        if (filterVal !== 'all') {
            filtered = filtered.filter(h => h.direction === filterVal);
        }

        // Sort
        if (sortVal === 'oldest') {
            filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        } else {
            filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }

        container.innerHTML = filtered.length ? '' : `
            <div class="empty-state">
                <i class="fa-regular fa-folder-open empty-icon"></i>
                <h3>No history found</h3>
                <p>${allHistories.length ? 'No translations match your search criteria.' : 'Start transliterating above and your securely saved history will appear here.'}</p>
            </div>
        `;

        filtered.forEach(h => {
            const div = document.createElement('div');
            div.className = 'history-item';
            const date = new Date(h.timestamp).toLocaleString();
            const textDir = h.direction === 'shahmukhi_to_gurmukhi' ? 'rtl' : 'ltr';
            const outDir = h.direction === 'shahmukhi_to_gurmukhi' ? 'ltr' : 'rtl';

            div.innerHTML = `
            <div class="history-meta">
                <span>${h.direction.replace(/_/g, ' ').toUpperCase()}</span>
                <span>${date}</span>
            </div>
            <div class="history-content">
                <div class="history-text" dir="${textDir}">${h.input_text.substring(0, 100)}${h.input_text.length > 100 ? '...' : ''}</div>
                <div class="history-text" style="color:var(--primary-color)" dir="${outDir}">${h.output_text.substring(0, 100)}${h.output_text.length > 100 ? '...' : ''}</div>
            </div>
            <div style="text-align:right; margin-top:0.5rem;">
                <button class="text-btn reuse-btn primary-text" data-text="${h.input_text.replace(/"/g, '&quot;')}" data-dir="${h.direction}">
                    <i class="fa-solid fa-rotate-left"></i> Quick Reuse
                </button>
            </div>
        `;
            container.appendChild(div);
        });

        // Attach reuse listeners
        document.querySelectorAll('.reuse-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const text = e.target.closest('button').getAttribute('data-text');
                const dir = e.target.closest('button').getAttribute('data-dir');
                
                // Align UI direction
                if (currentDirection !== dir) {
                    document.getElementById('swap-dir-btn').click();
                }
                
                sourceInput.value = text;
                window.scrollTo({ top: 0, behavior: 'smooth' });
                showToast('Text loaded for quick reuse');
                performTransliteration(text, null, true);
            });
        });
    };

    const loadHistory = async () => {
        const container = document.getElementById('history-list-container');
        container.innerHTML = '<div class="center p-2 text-secondary"><div class="spinner mx-auto"></div></div>';
        try {
            const res = await fetch('/api/history/', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (!res.ok) throw new Error('Failed to fetch history');
            allHistories = await res.json();
            
            // Update Dashboard/Profile Stats
            if (profileHistoryCount) profileHistoryCount.textContent = allHistories.length.toLocaleString();
            const charStat = document.getElementById('profile-char-count');
            if (charStat) {
                const totalChars = allHistories.reduce((sum, h) => sum + (h.input_text ? h.input_text.length : 0), 0);
                charStat.textContent = totalChars.toLocaleString();
            }

            renderHistory();
        } catch (e) {
            container.innerHTML = `<div class="center p-2 text-secondary">Error loading history: ${e.message}</div>`;
        }
    };

    // History Control Listeners
    const histSearch = document.getElementById('history-search');
    const histFilter = document.getElementById('history-filter');
    const histSort = document.getElementById('history-sort');
    
    if (histSearch) histSearch.addEventListener('input', renderHistory);
    if (histFilter) histFilter.addEventListener('change', renderHistory);
    if (histSort) histSort.addEventListener('change', renderHistory);

    document.getElementById('refresh-history-btn').addEventListener('click', loadHistory);

    const performTransliteration = async (textToProcess, fileObj, isRealtime = false) => {
        if (!textToProcess && !fileObj) {
            if (!isRealtime) showToast('Please enter text or upload a file first');
            return;
        }

        if (!isRealtime) loadingOverlay.classList.remove('hidden');

        try {
            let data;
            if (fileObj) {
                const formData = new FormData();
                formData.append('file', fileObj);
                formData.append('direction', currentDirection);
                const response = await fetch('/api/transliterate/file', {
                    method: 'POST',
                    body: formData
                });
                if (!response.ok) throw new Error('File processing failed');
                data = await response.json();
            } else {
                const response = await fetch('/api/transliterate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: textToProcess, direction: currentDirection })
                });
                if (!response.ok) throw new Error('Text processing failed');
                data = await response.json();
            }

            // Build rich mapping HTML instead of textContent
            if (data.rich_mapping) {
                resultBox.innerHTML = '';
                data.rich_mapping.forEach(mapping => {
                    if (mapping.is_word) {
                        const span = document.createElement('span');
                        span.textContent = mapping.output; // Dynamically mapped in backend
                        span.className = 'mapped-word';
                        span.setAttribute('data-original', mapping.input);
                        span.title = `Original: ${mapping.input}`;

                        resultBox.appendChild(span);
                    } else {
                        resultBox.appendChild(document.createTextNode(mapping.text));
                    }
                });
            } else {
                resultBox.textContent = data.output_text;
            }

            wordCountDisplay.textContent = data.word_count.toLocaleString();
            charCountDisplay.textContent = data.char_count.toLocaleString();
            processTimeDisplay.textContent = `${data.process_time_ms}ms`;

            if (!isRealtime) {
                if (data.is_source_script_correct === false && (textToProcess || fileObj)) {
                    showToast(`Warning: Input might not be pure ${currentDirection.split('_')[0]}`);
                } else {
                    showToast('Transliteration complete');
                }
                saveToHistory(textToProcess || "FILE", data.output_text, currentDirection);
            }

        } catch (error) {
            console.error(error);
            if (!isRealtime) showToast('Error during processing', true);
        } finally {
            if (!isRealtime) loadingOverlay.classList.add('hidden');
        }
    };

    sourceInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        if (uploadedFile) return;

        debounceTimer = setTimeout(() => {
            const textToProcess = sourceInput.value.trim();
            if (textToProcess) {
                performTransliteration(textToProcess, null, true);
            } else {
                resultBox.innerHTML = '';
                updateStats('', 0);
            }
        }, 400);
    });

    transliterateBtn.addEventListener('click', async () => {
        await performTransliteration(sourceInput.value.trim(), uploadedFile, false);
    });

    clearBtn.addEventListener('click', () => {
        sourceInput.value = '';
        resultBox.innerHTML = '';
        uploadedFile = null;
        fileNameDisplay.textContent = '';
        updateStats('', 0);
    });

    // File Upload logic - Automatically Parse file and put into textarea
    const handleFileUpload = async (file) => {
        if (!file) return;
        
        loadingOverlay.classList.remove('hidden');
        showToast(`Extracting text from ${file.name}...`);
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const res = await fetch('/api/parse-file', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to extract text');

            // Phase 1 Requirement: Show preview before inserting
            const previewModal = document.getElementById('preview-modal');
            const previewTextarea = document.getElementById('preview-textarea');
            const previewTitle = document.getElementById('preview-title');
            
            previewTitle.innerHTML = `<i class="fa-solid fa-file-lines text-primary"></i> Preview: ${file.name}`;
            previewTextarea.value = data.text;
            previewTextarea.dir = data.detected_language === 'shahmukhi' ? 'rtl' : 'ltr';
            
            window._pendingPreviewData = {
                detected: data.detected_language,
                filename: file.name
            };
            
            previewModal.classList.remove('hidden');

        } catch (error) {
            console.error(error);
            showToast(error.message, true);
        } finally {
            loadingOverlay.classList.add('hidden');
            fileUpload.value = ''; // Reset input
        }
    };

    fileUpload.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });

    // Modal Preview Event Listeners
    const hidePreviewModal = () => document.getElementById('preview-modal').classList.add('hidden');
    document.getElementById('close-preview-btn')?.addEventListener('click', hidePreviewModal);
    document.getElementById('cancel-preview-btn')?.addEventListener('click', hidePreviewModal);
    
    document.getElementById('insert-preview-btn')?.addEventListener('click', () => {
        hidePreviewModal();
        const data = window._pendingPreviewData;
        if (!data) return;
        
        const finalText = document.getElementById('preview-textarea').value.trim();
        if (!finalText) {
            showToast('No text to insert.');
            return;
        }

        // Auto switch direction based on detection if possible
        if (data.detected === 'shahmukhi' && currentDirection !== 'shahmukhi_to_gurmukhi') {
            currentDirection = 'shahmukhi_to_gurmukhi';
            updateDirectionUI();
            showToast('Auto-detected: Shahmukhi');
        } else if (data.detected === 'gurmukhi' && currentDirection !== 'gurmukhi_to_shahmukhi') {
            currentDirection = 'gurmukhi_to_shahmukhi';
            updateDirectionUI();
            showToast('Auto-detected: Gurmukhi');
        } else {
            showToast('Text extracted successfully');
        }
        
        sourceInput.value = finalText;
        fileNameDisplay.textContent = `Extracted from: ${data.filename}`;
        
        // Trigger transliteration preview if under character limit, or clear previous
        if (finalText.length < 5000) {
            performTransliteration(finalText, null, true);
        } else {
            showToast('Large file detected. Click Convert to process.');
        }
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });

    // Copy & Downloads
    copyBtn.addEventListener('click', () => {
        const text = resultBox.textContent;
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard');
        }).catch(() => {
            showToast('Failed to copy', true);
        });
    });

    const generateFileBlob = (content, type) => {
        if (type === 'txt') {
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'transliteration.txt';
            a.click();
            URL.revokeObjectURL(url);
        }
        // Note: client side true docx generation requires complex libraries.
        // For vibe coding we serve basic word HTML or use backend. Using simple text for now.
    };

    downloadTxtBtn.addEventListener('click', (e) => {
        e.preventDefault();
        generateFileBlob(resultBox.textContent, 'txt');
    });

    downloadDocxBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const text = resultBox.textContent;
        if (!text) return showToast('No text to download', true);
        
        try {
            showToast('Generating Word Document...');
            const res = await fetch('/api/export-docx', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({text: text, direction: currentDirection})
            });
            if (!res.ok) throw new Error('Export failed');
            
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `transliteration_${currentDirection}.docx`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('Download complete');
        } catch (err) {
            showToast('Failed to download document', true);
        }
    });
    // Theme Logic
    const getPreferredTheme = () => {
        const saved = localStorage.getItem('translit_theme');
        if (saved) return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const setTheme = (theme) => {
        if (theme === 'dark') {
            root.setAttribute('data-theme', 'dark');
            themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
        } else {
            root.removeAttribute('data-theme');
            themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
        }
        localStorage.setItem('translit_theme', theme);
    };

    const initTheme = () => {
        setTheme(getPreferredTheme());
    };

    themeBtn.addEventListener('click', () => {
        const current = root.getAttribute('data-theme');
        setTheme(current === 'dark' ? 'light' : 'dark');
    });

    // Run Initializers
    initTheme();
    initQuotes();
    updateDirectionUI();
    checkAuth();
    if(loginNavBtn && authModal) loginNavBtn.addEventListener('click', () => authModal.classList.remove('hidden'));
    if(closeAuthBtn || closeModalBtn) closeAuthBtn.addEventListener('click', () => authModal.classList.add('hidden'));
});
