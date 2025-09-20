"use client"

import { CardContent } from "@/components/ui/card"
import { useFrame } from "@react-three/fiber"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Clock, Flag, Handshake, ChevronLeft, List, Expand } from "lucide-react"
import { Inter } from "next/font/google"
import type * as THREE from "three"

const inter = Inter({ subsets: ["latin"] })

// Mock data for demonstration
const initialMoves = [
  { number: 1, white: "e4", black: "e5" },
  { number: 2, white: "Nf3", black: "Nc6" },
  { number: 3, white: "Bb5", black: "a6" },
]

const additionalMoves = [
  { number: 4, white: "Ba4", black: "Nf6" },
  { number: 5, white: "O-O", black: "Be7" },
  { number: 6, white: "Re1", black: "b5" },
  { number: 7, white: "Bb3", black: "d6" },
]

const playerNames = ["Александр", "Мария", "Дмитрий", "Анна", "Сергей", "Елена", "Михаил", "Ольга"]

const gradientColors = [
  "from-[#5757EB] to-purple-600",
  "from-[#5757EB] to-blue-600",
  "from-orange-500 to-red-600",
  "from-pink-500 to-rose-600",
  "from-green-500 to-teal-600",
  "from-yellow-500 to-orange-600",
]

const players = {
  white: { name: playerNames[0], gradient: gradientColors[0] },
  black: { name: playerNames[1], gradient: gradientColors[1] },
}

function ChessBoard() {
  return (
    <div className="w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] md:w-[600px] md:h-[600px] lg:w-[700px] lg:h-[700px] xl:w-[800px] xl:h-[800px] 2xl:w-[900px] 2xl:h-[900px] max-w-[min(95vw,90vh)] max-h-[min(95vw,90vh)] bg-gray-800 rounded-lg shadow-lg"></div>
  )
}

function PlayerProfile({ name, gradient }: { name: string; gradient: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold`}
      >
        {name[0]}
      </div>
      <span className="font-semibold text-lg text-white">{name}</span>
    </div>
  )
}

function Timer({ time, isActive }: { time: string; isActive: boolean }) {
  return (
    <Card
      className={`bg-gray-900 border-gray-700 flex items-center justify-center gap-2 p-3 ${isActive ? "ring-2 ring-[#5757EB]" : ""}`}
    >
      <Clock className="w-4 h-4 text-white" />
      <span className="font-sans text-white font-semibold text-xl">{time}</span>
    </Card>
  )
}

function MovesPreview({
  moves,
  onExpand,
}: {
  moves: Array<{ number: number; white: string; black?: string }>
  onExpand: () => void
}) {
  const latestMoves = moves?.filter((move) => move && typeof move.number !== "undefined" && move.white).slice(-6) || [] // Show last 6 valid moves

  return (
    <div className="fixed bottom-6 right-6 z-20 cursor-pointer group" onClick={onExpand}>
      {/* macOS-style header with traffic lights */}
      <div className="w-[260px] h-[160px] backdrop-blur-md shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] rounded-xl border border-gray-700/30 overflow-hidden bg-transparent">
        {/* Content area */}
        <div className="h-[160px] flex flex-col relative bg-gray-900/95">
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black via-black/90 to-transparent pointer-events-none z-10" />

          <div className="flex-1 overflow-y-auto scrollbar-hide pt-1 bg-transparent">
            <div className="p-3 space-y-1 min-h-full flex flex-col justify-end bg-black">
              {latestMoves.length === 0 ? (
                <div className="text-xs text-gray-500 text-center py-6">No moves yet</div>
              ) : (
                latestMoves.map((move, index) => (
                  <div
                    key={`${move.number}-${index}`}
                    className="flex items-center py-1.5 px-2 rounded-md hover:bg-gray-800/30 transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-1 w-full"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animationDuration: "400ms",
                      animationFillMode: "both",
                    }}
                  >
                    <span className="text-xs text-gray-400 w-5 font-mono tabular-nums shrink-0 text-right mr-2">
                      {move.number}.
                    </span>

                    <div className="flex items-center gap-1.5 flex-1">
                      <span className="text-xs text-gray-100 font-mono flex-1 bg-gray-800/40 px-2 py-1 rounded border border-gray-700/50 text-center hover:bg-[#5757EB]/20 hover:border-[#5757EB]/30 transition-colors">
                        {move.white || ""}
                      </span>
                      {move.black && (
                        <span className="text-xs text-gray-100 font-mono flex-1 bg-gray-800/40 px-2 py-1 rounded border border-gray-700/50 text-center hover:bg-[#5757EB]/20 hover:border-[#5757EB]/30 transition-colors">
                          {move.black}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-black to-transparent pointer-events-none" />

          <div className="absolute inset-0 bg-[#5757EB]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <div className="absolute bottom-2 right-2 z-20 pointer-events-none">
            <Expand className="w-3 h-3 text-gray-400 group-hover:text-[#5757EB] transition-colors duration-300" />
          </div>
        </div>
      </div>
    </div>
  )
}

function MovesWindow({
  moves,
  isOpen,
  onClose,
}: {
  moves: Array<{ number: number; white: string; black?: string }>
  isOpen: boolean
  onClose: () => void
}) {
  const movesContainerRef = useRef<HTMLDivElement | null>(null)
  const sidebarRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (movesContainerRef.current) {
      movesContainerRef.current.scrollTop = movesContainerRef.current.scrollHeight
    }
  }, [moves])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node) && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-30 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        ref={sidebarRef}
        className={`fixed top-0 right-0 h-full z-40 transition-all duration-500 ease-out ${
          isOpen ? "w-80 md:w-96 translate-x-0 shadow-2xl" : "w-0 translate-x-full shadow-none"
        }`}
      >
        <Card className="h-full bg-gray-950/95 border-l border-gray-700/50 backdrop-blur-md rounded-none overflow-hidden">
          

          <CardContent className="p-0 h-full flex flex-col relative">
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-gray-900/95 via-gray-900/90 to-transparent pointer-events-none z-10" />

            <div
              className="flex-1 overflow-y-auto scrollbar-hide pt-4"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
              ref={movesContainerRef}
            >
              <div className="p-4 space-y-2 min-h-full flex flex-col justify-end">
                {moves
                  ?.filter((move) => move && typeof move.number !== "undefined")
                  .map((move, index) => (
                    <div
                      key={`${move.number}-${index}`}
                      className="flex items-center py-3 px-4 rounded-lg hover:bg-gray-800/30 transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-2 w-full"
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animationDuration: "400ms",
                        animationFillMode: "both",
                      }}
                    >
                      <span className="text-sm text-gray-400 w-8 font-mono tabular-nums shrink-0 text-right mr-4">
                        {move.number}.
                      </span>

                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-sm text-gray-100 font-mono flex-1 bg-gray-800/40 px-3 py-2 rounded border border-gray-700/50 text-center hover:bg-[#5757EB]/20 hover:border-[#5757EB]/30 transition-colors">
                          {move.white || ""}
                        </span>
                        {move.black && (
                          <span className="text-sm text-gray-100 font-mono flex-1 bg-gray-800/40 px-3 py-2 rounded border border-gray-700/50 text-center hover:bg-[#5757EB]/20 hover:border-[#5757EB]/30 transition-colors">
                            {move.black}
                          </span>
                        )}
                      </div>
                    </div>
                  )) || []}
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-900/95 to-transparent pointer-events-none" />
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function SpinningLogo() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5
    }
  })

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.5, 0.5, 0.5]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#cccccc" />
      </mesh>
      <mesh position={[-0.5, -0.5, -0.5]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#999999" />
      </mesh>
    </group>
  )
}

function CombinedTimer({
  whiteTime,
  blackTime,
  activePlayer,
}: {
  whiteTime: string
  blackTime: string
  activePlayer: "white" | "black"
}) {
  return (
    <Card className="bg-gray-900 border-gray-700 overflow-hidden border-0 w-full">
      <div className="flex flex-col">
        {/* Black player timer (top half) */}
        <div
          className={`flex-1 p-4 flex items-center justify-center gap-2 border-b border-gray-700 ${
            activePlayer === "black" ? "bg-[#5757EB]/20 ring-1 ring-[#5757EB]/50" : ""
          }`}
        >
          <Clock className="w-4 h-4 text-white" />
          <span className="font-sans text-white font-semibold text-xl">{blackTime}</span>
          <span className="text-xs text-gray-400 ml-1">Black</span>
        </div>

        {/* White player timer (bottom half) */}
        <div
          className={`flex-1 p-4 flex items-center justify-center gap-2 ${
            activePlayer === "white" ? "bg-[#5757EB]/20 ring-1 ring-[#5757EB]/50" : ""
          }`}
        >
          <Clock className="w-4 h-4 text-white" />
          <span className="font-sans text-white font-semibold text-xl">{whiteTime}</span>
          <span className="text-xs text-gray-400 ml-1">White</span>
        </div>
      </div>
    </Card>
  )
}

export default function GamePage() {
  const [whiteTime, setWhiteTime] = useState("01:00")
  const [blackTime, setBlackTime] = useState("01:00")
  const [activePlayer, setActivePlayer] = useState<"white" | "black">("white")
  const [moves, setMoves] = useState<Array<{ number: number; white: string; black?: string }>>([])
  const [isMovesOpen, setIsMovesOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const allMoves = [
      ...initialMoves,
      ...additionalMoves,
      { number: 8, white: "h3", black: "O-O" },
      { number: 9, white: "c3", black: "Bb7" },
      { number: 10, white: "d4", black: "Re8" },
      { number: 11, white: "Nbd2", black: "Bf8" },
      { number: 12, white: "a4", black: "h6" },
    ]

    let currentIndex = 0
    const addMove = () => {
      if (currentIndex < allMoves.length) {
        setMoves((prev) => [...prev, allMoves[currentIndex]])
        setActivePlayer(currentIndex % 2 === 0 ? "white" : "black")
        currentIndex++
        setTimeout(addMove, 1500) // Faster timing for better demonstration
      }
    }

    setTimeout(addMove, 500)
  }, [])

  const handleResign = () => {
    router.push("/")
  }

  return (
    <div className={`h-screen bg-black text-white flex flex-col relative overflow-hidden ${inter.className}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "25s" }}
        />
        <div
          className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-br from-pink-400/8 to-rose-400/8 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "30s", animationDelay: "5s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-br from-indigo-400/6 to-cyan-400/6 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "35s", animationDelay: "10s" }}
        />
        <div
          className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-gradient-to-br from-violet-400/8 to-fuchsia-400/8 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "28s", animationDelay: "15s" }}
        />
        <div
          className="absolute top-1/3 right-1/3 w-88 h-88 bg-gradient-to-br from-emerald-400/7 to-teal-400/7 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "32s", animationDelay: "8s" }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center relative z-10 min-h-0 h-full py-4">
        {/* Main Game Area */}
        <div className="flex justify-center items-center w-full h-full relative max-w-7xl mx-auto px-4">
          <div className="relative flex items-center justify-center h-full">
            {/* Black player avatar - positioned at top left of board */}
            <div className="absolute -left-20 sm:-left-24 md:-left-28 -top-8 sm:-top-10 z-10">
              <PlayerProfile name={players.black.name} gradient={players.black.gradient} />
            </div>

            {/* Chess Board - centered and responsive to screen height */}
            <div className="flex items-center justify-center h-full">
              <ChessBoard />
            </div>

            {/* White player avatar - positioned at bottom left of board */}
            <div className="absolute -left-20 sm:-left-24 md:-left-28 -bottom-8 sm:-bottom-10 z-10">
              <PlayerProfile name={players.white.name} gradient={players.white.gradient} />
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex flex-col justify-center items-center gap-6 lg:gap-8 flex-shrink-0 min-w-[250px] ml-8 lg:ml-12">
            {/* Combined Timer */}
            <CombinedTimer whiteTime={whiteTime} blackTime={blackTime} activePlayer={activePlayer} />

            {/* Game Control Buttons */}
            <div className="flex flex-col gap-3 w-full">
              <Button
                variant="outline"
                className="gap-2 font-medium bg-red-900/80 border-red-800 text-red-200 hover:bg-red-800 hover:border-red-700 hover:text-red-100 transition-colors w-full"
                onClick={handleResign}
              >
                <Flag className="w-4 h-4" />
                Сдаться
              </Button>
              <Button
                variant="outline"
                className="gap-2 font-medium border-gray-700 text-gray-300 hover:bg-[#5757EB]/20 hover:border-[#5757EB] bg-transparent hover:text-white transition-colors w-full"
              >
                <Handshake className="w-4 h-4" />
                Ничья
              </Button>
            </div>
          </div>
        </div>
      </div>

      <MovesPreview moves={moves} onExpand={() => setIsMovesOpen(true)} />

      <MovesWindow moves={moves} isOpen={isMovesOpen} onClose={() => setIsMovesOpen(false)} />

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px) scale(1); }
          25% { transform: translateY(-20px) translateX(10px) scale(1.05); }
          50% { transform: translateY(-10px) translateX(-15px) scale(0.95); }
          75% { transform: translateY(-30px) translateX(5px) scale(1.02); }
        }
        
        .animate-float-1 { animation: float 25s ease-in-out infinite; }
        .animate-float-2 { animation: float 30s ease-in-out infinite 5s; }
        .animate-float-3 { animation: float 35s ease-in-out infinite 10s; }
        .animate-float-4 { animation: float 28s ease-in-out infinite 15s; }
        .animate-float-5 { animation: float 32s ease-in-out infinite 8s; }
      `}</style>
    </div>
  )
}
