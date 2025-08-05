 import Miku, { useState, useEffect } from "Miku";
 

 
  const friends = [
    {
      id: 1,
      name: "Alex Chen",
      username: "@alexchen",
      avatar: "AC",
      online: true,
      status: "In Game",
      rank: 28,
      lastSeen: "now",
      mutualFriends: 5,
      winRate: 78.5,
    },
    {
      id: 2,
      name: "Maria Rodriguez",
      username: "@maria_r",
      avatar: "MR",
      online: true,
      status: "Online",
      rank: 15,
      lastSeen: "now",
      mutualFriends: 3,
      winRate: 82.1,
    },
    {
      id: 3,
      name: "David Kim",
      username: "@davidk",
      avatar: "DK",
      online: false,
      status: "Offline",
      rank: 45,
      lastSeen: "2 hours ago",
      mutualFriends: 8,
      winRate: 71.3,
    },
    {
      id: 4,
      name: "Sarah Wilson",
      username: "@sarahw",
      avatar: "SW",
      online: true,
      status: "In Tournament",
      rank: 33,
      lastSeen: "now",
      mutualFriends: 2,
      winRate: 75.8,
    },
    {
      id: 5,
      name: "Mike Johnson",
      username: "@mikej",
      avatar: "MJ",
      online: false,
      status: "Offline",
      rank: 67,
      lastSeen: "1 day ago",
      mutualFriends: 1,
      winRate: 68.9,
    },
  ]

  const friendRequests = [
    {
      id: 1,
      name: "Emma Davis",
      username: "@emmad",
      avatar: "ED",
      rank: 52,
      mutualFriends: 4,
      requestTime: "2 hours ago",
    },
    {
      id: 2,
      name: "Tom Wilson",
      username: "@tomw",
      avatar: "TW",
      rank: 89,
      mutualFriends: 1,
      requestTime: "1 day ago",
    },
  ]
 
export default function Friends() {
    function handleQuickMatch(event: any): void {
        throw new Error("Function not implemented.");
    }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Friends</h2>
        <button className="bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-2 rounded-full font-semibold hover:from-orange-600 hover:to-pink-600 transition-all">
          Add Friends
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Friends List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Online Friends */}
          <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Online Friends ({friends.filter((f) => f.online).length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {friends
                .filter((friend) => friend.online)
                .map((friend) => (
                  <div
                    key={friend.id}
                    className="bg-gray-700/30 rounded-xl p-4 hover:bg-gray-700/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">{friend.avatar}</span>
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800"></div>
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">{friend.name}</h4>
                          
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-orange-400 font-bold">#{friend.rank}</div>
                        <div className="text-green-400 text-xs">{friend.status}</div>
                      </div>
                    </div>

                    <div className="flex justify-between text-sm text-gray-300 mb-3">
                      
                      
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={handleQuickMatch}
                        className="flex-1 py-2 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg text-sm font-semibold hover:from-orange-600 hover:to-pink-600 transition-all"
                      >
                        Challenge
                      </button>
                      <button className="px-3 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition-all">💬</button>
                      
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* All Friends */}
          <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">All Friends ({friends.length})</h3>
            <div className="space-y-3">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-3 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-all cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{friend.avatar}</span>
                      </div>
                      {friend.online && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">{friend.name}</h4>
                      <p className="text-gray-400 text-sm">
                        {friend.online ? friend.status : `Last seen ${friend.lastSeen}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right text-sm">
                      <div className="text-orange-400 font-bold">#{friend.rank}</div>
                      
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={handleQuickMatch}
                        className="px-3 py-1 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg text-sm hover:from-orange-600 hover:to-pink-600 transition-all"
                      >
                        Challenge
                      </button>
                      <button className="px-2 py-1 bg-gray-600 rounded-lg hover:bg-gray-500 transition-all text-sm">
                        💬
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Friend Requests & Quick Actions */}
        <div className="space-y-6">
          {/* Friend Requests */}
          <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              Friend Requests
              {friendRequests.length > 0 && (
                <span className="ml-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {friendRequests.length}
                </span>
              )}
            </h3>

            {friendRequests.length > 0 ? (
              <div className="space-y-4">
                {friendRequests.map((request) => (
                  <div key={request.id} className="bg-gray-700/30 rounded-xl p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{request.avatar}</span>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">{request.name}</h4>
                        
                      </div>
                    </div>

                    <div className="text-sm text-gray-300 mb-3">
                      <div>Rank #{request.rank}</div>
                      
                      <div className="text-gray-400">{request.requestTime}</div>
                    </div>

                    <div className="flex space-x-2">
                      <button className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm">
                        Accept
                      </button>
                      <button className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm">
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">👥</div>
                <p className="text-gray-400">No pending requests</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          

          {/* Friend Stats */}
          <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Friend Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Friends:</span>
                <span className="text-white font-semibold">{friends.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Online Now:</span>
                <span className="text-green-400 font-semibold">{friends.filter((f) => f.online).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">In Game:</span>
                <span className="text-orange-400 font-semibold">
                  {friends.filter((f) => f.status === "In Game" || f.status === "In Tournament").length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}