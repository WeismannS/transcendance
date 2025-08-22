"use client"

import Miku, { useState, useEffect, useRef } from "Miku"
import { Link } from "Miku/Router"
import { stateManager } from "../../store/StateManager.ts"
import { UserProfileState } from "../../store/StateManager.ts"
import { API_URL, gameConnect } from "../../services/api.ts"

interface GameUpdate {
  type: "gameUpdate" | "gameEnd" | "scoreUpdate" | "reconnection" | "connected" | "gameCreated" | "playerDisconnected" | "gameRejected";
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
    const pathSegments = window.location.pathname.split('/').filter(segment => segment)
    
    if (pathSegments[0] === 'game' && pathSegments[1]) {
      return pathSegments[1]
    }
    return null
  }

export default function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number | null>(null)
  const gameSocket = useRef<WebSocket | null>(null)
  const [gameState, setGameState] = useState("menu") // menu, playing, paused, finished, connecting
  const [gameMode, setGameMode] = useState("quickmatch") // quickmatch, practice, tournament
  const [isVisible, setIsVisible] = useState(false)
  const [opponent, setOpponent] = useState({ name: "Opponent", avatar: "OP", difficulty: "intermediate" })
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [playerNumber, setPlayerNumber] = useState<number>(1) // 1 or 2
  const [waitingForOpponent, setWaitingForOpponent] = useState(false)
  
  const gameId = getGameId()
  
  // Get current user from state manager
  const currentUser = stateManager.getState<UserProfileState>('userProfile')

  // Game state
  const [score, setScore] = useState({ player: 0, opponent: 0 })
  const [sets, setSets] = useState({ player: 0, opponent: 0 })
  const [gameTime, setGameTime] = useState(0)

  // Controls
  const [keys, setKeys] = useState({ up: false, down: false })
  const [matchResults, setMatchResults] = useState<{
    result: "win" | "loss";
    opponent: string;
    score: string;
    duration: string;
    xpGained: number;
    pointsGained: number;
  } | null>(null)

  // Game constants - Match backend dimensions EXACTLY
  const CANVAS_WIDTH = 800
  const CANVAS_HEIGHT = 400
  const BACKEND_WIDTH = 20  // Backend game width
  const BACKEND_HEIGHT = 10 // Backend game height
  const BACKEND_PADDLE_HEIGHT = 2 // Backend paddle height
  const BACKEND_PADDLE_WIDTH = 0.5 // Backend paddle width
  const WINNING_SCORE = 11
  const WINNING_SETS = 2

  // Scale factors for coordinate conversion
  const SCALE_X = CANVAS_WIDTH / BACKEND_WIDTH
  const SCALE_Y = CANVAS_HEIGHT / BACKEND_HEIGHT

  // Calculate scaled paddle dimensions
  const PADDLE_WIDTH = BACKEND_PADDLE_WIDTH * SCALE_X  // 20px
  const PADDLE_HEIGHT = BACKEND_PADDLE_HEIGHT * SCALE_Y // 80px
  const BALL_RADIUS = 8

  // Game objects - using refs to avoid stale closures
  const gameObjects = useRef({
    ball: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, radius: BALL_RADIUS, vx: 6, vy: 4 },
    playerPaddle: { 
      x: playerNumber === 1 ? PADDLE_WIDTH / 2 : CANVAS_WIDTH - (PADDLE_WIDTH * 1.5), 
      y: CANVAS_HEIGHT / 2, 
      width: PADDLE_WIDTH, 
      height: PADDLE_HEIGHT 
    },
    opponentPaddle: { 
      x: playerNumber === 1 ? CANVAS_WIDTH - (PADDLE_WIDTH * 1.5) : PADDLE_WIDTH / 2, 
      y: CANVAS_HEIGHT / 2, 
      width: PADDLE_WIDTH, 
      height: PADDLE_HEIGHT 
    }
  })

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Game timer
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined
    if (gameState === "playing") {
      interval = setInterval(() => {
        setGameTime((prev) => prev + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [gameState])

  // Update paddle positions when player number changes
  useEffect(() => {
    if (playerNumber === 1) {
      gameObjects.current.playerPaddle.x = PADDLE_WIDTH / 2
      gameObjects.current.opponentPaddle.x = CANVAS_WIDTH - (PADDLE_WIDTH * 1.5)
    } else {
      gameObjects.current.playerPaddle.x = CANVAS_WIDTH - (PADDLE_WIDTH * 1.5)
      gameObjects.current.opponentPaddle.x = PADDLE_WIDTH / 2
    }
    gameObjects.current.playerPaddle.width = PADDLE_WIDTH
    gameObjects.current.playerPaddle.height = PADDLE_HEIGHT
    gameObjects.current.opponentPaddle.width = PADDLE_WIDTH
    gameObjects.current.opponentPaddle.height = PADDLE_HEIGHT
  }, [playerNumber])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: any) => {
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault()
          setKeys((prev) => ({ ...prev, up: true }))
          break
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault()
          setKeys((prev) => ({ ...prev, down: true }))
          break
        case " ":
          e.preventDefault()
          if (gameState === "playing") {
            setGameState("paused")
          } else if (gameState === "paused") {
            setGameState("playing")
          }
          break
      }
    }

    const handleKeyUp = (e: any) => {
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault()
          setKeys((prev) => ({ ...prev, up: false }))
          break
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault()
          setKeys((prev) => ({ ...prev, down: false }))
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [gameState, gameId])

  // Send paddle movement in the format backend expects
  const sendPaddleMove = (direction: "up" | "down") => {
    if (gameSocket.current && gameSocket.current.readyState === WebSocket.OPEN) {
      try {
        const message = JSON.stringify({
          type: 'move',
          direction: direction
        })
        console.log("Sending paddle move:", direction)
        gameSocket.current.send(message)
      } catch (error) {
        console.error("Failed to send paddle movement:", error)
      }
    } else {
      console.warn("Cannot send paddle move - socket not ready:", {
        socket: !!gameSocket.current,
        readyState: gameSocket.current?.readyState
      })
    }
  }

  // Throttled paddle movement sending for multiplayer
  const sendPaddleMoveThrottled = useRef({
    lastSent: 0,
    throttleMs: 16, // ~60 FPS
    lastDirection: null as string | null
  })

  const sendPaddleMoveIfNeeded = (direction: "up" | "down") => {
    const now = Date.now()
    const throttleRef = sendPaddleMoveThrottled.current
    
    // Only send if enough time has passed OR direction changed
    if (now - throttleRef.lastSent > throttleRef.throttleMs || throttleRef.lastDirection !== direction) {
      sendPaddleMove(direction)
      throttleRef.lastSent = now
      throttleRef.lastDirection = direction
    }
  }

  // WebSocket connection for multiplayer games
  useEffect(() => {
    if (gameId && currentUser?.id) {
      setGameState("connecting")
      setConnectionError(null)
      
      const connectToGame = async () => {
        try {
          const socket = await gameConnect(currentUser.id, gameId, {
            onMessage: (data) => {
              handleGameMessage(data)
            },
            onClose: () => {
              console.log("Disconnected from game:", gameId)
              if (gameState !== "finished") {
                setConnectionError("Connection lost. Game ended.")
                setGameState("finished")
              }
              gameSocket.current = null
            },
            onOpen: () => {
              console.log("Connected to game:", gameId)
              setConnectionError(null)
            }
          })
          
          if (socket instanceof WebSocket) {
            gameSocket.current = socket
          } else {
            throw socket // gameConnect returned an error
          }
          
        } catch (error) {
          console.error("Failed to connect to game:", error)
          setConnectionError("Failed to connect to game. Please check your connection and try again.")
          setGameState("menu")
        }
      }

      connectToGame()

      return () => {
        if (gameSocket.current) {
          gameSocket.current.close()
          gameSocket.current = null
        }
      }
    } else if (gameId && !currentUser?.id) {
      setConnectionError("User not loaded. Please try refreshing the page.")
      setGameState("menu")
    }
  }, [gameId, currentUser])

  const handleGameMessage = (data: GameUpdate) => {
    console.log("Received game message:", data.type, data)
    
    switch (data.type) {
      case 'connected':
        console.log("Successfully connected to game WebSocket")
        setWaitingForOpponent(true)
        break
        
      case 'gameCreated':
        console.log("Game created:", data)
        if (data.playerNumber) {
          console.log("Setting player number:", data.playerNumber)
          setPlayerNumber(data.playerNumber)
        }
        if (data.opponent) {
          setOpponent({ name: data.opponent, avatar: "OP", difficulty: "intermediate" })
        }
        if (data.waitingForOpponent) {
          setWaitingForOpponent(true)
          setGameState("connecting")
        } else {
          setWaitingForOpponent(false)
          setGameState("playing")
        }
        
        // Initialize game state from server
        if (data.gameBoard) {
          console.log("Initial game board:", data.gameBoard)
          updateGameFromServer(data.gameBoard)
        }
        if (data.score) {
          updateScoreFromServer(data.score, data.playerNumber || 1)
        }
        break
        
      case 'gameUpdate':
        if (data.gameStarted && gameState === "connecting") {
          console.log("Game started, switching to playing state")
          setGameState("playing")
          setWaitingForOpponent(false)
        }
        
        // Update game state from server
        if (data.gameBoard) {
          console.log("Game board update:", data.gameBoard)
          updateGameFromServer(data.gameBoard)
        }
        if (data.score) {
          updateScoreFromServer(data.score, playerNumber)
        }
        break
        
      case 'scoreUpdate':
        if (data.score) {
          updateScoreFromServer(data.score, playerNumber)
        }
        break
        
      case 'gameEnd':
        setGameState("finished")
        if (data.finalScore && data.winner) {
          const isPlayerWinner = data.winner === currentUser?.id?.toString()
          setMatchResults({
            result: isPlayerWinner ? "win" : "loss",
            opponent: opponent.name,
            score: `${data.finalScore.player1} - ${data.finalScore.player2}`,
            duration: formatTime(gameTime),
            xpGained: isPlayerWinner ? 45 : 15,
            pointsGained: isPlayerWinner ? 25 : -10
          })
        }
        break
        
      case 'reconnection':
        console.log("Reconnected to game:", data.gameId)
        if (data.playerNumber) {
          setPlayerNumber(data.playerNumber)
        }
        if (data.gameBoard) {
          updateGameFromServer(data.gameBoard)
        }
        if (data.score) {
          updateScoreFromServer(data.score, data.playerNumber || 1)
        }
        setGameState("playing")
        break
        
      case 'playerDisconnected':
        console.log("Opponent disconnected:", data.message)
        // Show waiting message but keep game state
        setWaitingForOpponent(true)
        break
        
      case 'gameRejected':
        console.log("Game was rejected:", data.message)
        setConnectionError(data.message || "Game invitation was rejected")
        setGameState("menu")
        break
        
      default:
        console.log("Unknown game message type:", data.type)
    }
  }

  // Convert server coordinates to canvas coordinates and update game objects
  const updateGameFromServer = (gameBoard: GameBoard) => {
    const { player1, player2, ball } = gameBoard
    
    console.log("Updating from server - Player number:", playerNumber, "GameBoard:", { 
      player1: player1?.paddleY, 
      player2: player2?.paddleY,
      ball: { x: ball?.x, y: ball?.y }
    })
    
    // Update ball position (convert from server coordinates)
    if (ball) {
      gameObjects.current.ball = {
        ...gameObjects.current.ball, // Preserve existing properties like radius and velocity
        x: ball.x * SCALE_X,
        y: ball.y * SCALE_Y
      }
    }
    
    // Update paddle positions based on player number
    // Server coordinates are paddle center Y, convert to canvas top-left Y
    // Only update opponent paddle position from server, keep player paddle under local control
    if (playerNumber === 1) {
      // Current player is player1 (left paddle), only update opponent (player2) paddle
      if (player2) {
        const serverY = (player2.paddleY * SCALE_Y) - (PADDLE_HEIGHT / 2)
        const targetY = Math.max(0, Math.min(serverY, CANVAS_HEIGHT - PADDLE_HEIGHT))
        
        console.log("Player 1 - Updating opponent paddle from server:", player2.paddleY, "->", targetY)
        
        // Smooth interpolation for opponent paddle to reduce jerkiness
        const currentY = gameObjects.current.opponentPaddle.y
        const lerpFactor = 0.3 // Adjust for smoothness (0.1 = very smooth, 0.5 = responsive)
        gameObjects.current.opponentPaddle.y = currentY + (targetY - currentY) * lerpFactor
      }
      // Don't update player1 paddle from server - keep local control
    } else {
      // Current player is player2 (right paddle), only update opponent (player1) paddle  
      if (player1) {
        const serverY = (player1.paddleY * SCALE_Y) - (PADDLE_HEIGHT / 2)
        const targetY = Math.max(0, Math.min(serverY, CANVAS_HEIGHT - PADDLE_HEIGHT))
        
        console.log("Player 2 - Updating opponent paddle from server:", player1.paddleY, "->", targetY)
        
        // Smooth interpolation for opponent paddle to reduce jerkiness
        const currentY = gameObjects.current.opponentPaddle.y
        const lerpFactor = 0.3 // Adjust for smoothness
        gameObjects.current.opponentPaddle.y = currentY + (targetY - currentY) * lerpFactor
      }
      // Don't update player2 paddle from server - keep local control
    }
  }

  // Update score based on player number
  const updateScoreFromServer = (serverScore: Score, currentPlayerNumber: number) => {
    if (currentPlayerNumber === 1) {
      setScore({ 
        player: serverScore.player1, 
        opponent: serverScore.player2 
      })
    } else {
      setScore({ 
        player: serverScore.player2, 
        opponent: serverScore.player1 
      })
    }
  }

  // Render loop - handles both local and multiplayer game logic
  useEffect(() => {
    const gameLoop = () => {
      if (gameState !== "playing") {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
        return
      }

      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Handle game logic based on mode
      if (gameId) {
        // Multiplayer game - handle local player paddle movement only
        handleMultiplayerLogic()
        render(ctx)
      } else {
        // Local game - full game logic including AI and ball physics
        runLocalGameLogic()
        render(ctx)
      }

      // Continue the loop
      animationRef.current = requestAnimationFrame(gameLoop)
    }

    if (gameState === "playing") {
      animationRef.current = requestAnimationFrame(gameLoop)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameState, keys, gameId])

  // Handle multiplayer game logic - only local player paddle movement
  const handleMultiplayerLogic = () => {
    const { playerPaddle, ball } = gameObjects.current
    const paddleSpeed = 8
    let isMoving = false
    
    // Only handle player paddle movement - server handles ball and opponent
    if (keys.up && playerPaddle.y > 0) {
      playerPaddle.y = Math.max(0, playerPaddle.y - paddleSpeed)
      // Send throttled movement to server
      sendPaddleMoveIfNeeded("up")
      isMoving = true
    }
    if (keys.down && playerPaddle.y < CANVAS_HEIGHT - playerPaddle.height) {
      playerPaddle.y = Math.min(CANVAS_HEIGHT - playerPaddle.height, playerPaddle.y + paddleSpeed)
      // Send throttled movement to server
      sendPaddleMoveIfNeeded("down")
      isMoving = true
    }
    
    // Send stop signal when not moving (to ensure server stops the paddle)
    if (!isMoving && sendPaddleMoveThrottled.current.lastDirection) {
      sendPaddleStop()
    }

    // Client-side prediction for player paddle collision (visual feedback only)
    // Server will send authoritative ball position, but this provides immediate feedback
    clientSideBallPrediction()
  }

  // Basic client-side ball prediction for immediate visual feedback
  const clientSideBallPrediction = () => {
    const { ball, playerPaddle } = gameObjects.current
    
    // Only do basic collision check with player's own paddle for immediate feedback
    // This won't affect server state, just provides responsive visual feedback
    const isPlayerCollision = (
      (playerNumber === 1 && ball.x - (ball.radius || 8) <= playerPaddle.x + playerPaddle.width && ball.vx && ball.vx < 0) ||
      (playerNumber === 2 && ball.x + (ball.radius || 8) >= playerPaddle.x && ball.vx && ball.vx > 0)
    )
    
    if (isPlayerCollision && 
        ball.y >= playerPaddle.y && 
        ball.y <= playerPaddle.y + playerPaddle.height) {
      
      // Simple bounce prediction for immediate feedback
      // Server will override this with authoritative position
      if (ball.vx) {
        ball.vx = -ball.vx
        // Adjust position slightly to prevent stuck ball
        if (playerNumber === 1) {
          ball.x = playerPaddle.x + playerPaddle.width + (ball.radius || 8)
        } else {
          ball.x = playerPaddle.x - (ball.radius || 8)
        }
      }
    }
  }

  // Send stop movement message to server
  const sendPaddleStop = () => {
    const throttleRef = sendPaddleMoveThrottled.current
    if (gameSocket.current && gameSocket.current.readyState === WebSocket.OPEN && throttleRef.lastDirection) {
      try {
        const message = JSON.stringify({
          type: 'stop'
        })
        console.log("Sending paddle stop")
        gameSocket.current.send(message)
        throttleRef.lastDirection = null // Reset last direction
      } catch (error) {
        console.error("Failed to send paddle stop:", error)
      }
    }
  }

  const runLocalGameLogic = () => {
    const { ball, playerPaddle, opponentPaddle } = gameObjects.current

    // Move player paddle - using realistic speed (20px per frame at 60fps)
    const paddleSpeed = 8
    if (keys.up && playerPaddle.y > 0) {
      playerPaddle.y = Math.max(0, playerPaddle.y - paddleSpeed)
    }
    if (keys.down && playerPaddle.y < CANVAS_HEIGHT - playerPaddle.height) {
      playerPaddle.y = Math.min(CANVAS_HEIGHT - playerPaddle.height, playerPaddle.y + paddleSpeed)
    }

    // AI opponent movement - track ball with some lag for challenge
    const paddleCenter = opponentPaddle.y + opponentPaddle.height / 2
    const ballY = ball.y
    const aiSpeed = 6

    if (paddleCenter < ballY - 20) {
      opponentPaddle.y = Math.min(opponentPaddle.y + aiSpeed, CANVAS_HEIGHT - opponentPaddle.height)
    } else if (paddleCenter > ballY + 20) {
      opponentPaddle.y = Math.max(opponentPaddle.y - aiSpeed, 0)
    }

    // Initialize ball velocity if not set
    if (!ball.vx || !ball.vy) {
      ball.vx = 6 * (Math.random() > 0.5 ? 1 : -1)
      ball.vy = 4 * (Math.random() > 0.5 ? 1 : -1)
    }

    // Move ball
    ball.x += ball.vx
    ball.y += ball.vy

    // Ball collision with top and bottom walls
    if (ball.y <= ball.radius || ball.y >= CANVAS_HEIGHT - ball.radius) {
      ball.vy = -ball.vy
      ball.y = Math.max(ball.radius, Math.min(ball.y, CANVAS_HEIGHT - ball.radius))
    }

    // Ball collision with paddles
    // Left paddle collision (player paddle when player is 1, opponent when player is 2)
    const leftPaddle = playerNumber === 1 ? playerPaddle : opponentPaddle
    if (ball.x - ball.radius <= leftPaddle.x + leftPaddle.width && ball.vx < 0) {
      if (ball.y >= leftPaddle.y && ball.y <= leftPaddle.y + leftPaddle.height) {
        ball.vx = -ball.vx
        ball.x = leftPaddle.x + leftPaddle.width + ball.radius
        // Add some angle variation based on where ball hits paddle
        const hitPos = (ball.y - (leftPaddle.y + leftPaddle.height / 2)) / (leftPaddle.height / 2)
        ball.vy += hitPos * 2
      }
    }

    // Right paddle collision (opponent paddle when player is 1, player when player is 2)
    const rightPaddle = playerNumber === 1 ? opponentPaddle : playerPaddle
    if (ball.x + ball.radius >= rightPaddle.x && ball.vx > 0) {
      if (ball.y >= rightPaddle.y && ball.y <= rightPaddle.y + rightPaddle.height) {
        ball.vx = -ball.vx
        ball.x = rightPaddle.x - ball.radius
        // Add some angle variation
        const hitPos = (ball.y - (rightPaddle.y + rightPaddle.height / 2)) / (rightPaddle.height / 2)
        ball.vy += hitPos * 2
      }
    }

    // Limit ball speed
    const maxSpeed = 12
    if (Math.abs(ball.vx) > maxSpeed) ball.vx = maxSpeed * Math.sign(ball.vx)
    if (Math.abs(ball.vy) > maxSpeed) ball.vy = maxSpeed * Math.sign(ball.vy)

    // Score points
    if (ball.x < -ball.radius) {
      setScore((prev) => ({ ...prev, opponent: prev.opponent + 1 }))
      resetBall()
    }
    if (ball.x > CANVAS_WIDTH + ball.radius) {
      setScore((prev) => ({ ...prev, player: prev.player + 1 }))
      resetBall()
    }
  }

  const resetBall = () => {
    gameObjects.current.ball = { 
      x: CANVAS_WIDTH / 2, 
      y: CANVAS_HEIGHT / 2,
      radius: BALL_RADIUS,
      vx: 6 * (Math.random() > 0.5 ? 1 : -1),
      vy: 4 * (Math.random() > 0.5 ? 1 : -1)
    }
  }

  const render = (ctx: CanvasRenderingContext2D) => {
    const { ball, playerPaddle, opponentPaddle } = gameObjects.current

    // Clear canvas
    ctx.fillStyle = "#1e293b"
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Draw center line
    ctx.strokeStyle = "#475569"
    ctx.setLineDash([10, 10])
    ctx.beginPath()
    ctx.moveTo(CANVAS_WIDTH / 2, 0)
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT)
    ctx.stroke()
    ctx.setLineDash([])

    // Draw paddles - player paddle is always orange, opponent is always pink
    ctx.fillStyle = "#f97316" // Orange for player
    ctx.fillRect(playerPaddle.x, playerPaddle.y, playerPaddle.width, playerPaddle.height)
    
    ctx.fillStyle = "#ec4899" // Pink for opponent
    ctx.fillRect(opponentPaddle.x, opponentPaddle.y, opponentPaddle.width, opponentPaddle.height)

    // Draw ball
    ctx.fillStyle = "#ffffff"
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
    ctx.fill()

    // Draw scores
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 48px Arial"
    ctx.textAlign = "center"
    ctx.fillText(score.player.toString(), CANVAS_WIDTH / 4, 60)
    ctx.fillText(score.opponent.toString(), (CANVAS_WIDTH * 3) / 4, 60)
    
    // Show waiting message if opponent not connected
    if (waitingForOpponent && gameId) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      
      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 24px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Waiting for opponent...", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
    }
  }

  // Rest of the component methods remain the same...
  const startGame = (mode: string) => {
    setGameMode(mode)
    setGameState("playing")
    setScore({ player: 0, opponent: 0 })
    setSets({ player: 0, opponent: 0 })
    setGameTime(0)
    
    // Reset game objects for local play
    gameObjects.current = {
      ball: { 
        x: CANVAS_WIDTH / 2, 
        y: CANVAS_HEIGHT / 2, 
        radius: BALL_RADIUS,
        vx: 6 * (Math.random() > 0.5 ? 1 : -1),
        vy: 4 * (Math.random() > 0.5 ? 1 : -1)
      },
      playerPaddle: { x: PADDLE_WIDTH / 2, y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2, width: PADDLE_WIDTH, height: PADDLE_HEIGHT },
      opponentPaddle: { x: CANVAS_WIDTH - PADDLE_WIDTH * 1.5, y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2, width: PADDLE_WIDTH, height: PADDLE_HEIGHT }
    }
  }

  const endGame = (result: "win" | "loss") => {
    setGameState("finished")
    const finalScore = `${sets.player + (result === "win" ? 1 : 0)}-${sets.opponent + (result === "loss" ? 1 : 0)}`
    const xpGained = result === "win" ? 45 + Math.floor(gameTime / 10) : 15

    setMatchResults({
      result: result,
      opponent: opponent.name,
      score: finalScore,
      duration: formatTime(gameTime),
      xpGained,
      pointsGained: result === "win" ? 25 : -10,
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Check for set/match win (only for local games)
  useEffect(() => {
    if (!gameId) { // Only for local games
      if (score.player >= WINNING_SCORE && score.player - score.opponent >= 2) {
        setSets((prev) => ({ ...prev, player: prev.player + 1 }))
        setScore({ player: 0, opponent: 0 })

        if (sets.player + 1 >= WINNING_SETS) {
          endGame("win")
        }
      } else if (score.opponent >= WINNING_SCORE && score.opponent - score.player >= 2) {
        setSets((prev) => ({ ...prev, opponent: prev.opponent + 1 }))
        setScore({ player: 0, opponent: 0 })

        if (sets.opponent + 1 >= WINNING_SETS) {
          endGame("loss")
        }
      }
    }
  }, [score, sets, gameId])

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
          <Link to="/dashboard" className="text-orange-400 hover:text-orange-300 transition-colors">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )

  const renderGameUI = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {/* Game Header */}
      <div className="w-full max-w-4xl mb-4">
        <div className="flex items-center justify-between bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-xl p-4">
          <div className="flex items-center space-x-4">
            {currentUser?.avatar ? (
              <img 
                src={API_URL + `/${currentUser.avatar}`} 
                alt={currentUser.displayName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {currentUser?.displayName?.split(" ").map(n => n[0]).join("") || "U"}
                </span>
              </div>
            )}
            <div>
              <div className="text-white font-semibold">{currentUser?.displayName || "Player"}</div>
              <div className="text-gray-400 text-sm">Player {playerNumber}</div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-white font-bold text-lg">
              Sets: {sets.player} - {sets.opponent}
            </div>
            <div className="text-gray-400 text-sm">{formatTime(gameTime)}</div>
          </div>

          <div className="flex items-center space-x-4">
            <div>
              <div className="text-white font-semibold">{opponent.name}</div>
              <div className="text-gray-400 text-sm">Opponent</div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">{opponent.avatar}</span>
            </div>
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
              <h3 className="text-2xl font-bold text-white mb-4">Game Paused</h3>
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
            onClick={() => setGameState(gameState === "paused" ? "playing" : "paused")}
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
  )

  const renderGameResults = () => (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{matchResults?.result === "win" ? "🏆" : "😔"}</div>
          <h2 className="text-3xl font-bold mb-2">
            <span className={`${matchResults?.result === "win" ? "text-green-400" : "text-red-400"}`}>
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
            <span className="text-white font-bold">{matchResults?.duration}</span>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-xl">
            <span className="text-gray-400">XP Gained:</span>
            <span className="text-orange-400 font-bold">+{matchResults?.xpGained}</span>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-xl">
            <span className="text-gray-400">Rank Points:</span>
            <span className={`font-bold ${(matchResults?.pointsGained ?? 0) > 0 ? "text-green-400" : "text-red-400"}`}>
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
  )

  const renderConnecting = () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-white mb-2">Connecting to Game</h2>
        <p className="text-gray-400">Please wait while we connect you to the game...</p>
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
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div
        className={`transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      >
        {gameState === "connecting" && renderConnecting()}
        {gameState === "menu" && !gameId && renderGameMenu()}
        {(gameState === "playing" || gameState === "paused") && renderGameUI()}
        {gameState === "finished" && renderGameResults()}
      </div>
    </div>
  )
}