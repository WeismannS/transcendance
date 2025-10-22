"use client";

import Miku, { useEffect, useRef, useState } from "Miku";
import { Link } from "Miku/Router";
import { API_URL } from "../../services/api/config";
import { gameConnect } from "../../services/api/game";
import { getPlayerProfile } from "../../services/api/profile";
import type { UserProfileState } from "../../store/StateManager.ts";
import { stateManager } from "../../store/StateManager.ts";

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
	radius?: number;
	vx?: number;
	vy?: number;
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
	const [gameState, setGameState] = useState("connecting");
	const [isVisible, setIsVisible] = useState(false);
	const [opponent, setOpponent] = useState({
		name: "Opponent",
		avatar: "OP",
	});

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
	const [playerNumber, setPlayerNumber] = useState<number>(1);
	const [waitingForOpponent, setWaitingForOpponent] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [pauseReason, setPauseReason] = useState<string | null>(null);
	const [reconnectingPlayer, setReconnectingPlayer] = useState<string | null>(
		null,
	);

	const gameId = getGameId();

	const currentUser = stateManager.getState<UserProfileState>("userProfile");

	const [score, setScore] = useState({ player: 0, opponent: 0 });
	const scoreRef = useRef(score);
	const [gameTime, setGameTime] = useState(0);

	const [keys, setKeys] = useState({ up: false, down: false });
	const [matchResults, setMatchResults] = useState<{
		result: "win" | "loss";
		opponent: string;
		score: string;
		duration: string;
		xpGained: number;
		pointsGained: number;
		reason?: string;
	} | null>(null);

	const CANVAS_WIDTH = 800;
	const CANVAS_HEIGHT = 400;
	const BACKEND_WIDTH = 20;
	const BACKEND_HEIGHT = 10;
	const BACKEND_PADDLE_HEIGHT = 2;
	const BACKEND_PADDLE_WIDTH = 0.5;
	const SCALE_X = CANVAS_WIDTH / BACKEND_WIDTH;
	const SCALE_Y = CANVAS_HEIGHT / BACKEND_HEIGHT;

	const PADDLE_WIDTH = BACKEND_PADDLE_WIDTH * SCALE_X;
	const PADDLE_HEIGHT = BACKEND_PADDLE_HEIGHT * SCALE_Y;
	const BALL_RADIUS = 8;

	const gameObjects = useRef({
		ball: {
			x: CANVAS_WIDTH / 2,
			y: CANVAS_HEIGHT / 2,
			radius: BALL_RADIUS,
			vx: 6,
			vy: 4,
		},
		leftPaddle: {
			x: PADDLE_WIDTH / 2,
			y: CANVAS_HEIGHT / 2,
			width: PADDLE_WIDTH,
			height: PADDLE_HEIGHT,
		},
		rightPaddle: {
			x: CANVAS_WIDTH - PADDLE_WIDTH * 1.5,
			y: CANVAS_HEIGHT / 2,
			width: PADDLE_WIDTH,
			height: PADDLE_HEIGHT,
		},
	});

	useEffect(() => {
		setIsVisible(true);

		if (currentUser) {
			console.log(
				`useEffect: Setting current user ${currentUser.displayName} as player ${playerNumber}`,
			);
			if (playerNumber === 1) {
				setPlayer1Info((prev) => {
					if (
						prev.name === "Player 1" ||
						prev.displayName === currentUser.displayName
					) {
						return {
							name: currentUser.displayName || "Player 1",
							avatar: currentUser.avatar || "",
							displayName: currentUser.displayName || "Player 1",
						};
					}
					return prev;
				});
			} else {
				setPlayer2Info((prev) => {
					if (
						prev.name === "Player 2" ||
						prev.displayName === currentUser.displayName
					) {
						return {
							name: currentUser.displayName || "Player 2",
							avatar: currentUser.avatar || "",
							displayName: currentUser.displayName || "Player 2",
						};
					}
					return prev;
				});
			}
		}
	}, [currentUser, playerNumber]);

	const getLeftSidePlayer = () => {
		if (playerNumber === 1) {
			return {
				name: currentUser?.displayName || "Player 1",
				avatar: currentUser?.avatar || "",
				displayName: currentUser?.displayName || "Player 1",
				isCurrentPlayer: true,
				playerNumber: 1,
			};
		} else {
			return {
				name: player1Info.displayName || "Player 1",
				avatar: player1Info.avatar || "",
				displayName: player1Info.displayName || "Player 1",
				isCurrentPlayer: false,
				playerNumber: 1,
			};
		}
	};

	const getRightSidePlayer = () => {
		if (playerNumber === 2) {
			return {
				name: currentUser?.displayName || "Player 2",
				avatar: currentUser?.avatar || "",
				displayName: currentUser?.displayName || "Player 2",
				isCurrentPlayer: true,
				playerNumber: 2,
			};
		} else {
			return {
				name: player2Info.displayName || "Player 2",
				avatar: player2Info.avatar || "",
				displayName: player2Info.displayName || "Player 2",
				isCurrentPlayer: false,
				playerNumber: 2,
			};
		}
	};

	useEffect(() => {
		console.log("🎮 GAMESTATE CHANGED:", gameState);
		console.log("🎮 Current gameId:", gameId);
		console.log("🎮 Current playerNumber:", playerNumber);
	}, [gameState]);

	useEffect(() => {
		let interval: any;
		if (gameState === "playing" && !isPaused) {
			interval = setInterval(() => {
				setGameTime((prev) => prev + 1);
			}, 1000);
		}
		return () => {
			if (interval) clearInterval(interval);
		};
	}, [gameState, isPaused]);

	useEffect(() => {
		gameObjects.current.leftPaddle.x = PADDLE_WIDTH / 2;

		gameObjects.current.rightPaddle.x = CANVAS_WIDTH - PADDLE_WIDTH * 1.5;

		gameObjects.current.leftPaddle.width = PADDLE_WIDTH;
		gameObjects.current.leftPaddle.height = PADDLE_HEIGHT;
		gameObjects.current.rightPaddle.width = PADDLE_WIDTH;
		gameObjects.current.rightPaddle.height = PADDLE_HEIGHT;

		console.log(
			`🎮 Paddle positions set - Current player (backend player${playerNumber}): LEFT, Opponent: RIGHT`,
		);
	}, [playerNumber]);

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
	}, [gameState]);

	const sendPaddleMoveThrottled = useRef({
		lastSent: 0,
		throttleMs: 16,
		lastDirection: null as string | null,
	});

	useEffect(() => {
		scoreRef.current = score;
	}, [score]);

	useEffect(() => {
		console.log(
			"🔥 WEBSOCKET USEEFFECT RUNNING - gameId:",
			gameId,
			"currentUser:",
			currentUser?.id,
		);
		console.log(
			"🔥 Current gameSocket.current before logic:",
			gameSocket.current,
		);

		if (gameId && currentUser?.id) {
			if (
				gameSocket.current &&
				gameSocket.current.readyState === WebSocket.OPEN
			) {
				console.log("🛑 Socket already connected, skipping new connection");
				return;
			}

			setGameState("connecting");
			setConnectionError(null);

			(async () => {
				try {
					const res = await fetch(`http://localhost:3006/game/${gameId}`);
					if (res.status === 404) {
						console.log(`Game ${gameId} not found on server`);
						setGameState("no-game");
						setConnectionError("Game not found");
						return;
					}
					if (!res.ok) {
						console.error(`Error checking game ${gameId}:`, await res.text());
						setGameState("connection-error");
						setConnectionError("Failed to check game existence");
						return;
					}
				} catch (err) {
					console.error("Failed to check game existence:", err);
					setGameState("connection-error");
					setConnectionError("Failed to check game existence");
					return;
				}

				const connectToGame = async () => {
					console.log("🚀 Starting WebSocket connection process");
					try {
						const socket = await gameConnect(currentUser.id, gameId, {
							onMessage: (data) => {
								console.log("🎯 Received game message:", data.type, data);

								const message = data as any;

								switch (message.type) {
									case "connected":
										console.log("Successfully connected to game WebSocket");
										setWaitingForOpponent(true);
										break;

									case "gameCreated":
										console.log("Game created:", message);
										if (message.playerNumber) {
											console.log(
												"Setting player number:",
												message.playerNumber,
											);
											setPlayerNumber(message.playerNumber);
										}

										if (currentUser && message.playerNumber) {
											console.log(
												`Setting current user ${currentUser.displayName} as player ${message.playerNumber}`,
											);
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

										if (message.opponent) {
											const opponentId = message.opponent;

											getPlayerProfile(opponentId)
												.then((opponentProfile) => {
													setOpponent({
														name:
															opponentProfile.displayName ||
															`Player ${opponentId}`,
														avatar: opponentProfile.avatar || "OP",
													});

													const opponentPlayerNumber =
														message.playerNumber === 1 ? 2 : 1;
													console.log(
														`Setting opponent ${opponentProfile.displayName} as player ${opponentPlayerNumber}`,
													);
													if (opponentPlayerNumber === 1) {
														setPlayer1Info({
															name:
																opponentProfile.displayName ||
																`Player ${opponentId}`,
															avatar: opponentProfile.avatar || "",
															displayName:
																opponentProfile.displayName ||
																`Player ${opponentId}`,
														});
													} else {
														setPlayer2Info({
															name:
																opponentProfile.displayName ||
																`Player ${opponentId}`,
															avatar: opponentProfile.avatar || "",
															displayName:
																opponentProfile.displayName ||
																`Player ${opponentId}`,
														});
													}
												})
												.catch((error) => {
													console.error(
														"Failed to fetch opponent profile:",
														error,
													);
													setOpponent({
														name: `Player ${opponentId}`,
														avatar: "OP",
													});

													const opponentPlayerNumber =
														message.playerNumber === 1 ? 2 : 1;
													if (opponentPlayerNumber === 1) {
														setPlayer1Info({
															name: `Player ${opponentId}`,
															avatar: "",
															displayName: `Player ${opponentId}`,
														});
													} else {
														setPlayer2Info({
															name: `Player ${opponentId}`,
															avatar: "",
															displayName: `Player ${opponentId}`,
														});
													}
												});
										}
										if (message.waitingForOpponent) {
											setWaitingForOpponent(true);
											console.log(
												"🔄 Setting gameState to 'connecting' (waiting for opponent)",
											);
											setGameState("connecting");
										} else {
											setWaitingForOpponent(false);
											console.log(
												"🎮 Setting gameState to 'playing' (game ready)",
											);
											setGameState("playing");
										}

										if (message.gameBoard) {
											console.log("Initial game board:", message.gameBoard);
											updateGameFromServer(message.gameBoard);
										}
										if (message.score) {
											updateScoreFromServer(
												message.score,
												message.playerNumber || 1,
											);
										}
										break;

									case "gameUpdate":
										if (message.gameStarted) {
											console.log(
												"🎮 Game started, switching to playing state",
											);
											setGameState("playing");
											setWaitingForOpponent(false);
										}

										if (message.gameBoard) {
											console.log("Game board update:", message.gameBoard);
											updateGameFromServer(message.gameBoard);
										}
										if (message.score) {
											updateScoreFromServer(
												message.score,
												message.playerNumber || 1,
											);
										}
										break;

									case "scoreUpdate":
										if (message.score) {
											updateScoreFromServer(
												message.score,
												message.playerNumber || 1,
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

									case "gameEnded":
										console.log(
											"🏁 Game ended due to timeout/disconnection:",
											message,
										);
										setGameState("finished");

										if (message.winner && message.reason) {
											const isPlayerWinner =
												message.winner === currentUser?.id?.toString();
											const reasonText =
												message.reason === "Opponent did not reconnect"
													? "opponent disconnected"
													: message.reason;

											setMatchResults({
												result: isPlayerWinner ? "win" : "loss",
												opponent: opponent.name,
												score: isPlayerWinner
													? "Victory by Forfeit"
													: "Loss by Disconnection",
												duration: formatTime(gameTime),
												xpGained: isPlayerWinner ? 45 : 15,
												pointsGained: isPlayerWinner ? 25 : -10,
												reason: reasonText,
											});
										}
										break;

									case "reconnection":
										console.log("🔄 Reconnected to game:", message.gameId);
										if (message.playerNumber) {
											console.log(
												"🔄 Setting player number from reconnection:",
												message.playerNumber,
											);
											setPlayerNumber(message.playerNumber);
										}

										if (currentUser && message.playerNumber) {
											console.log(
												`useEffect: Setting current user ${currentUser.displayName} as player ${message.playerNumber} (reconnection)`,
											);
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

										if (message.opponent) {
											const opponentId = message.opponent;
											console.log(
												`🔄 Fetching opponent profile for reconnection: ${opponentId}`,
											);

											getPlayerProfile(opponentId)
												.then((opponentProfile) => {
													setOpponent({
														name:
															opponentProfile.displayName ||
															`Player ${opponentId}`,
														avatar: opponentProfile.avatar || "OP",
													});

													const opponentPlayerNumber =
														message.playerNumber === 1 ? 2 : 1;
													console.log(
														`Setting opponent ${opponentProfile.displayName} as player ${opponentPlayerNumber} (reconnection)`,
													);
													if (opponentPlayerNumber === 1) {
														setPlayer1Info({
															name:
																opponentProfile.displayName ||
																`Player ${opponentId}`,
															avatar: opponentProfile.avatar || "",
															displayName:
																opponentProfile.displayName ||
																`Player ${opponentId}`,
														});
													} else {
														setPlayer2Info({
															name:
																opponentProfile.displayName ||
																`Player ${opponentId}`,
															avatar: opponentProfile.avatar || "",
															displayName:
																opponentProfile.displayName ||
																`Player ${opponentId}`,
														});
													}
												})
												.catch((error) => {
													console.error(
														"Failed to fetch opponent profile on reconnection:",
														error,
													);
													setOpponent({
														name: `Player ${opponentId}`,
														avatar: "OP",
													});

													const opponentPlayerNumber =
														message.playerNumber === 1 ? 2 : 1;
													if (opponentPlayerNumber === 1) {
														setPlayer1Info({
															name: `Player ${opponentId}`,
															avatar: "",
															displayName: `Player ${opponentId}`,
														});
													} else {
														setPlayer2Info({
															name: `Player ${opponentId}`,
															avatar: "",
															displayName: `Player ${opponentId}`,
														});
													}
												});
										}

										if (message.gameBoard) {
											updateGameFromServer(message.gameBoard);
										}
										if (message.score) {
											updateScoreFromServer(
												message.score,
												message.playerNumber || 1,
											);
										}

										if (message.isPaused) {
											setIsPaused(true);
											setPauseReason(message.pauseReason || "unknown");
											setGameState("paused");
										} else {
											setIsPaused(false);
											setPauseReason(null);
											console.log(
												"🎮 Setting gameState to 'playing' from reconnection",
											);
											setGameState("playing");
										}
										break;

									case "gamePaused":
										console.log("Game paused:", message.reason);
										setIsPaused(true);
										setPauseReason(message.reason || "unknown");
										setGameState("paused");
										break;

									case "gameResumed":
										console.log("Game resumed!");
										setIsPaused(false);
										setPauseReason(null);
										setReconnectingPlayer(null);
										setGameState("playing");
										if (message.gameBoard) {
											updateGameFromServer(message.gameBoard);
										}
										if (message.score) {
											updateScoreFromServer(message.score, playerNumber);
										}
										break;

									case "gameRejected":
										console.log("Game was rejected:", message.message);
										setConnectionError(
											message.message || "Game invitation was rejected",
										);
										setGameState("connecting");
										break;

									case "playerDisconnected":
										console.log("🔌 Player disconnected message:", message);

										if (message.timeoutSeconds) {
											console.log(
												`Player disconnected, waiting ${message.timeoutSeconds} seconds...`,
											);
											setReconnectingPlayer(
												message.disconnectedPlayer || "opponent",
											);
											setIsPaused(true);
											setPauseReason("disconnection");
											setGameState("paused");
										} else if (message.winner && currentUser?.id) {
											console.log(
												"Timeout reached, game ended with winner:",
												message.winner,
											);

											setGameState("finished");

											const isPlayerWinner =
												message.winner === currentUser.id.toString();
											setMatchResults({
												result: isPlayerWinner ? "win" : "loss",
												opponent: opponent.name,
												score: isPlayerWinner
													? "Victory by Forfeit"
													: "Loss by Disconnection",
												duration: formatTime(gameTime),
												xpGained: isPlayerWinner ? 45 : 15,
												pointsGained: isPlayerWinner ? 25 : -10,
												reason: "opponent disconnected",
											});
										}
										break;

									case "disconnectionCountdown":
										console.log(
											"⏰ Ignoring disconnection countdown - games end immediately",
										);
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
									gameSocket.current,
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
									gameSocket.current,
								);
								console.log(
									"✅ WebSocket opened, readyState:",
									gameSocket.current?.readyState,
								);
								setConnectionError(null);
							},
							onError: (error) => {
								console.error("❌ WebSocket ERROR from frontend:", error);
								console.error("❌ Error type:", error.type);
								console.error("❌ Error target:", error.target);
								setConnectionError(
									"WebSocket connection failed. Please try again.",
								);
							},
						});

						if (socket instanceof WebSocket) {
							console.log(
								"📝 ASSIGNING SOCKET - Before assignment, gameSocket.current:",
								gameSocket.current,
							);
							gameSocket.current = socket;
							console.log(
								"📝 ASSIGNING SOCKET - After assignment, gameSocket.current:",
								gameSocket.current,
							);
							console.log(
								"📝 Socket readyState after assignment:",
								gameSocket.current.readyState,
							);
							console.log("📝 Socket URL:", gameSocket.current.url);

							setTimeout(() => {
								console.log(
									"⏰ TIMEOUT CHECK - gameSocket.current:",
									gameSocket.current,
								);
								console.log(
									"⏰ TIMEOUT CHECK - readyState:",
									gameSocket.current?.readyState,
								);
							}, 100);

							const checkInterval = setInterval(() => {
								console.log(
									"🔄 PERIODIC CHECK - gameSocket.current:",
									gameSocket.current,
								);
								console.log(
									"🔄 PERIODIC CHECK - readyState:",
									gameSocket.current?.readyState,
								);
								if (
									!gameSocket.current ||
									gameSocket.current.readyState !== WebSocket.OPEN
								) {
									console.log(
										"🔄 Socket lost or closed, stopping periodic check",
									);
									clearInterval(checkInterval);
								}
							}, 1000);

							setTimeout(() => {
								clearInterval(checkInterval);
							}, 10000);
						} else {
							console.error(
								"🚫 gameConnect did not return a WebSocket:",
								socket,
							);
							throw socket;
						}
					} catch (error) {
						console.error("Failed to connect to game:", error);
						setConnectionError(
							"Failed to connect to game. Please check your connection and try again.",
						);
						setGameState("connecting");
					}
				};

				connectToGame();
			})();

			return () => {
				console.log(
					"🧹 USEEFFECT CLEANUP - Current socket:",
					gameSocket.current,
				);
			};
		} else if (gameId && !currentUser?.id) {
			console.log(
				"❌ Missing currentUser.id, cannot connect - checking if user data is loading",
			);
			if (!connectionError) {
				setGameState("connecting");
			}
		}
	}, [gameId, currentUser]);

	useEffect(() => {
		if (
			gameId &&
			currentUser?.id &&
			gameState === "connecting" &&
			!gameSocket.current
		) {
			console.log("🔄 User data loaded, retrying WebSocket connection...");
		}
	}, [currentUser, gameState, gameId]);

	useEffect(() => {
		console.log("🔍 Socket ref changed:", gameSocket.current);
		console.log("🔍 Socket readyState:", gameSocket.current?.readyState);
	});

	useEffect(() => {
		console.log("🎹 Keys state changed:", keys);
	}, [keys]);

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
			},
		);

		if (ball) {
			gameObjects.current.ball = {
				...gameObjects.current.ball,
				x: ball.x * SCALE_X,
				y: ball.y * SCALE_Y,
			};
		}

		if (player1) {
			const serverY = player1.paddleY * SCALE_Y - PADDLE_HEIGHT / 2;
			const targetY = Math.max(
				0,
				Math.min(serverY, CANVAS_HEIGHT - PADDLE_HEIGHT),
			);

			console.log(
				`Player 1 (LEFT paddle) - Updating from server:`,
				player1.paddleY,
				"->",
				targetY,
			);

			if (playerNumber === 1) {
				gameObjects.current.leftPaddle.y = targetY;
			} else {
				const currentY = gameObjects.current.leftPaddle.y;
				const lerpFactor = 0.6;
				gameObjects.current.leftPaddle.y =
					currentY + (targetY - currentY) * lerpFactor;
			}
		}

		if (player2) {
			const serverY = player2.paddleY * SCALE_Y - PADDLE_HEIGHT / 2;
			const targetY = Math.max(
				0,
				Math.min(serverY, CANVAS_HEIGHT - PADDLE_HEIGHT),
			);

			console.log(
				`Player 2 (RIGHT paddle) - Updating from server:`,
				player2.paddleY,
				"->",
				targetY,
			);

			if (playerNumber === 2) {
				gameObjects.current.rightPaddle.y = targetY;
			} else {
				const currentY = gameObjects.current.rightPaddle.y;
				const lerpFactor = 0.6;
				gameObjects.current.rightPaddle.y =
					currentY + (targetY - currentY) * lerpFactor;
			}
		}
	};
	const updateScoreFromServer = (
		serverScore: Score,
		currentPlayerNumber: number,
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

	useEffect(() => {
		console.log(
			"🎮 GAME LOOP USEEFFECT - gameState:",
			gameState,
			"gameId:",
			gameId,
		);

		const handleMultiplayerLogic = () => {
			if (isPaused) {
				console.log("🔇 Game is paused, not handling input");
				return;
			}

			let isMoving = false;
			console.log("=== HANDLE MULTIPLAYER LOGIC ===");
			console.log("🎮 Keys state:", keys);

			console.log(
				"📱 Current socket reference in handleMultiplayerLogic:",
				gameSocket.current,
			);
			console.log("📱 Socket readyState:", gameSocket.current?.readyState);

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

			if (gameId) {
				const currentSocket = gameSocket.current;
				console.log("🎮 RUNNING MULTIPLAYER LOGIC - Socket state:", {
					hasSocket: !!currentSocket,
					readyState: currentSocket?.readyState,
					webSocketOpen: WebSocket.OPEN,
				});

				console.log("🔬 DEEP DEBUG:");
				console.log("🔬 gameSocket ref object:", gameSocket);
				console.log("🔬 gameSocket.current type:", typeof gameSocket.current);
				console.log(
					"🔬 gameSocket.current constructor:",
					gameSocket.current?.constructor?.name,
				);
				console.log(
					"🔬 Is gameSocket.current a WebSocket?",
					gameSocket.current instanceof WebSocket,
				);

				handleMultiplayerLogic();
				render(ctx);
			} else {
				render(ctx);
			}

			animationRef.current = requestAnimationFrame(gameLoop);
		};

		if ((gameState === "playing" || gameState === "paused") && gameId) {
			console.log(
				"🎯 STARTING GAME LOOP - gameId:",
				gameId,
				"gameState:",
				gameState,
				"isPaused:",
				isPaused,
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
	}, [gameState, gameId, keys, isPaused]);

	const sendPaddleMoveDirectly = (direction: "up" | "down") => {
		console.log("=== DIRECT PADDLE MOVE DEBUG ===");
		console.log("gameSocket.current:", gameSocket.current);
		console.log("gameSocket.current type:", typeof gameSocket.current);
		console.log(
			"gameSocket.current readyState:",
			gameSocket.current?.readyState,
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
				throttleRef.lastDirection = null;
			} catch (error) {
				console.error("Failed to send paddle stop:", error);
			}
		}
	};

	const render = (ctx: CanvasRenderingContext2D) => {
		const { ball, leftPaddle, rightPaddle } = gameObjects.current;

		ctx.fillStyle = "#1e293b";
		ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

		ctx.strokeStyle = "#475569";
		ctx.setLineDash([10, 10]);
		ctx.beginPath();
		ctx.moveTo(CANVAS_WIDTH / 2, 0);
		ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
		ctx.stroke();
		ctx.setLineDash([]);

		const currentPlayerPaddle = playerNumber === 1 ? leftPaddle : rightPaddle;
		const opponentPlayerPaddle = playerNumber === 1 ? rightPaddle : leftPaddle;

		ctx.fillStyle = "#f97316";
		ctx.fillRect(
			currentPlayerPaddle.x,
			currentPlayerPaddle.y,
			currentPlayerPaddle.width,
			currentPlayerPaddle.height,
		);

		ctx.fillStyle = "#ec4899";
		ctx.fillRect(
			opponentPlayerPaddle.x,
			opponentPlayerPaddle.y,
			opponentPlayerPaddle.width,
			opponentPlayerPaddle.height,
		);

		ctx.fillStyle = "#ffffff";
		ctx.beginPath();
		ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
		ctx.fill();

		const currentScore = scoreRef.current;
		ctx.fillStyle = "#ffffff";
		ctx.font = "bold 48px Arial";
		ctx.textAlign = "center";
		ctx.fillText(currentScore.player.toString(), CANVAS_WIDTH / 4, 60);
		ctx.fillText(currentScore.opponent.toString(), (CANVAS_WIDTH * 3) / 4, 60);

		if (waitingForOpponent && gameId) {
			ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
			ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

			ctx.fillStyle = "#ffffff";
			ctx.font = "bold 24px Arial";
			ctx.textAlign = "center";
			ctx.fillText(
				"Waiting for opponent...",
				CANVAS_WIDTH / 2,
				CANVAS_HEIGHT / 2,
			);
		}

		if (isPaused) {
			ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
			ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

			ctx.fillStyle = "#ffffff";
			ctx.font = "bold 32px Arial";
			ctx.textAlign = "center";
			ctx.fillText("GAME PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

			ctx.font = "18px Arial";
			let pauseMessage = "";
			if (pauseReason === "disconnection") {
				if (reconnectingPlayer) {
					pauseMessage = `Waiting for ${reconnectingPlayer} to reconnect...`;
				} else {
					pauseMessage = "Waiting for player to reconnect...";
				}
			} else {
				pauseMessage = "Game paused";
			}

			ctx.fillText(pauseMessage, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
		}
	};

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const renderGameUI = () => {
		const leftPlayer = getLeftSidePlayer();
		const rightPlayer = getRightSidePlayer();

		return (
			<div className="flex flex-col items-center justify-center min-h-screen p-4">
				<div className="w-full max-w-4xl mb-4">
					<div className="flex items-center justify-between bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-xl p-4">
						<div className="flex items-center space-x-4">
							{leftPlayer.avatar ? (
								<img
									src={API_URL + `/${leftPlayer.avatar}`}
									alt={leftPlayer.displayName}
									className="w-10 h-10 rounded-full object-cover"
								/>
							) : (
								<div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
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
								<div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
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
									className="bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all"
								>
									Resume Game
								</button>
							</div>
						</div>
					)}
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
					{matchResults?.reason && (
						<p className="text-gray-300 text-sm italic">
							{matchResults.result === "win"
								? `Won by ${matchResults.reason}`
								: `Lost due to ${matchResults.reason}`}
						</p>
					)}
				</div>

				<div className="space-y-4 mb-8">
					<div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-xl">
						<span className="text-gray-400">Final Score:</span>
						<span className="text-white font-bold">{matchResults?.score}</span>
					</div>
				</div>
				<Link
					to="/dashboard"
					className="block w-full py-3 bg-blue-600 text-white text-center rounded-xl hover:bg-blue-700 transition-all"
				>
					Back to Dashboard
				</Link>
			</div>
		</div>
	);

	const renderPausedGame = () => (
		<div className="flex flex-col items-center justify-center min-h-screen p-4">
			<div className="relative">
				<canvas
					ref={canvasRef}
					width={CANVAS_WIDTH}
					height={CANVAS_HEIGHT}
					className="border-2 border-gray-600 rounded-lg bg-slate-800"
				/>
			</div>
			<div className="mt-4 bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6 max-w-md w-full text-center">
				<h2 className="text-2xl font-bold text-white mb-2">Game Paused</h2>
				{pauseReason === "disconnection" ? (
					<div>
						<p className="text-gray-300 mb-2">
							{reconnectingPlayer
								? `${reconnectingPlayer} disconnected`
								: "Player disconnected"}
						</p>
						<p className="text-orange-400 text-sm">
							Waiting for reconnection...
						</p>
						<div className="flex items-center justify-center mt-3">
							<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-2"></div>
							<span className="text-sm text-gray-400">Reconnecting</span>
						</div>
					</div>
				) : (
					<p className="text-gray-300">Game is paused</p>
				)}
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
					{!currentUser?.id
						? "Loading user data..."
						: "Please wait while we connect you to the game..."}
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

	const renderNoGame = () => (
		<div className="flex items-center justify-center min-h-screen">
			<div className="text-center p-6 bg-gray-800/60 rounded-xl border border-gray-700">
				<h2 className="text-2xl font-bold text-white mb-2">Game Not Found</h2>
				<p className="text-gray-300 mb-4">
					The game you tried to join does not exist or has already ended.
				</p>
				<Link
					to="/dashboard"
					className="inline-block px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
				>
					Back to Dashboard
				</Link>
			</div>
		</div>
	);

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
			<div
				className={`transition-all duration-1000 ${
					isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
				}`}
			>
				{gameState === "connecting" && renderConnecting()}
				{gameState === "no-game" && renderNoGame()}
				{gameState === "playing" && renderGameUI()}
				{gameState === "paused" && renderPausedGame()}
				{gameState === "finished" && renderGameResults()}
			</div>
		</div>
	);
}
