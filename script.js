let userName = localStorage.getItem('userName') || "User";
let chatHistory = [];
let currentChatId = null;
let controller = null;

// --- New: Your Backend URL ---
const backendUrl = "https://zeroth-ernesta-llwai1-466fcd9e.koyeb.app";

// --- DOM Elements ---
const homepage = document.getElementById('homepage');
const nameEntryPage = document.getElementById('name-entry-page');
const chatContainer = document.getElementById('chat-container');
const startChatButton = document.getElementById('start-chat-button');
const savedChatsList = document.getElementById('saved-chats-list');
const nameInput = document.getElementById('name-input');
const submitNameButton = document.getElementById('submit-name-button');
const skipButton = document.getElementById('skip-button');
const displayNameElement = document.getElementById('display-name');
const editNameBtn = document.getElementById('edit-name-btn');
const backToHomeBtn = document.getElementById('back-to-home-btn');
const displayChatTitle = document.getElementById('display-chat-title');
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const imageUploadBtn = document.getElementById('image-upload-btn');
const imageUpload = document.getElementById('image-upload');
const stopButton = document.getElementById('stop-button');

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    loadAppState();
    showHomepage();
});

startChatButton.addEventListener('click', () => startNewChat());
submitNameButton.addEventListener('click', submitName);
skipButton.addEventListener('click', () => submitName(true));
sendButton.addEventListener('click', sendMessage);

// Event listener for the textarea to handle Enter key
userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); 
        sendMessage();
    }
});
userInput.addEventListener('input', () => {
    autoResize(userInput);
});


editNameBtn.addEventListener('click', () => {
    showNameEntry();
});
backToHomeBtn.addEventListener('click', () => {
    saveAppState();
    showHomepage();
});
imageUploadBtn.addEventListener('click', () => {
    imageUpload.click();
});
stopButton.addEventListener('click', stopResponse);

// --- Functions ---
function showNameEntry() {
    homepage.style.display = 'none';
    nameEntryPage.style.display = 'flex';
    chatContainer.style.display = 'none';
    nameInput.focus();
}

function showHomepage() {
    homepage.style.display = 'flex';
    nameEntryPage.style.display = 'none';
    chatContainer.style.display = 'none';
    renderSavedChats();
}

function showChat() {
    homepage.style.display = 'none';
    nameEntryPage.style.display = 'none';
    chatContainer.style.display = 'flex';
    displayNameElement.textContent = userName;
    chatBox.innerHTML = '';
    
    const currentChat = getChatFromStorage(currentChatId);
    if (currentChat && currentChat.history) {
        currentChat.history.forEach(msg => {
            appendMessageToDOM(msg.sender, msg.message, msg.image, false);
        });
        displayChatTitle.textContent = currentChat.title;
    } else {
        displayChatTitle.textContent = "New Chat";
    }

    userInput.focus();
    chatBox.scrollTop = chatBox.scrollHeight;
}

function submitName(skip = false) {
    if (!skip) {
        const newName = nameInput.value.trim();
        if (newName) {
            userName = newName;
            localStorage.setItem('userName', userName);
        }
    }
    showChat();
    if (chatHistory.length === 0) {
        appendMessage('bot', `Hello, ${userName}! How can I help you today?`);
    } else {
        displayNameElement.textContent = userName;
    }
}

function startNewChat() {
    currentChatId = `chat-${Date.now()}`;
    chatHistory = [];
    showChat();
    appendMessage('bot', `Hello, ${userName}! How can I help you today?`);
}

function renderSavedChats() {
    savedChatsList.innerHTML = '';
    const chats = getChatsFromStorage();
    if (chats.length > 0) {
        chats.forEach(chat => {
            const li = document.createElement('li');
            li.classList.add('saved-chat-item');
            li.innerHTML = `
                <span class="chat-item-text">${chat.title}</span>
                <div class="chat-item-actions">
                    <button class="resume-chat-btn" data-chat-id="${chat.id}"><i class="fas fa-play"></i></button>
                    <button class="delete-chat-btn" data-chat-id="${chat.id}"><i class="fas fa-trash"></i></button>
                </div>
            `;
            savedChatsList.appendChild(li);
        });
        document.querySelectorAll('.resume-chat-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const chatId = event.target.dataset.chatId;
                resumeChat(chatId);
            });
        });
        document.querySelectorAll('.delete-chat-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const chatId = event.target.dataset.chatId;
                deleteChat(chatId);
                event.stopPropagation();
            });
        });
    } else {
        savedChatsList.innerHTML = '<li>No saved chats. Start a new one!</li>';
    }
}

function resumeChat(chatId) {
    currentChatId = chatId;
    const currentChat = getChatFromStorage(currentChatId);
    chatHistory = currentChat.history;
    showChat();
}

function deleteChat(chatId) {
    let chats = getChatsFromStorage();
    chats = chats.filter(chat => chat.id !== chatId);
    localStorage.setItem('savedChats', JSON.stringify(chats));
    renderSavedChats();
}

function appendMessage(sender, text, imageBase64 = null) {
    const message = {
        sender,
        message: text,
        image: imageBase64,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    chatHistory.push(message);
    appendMessageToDOM(sender, text, imageBase64);
    saveAppState();
}

function appendMessageToDOM(sender, text, imageBase64 = null) {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message-container', sender);
    
    if (sender === 'bot') {
        const logo = createLogo();
        messageContainer.appendChild(logo);
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    
    if (imageBase64) {
        const img = document.createElement('img');
        img.src = imageBase64;
        img.classList.add('message-image');
        messageDiv.appendChild(img);
    }
    
    const messageContent = document.createElement('p');
    messageContent.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    messageDiv.appendChild(messageContent);
    
    const timestamp = document.createElement('span');
    timestamp.classList.add('timestamp');
    timestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    messageContainer.appendChild(timestamp);

    if (sender === 'bot') {
        const copyButton = document.createElement('button');
        copyButton.classList.add('copy-button');
        copyButton.innerHTML = '<i class="far fa-copy"></i>';
        copyButton.addEventListener('click', () => copyMessage(messageContent.textContent));
        messageDiv.appendChild(copyButton);
    }

    messageContainer.appendChild(messageDiv);
    chatBox.appendChild(messageContainer);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function createLogo() {
    const logo = document.createElement('div');
    logo.classList.add('logo');
    logo.textContent = 'LLW';
    return logo;
}

function saveAppState() {
    const chats = getChatsFromStorage();
    const chatIndex = chats.findIndex(chat => chat.id === currentChatId);
    
    const chatToSave = {
        id: currentChatId,
        title: displayChatTitle.textContent,
        history: chatHistory
    };

    if (chatIndex > -1) {
        chats[chatIndex] = chatToSave;
    } else {
        chats.push(chatToSave);
    }

    localStorage.setItem('savedChats', JSON.stringify(chats));
    localStorage.setItem('userName', userName);
}

function loadAppState() {
    userName = localStorage.getItem('userName') || "User";
    const savedChats = localStorage.getItem('savedChats');
    if (savedChats) {
        // Just load the list, don't display a specific chat yet
    }
}

function getChatsFromStorage() {
    const savedChats = localStorage.getItem('savedChats');
    return savedChats ? JSON.parse(savedChats) : [];
}

function getChatFromStorage(chatId) {
    const chats = getChatsFromStorage();
    return chats.find(chat => chat.id === chatId);
}

function copyMessage(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            alert('Message copied to clipboard!');
        })
        .catch(err => {
            console.error('Failed to copy text: ', err);
        });
}

function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

async function sendMessage() {
    const userMessage = userInput.value.trim();
    const imageFile = imageUpload.files[0];
    
    if (!userMessage && !imageFile) return;

    const isFirstMessage = chatHistory.length <= 1;
    
    sendButton.style.display = 'none';
    imageUploadBtn.style.display = 'none';
    stopButton.style.display = 'block';
    userInput.disabled = true;

    appendMessage('user', userMessage, imageFile ? URL.createObjectURL(imageFile) : null);
    userInput.value = '';
    imageUpload.value = '';
    autoResize(userInput); 

    controller = new AbortController();
    const signal = controller.signal;

    try {
        const formData = new FormData();
        formData.append('message', userMessage);
        formData.append('userName', userName);
        formData.append('history', JSON.stringify(chatHistory));

        if (imageFile) {
            formData.append('image', imageFile);
        }
        
        if (isFirstMessage) {
            formData.append('chat_title_request', 'true');
        }

        const response = await fetch(`${backendUrl}/chat`, {
            method: 'POST',
            body: formData,
            signal: signal
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (isFirstMessage && data.chat_title) {
            displayChatTitle.textContent = data.chat_title;
        }

        const botResponse = data.response;
        appendMessage('bot', botResponse);
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Fetch aborted by user.');
            appendMessage('bot', 'Response stopped by user.');
        } else {
            console.error('Error during chat:', error);
            appendMessage('bot', 'I\'m sorry, I encountered an error and couldn\'t respond.');
        }
    } finally {
        sendButton.style.display = 'block';
        imageUploadBtn.style.display = 'block';
        stopButton.style.display = 'none';
        userInput.disabled = false;
        userInput.focus();
        controller = null;
    }
}

function stopResponse() {
    if (controller) {
        controller.abort();
    }
}
