const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');

const homepageDiv = document.getElementById('homepage');
const nameEntryDiv = document.getElementById('name-entry-page');
const chatContainerDiv = document.getElementById('chat-container');
const nameInput = document.getElementById('name-input');
const displayName = document.getElementById('display-name');

const backendUrl = "YOUR_KOYEB_APP_URL"; 
let userName = localStorage.getItem('userName') || null;

// Store a random color for the user's logo for the entire chat session
let userLogoColor = null;

function showHomepage() {
    homepageDiv.style.display = 'flex';
    nameEntryDiv.style.display = 'none';
    chatContainerDiv.style.display = 'none';
}

function showNameEntry() {
    homepageDiv.style.display = 'none';
    nameEntryDiv.style.display = 'flex';
    chatContainerDiv.style.display = 'none';
    nameInput.focus();
}

function showChat() {
    homepageDiv.style.display = 'none';
    nameEntryDiv.style.display = 'none';
    chatContainerDiv.style.display = 'flex';
    userInput.focus();
}

// Function to generate a random hex color
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function startChat(name = null) {
    showChat();
    chatBox.innerHTML = '';
    
    // Set a new random color for the user logo at the start of each chat
    userLogoColor = getRandomColor();
    
    if (name) {
        displayName.innerText = name;
        appendMessage(`Hey, ${name}! LLW AI is here to help.`, 'bot');
    } else {
        displayName.innerText = "User";
        appendMessage("Hey! LLW AI is here to help.", 'bot');
    }
}

window.onload = () => {
    if (userName) {
        startChat(userName);
    } else {
        showHomepage();
    }
}

function showNameEntry() {
    homepageDiv.style.display = 'none';
    nameEntryDiv.style.display = 'flex';
    nameInput.focus();
}

function submitOrSkipName(skip = false) {
    if (!skip && nameInput.value.trim() !== '') {
        userName = nameInput.value.trim();
        localStorage.setItem('userName', userName);
    }
    
    startChat(userName);
}

function editName() {
    const newName = prompt("Enter your new name:");
    
    if (newName && newName.trim() !== '') {
        userName = newName.trim();
        localStorage.setItem('userName', userName);
        displayName.innerText = userName;
        appendMessage(`Hello, ${userName}! Your name has been updated.`, 'bot');
    }
}

function closeChat() {
    showHomepage();
    // New logic to clear user name on close
    localStorage.removeItem('userName');
    userName = null;
    displayName.innerText = "User";
}

async function sendMessage() {
    const message = userInput.value;
    if (message.trim() === '') return;

    appendMessage(message, 'user');
    userInput.value = '';
    
    const loadingMessage = appendMessage("Loading...", 'bot');

    try {
        const response = await fetch(backendUrl + '/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message, userName: userName }),
        });

        const data = await response.json();
        chatBox.removeChild(loadingMessage.parentElement);
        
        if (data.foundName) {
            userName = data.foundName;
            localStorage.setItem('userName', userName);
            displayName.innerText = userName;
            appendMessage(data.response, 'bot');
        } else if (data.response) {
            appendMessage(data.response, 'bot');
        } else {
            appendMessage("Error: " + data.error, 'bot');
        }
    } catch (error) {
        chatBox.removeChild(loadingMessage.parentElement);
        appendMessage("An error occurred. Please try again.", 'bot');
        console.error('Error:', error);
    }
}

function appendMessage(message, sender) {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message-container', sender);
    
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.innerText = message;
    
    const timestampElement = document.createElement('div');
    timestampElement.classList.add('timestamp');
    const now = new Date();
    timestampElement.innerText = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    if (sender === 'user') {
        const userLogo = document.createElement('div');
        userLogo.classList.add('logo');
        userLogo.style.backgroundColor = userLogoColor;
        const firstLetter = (userName || 'U').charAt(0).toUpperCase();
        userLogo.innerText = firstLetter;
        messageContainer.appendChild(messageElement);
        messageContainer.appendChild(userLogo);
    } else {
        const botName = document.createElement('div');
        botName.classList.add('bot-name');
        botName.innerText = "LLW AI";
        messageContainer.appendChild(botName);
        messageContainer.appendChild(messageElement);
    }
    
    messageContainer.appendChild(timestampElement);
    chatBox.appendChild(messageContainer);
    chatBox.scrollTop = chatBox.scrollHeight;
    
    return messageElement;
}

userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});
