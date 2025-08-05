import Miku from "Miku";
import { Link } from "Miku/Router";

interface Chat {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

interface ChatsSectionProps {
  chats: Chat[];
}

export default function ChatsSection({ chats }: ChatsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Messages</h2>
        <button className="bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-2 rounded-full font-semibold hover:from-orange-600 hover:to-pink-600 transition-all">
          New Chat
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat List */}
        <div className="lg:col-span-1 space-y-4">
          {chats.map((chat) => (
            <div key={chat.id} className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-4 hover:border-orange-500/50 transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{chat.name.split(" ").map((n) => n[0]).join("")}</span>
                    </div>
                    {chat.online && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{chat.name}</h3>
                    <p className="text-gray-400 text-sm">{chat.time}</p>
                  </div>
                </div>
                {chat.unread > 0 && <div className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{chat.unread}</div>}
              </div>
              <p className="text-gray-300 text-sm truncate">{chat.lastMessage}</p>
            </div>
          ))}
        </div>
        {/* Chat Interface */}
        <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">AC</span>
              </div>
              <div>
                <h3 className="text-white font-semibold">Alex Chen</h3>
                <p className="text-green-400 text-sm">Online</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2 rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-pink-600 transition-all">
                <Link to="/game">Challenge</Link>
              </button>
              <button className="text-gray-400 hover:text-white transition-colors">⚙️</button>
            </div>
          </div>
          <div className="space-y-4 mb-6 h-64 overflow-y-auto">
            <div className="flex justify-end">
              <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-2 rounded-2xl rounded-br-sm max-w-xs">Hey! Ready for another match?</div>
            </div>
            <div className="flex justify-start">
              <div className="bg-gray-700 text-white px-4 py-2 rounded-2xl rounded-bl-sm max-w-xs">That last game was intense 🏓</div>
            </div>
            <div className="flex justify-start">
              <div className="bg-gray-700 text-white px-4 py-2 rounded-2xl rounded-bl-sm max-w-xs">GG! Great match, rematch later?</div>
            </div>
          </div>
          <div className="flex space-x-3">
            <input type="text" placeholder="Type a message..." className="flex-1 bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <button className="bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-2 rounded-xl font-semibold hover:from-orange-600 hover:to-pink-600 transition-all">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
