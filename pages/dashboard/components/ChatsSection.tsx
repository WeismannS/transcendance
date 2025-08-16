import Miku, { useState } from "Miku";

interface Message {
  id: number;
  text: string;
  sender: 'me' | 'other';
  time: string;
}

interface Chat {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  messages: Message[];
}

interface ChatsSectionProps {
  chats: Chat[];
}

// Sample chat data with messages
const sampleChats: Chat[] = [
  {
    id: 1,
    name: "Alex Chen",
    lastMessage: "GG! Great match, rematch later?",
    time: "2m ago",
    unread: 2,
    online: true,
    messages: [
      { id: 1, text: "Hey! Ready for another match?", sender: 'me', time: '10:30 AM' },
      { id: 2, text: "That last game was intense 🏓", sender: 'other', time: '10:32 AM' },
      { id: 3, text: "GG! Great match, rematch later?", sender: 'other', time: '10:35 AM' }
    ]
  },
  {
    id: 2,
    name: "Sarah Johnson",
    lastMessage: "Thanks for the tips!",
    time: "1h ago",
    unread: 0,
    online: false,
    messages: [
      { id: 1, text: "Can you help me with my serve?", sender: 'other', time: '9:15 AM' },
      { id: 2, text: "Sure! Try keeping your wrist relaxed", sender: 'me', time: '9:16 AM' },
      { id: 3, text: "Thanks for the tips!", sender: 'other', time: '9:20 AM' }
    ]
  },
  {
    id: 3,
    name: "Mike Torres",
    lastMessage: "See you at practice!",
    time: "3h ago",
    unread: 1,
    online: true,
    messages: [
      { id: 1, text: "Practice is at 6 PM tomorrow", sender: 'other', time: '7:45 AM' },
      { id: 2, text: "Perfect, I'll be there", sender: 'me', time: '7:46 AM' },
      { id: 3, text: "See you at practice!", sender: 'other', time: '7:50 AM' }
    ]
  },
  {
    id: 4,
    name: "Emma Wilson",
    lastMessage: "Good luck in the tournament!",
    time: "5h ago",
    unread: 0,
    online: false,
    messages: [
      { id: 1, text: "Tournament starts next week", sender: 'me', time: '5:30 AM' },
      { id: 2, text: "You've been training hard!", sender: 'other', time: '5:32 AM' },
      { id: 3, text: "Good luck in the tournament!", sender: 'other', time: '5:35 AM' }
    ]
  }
];

export default function ChatsSection() {
  const chats = sampleChats
  const [selectedChatId, setSelectedChatId] = useState<number>(chats[0]?.id || 1);
  const [newMessage, setNewMessage] = useState("");
  const [chatData, setChatData] = useState<Chat[]>(chats);

  const selectedChat = chatData.find(chat => chat.id === selectedChatId);

  const handleChatSelect = (chatId: number) => {
    setSelectedChatId(chatId);
    // Mark messages as read when switching to a chat
    setChatData(prevChats => 
      prevChats.map(chat => 
        chat.id === chatId ? { ...chat, unread: 0 } : chat
      )
    );
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;

    const message: Message = {
      id: selectedChat.messages.length + 1,
      text: newMessage,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatData(prevChats =>
      prevChats.map(chat =>
        chat.id === selectedChatId
          ? {
              ...chat,
              messages: [...chat.messages, message],
              lastMessage: newMessage,
              time: 'now'
            }
          : chat
      )
    );

    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Messages</h2>
        <button className="bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-2 rounded-full font-semibold hover:from-orange-600 hover:to-pink-600 transition-all transform hover:scale-105">
          New Chat
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat List */}
        <div className="lg:col-span-1 space-y-4 max-h-[600px] overflow-y-auto">
          {chatData.map((chat) => (
            <div 
              key={chat.id} 
              onClick={() => handleChatSelect(chat.id)}
              className={`bg-gray-800/50 backdrop-blur-lg border rounded-2xl p-4 transition-all cursor-pointer transform hover:scale-[1.02] ${
                selectedChatId === chat.id 
                  ? 'border-orange-500/70 bg-gray-800/70 shadow-lg shadow-orange-500/20' 
                  : 'border-gray-700 hover:border-orange-500/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {chat.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                    </div>
                    {chat.online && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{chat.name}</h3>
                    <p className="text-gray-400 text-sm">{chat.time}</p>
                  </div>
                </div>
                {chat.unread > 0 && (
                  <div className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {chat.unread}
                  </div>
                )}
              </div>
              <p className="text-gray-300 text-sm truncate">{chat.lastMessage}</p>
            </div>
          ))}
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6">
          {selectedChat ? (
            <>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {selectedChat.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{selectedChat.name}</h3>
                    <p className={`text-sm ${selectedChat.online ? 'text-green-400' : 'text-gray-400'}`}>
                      {selectedChat.online ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2 rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-pink-600 transition-all transform hover:scale-105">
                    Challenge
                  </button>
                  <button className="text-gray-400 hover:text-white transition-colors transform hover:scale-110">
                    ⚙️
                  </button>
                </div>
              </div>

              <div className="space-y-4 mb-6 h-64 overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-orange-500">
                {selectedChat.messages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`px-4 py-2 rounded-2xl max-w-xs ${
                      message.sender === 'me'
                        ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-br-sm'
                        : 'bg-gray-700 text-white rounded-bl-sm'
                    }`}>
                      <p>{message.text}</p>
                      <p className="text-xs opacity-70 mt-1">{message.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-3">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..." 
                  className="flex-1 bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all" 
                />
                <button 
                  onClick={handleSendMessage}
                  className="bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-2 rounded-xl font-semibold hover:from-orange-600 hover:to-pink-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                  disabled={!newMessage.trim()}
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>Select a chat to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}