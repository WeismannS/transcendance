"use client"

import Miku, { useState, useEffect, useRef } from "Miku"

export default function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number | null>(null)
  const [gameState, setGameState] = useState("menu") // menu, playing, paused, finished
  const [gameMode, setGameMode] = useState("quickmatch") // quickmatch, practice, tournament
  const [isVisible, setIsVisible] = useState(false)
  const [opponent, setOpponent] = useState({ name: "Alex Chen", avatar: "AC", difficulty: "intermediate" })

  // Game state
  const [score, setScore] = useState({ player: 0, opponent: 0 })
  const [sets, setSets] = useState({ player: 0, opponent: 0 })
  const [gameTime, setGameTime] = useState(0)
  const [ballSpeed, setBallSpeed] = useState(5)

  // Game objects - using refs to avoid stale closures
  const gameObjects = useRef({
    ball: { x: 400, y: 200, dx: 5, dy: 3, radius: 8 },
    playerPaddle: { x: 50, y: 150, width: 15, height: 80, speed: 8 },
    opponentPaddle: { x: 735, y: 150, width: 15, height: 80, speed: 6 }
  })

  // Controls
  const [keys, setKeys] = useState({ up: false, down: false })
  const [matchResults, setMatchResults] = useState(null)

  // Game constants
  const CANVAS_WIDTH = 800
  const CANVAS_HEIGHT = 400
  const WINNING_SCORE = 11
  const WINNING_SETS = 2

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Game timer
  useEffect(() => {
    let interval
    if (gameState === "playing") {
      interval = setInterval(() => {
        setGameTime((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [gameState])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
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

    const handleKeyUp = (e) => {
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
  }, [gameState])

  // Single game loop with requestAnimationFrame
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

      const { ball, playerPaddle, opponentPaddle } = gameObjects.current

      // Move player paddle
      if (keys.up && playerPaddle.y > 0) {
        playerPaddle.y -= playerPaddle.speed
      }
      if (keys.down && playerPaddle.y < CANVAS_HEIGHT - playerPaddle.height) {
        playerPaddle.y += playerPaddle.speed
      }

      // AI opponent movement
      const paddleCenter = opponentPaddle.y + opponentPaddle.height / 2
      const ballY = ball.y

      if (paddleCenter < ballY - 10) {
        opponentPaddle.y = Math.min(opponentPaddle.y + opponentPaddle.speed, CANVAS_HEIGHT - opponentPaddle.height)
      } else if (paddleCenter > ballY + 10) {
        opponentPaddle.y = Math.max(opponentPaddle.y - opponentPaddle.speed, 0)
      }

      // Move ball
      ball.x += ball.dx
      ball.y += ball.dy

      // Top and bottom wall collision
      if (ball.y <= ball.radius || ball.y >= CANVAS_HEIGHT - ball.radius) {
        ball.dy = -ball.dy
      }

      // Player paddle collision
      if (
        ball.x <= playerPaddle.x + playerPaddle.width + ball.radius &&
        ball.x >= playerPaddle.x &&
        ball.y >= playerPaddle.y &&
        ball.y <= playerPaddle.y + playerPaddle.height &&
        ball.dx < 0
      ) {
        ball.dx = Math.abs(ball.dx)
        const hitPos = (ball.y - playerPaddle.y) / playerPaddle.height
        ball.dy = (hitPos - 0.5) * 8
      }

      // Opponent paddle collision
      if (
        ball.x >= opponentPaddle.x - ball.radius &&
        ball.x <= opponentPaddle.x + opponentPaddle.width &&
        ball.y >= opponentPaddle.y &&
        ball.y <= opponentPaddle.y + opponentPaddle.height &&
        ball.dx > 0
      ) {
        ball.dx = -Math.abs(ball.dx)
        const hitPos = (ball.y - opponentPaddle.y) / opponentPaddle.height
        ball.dy = (hitPos - 0.5) * 8
      }

      // Score points
      if (ball.x < 0) {
        setScore((prev) => ({ ...prev, opponent: prev.opponent + 1 }))
        resetBall()
      }
      if (ball.x > CANVAS_WIDTH) {
        setScore((prev) => ({ ...prev, player: prev.player + 1 }))
        resetBall()
      }

      // Render everything
      render(ctx)

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
  }, [gameState, keys])

  const resetBall = () => {
    gameObjects.current.ball = { 
      x: CANVAS_WIDTH / 2, 
      y: CANVAS_HEIGHT / 2, 
      dx: Math.random() > 0.5 ? 5 : -5, 
      dy: (Math.random() - 0.5) * 6, 
      radius: 8 
    }
  }

  const render = (ctx) => {
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

    // Draw paddles
    ctx.fillStyle = "#f97316"
    ctx.fillRect(playerPaddle.x, playerPaddle.y, playerPaddle.width, playerPaddle.height)

    ctx.fillStyle = "#ec4899"
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
  }

  // Check for set/match win
  useEffect(() => {
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
  }, [score, sets])

  const startGame = (mode) => {
    setGameMode(mode)
    setGameState("playing")
    setScore({ player: 0, opponent: 0 })
    setSets({ player: 0, opponent: 0 })
    setGameTime(0)
    
    // Reset game objects
    gameObjects.current = {
      ball: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, dx: 5, dy: 3, radius: 8 },
      playerPaddle: { x: 50, y: 150, width: 15, height: 80, speed: 8 },
      opponentPaddle: { x: 735, y: 150, width: 15, height: 80, speed: 6 }
    }
  }

  const endGame = (result) => {
    setGameState("finished")
    const finalScore = `${sets.player + (result === "win" ? 1 : 0)}-${sets.opponent + (result === "loss" ? 1 : 0)}`
    const xpGained = result === "win" ? 45 + Math.floor(gameTime / 10) : 15

    setMatchResults({
      result,
      opponent: opponent.name,
      score: finalScore,
      duration: formatTime(gameTime),
      xpGained,
      pointsGained: result === "win" ? 25 : -10,
    })
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

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
            🚀 Quick Match
          </button>

          <button
            onClick={() => startGame("practice")}
            className="w-full py-4 bg-gray-700 text-white rounded-xl font-bold text-lg hover:bg-gray-600 transition-all"
          >
            🎯 Practice Mode
          </button>

          <button
            onClick={() => startGame("tournament")}
            className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold text-lg hover:bg-purple-700 transition-all"
          >
            🏆 Tournament Match
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
          <a href="/dashboard" className="text-orange-400 hover:text-orange-300 transition-colors">
            ← Back to Dashboard
          </a>
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
            <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">JD</span>
            </div>
            <div>
              <div className="text-white font-semibold">John Doe</div>
              <div className="text-gray-400 text-sm">You</div>
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
            <span className={`font-bold ${matchResults?.pointsGained > 0 ? "text-green-400" : "text-red-400"}`}>
              {matchResults?.pointsGained > 0 ? "+" : ""}
              {matchResults?.pointsGained}
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

          <a
            href="/dashboard"
            className="block w-full py-3 bg-purple-600 text-white text-center rounded-xl hover:bg-purple-700 transition-all"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div
        className={`transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      >
        {gameState === "menu" && renderGameMenu()}
        {(gameState === "playing" || gameState === "paused") && renderGameUI()}
        {gameState === "finished" && renderGameResults()}
      </div>
    </div>
  )
}