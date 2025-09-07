"use client";

import Miku, { useState, useEffect, useRef } from "Miku";
import { Link } from "Miku/Router";
import { stateManager } from "../../store/StateManager.ts";
import { UserProfileState } from "../../store/StateManager.ts";
import { API_URL, gameConnect } from "../../services/api.ts";

interface GameUpdate {
  type:
    | "gameUpdate"
    | "gameEnd"
    | "scoreUpdate"
    | "reconnection"
    | "connected"
    | "gameCreated"
    | "playerDisconnected"
    | "gameRejected";
  gameId?: string;
  gameBoard?: GameBoard;
  score?: Score;
  gameStarted?: boolean;
  playerNumber?: number;
  opponent?: string;
  mode?: string;
  waitingForOpponent?: boolean;
  winner?: string;
  finalScore?: Score;
  message?: string;
}

interface GameBoard {
  player1: Player;
  player2: Player;
  ball: Ball;
}

interface Player {
  paddleY: number;
}

interface Ball {
  x: number;
  y: number;
  radius?: number; // Made optional since API doesn't include it
  vx?: number; // velocity x
  vy?: number; // velocity y
}

interface Score {
  player1: number;
  player2: number;
}

const getGameId = () => {
  const pathSegments = window.location.pathname
    .split("/")
    .filter((segment) => segment);

  if (pathSegments[0] === "game" && pathSegments[1]) {
    return pathSegments[1];
  }
  return null;
};

export default function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const gameSocket = useRef<WebSocket | null>(null);
  const [gameState, setGameState] = useState("menu"); // menu, playing, paused, finished, connecting
  const [gameMode, setGameMode] = useState("quickmatch"); // quickmatch, practice, tournament
  const [isVisible, setIsVisible] = useState(false);
  const [opponent, setOpponent] = useState({
    name: "Opponent",
    avatar: "OP",
    difficulty: "intermediate",
  });

  // Store both player information to display correctly based on paddle sides
  const [player1Info, setPlayer1Info] = useState({
    name: "Player 1",
    avatar: "",
    displayName: "Player 1",
  });
  const [player2Info, setPlayer2Info] = useState({
    name: "Player 2",
    avatar: "",
    displayName: "Player 2",
  });

  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [playerNumber, setPlayerNumber] = useState<number>(1); // 1 or 2
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);

  const gameId = getGameId();

  // Get current user from state manager
  const currentUser = stateManager.getState<UserProfileState>("userProfile");

  // Game state
  const [score, setScore] = useState({ player: 0, opponent: 0 });
  const [sets, setSets] = useState({ player: 0, opponent: 0 });
  const [gameTime, setGameTime] = useState(0);

  // Controls
  const [keys, setKeys] = useState({ up: false, down: false });
  const [matchResults, setMatchResults] = useState<{
    result: "win" | "loss";
    opponent: string;
    score: string;
    duration: string;
    xpGained: number;
    pointsGained: number;
  } | null>(null);

  // Game constants - Match backend dimensions EXACTLY
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 400;
  const BACKEND_WIDTH = 20; // Backend game width
  const BACKEND_HEIGHT = 10; // Backend game height
  const BACKEND_PADDLE_HEIGHT = 2; // Backend paddle height
  const BACKEND_PADDLE_WIDTH = 0.5; // Backend paddle width
  const WINNING_SCORE = 11;
  const WINNING_SETS = 2;

  // Scale factors for coordinate conversion
  const SCALE_X = CANVAS_WIDTH / BACKEND_WIDTH;
  const SCALE_Y = CANVAS_HEIGHT / BACKEND_HEIGHT;

  // Calculate scaled paddle dimensions
  const PADDLE_WIDTH = BACKEND_PADDLE_WIDTH * SCALE_X; // 20px
  const PADDLE_HEIGHT = BACKEND_PADDLE_HEIGHT * SCALE_Y; // 80px
  const BALL_RADIUS = 8;

  // Game objects - using refs to avoid stale closures
  const gameObjects = useRef({
    ball: {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      radius: BALL_RADIUS,
      vx: 6,
      vy: 4,
    },
    playerPaddle: {
      // Current player is ALWAYS on the LEFT side in frontend view
      x: PADDLE_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
    },
    opponentPaddle: {
      // Opponent is ALWAYS on the RIGHT side in frontend view
      x: CANVAS_WIDTH - PADDLE_WIDTH * 1.5,
      y: CANVAS_HEIGHT / 2,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
    },
  });

  useEffect(() => {
    setIsVisible(true);

    // Initialize current user as one of the players
    if (currentUser) {
      if (playerNumber === 1) {
        setPlayer1Info({
          name: currentUser.displayName || "Player 1",
          avatar: currentUser.avatar || "",
          displayName: currentUser.displayName || "Player 1",
        });
      } else {
        setPlayer2Info({
          name: currentUser.displayName || "Player 2",
          avatar: currentUser.avatar || "",
          displayName: currentUser.displayName || "Player 2",
        });
      }
    }
  }, [currentUser, playerNumber]);

  // Helper functions to determine which player info to show on which side
  const getLeftSidePlayer = () => {
    // Frontend always shows current player on LEFT, regardless of playerNumber
    return {
      name: currentUser?.displayName || "Player",
      avatar: currentUser?.avatar || "",
      displayName: currentUser?.displayName || "Player",
      isCurrentPlayer: true,
      playerNumber: playerNumber,
    };
  };

  const getRightSidePlayer = () => {
    // Frontend always shows opponent on RIGHT
    const opponentPlayerNumber = playerNumber === 1 ? 2 : 1;
    const opponentInfo = playerNumber === 1 ? player2Info : player1Info;

    return {
      name: opponentInfo.displayName || opponent.name || "Opponent",
      avatar: opponentInfo.avatar || "",
      displayName: opponentInfo.displayName || opponent.name || "Opponent",
      isCurrentPlayer: false,
      playerNumber: opponentPlayerNumber,
    };
  };

  // Monitor gameState changes
  useEffect(() => {
    console.log("🎮 GAMESTATE CHANGED:", gameState);
    console.log("🎮 Current gameId:", gameId);
    console.log("🎮 Current playerNumber:", playerNumber);
  }, [gameState]);

  // Game timer
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (gameState === "playing") {
      interval = setInterval(() => {
        setGameTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState]);

  // Update paddle positions when player number changes
  useEffect(() => {
    // Frontend Perspective: ALWAYS render current player on LEFT, opponent on RIGHT
    // Regardless of backend player number assignment

    // Current player's paddle is ALWAYS on the LEFT
    gameObjects.current.playerPaddle.x = PADDLE_WIDTH / 2;

    // Opponent's paddle is ALWAYS on the RIGHT
    gameObjects.current.opponentPaddle.x = CANVAS_WIDTH - PADDLE_WIDTH * 1.5;

    // Set paddle dimensions
    gameObjects.current.playerPaddle.width = PADDLE_WIDTH;
    gameObjects.current.playerPaddle.height = PADDLE_HEIGHT;
    gameObjects.current.opponentPaddle.width = PADDLE_WIDTH;
    gameObjects.current.opponentPaddle.height = PADDLE_HEIGHT;

    console.log(
      `🎮 Paddle positions set - Current player (backend player${playerNumber}): LEFT, Opponent: RIGHT`
    );
  }, [playerNumber]);

  // Keyboard controls
  useEffect(() => {
    console.log("🎯 Setting up keyboard handlers");

    const handleKeyDown = (e: any) => {
      console.log("🔽 Key pressed:", e.key);
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          console.log("🔼 Setting up key true");
          setKeys((prev) => ({ ...prev, up: true }));
          break;
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          console.log("🔽 Setting down key true");
          setKeys((prev) => ({ ...prev, down: true }));
          break;
        case " ":
          e.preventDefault();
          if (gameState === "playing") {
            setGameState("paused");
          } else if (gameState === "paused") {
            setGameState("playing");
          }
          break;
      }
    };

    const handleKeyUp = (e: any) => {
      console.log("🔼 Key released:", e.key);
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          console.log("🔼 Setting up key false");
          setKeys((prev) => ({ ...prev, up: false }));
          break;
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          console.log("🔽 Setting down key false");
          setKeys((prev) => ({ ...prev, down: false }));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState]); // Fixed: removed gameId dependency

  // Send paddle movement in the format backend expects
  const sendPaddleMove = (direction: "up" | "down") => {
    console.log("=== PADDLE MOVE DEBUG ===");
    console.log("gameSocket.current:", gameSocket.current);
    console.log("gameSocket.current type:", typeof gameSocket.current);
    console.log(
      "gameSocket.current readyState:",
      gameSocket.current?.readyState
    );
    console.log("WebSocket.OPEN constant:", WebSocket.OPEN);
    console.log("Current game state:", gameState);
    console.log("Player number:", playerNumber);
    console.log("Game ID:", gameId);
    console.log("========================");

    if (
      gameSocket.current &&
      gameSocket.current.readyState === WebSocket.OPEN
    ) {
      try {
        const message = JSON.stringify({
          type: "move",
          direction: direction,
        });
        console.log("Sending paddle move:", direction, message);
        gameSocket.current.send(message);
        console.log("Message sent successfully");
      } catch (error) {
        console.error("Failed to send paddle movement:", error);
      }
    } else {
      console.warn("Cannot send paddle move - socket not ready:", {
        socket: !!gameSocket.current,
        readyState: gameSocket.current?.readyState,
        gameState: gameState,
        socketReference: gameSocket.current,
      });
    }
  };

  // Throttled paddle movement sending for multiplayer
  const sendPaddleMoveThrottled = useRef({
    lastSent: 0,
    throttleMs: 16, // ~60 FPS
    lastDirection: null as string | null,
  });

  const sendPaddleMoveIfNeeded = (direction: "up" | "down") => {
    console.log("=== 1PADDLE MOVE DEBUG ===");
    console.log("gameSocket.current:", gameSocket.current);
    console.log("gameSocket.current type:", typeof gameSocket.current);
    console.log(
      "gameSocket.current readyState:",
      gameSocket.current?.readyState
    );
    console.log("WebSocket.OPEN constant:", WebSocket.OPEN);
    console.log("Current game state:", gameState);
    console.log("Player number:", playerNumber);
    console.log("Game ID:", gameId);
    console.log("========================");
    const now = Date.now();
    const throttleRef = sendPaddleMoveThrottled.current;

    // Only send if enough time has passed OR direction changed
    if (
      now - throttleRef.lastSent > throttleRef.throttleMs ||
      throttleRef.lastDirection !== direction
    ) {
      sendPaddleMove(direction);
      throttleRef.lastSent = now;
      throttleRef.lastDirection = direction;
    }
  };

  // WebSocket connection for multiplayer games
  useEffect(() => {
    console.log(
      "🔥 WEBSOCKET USEEFFECT RUNNING - gameId:",
      gameId,
      "currentUser:",
      currentUser?.id
    );
    console.log(
      "🔥 Current gameSocket.current before logic:",
      gameSocket.current
    );

    if (gameId && currentUser?.id) {
      // Prevent multiple connections
      if (
        gameSocket.current &&
        gameSocket.current.readyState === WebSocket.OPEN
      ) {
        console.log("🛑 Socket already connected, skipping new connection");
        return;
      }

      setGameState("connecting");
      setConnectionError(null);

      const connectToGame = async () => {
        console.log("🚀 Starting WebSocket connection process");
        try {
          const socket = await gameConnect(currentUser.id, gameId, {
            onMessage: (data) => {
              // Create a fresh handler that doesn't capture stale state
              console.log("🎯 Received game message:", data.type, data);

              // Cast data to any to access all properties
              const message = data as any;

              switch (message.type) {
                case "connected":
                  console.log("Successfully connected to game WebSocket");
                  setWaitingForOpponent(true);
                  break;

                case "gameCreated":
                  console.log("Game created:", message);
                  if (message.playerNumber) {
                    console.log("Setting player number:", message.playerNumber);
                    setPlayerNumber(message.playerNumber);
                  }
                  if (message.opponent) {
                    setOpponent({
                      name: message.opponent,
                      avatar: "OP",
                      difficulty: "intermediate",
                    });

                    // Update the appropriate player info slot for the opponent
                    const opponentPlayerNumber =
                      message.playerNumber === 1 ? 2 : 1;
                    if (opponentPlayerNumber === 1) {
                      setPlayer1Info({
                        name: message.opponent,
                        avatar: "",
                        displayName: message.opponent,
                      });
                    } else {
                      setPlayer2Info({
                        name: message.opponent,
                        avatar: "",
                        displayName: message.opponent,
                      });
                    }
                  }

                  // Update current player info
                  if (currentUser && message.playerNumber) {
                    if (message.playerNumber === 1) {
                      setPlayer1Info({
                        name: currentUser.displayName || "Player 1",
                        avatar: currentUser.avatar || "",
                        displayName: currentUser.displayName || "Player 1",
                      });
                    } else {
                      setPlayer2Info({
                        name: currentUser.displayName || "Player 2",
                        avatar: currentUser.avatar || "",
                        displayName: currentUser.displayName || "Player 2",
                      });
                    }
                  }
                  if (message.waitingForOpponent) {
                    setWaitingForOpponent(true);
                    console.log(
                      "🔄 Setting gameState to 'connecting' (waiting for opponent)"
                    );
                    setGameState("connecting");
                  } else {
                    setWaitingForOpponent(false);
                    console.log(
                      "🎮 Setting gameState to 'playing' (game ready)"
                    );
                    setGameState("playing");
                  }

                  // Initialize game state from server
                  if (message.gameBoard) {
                    console.log("Initial game board:", message.gameBoard);
                    updateGameFromServer(message.gameBoard);
                  }
                  if (message.score) {
                    updateScoreFromServer(
                      message.score,
                      message.playerNumber || 1
                    );
                  }
                  break;

                case "gameUpdate":
                  // Don't rely on stale gameState, just set to playing if game started
                  if (message.gameStarted) {
                    console.log("🎮 Game started, switching to playing state");
                    setGameState("playing");
                    setWaitingForOpponent(false);
                  }

                  // Update game state from server
                  if (message.gameBoard) {
                    console.log("Game board update:", message.gameBoard);
                    updateGameFromServer(message.gameBoard);
                  }
                  if (message.score) {
                    updateScoreFromServer(
                      message.score,
                      message.playerNumber || 1
                    );
                  }
                  break;

                case "scoreUpdate":
                  if (message.score) {
                    updateScoreFromServer(
                      message.score,
                      message.playerNumber || 1
                    );
                  }
                  break;

                case "gameEnd":
                  console.log("🏁 Game ended, setting state to 'finished'");
                  setGameState("finished");
                  if (message.finalScore && message.winner) {
                    const isPlayerWinner =
                      message.winner === currentUser?.id?.toString();
                    setMatchResults({
                      result: isPlayerWinner ? "win" : "loss",
                      opponent: opponent.name,
                      score: `${message.finalScore.player1} - ${message.finalScore.player2}`,
                      duration: formatTime(gameTime),
                      xpGained: isPlayerWinner ? 45 : 15,
                      pointsGained: isPlayerWinner ? 25 : -10,
                    });
                  }
                  break;

                case "reconnection":
                  console.log("🔄 Reconnected to game:", message.gameId);
                  if (message.playerNumber) {
                    console.log(
                      "🔄 Setting player number from reconnection:",
                      message.playerNumber
                    );
                    setPlayerNumber(message.playerNumber);
                  }
                  if (message.gameBoard) {
                    updateGameFromServer(message.gameBoard);
                  }
                  if (message.score) {
                    updateScoreFromServer(
                      message.score,
                      message.playerNumber || 1
                    );
                  }
                  console.log(
                    "🎮 Setting gameState to 'playing' from reconnection"
                  );
                  setGameState("playing");
                  break;

                case "playerDisconnected":
                  console.log("Opponent disconnected:", message.message);
                  // Show waiting message but keep game state
                  setWaitingForOpponent(true);
                  break;

                case "gameRejected":
                  console.log("Game was rejected:", message.message);
                  setConnectionError(
                    message.message || "Game invitation was rejected"
                  );
                  setGameState("menu");
                  break;

                default:
                  console.log("Unknown game message type:", message.type);
              }
            },
            onClose: (event?: CloseEvent) => {
              console.log("🔴 WebSocket CLOSED - Event details:", event);
              console.log("🔴 Close code:", event?.code);
              console.log("🔴 Close reason:", event?.reason);
              console.log("🔴 Was clean close:", event?.wasClean);
              console.log(
                "🔴 GameSocket before setting to null:",
                gameSocket.current
              );
              console.log("Disconnected from game:", gameId);
              console.log("Setting gameSocket.current to null from onClose");
              setConnectionError("Connection lost. Game ended.");
              setGameState("finished");
              gameSocket.current = null;
            },
            onOpen: () => {
              console.log("✅ WebSocket OPENED successfully!");
              console.log("✅ Connected to game:", gameId);
              console.log(
                "✅ gameSocket.current at onOpen:",
                gameSocket.current
              );
              console.log(
                "✅ WebSocket opened, readyState:",
                gameSocket.current?.readyState
              );
              setConnectionError(null);
            },
            onError: (error) => {
              console.error("❌ WebSocket ERROR from frontend:", error);
              console.error("❌ Error type:", error.type);
              console.error("❌ Error target:", error.target);
              setConnectionError(
                "WebSocket connection failed. Please try again."
              );
            },
          });

          if (socket instanceof WebSocket) {
            console.log(
              "📝 ASSIGNING SOCKET - Before assignment, gameSocket.current:",
              gameSocket.current
            );
            gameSocket.current = socket;
            console.log(
              "📝 ASSIGNING SOCKET - After assignment, gameSocket.current:",
              gameSocket.current
            );
            console.log(
              "📝 Socket readyState after assignment:",
              gameSocket.current.readyState
            );
            console.log("📝 Socket URL:", gameSocket.current.url);

            // Add a small delay to ensure everything is set up
            setTimeout(() => {
              console.log(
                "⏰ TIMEOUT CHECK - gameSocket.current:",
                gameSocket.current
              );
              console.log(
                "⏰ TIMEOUT CHECK - readyState:",
                gameSocket.current?.readyState
              );
            }, 100);

            // Check periodically if socket is still there
            const checkInterval = setInterval(() => {
              console.log(
                "🔄 PERIODIC CHECK - gameSocket.current:",
                gameSocket.current
              );
              console.log(
                "🔄 PERIODIC CHECK - readyState:",
                gameSocket.current?.readyState
              );
              if (
                !gameSocket.current ||
                gameSocket.current.readyState !== WebSocket.OPEN
              ) {
                console.log(
                  "🔄 Socket lost or closed, stopping periodic check"
                );
                clearInterval(checkInterval);
              }
            }, 1000);

            // Stop checking after 10 seconds
            setTimeout(() => {
              clearInterval(checkInterval);
            }, 10000);
          } else {
            console.error("🚫 gameConnect did not return a WebSocket:", socket);
            throw socket; // gameConnect returned an error
          }
        } catch (error) {
          console.error("Failed to connect to game:", error);
          setConnectionError(
            "Failed to connect to game. Please check your connection and try again."
          );
          setGameState("menu");
        }
      };

      connectToGame();

      // Cleanup function to prevent socket from being lost
      return () => {
        console.log(
          "🧹 USEEFFECT CLEANUP - Current socket:",
          gameSocket.current
        );
        // Don't close the socket here, just log that cleanup is running
        // The socket should remain open for the game
      };
    } else if (gameId && !currentUser?.id) {
      console.log("❌ Missing currentUser.id, cannot connect");
      setConnectionError("User not loaded. Please try refreshing the page.");
      setGameState("menu");
    }
  }, [gameId]);

  // Monitor socket changes for debugging
  useEffect(() => {
    console.log("🔍 Socket ref changed:", gameSocket.current);
    console.log("🔍 Socket readyState:", gameSocket.current?.readyState);
  });

  // Monitor keys changes for debugging
  useEffect(() => {
    console.log("🎹 Keys state changed:", keys);
  }, [keys]);

  // Convert server coordinates to canvas coordinates and update game objects
  const updateGameFromServer = (gameBoard: GameBoard) => {
    const { player1, player2, ball } = gameBoard;

    console.log(
      "Updating from server - Player number:",
      playerNumber,
      "GameBoard:",
      {
        player1: player1?.paddleY,
        player2: player2?.paddleY,
        ball: { x: ball?.x, y: ball?.y },
      }
    );

    // Update ball position (convert from server coordinates)
    if (ball) {
      gameObjects.current.ball = {
        ...gameObjects.current.ball, // Preserve existing properties like radius and velocity
        x: ball.x * SCALE_X,
        y: ball.y * SCALE_Y,
      };
    }

    // Frontend Perspective: ALWAYS render current player on LEFT, opponent on RIGHT
    // Regardless of whether backend identifies them as player1 or player2

    // Determine which backend data corresponds to current player vs opponent
    const currentPlayerData = playerNumber === 1 ? player1 : player2;
    const opponentPlayerData = playerNumber === 1 ? player2 : player1;

    // Update current player's paddle (ALWAYS LEFT side in frontend)
    if (currentPlayerData) {
      const serverY = currentPlayerData.paddleY * SCALE_Y - PADDLE_HEIGHT / 2;
      const targetY = Math.max(
        0,
        Math.min(serverY, CANVAS_HEIGHT - PADDLE_HEIGHT)
      );

      console.log(
        `Current Player (backend player${playerNumber}) - Updating LEFT paddle from server:`,
        currentPlayerData.paddleY,
        "->",
        targetY
      );

      // Update left paddle (current player) - direct update for responsiveness
      gameObjects.current.playerPaddle.y = targetY;
    }

    // Update opponent's paddle (ALWAYS RIGHT side in frontend)
    if (opponentPlayerData) {
      const serverY = opponentPlayerData.paddleY * SCALE_Y - PADDLE_HEIGHT / 2;
      const targetY = Math.max(
        0,
        Math.min(serverY, CANVAS_HEIGHT - PADDLE_HEIGHT)
      );

      const opponentPlayerNum = playerNumber === 1 ? 2 : 1;
      console.log(
        `Opponent (backend player${opponentPlayerNum}) - Updating RIGHT paddle from server:`,
        opponentPlayerData.paddleY,
        "->",
        targetY
      );

      // Smooth interpolation for opponent paddle to reduce jerkiness
      const currentY = gameObjects.current.opponentPaddle.y;
      const lerpFactor = 0.6; // More responsive for opponent paddle
      gameObjects.current.opponentPaddle.y =
        currentY + (targetY - currentY) * lerpFactor;
    }
  }; // Update score based on player number
  const updateScoreFromServer = (
    serverScore: Score,
    currentPlayerNumber: number
  ) => {
    if (currentPlayerNumber === 1) {
      setScore({
        player: serverScore.player1,
        opponent: serverScore.player2,
      });
    } else {
      setScore({
        player: serverScore.player2,
        opponent: serverScore.player1,
      });
    }
  };

  // Render loop - handles both local and multiplayer game logic
  useEffect(() => {
    console.log(
      "🎮 GAME LOOP USEEFFECT - gameState:",
      gameState,
      "gameId:",
      gameId
    );

    // Define handleMultiplayerLogic inside useEffect to access fresh socket reference
    const handleMultiplayerLogic = () => {
      // In multiplayer mode, client only sends input to server
      // Server is authoritative for ALL paddle positions, including player's own
      let isMoving = false;
      console.log("=== HANDLE MULTIPLAYER LOGIC ===");
      console.log("🎮 Keys state:", keys);

      // ALWAYS get fresh socket reference DIRECTLY from the ref
      console.log(
        "📱 Current socket reference in handleMultiplayerLogic:",
        gameSocket.current
      );
      console.log("📱 Socket readyState:", gameSocket.current?.readyState);

      // Only send input commands to server - DO NOT move local paddle
      // Server will update our paddle position and send it back via gameUpdate
      if (keys.up) {
        console.log("🔼 UP key pressed - sending command to server");
        if (
          gameSocket.current &&
          gameSocket.current.readyState === WebSocket.OPEN
        ) {
          console.log("🚀 Sending UP movement to server");
          sendPaddleMoveIfNeededDirectly("up");
        } else {
          console.log("❌ Cannot send UP - socket not ready");
          console.log("❌ Socket exists:", !!gameSocket.current);
          console.log("❌ Socket readyState:", gameSocket.current?.readyState);
          console.log("❌ WebSocket.OPEN:", WebSocket.OPEN);
        }
        isMoving = true;
      }
      if (keys.down) {
        console.log("🔽 DOWN key pressed - sending command to server");
        if (
          gameSocket.current &&
          gameSocket.current.readyState === WebSocket.OPEN
        ) {
          console.log("🚀 Sending DOWN movement to server");
          sendPaddleMoveIfNeededDirectly("down");
        } else {
          console.log("❌ Cannot send DOWN - socket not ready");
        }
        isMoving = true;
      }

      // Send stop message if no movement
      if (!isMoving && sendPaddleMoveThrottled.current.lastDirection !== null) {
        console.log("🛑 Stopping paddle movement");
        if (
          gameSocket.current &&
          gameSocket.current.readyState === WebSocket.OPEN
        ) {
          console.log("🚀 Sending STOP to server");
          sendPaddleStopDirectly();
        } else {
          console.log("❌ Cannot send STOP - socket not ready");
        }
        sendPaddleMoveThrottled.current.lastDirection = null;
      }
    };

    const gameLoop = () => {
      console.log("🔄 GAME LOOP ITERATION - gameState:", gameState);

      if (gameState !== "playing") {
        console.log("⏹️ Game not playing, stopping loop");
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        console.log("❌ No canvas found");
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.log("❌ No canvas context");
        return;
      }

      // Handle game logic based on mode
      if (gameId) {
        // Multiplayer game - handle local player paddle movement only
        // ALWAYS get fresh socket reference to avoid closure issues
        const currentSocket = gameSocket.current;
        console.log("🎮 RUNNING MULTIPLAYER LOGIC - Socket state:", {
          hasSocket: !!currentSocket,
          readyState: currentSocket?.readyState,
          webSocketOpen: WebSocket.OPEN,
        });

        // ADDITIONAL DEBUGGING: Let's see if the ref itself is correct
        console.log("🔬 DEEP DEBUG:");
        console.log("🔬 gameSocket ref object:", gameSocket);
        console.log("🔬 gameSocket.current type:", typeof gameSocket.current);
        console.log(
          "🔬 gameSocket.current constructor:",
          gameSocket.current?.constructor?.name
        );
        console.log(
          "🔬 Is gameSocket.current a WebSocket?",
          gameSocket.current instanceof WebSocket
        );

        handleMultiplayerLogic();
        render(ctx);
      } else {
        // Local game - full game logic including AI and ball physics
        console.log("🏠 Running local game logic");
        runLocalGameLogic();
        render(ctx);
      }

      // Continue the loop
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    if (gameState === "playing") {
      console.log(
        "🎯 STARTING GAME LOOP - gameId:",
        gameId,
        "gameState:",
        gameState
      );
      animationRef.current = requestAnimationFrame(gameLoop);
    } else {
      console.log("🚫 NOT STARTING GAME LOOP - gameState:", gameState);
    }

    return () => {
      if (animationRef.current) {
        console.log("🎯 CLEANING UP GAME LOOP");
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, gameId, keys]); // Added keys dependency to fix closure issue

  // Direct paddle movement functions that always access current socket state
  const sendPaddleMoveDirectly = (direction: "up" | "down") => {
    console.log("=== DIRECT PADDLE MOVE DEBUG ===");
    console.log("gameSocket.current:", gameSocket.current);
    console.log("gameSocket.current type:", typeof gameSocket.current);
    console.log(
      "gameSocket.current readyState:",
      gameSocket.current?.readyState
    );
    console.log("WebSocket.OPEN constant:", WebSocket.OPEN);
    console.log("========================");

    if (
      gameSocket.current &&
      gameSocket.current.readyState === WebSocket.OPEN
    ) {
      try {
        const message = JSON.stringify({
          type: "move",
          direction: direction,
        });
        console.log("Sending paddle move:", direction, message);
        gameSocket.current.send(message);
        console.log("Message sent successfully");
      } catch (error) {
        console.error("Failed to send paddle movement:", error);
      }
    } else {
      console.warn("Cannot send paddle move - socket not ready:", {
        socket: !!gameSocket.current,
        readyState: gameSocket.current?.readyState,
        socketReference: gameSocket.current,
      });
    }
  };

  const sendPaddleMoveIfNeededDirectly = (direction: "up" | "down") => {
    const now = Date.now();
    const throttleRef = sendPaddleMoveThrottled.current;

    // Only send if enough time has passed OR direction changed
    if (
      now - throttleRef.lastSent > throttleRef.throttleMs ||
      throttleRef.lastDirection !== direction
    ) {
      sendPaddleMoveDirectly(direction);
      throttleRef.lastSent = now;
      throttleRef.lastDirection = direction;
    }
  };

  const sendPaddleStopDirectly = () => {
    const throttleRef = sendPaddleMoveThrottled.current;
    if (
      gameSocket.current &&
      gameSocket.current.readyState === WebSocket.OPEN &&
      throttleRef.lastDirection
    ) {
      try {
        const message = JSON.stringify({
          type: "stop",
        });
        console.log("Sending paddle stop");
        gameSocket.current.send(message);
        throttleRef.lastDirection = null; // Reset last direction
      } catch (error) {
        console.error("Failed to send paddle stop:", error);
      }
    }
  };

  // Send stop movement message to server
  const sendPaddleStop = () => {
    const throttleRef = sendPaddleMoveThrottled.current;
    if (
      gameSocket.current &&
      gameSocket.current.readyState === WebSocket.OPEN &&
      throttleRef.lastDirection
    ) {
      try {
        const message = JSON.stringify({
          type: "stop",
        });
        console.log("Sending paddle stop");
        gameSocket.current.send(message);
        throttleRef.lastDirection = null; // Reset last direction
      } catch (error) {
        console.error("Failed to send paddle stop:", error);
      }
    }
  };

  const runLocalGameLogic = () => {
    console.log("Running local game logic");
    const { ball, playerPaddle, opponentPaddle } = gameObjects.current;

    // Move player paddle - using realistic speed (20px per frame at 60fps)
    const paddleSpeed = 8;
    if (keys.up && playerPaddle.y > 0) {
      playerPaddle.y = Math.max(0, playerPaddle.y - paddleSpeed);
    }
    if (keys.down && playerPaddle.y < CANVAS_HEIGHT - playerPaddle.height) {
      playerPaddle.y = Math.min(
        CANVAS_HEIGHT - playerPaddle.height,
        playerPaddle.y + paddleSpeed
      );
    }

    // AI opponent movement - track ball with some lag for challenge
    const paddleCenter = opponentPaddle.y + opponentPaddle.height / 2;
    const ballY = ball.y;
    const aiSpeed = 6;

    if (paddleCenter < ballY - 20) {
      opponentPaddle.y = Math.min(
        opponentPaddle.y + aiSpeed,
        CANVAS_HEIGHT - opponentPaddle.height
      );
    } else if (paddleCenter > ballY + 20) {
      opponentPaddle.y = Math.max(opponentPaddle.y - aiSpeed, 0);
    }

    // Initialize ball velocity if not set
    if (!ball.vx || !ball.vy) {
      ball.vx = 6 * (Math.random() > 0.5 ? 1 : -1);
      ball.vy = 4 * (Math.random() > 0.5 ? 1 : -1);
    }

    // Move ball
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Ball collision with top and bottom walls
    if (ball.y <= ball.radius || ball.y >= CANVAS_HEIGHT - ball.radius) {
      ball.vy = -ball.vy;
      ball.y = Math.max(
        ball.radius,
        Math.min(ball.y, CANVAS_HEIGHT - ball.radius)
      );
    }

    // Ball collision with paddles
    // Now with consistent positioning: playerPaddle = LEFT, opponentPaddle = RIGHT

    // Left paddle collision (always player paddle in new consistent layout)
    if (
      ball.x - ball.radius <= playerPaddle.x + playerPaddle.width &&
      ball.vx < 0
    ) {
      if (
        ball.y >= playerPaddle.y &&
        ball.y <= playerPaddle.y + playerPaddle.height
      ) {
        ball.vx = -ball.vx;
        ball.x = playerPaddle.x + playerPaddle.width + ball.radius;
        // Add some angle variation based on where ball hits paddle
        const hitPos =
          (ball.y - (playerPaddle.y + playerPaddle.height / 2)) /
          (playerPaddle.height / 2);
        ball.vy += hitPos * 2;
      }
    }

    // Right paddle collision (always opponent paddle in new consistent layout)
    if (ball.x + ball.radius >= opponentPaddle.x && ball.vx > 0) {
      if (
        ball.y >= opponentPaddle.y &&
        ball.y <= opponentPaddle.y + opponentPaddle.height
      ) {
        ball.vx = -ball.vx;
        ball.x = opponentPaddle.x - ball.radius;
        // Add some angle variation
        const hitPos =
          (ball.y - (opponentPaddle.y + opponentPaddle.height / 2)) /
          (opponentPaddle.height / 2);
        ball.vy += hitPos * 2;
      }
    }

    // Limit ball speed
    const maxSpeed = 12;
    if (Math.abs(ball.vx) > maxSpeed) ball.vx = maxSpeed * Math.sign(ball.vx);
    if (Math.abs(ball.vy) > maxSpeed) ball.vy = maxSpeed * Math.sign(ball.vy);

    // Score points
    if (ball.x < -ball.radius) {
      setScore((prev) => ({ ...prev, opponent: prev.opponent + 1 }));
      resetBall();
    }
    if (ball.x > CANVAS_WIDTH + ball.radius) {
      setScore((prev) => ({ ...prev, player: prev.player + 1 }));
      resetBall();
    }
  };

  const resetBall = () => {
    gameObjects.current.ball = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      radius: BALL_RADIUS,
      vx: 6 * (Math.random() > 0.5 ? 1 : -1),
      vy: 4 * (Math.random() > 0.5 ? 1 : -1),
    };
  };

  const render = (ctx: CanvasRenderingContext2D) => {
    const { ball, playerPaddle, opponentPaddle } = gameObjects.current;

    // Clear canvas
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw center line
    ctx.strokeStyle = "#475569";
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    // Current player is ALWAYS on the LEFT (orange)
    ctx.fillStyle = "#f97316"; // Orange for current player (LEFT side)
    ctx.fillRect(
      playerPaddle.x,
      playerPaddle.y,
      playerPaddle.width,
      playerPaddle.height
    );

    // Opponent is ALWAYS on the RIGHT (pink)
    ctx.fillStyle = "#ec4899"; // Pink for opponent (RIGHT side)
    ctx.fillRect(
      opponentPaddle.x,
      opponentPaddle.y,
      opponentPaddle.width,
      opponentPaddle.height
    );

    // Draw ball
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw scores - current player score on left, opponent score on right
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.fillText(score.player.toString(), CANVAS_WIDTH / 4, 60);
    ctx.fillText(score.opponent.toString(), (CANVAS_WIDTH * 3) / 4, 60);

    // Show waiting message if opponent not connected
    if (waitingForOpponent && gameId) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        "Waiting for opponent...",
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2
      );
    }
  };

  // Rest of the component methods remain the same...
  const startGame = (mode: string) => {
    setGameMode(mode);
    setGameState("playing");
    setScore({ player: 0, opponent: 0 });
    setSets({ player: 0, opponent: 0 });
    setGameTime(0);

    // Reset game objects for local play
    gameObjects.current = {
      ball: {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        radius: BALL_RADIUS,
        vx: 6 * (Math.random() > 0.5 ? 1 : -1),
        vy: 4 * (Math.random() > 0.5 ? 1 : -1),
      },
      playerPaddle: {
        x: PADDLE_WIDTH / 2,
        y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
      },
      opponentPaddle: {
        x: CANVAS_WIDTH - PADDLE_WIDTH * 1.5,
        y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
      },
    };
  };

  const endGame = (result: "win" | "loss") => {
    setGameState("finished");
    const finalScore = `${sets.player + (result === "win" ? 1 : 0)}-${
      sets.opponent + (result === "loss" ? 1 : 0)
    }`;
    const xpGained = result === "win" ? 45 + Math.floor(gameTime / 10) : 15;

    setMatchResults({
      result: result,
      opponent: opponent.name,
      score: finalScore,
      duration: formatTime(gameTime),
      xpGained,
      pointsGained: result === "win" ? 25 : -10,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Check for set/match win (only for local games)
  useEffect(() => {
    if (!gameId) {
      // Only for local games
      if (score.player >= WINNING_SCORE && score.player - score.opponent >= 2) {
        setSets((prev) => ({ ...prev, player: prev.player + 1 }));
        setScore({ player: 0, opponent: 0 });

        if (sets.player + 1 >= WINNING_SETS) {
          endGame("win");
        }
      } else if (
        score.opponent >= WINNING_SCORE &&
        score.opponent - score.player >= 2
      ) {
        setSets((prev) => ({ ...prev, opponent: prev.opponent + 1 }));
        setScore({ player: 0, opponent: 0 });

        if (sets.opponent + 1 >= WINNING_SETS) {
          endGame("loss");
        }
      }
    }
  }, [score, sets, gameId]);

  const renderGameMenu = () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
              Ping Pong Pro
            </span>
          </h1>
          <p className="text-gray-300">Choose your game mode</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => startGame("quickmatch")}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl font-bold text-lg hover:from-orange-600 hover:to-pink-600 transition-all transform hover:scale-105"
          >
            Quick Match
          </button>

          <button
            onClick={() => startGame("practice")}
            className="w-full py-4 bg-gray-700 text-white rounded-xl font-bold text-lg hover:bg-gray-600 transition-all"
          >
            Practice Mode
          </button>

          <button
            onClick={() => startGame("tournament")}
            className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold text-lg hover:bg-purple-700 transition-all"
          >
            Tournament Match
          </button>
        </div>

        <div className="mt-8 p-4 bg-gray-700/30 rounded-xl">
          <h3 className="text-white font-semibold mb-2">Controls:</h3>
          <div className="text-gray-300 text-sm space-y-1">
            <div>↑ / W - Move paddle up</div>
            <div>↓ / S - Move paddle down</div>
            <div>Space - Pause/Resume</div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/dashboard"
            className="text-orange-400 hover:text-orange-300 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );

  const renderGameUI = () => {
    const leftPlayer = getLeftSidePlayer();
    const rightPlayer = getRightSidePlayer();

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        {/* Game Header */}
        <div className="w-full max-w-4xl mb-4">
          <div className="flex items-center justify-between bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-xl p-4">
            {/* LEFT SIDE PLAYER (Current Player) */}
            <div className="flex items-center space-x-4">
              {leftPlayer.avatar ? (
                <img
                  src={API_URL + `/${leftPlayer.avatar}`}
                  alt={leftPlayer.displayName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {leftPlayer.displayName
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || "P"}
                  </span>
                </div>
              )}
              <div>
                <div className="text-white font-semibold">
                  {leftPlayer.displayName}
                </div>
                <div className="text-gray-400 text-sm">
                  {leftPlayer.isCurrentPlayer
                    ? `You (Player ${leftPlayer.playerNumber})`
                    : `Player ${leftPlayer.playerNumber}`}
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-white font-bold text-lg">
                Sets: {sets.player} - {sets.opponent}
              </div>
              <div className="text-gray-400 text-sm">
                {formatTime(gameTime)}
              </div>
            </div>

            {/* RIGHT SIDE PLAYER (Opponent) */}
            <div className="flex items-center space-x-4">
              <div>
                <div className="text-white font-semibold">
                  {rightPlayer.displayName}
                </div>
                <div className="text-gray-400 text-sm">
                  {rightPlayer.isCurrentPlayer
                    ? `You (Player ${rightPlayer.playerNumber})`
                    : `Player ${rightPlayer.playerNumber}`}
                </div>
              </div>
              {rightPlayer.avatar ? (
                <img
                  src={API_URL + `/${rightPlayer.avatar}`}
                  alt={rightPlayer.displayName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {rightPlayer.displayName
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || "P"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Game Canvas */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="border-2 border-gray-700 rounded-xl bg-slate-800"
          />

          {gameState === "paused" && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <div className="bg-gray-800/90 border border-gray-700 rounded-xl p-6 text-center">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Game Paused
                </h3>
                <button
                  onClick={() => setGameState("playing")}
                  className="bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-pink-600 transition-all"
                >
                  Resume Game
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Game Controls */}
        <div className="w-full max-w-4xl mt-4">
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() =>
                setGameState(gameState === "paused" ? "playing" : "paused")
              }
              className="bg-gray-700 text-white px-6 py-2 rounded-xl hover:bg-gray-600 transition-all"
            >
              {gameState === "paused" ? "Resume" : "Pause"}
            </button>

            <button
              onClick={() => setGameState("menu")}
              className="bg-red-600 text-white px-6 py-2 rounded-xl hover:bg-red-700 transition-all"
            >
              Quit Game
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderGameResults = () => (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">
            {matchResults?.result === "win" ? "🏆" : "😔"}
          </div>
          <h2 className="text-3xl font-bold mb-2">
            <span
              className={`${
                matchResults?.result === "win"
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {matchResults?.result === "win" ? "Victory!" : "Defeat"}
            </span>
          </h2>
          <p className="text-gray-300">vs {matchResults?.opponent}</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-xl">
            <span className="text-gray-400">Final Score:</span>
            <span className="text-white font-bold">{matchResults?.score}</span>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-xl">
            <span className="text-gray-400">Duration:</span>
            <span className="text-white font-bold">
              {matchResults?.duration}
            </span>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-xl">
            <span className="text-gray-400">XP Gained:</span>
            <span className="text-orange-400 font-bold">
              +{matchResults?.xpGained}
            </span>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-xl">
            <span className="text-gray-400">Rank Points:</span>
            <span
              className={`font-bold ${
                (matchResults?.pointsGained ?? 0) > 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {(matchResults?.pointsGained ?? 0) > 0 ? "+" : ""}
              {matchResults?.pointsGained ?? 0}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => startGame(gameMode)}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl font-bold hover:from-orange-600 hover:to-pink-600 transition-all"
          >
            Play Again
          </button>

          <button
            onClick={() => setGameState("menu")}
            className="w-full py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-all"
          >
            Main Menu
          </button>

          <Link
            to="/dashboard"
            className="block w-full py-3 bg-purple-600 text-white text-center rounded-xl hover:bg-purple-700 transition-all"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );

  const renderConnecting = () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Connecting to Game
        </h2>
        <p className="text-gray-400">
          Please wait while we connect you to the game...
        </p>
        {connectionError && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-xl">
            <p className="text-red-400">{connectionError}</p>
            <Link
              to="/dashboard"
              className="inline-block mt-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div
        className={`transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {gameState === "connecting" && renderConnecting()}
        {gameState === "menu" && !gameId && renderGameMenu()}
        {(gameState === "playing" || gameState === "paused") && renderGameUI()}
        {gameState === "finished" && renderGameResults()}
      </div>
    </div>
  );
}
