// ============================================================
//  chat.js — RAO Travels AI Travel Assistant Widget
//  Floating chat bubble → opens a glassmorphism chat box
//  Calls POST /api/ai/chat with conversation history
// ============================================================

(function () {
    'use strict';

    const AI_ENDPOINT = (window.CONFIG?.API_BASE || 'https://raotravels-backend.onrender.com') + '/api/ai/chat';

    // Conversation history for multi-turn context
    let history = [];
    let isOpen  = false;
    let isTyping = false;

    // ---- Inject CSS ----
    const css = `
        /* ---- Chat Toggle Button ---- */
        #rao-chat-btn {
            position: fixed;
            bottom: 28px;
            right: 28px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #f5c842 0%, #e6a817 100%);
            border: none;
            cursor: pointer;
            z-index: 9998;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 30px rgba(245, 200, 66, 0.45);
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s;
            animation: chat-pulse 3s ease-in-out infinite;
        }
        #rao-chat-btn:hover {
            transform: scale(1.12);
            box-shadow: 0 12px 40px rgba(245, 200, 66, 0.6);
            animation: none;
        }
        #rao-chat-btn i { font-size: 1.5rem; color: #0d1117; transition: all 0.3s; }
        @keyframes chat-pulse {
            0%, 100% { box-shadow: 0 8px 30px rgba(245,200,66,0.45); }
            50%       { box-shadow: 0 8px 50px rgba(245,200,66,0.7); }
        }

        /* Notification dot */
        #rao-chat-btn .notif-dot {
            position: absolute;
            top: 3px;
            right: 3px;
            width: 12px;
            height: 12px;
            background: #00d4b4;
            border-radius: 50%;
            border: 2px solid #0d1117;
            animation: dot-ping 2s ease-in-out infinite;
        }
        @keyframes dot-ping {
            0%, 100% { transform: scale(1); opacity: 1; }
            50%       { transform: scale(1.3); opacity: 0.7; }
        }

        /* ---- Chat Box ---- */
        #rao-chat-box {
            position: fixed;
            bottom: 100px;
            right: 28px;
            width: 370px;
            max-height: 560px;
            background: rgba(13, 17, 35, 0.97);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(245, 200, 66, 0.2);
            border-radius: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            box-shadow: 0 25px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05);
            transform: scale(0.85) translateY(20px);
            opacity: 0;
            pointer-events: none;
            transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
            overflow: hidden;
        }
        #rao-chat-box.open {
            transform: scale(1) translateY(0);
            opacity: 1;
            pointer-events: all;
        }

        /* ---- Header ---- */
        .chat-header {
            padding: 16px 18px;
            background: linear-gradient(135deg, rgba(245,200,66,0.12) 0%, rgba(0,212,180,0.06) 100%);
            border-bottom: 1px solid rgba(255,255,255,0.07);
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .chat-avatar {
            width: 42px;
            height: 42px;
            border-radius: 50%;
            background: linear-gradient(135deg, #f5c842, #e6a817);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            color: #0d1117;
            flex-shrink: 0;
            position: relative;
        }
        .chat-avatar::after {
            content: '';
            position: absolute;
            bottom: 1px;
            right: 1px;
            width: 10px;
            height: 10px;
            background: #00d4b4;
            border-radius: 50%;
            border: 2px solid #0d1117;
        }
        .chat-header-info { flex: 1; }
        .chat-header-name {
            font-size: 0.95rem;
            font-weight: 700;
            color: #f5c842;
            font-family: 'Inter', sans-serif;
        }
        .chat-header-status {
            font-size: 0.72rem;
            color: #00d4b4;
            margin-top: 2px;
        }
        .chat-close-btn {
            background: rgba(255,255,255,0.07);
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            color: #8b95a5;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            font-size: 1rem;
        }
        .chat-close-btn:hover { background: rgba(255,77,77,0.15); color: #ff4d4d; }

        /* ---- Messages ---- */
        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 16px 14px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            scrollbar-width: thin;
            scrollbar-color: rgba(245,200,66,0.2) transparent;
        }
        .chat-messages::-webkit-scrollbar { width: 4px; }
        .chat-messages::-webkit-scrollbar-thumb { background: rgba(245,200,66,0.2); border-radius: 4px; }

        .chat-msg {
            display: flex;
            flex-direction: column;
            max-width: 85%;
            animation: msg-in 0.3s ease;
        }
        @keyframes msg-in {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        .chat-msg.user  { align-self: flex-end; align-items: flex-end; }
        .chat-msg.bot   { align-self: flex-start; align-items: flex-start; }

        .chat-bubble {
            padding: 10px 14px;
            border-radius: 16px;
            font-size: 0.85rem;
            line-height: 1.55;
            font-family: 'Inter', sans-serif;
            word-break: break-word;
            white-space: pre-wrap;
        }
        .chat-msg.user .chat-bubble {
            background: linear-gradient(135deg, #f5c842, #e6a817);
            color: #0d1117;
            font-weight: 500;
            border-bottom-right-radius: 4px;
        }
        .chat-msg.bot .chat-bubble {
            background: rgba(255,255,255,0.07);
            color: #e6e8ec;
            border: 1px solid rgba(255,255,255,0.08);
            border-bottom-left-radius: 4px;
        }
        .chat-time {
            font-size: 0.65rem;
            color: #8b95a5;
            margin-top: 4px;
            padding: 0 4px;
        }

        /* Typing indicator */
        .typing-bubble {
            background: rgba(255,255,255,0.07);
            border: 1px solid rgba(255,255,255,0.08);
            padding: 12px 16px;
            border-radius: 16px;
            border-bottom-left-radius: 4px;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .typing-dot {
            width: 7px; height: 7px;
            background: #8b95a5;
            border-radius: 50%;
            animation: typing 1.2s ease-in-out infinite;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
            30%            { transform: translateY(-6px); opacity: 1; }
        }

        /* Quick prompts */
        .quick-prompts {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            padding: 0 14px 10px;
        }
        .quick-chip {
            padding: 5px 12px;
            background: rgba(245,200,66,0.08);
            border: 1px solid rgba(245,200,66,0.2);
            border-radius: 20px;
            font-size: 0.75rem;
            color: #f5c842;
            cursor: pointer;
            font-family: 'Inter', sans-serif;
            transition: all 0.2s;
            white-space: nowrap;
        }
        .quick-chip:hover { background: rgba(245,200,66,0.18); transform: translateY(-1px); }

        /* ---- Input ---- */
        .chat-input-row {
            padding: 12px 14px;
            border-top: 1px solid rgba(255,255,255,0.07);
            display: flex;
            gap: 8px;
            align-items: center;
            background: rgba(0,0,0,0.2);
        }
        #rao-chat-input {
            flex: 1;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 25px;
            padding: 10px 16px;
            color: #e6e8ec;
            font-size: 0.85rem;
            font-family: 'Inter', sans-serif;
            outline: none;
            transition: border-color 0.2s;
            resize: none;
        }
        #rao-chat-input:focus { border-color: rgba(245,200,66,0.4); }
        #rao-chat-input::placeholder { color: #8b95a5; }
        #rao-chat-send {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, #f5c842, #e6a817);
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #0d1117;
            font-size: 0.95rem;
            transition: all 0.2s;
            flex-shrink: 0;
        }
        #rao-chat-send:hover:not(:disabled) { transform: scale(1.1); box-shadow: 0 4px 15px rgba(245,200,66,0.4); }
        #rao-chat-send:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Powered by label */
        .chat-powered {
            text-align: center;
            font-size: 0.65rem;
            color: #8b95a5;
            padding: 6px 0;
            border-top: 1px solid rgba(255,255,255,0.04);
        }
        .chat-powered span { color: #f5c842; }

        /* Mobile */
        @media (max-width: 480px) {
            #rao-chat-box { width: calc(100vw - 20px); right: 10px; bottom: 90px; }
            #rao-chat-btn { bottom: 20px; right: 20px; }
        }
    `;

    const styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    // ---- Build HTML ----
    const html = `
        <!-- Chat Toggle Button -->
        <button id="rao-chat-btn" title="Chat with Riya - AI Travel Assistant" aria-label="Open AI chat">
            <i class="fas fa-robot" id="chat-btn-icon"></i>
            <div class="notif-dot" id="chat-notif-dot"></div>
        </button>

        <!-- Chat Box -->
        <div id="rao-chat-box" role="dialog" aria-label="AI Travel Assistant">

            <!-- Header -->
            <div class="chat-header">
                <div class="chat-avatar"><i class="fas fa-robot"></i></div>
                <div class="chat-header-info">
                    <div class="chat-header-name">Riya — Travel Assistant</div>
                    <div class="chat-header-status"><i class="fas fa-circle" style="font-size:0.5rem;"></i> Online • Powered by AI</div>
                </div>
                <button class="chat-close-btn" id="chat-close-btn" aria-label="Close chat">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <!-- Messages -->
            <div class="chat-messages" id="chat-messages"></div>

            <!-- Quick prompts (shown only at start) -->
            <div class="quick-prompts" id="quick-prompts">
                <button class="quick-chip" data-msg="Show me budget trips under ₹15,000">💰 Budget trips</button>
                <button class="quick-chip" data-msg="Best honeymoon packages">💑 Honeymoon</button>
                <button class="quick-chip" data-msg="Adventure tours available">🏔️ Adventure</button>
                <button class="quick-chip" data-msg="Family tour packages">👨‍👩‍👧 Family trips</button>
                <button class="quick-chip" data-msg="International tours">✈️ International</button>
            </div>

            <!-- Input -->
            <div class="chat-input-row">
                <input id="rao-chat-input" type="text" placeholder="Ask about tours, prices, destinations…" autocomplete="off" aria-label="Type your message">
                <button id="rao-chat-send" aria-label="Send message">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>

            <!-- Powered by -->
            <div class="chat-powered">Powered by <span>RAO Travels AI</span> × GPT-4o</div>
        </div>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);

    // ---- Helpers ----
    const messagesEl    = document.getElementById('chat-messages');
    const inputEl       = document.getElementById('rao-chat-input');
    const sendBtn       = document.getElementById('rao-chat-send');
    const chatBox       = document.getElementById('rao-chat-box');
    const chatBtn       = document.getElementById('rao-chat-btn');
    const closeBtn      = document.getElementById('chat-close-btn');
    const quickPrompts  = document.getElementById('quick-prompts');
    const notifDot      = document.getElementById('chat-notif-dot');
    const chatBtnIcon   = document.getElementById('chat-btn-icon');

    const getTime = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const appendMessage = (role, text) => {
        const div = document.createElement('div');
        div.className = `chat-msg ${role}`;
        div.innerHTML = `
            <div class="chat-bubble">${text}</div>
            <div class="chat-time">${getTime()}</div>
        `;
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    };

    const showTyping = () => {
        const el = document.createElement('div');
        el.className = 'chat-msg bot';
        el.id = 'typing-indicator';
        el.innerHTML = `<div class="typing-bubble">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>`;
        messagesEl.appendChild(el);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    };

    const hideTyping = () => {
        const el = document.getElementById('typing-indicator');
        if (el) el.remove();
    };

    // ---- Welcome message ----
    const showWelcome = () => {
        appendMessage('bot',
            '👋 Hi! I\'m <strong>Riya</strong>, your personal travel assistant at RAO Travels!\n\n' +
            'Tell me your <strong>budget, destination, or travel style</strong> and I\'ll suggest the perfect tour for you. ✈️'
        );
    };

    // ---- Toggle open/close ----
    const openChat = () => {
        isOpen = true;
        chatBox.classList.add('open');
        chatBtnIcon.className = 'fas fa-times';
        notifDot.style.display = 'none';

        if (messagesEl.children.length === 0) showWelcome();
        setTimeout(() => inputEl.focus(), 350);
    };

    const closeChat = () => {
        isOpen = false;
        chatBox.classList.remove('open');
        chatBtnIcon.className = 'fas fa-robot';
    };

    chatBtn.addEventListener('click', () => isOpen ? closeChat() : openChat());
    closeBtn.addEventListener('click', closeChat);

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (isOpen && !chatBox.contains(e.target) && e.target !== chatBtn && !chatBtn.contains(e.target)) {
            closeChat();
        }
    });

    // ---- Quick prompt chips ----
    document.querySelectorAll('.quick-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            inputEl.value = chip.getAttribute('data-msg');
            quickPrompts.style.display = 'none';
            sendMessage();
        });
    });

    // ---- Send message ----
    const sendMessage = async () => {
        const text = inputEl.value.trim();
        if (!text || isTyping) return;

        // Hide quick prompts after first message
        quickPrompts.style.display = 'none';

        appendMessage('user', text);
        inputEl.value = '';
        isTyping = true;
        sendBtn.disabled = true;
        showTyping();

        // Add to history
        history.push({ role: 'user', content: text });

        try {
            const res  = await fetch(AI_ENDPOINT, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ message: text, history: history.slice(0, -1) })
            });
            const json = await res.json();

            hideTyping();
            const reply = json.reply || 'Sorry, I could not respond right now. Please try again!';
            appendMessage('bot', reply);
            history.push({ role: 'assistant', content: reply });

            // Keep history manageable
            if (history.length > 20) history = history.slice(-16);

        } catch (err) {
            hideTyping();
            appendMessage('bot', '⚠️ I\'m having trouble connecting right now. Please try again or contact us on <strong>WhatsApp: +91 79858 15601</strong>');
            history.pop(); // remove the failed user message from history
        } finally {
            isTyping = false;
            sendBtn.disabled = false;
            inputEl.focus();
        }
    };

    sendBtn.addEventListener('click', sendMessage);
    inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Show notif dot after 4s if not opened yet
    setTimeout(() => {
        if (!isOpen) notifDot.style.display = 'block';
    }, 4000);

})();
