const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');

const homepageDiv = document.getElementById('homepage');
const nameEntryDiv = document.getElementById('name-entry-page');
const chatContainerDiv = document.getElementById('chat-container');
const nameInput = document.getElementById('name-input');
const displayName = document.getElementById('display-name');

const backendUrl = "YOUR_KOYEB_APP_URL"; 
let userName = localStorage.getItem('userName') || null;

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

window.onload = () => {
    if (userName) {
        showChat();
        displayName.innerText = userName;
        appendMessage(`Hey, ${userName}! LLW AI is here to help.`, 'bot');
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
    
    if (userName) {
        displayName.innerText = userName;
        appendMessage(`Hey, ${userName}! LLW AI is here to help.`, 'bot');
    } else {
        displayName.innerText = "User";
        appendMessage("Hey! LLW AI is here to help.", 'bot');
    }
    
    showChat();
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

async function sendMessage() {
    const message = userInput.value;
    if (message.trim() === '') return;

    appendMessage(message, 'user');
    userInput.value = '';
    
    const typingMessage = appendMessage("...", 'bot');

    try {
        const response = await fetch(backendUrl + '/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message, userName: userName }),
        });

        const data = await response.json();
        chatBox.removeChild(typingMessage);
        
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
        chatBox.removeChild(typingMessage);
        appendMessage("An error occurred. Please try again.", 'bot');
        console.error('Error:', error);
    }
}

function appendMessage(message, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);
    messageElement.innerText = message;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
    return messageElement;
}

userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});
