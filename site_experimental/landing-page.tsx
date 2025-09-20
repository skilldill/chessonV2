"use client"

import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Grid } from "@react-three/drei"
import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { Manrope } from "next/font/google"

const manrope = Manrope({ subsets: ["latin"] })

const occupiedPositions = new Set<string>()

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

function ChessPawn({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.8, 0.8, 0.2, 20]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.75, 0.8, 0.05, 20]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.72, 0.75, 0.08, 20]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.6, 0.6, 16]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.35, 0.15, 16]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.95, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.42, 0.25, 16]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.12, 0]} castShadow>
        <cylinderGeometry args={[0.45, 0.38, 0.12, 16]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.35, 0]} castShadow>
        <sphereGeometry args={[0.45, 20, 16]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.65, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.32, 0.18, 12]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.78, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.28, 0.08, 12]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
    </group>
  )
}

function ChessRook({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.8, 0.8, 0.2, 20]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.75, 0.8, 0.08, 20]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.7, 0.75, 0.15, 20]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.58, 0.68, 1.4, 20]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.65, 0]} castShadow>
        <cylinderGeometry args={[0.68, 0.58, 0.15, 20]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0.5, 1.85, 0.5]} castShadow>
        <boxGeometry args={[0.3, 0.4, 0.3]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[-0.5, 1.85, 0.5]} castShadow>
        <boxGeometry args={[0.3, 0.4, 0.3]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0.5, 1.85, -0.5]} castShadow>
        <boxGeometry args={[0.3, 0.4, 0.3]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[-0.5, 1.85, -0.5]} castShadow>
        <boxGeometry args={[0.3, 0.4, 0.3]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0.5, 1.85, 0]} castShadow>
        <boxGeometry args={[0.25, 0.3, 0.25]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[-0.5, 1.85, 0]} castShadow>
        <boxGeometry args={[0.25, 0.3, 0.25]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.85, 0.5]} castShadow>
        <boxGeometry args={[0.25, 0.3, 0.25]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.85, -0.5]} castShadow>
        <boxGeometry args={[0.25, 0.3, 0.25]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0.25, 1.85, 0.25]} castShadow>
        <boxGeometry args={[0.15, 0.2, 0.15]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[-0.25, 1.85, 0.25]} castShadow>
        <boxGeometry args={[0.15, 0.2, 0.15]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0.25, 1.85, -0.25]} castShadow>
        <boxGeometry args={[0.15, 0.2, 0.15]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[-0.25, 1.85, -0.25]} castShadow>
        <boxGeometry args={[0.15, 0.2, 0.15]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
    </group>
  )
}

function ChessQueen({ color }: { color: string }) {
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.8, 0.8, 0.2, 20]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.75, 0.8, 0.08, 20]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.32, 0]} castShadow>
        <cylinderGeometry args={[0.7, 0.75, 0.08, 20]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>

      {/* Lower body - wider base tapering upward */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <cylinderGeometry args={[0.45, 0.65, 0.8, 20]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>

      {/* Mid section with decorative rings */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.52, 0.45, 0.3, 20]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.35, 0]} castShadow>
        <cylinderGeometry args={[0.48, 0.52, 0.1, 20]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>

      {/* Upper stem - elegant taper */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.45, 0.8, 20]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>

      {/* Crown base - wider section */}
      <mesh position={[0, 2.35, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.35, 0.4, 20]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>

      {/* Crown decorative rings */}
      <mesh position={[0, 2.6, 0]} castShadow>
        <cylinderGeometry args={[0.58, 0.55, 0.08, 20]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0, 2.72, 0]} castShadow>
        <cylinderGeometry args={[0.56, 0.58, 0.06, 20]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>

      {/* Crown top - rounded dome shape */}
      <mesh position={[0, 2.95, 0]} castShadow>
        <cylinderGeometry args={[0.45, 0.56, 0.3, 20]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>

      {/* Spherical finial at the very top */}
      <mesh position={[0, 3.25, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 12]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
    </group>
  )
}

function ChessKing({ color }: { color: string }) {
  return (
    <group>
      {/* Base with decorative rings */}
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.8, 0.8, 0.2, 20]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.75, 0.8, 0.08, 20]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.32, 0]} castShadow>
        <cylinderGeometry args={[0.7, 0.75, 0.08, 20]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>

      {/* Lower body - wide base tapering upward */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.45, 0.65, 1.0, 20]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>

      {/* Decorative beaded ring */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <cylinderGeometry args={[0.52, 0.45, 0.12, 20]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>

      {/* Mid stem - elegant taper */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.48, 0.8, 20]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>

      {/* Another decorative beaded ring */}
      <mesh position={[0, 2.3, 0]} castShadow>
        <cylinderGeometry args={[0.45, 0.38, 0.15, 20]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>

      {/* Upper stem continuing the taper */}
      <mesh position={[0, 2.7, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.42, 0.6, 20]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>

      {/* Crown base - bulbous section like in reference */}
      <mesh position={[0, 3.2, 0]} castShadow>
        <sphereGeometry args={[0.55, 20, 16]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>

      {/* Decorative beaded ring around crown */}
      <mesh position={[0, 3.6, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.45, 0.08, 20]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>

      {/* Crown top section */}
      <mesh position={[0, 3.85, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.42, 0.3, 20]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>

      {/* Cross - vertical beam */}
      <mesh position={[0, 4.2, 0]} castShadow>
        <boxGeometry args={[0.08, 0.6, 0.08]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>

      {/* Cross - horizontal beam */}
      <mesh position={[0, 4.35, 0]} castShadow>
        <boxGeometry args={[0.35, 0.08, 0.08]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>

      {/* Cross center reinforcement */}
      <mesh position={[0, 4.35, 0]} castShadow>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
    </group>
  )
}

function AnimatedChessPiece({
  initialPosition,
  pieceId,
}: { initialPosition: [number, number, number]; pieceId: number }) {
  const meshRef = useRef<THREE.Group>(null)
  const snappedInitial: [number, number, number] = [
    Math.round(initialPosition[0] / 3) * 3 + 1.5,
    initialPosition[1],
    Math.round(initialPosition[2] / 3) * 3 + 1.5,
  ]
  const [targetPosition, setTargetPosition] = useState(new THREE.Vector3(...snappedInitial))
  const currentPosition = useRef(new THREE.Vector3(...snappedInitial))
  const [pieceType] = useState(() => Math.floor(Math.random() * 4))
  const pieceColor = pieceId % 2 === 0 ? "#8b5cf6" : "#ffffff"

  const getPositionKey = (pos: THREE.Vector3) => `${pos.x},${pos.z}`

  useEffect(() => {
    const initialKey = getPositionKey(currentPosition.current)
    occupiedPositions.add(initialKey)

    return () => {
      occupiedPositions.delete(initialKey)
    }
  }, [])

  const getChessMove = (current: THREE.Vector3, type: number) => {
    const cellSize = 3 // Grid cell size
    const possibleMoves: [number, number][] = [
      [cellSize, 0],
      [-cellSize, 0], // horizontal
      [0, cellSize],
      [0, -cellSize], // vertical
      [cellSize, cellSize],
      [-cellSize, -cellSize], // diagonal
      [cellSize, -cellSize],
      [-cellSize, cellSize], // diagonal
      [cellSize * 2, 0],
      [-cellSize * 2, 0], // longer horizontal
      [0, cellSize * 2],
      [0, -cellSize * 2], // longer vertical
      [cellSize * 2, cellSize],
      [-cellSize * 2, -cellSize], // longer diagonal
      [cellSize, cellSize * 2],
      [-cellSize, -cellSize * 2], // longer diagonal
    ]

    const shuffledMoves = [...possibleMoves].sort(() => Math.random() - 0.5)

    for (const move of shuffledMoves) {
      const newPos = new THREE.Vector3(current.x + move[0], 0.5, current.z + move[1])

      newPos.x = Math.max(-13.5, Math.min(13.5, Math.round((newPos.x - 1.5) / 3) * 3 + 1.5))
      newPos.z = Math.max(-13.5, Math.min(13.5, Math.round((newPos.z - 1.5) / 3) * 3 + 1.5))

      const posKey = getPositionKey(newPos)

      if (!occupiedPositions.has(posKey)) {
        return newPos
      }
    }

    return new THREE.Vector3(current.x, 0.5, current.z)
  }

  useEffect(() => {
    const randomInterval = 2000 + Math.random() * 1500 // 2000-3500ms random interval
    const interval = setInterval(() => {
      const currentKey = getPositionKey(currentPosition.current)
      const newPosition = getChessMove(currentPosition.current, pieceType)
      const newKey = getPositionKey(newPosition)

      if (currentKey !== newKey) {
        occupiedPositions.delete(currentKey)
        occupiedPositions.add(newKey)
        setTargetPosition(newPosition)
      }
    }, randomInterval)

    return () => clearInterval(interval)
  }, [pieceType])

  useFrame((state, delta) => {
    if (meshRef.current) {
      currentPosition.current.lerp(targetPosition, 0.05)
      meshRef.current.position.copy(currentPosition.current)
    }
  })

  const renderChessPiece = () => {
    switch (pieceType) {
      case 0:
        return <ChessPawn color={pieceColor} />
      case 1:
        return <ChessRook color={pieceColor} />
      case 2:
        return <ChessQueen color={pieceColor} />
      case 3:
        return <ChessKing color={pieceColor} />
      default:
        return <ChessPawn color={pieceColor} />
    }
  }

  return (
    <group ref={meshRef} position={snappedInitial}>
      {renderChessPiece()}
    </group>
  )
}

function Scene() {
  const initialPositions: [number, number, number][] = [
    [-7.5, 0.5, -7.5],
    [-4.5, 0.5, -4.5],
    [-1.5, 0.5, -1.5],
    [1.5, 0.5, 1.5],
    [4.5, 0.5, 4.5],
    [7.5, 0.5, 7.5],
    [10.5, 0.5, 10.5],
    [-10.5, 0.5, 1.5],
    [13.5, 0.5, 1.5],
    [1.5, 0.5, 13.5],
  ]

  return (
    <>
      <OrbitControls minDistance={20} maxDistance={80} />
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[20, 20, 20]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <pointLight position={[10, 15, 10]} intensity={0.4} castShadow />
      <pointLight position={[-10, 15, -10]} intensity={0.3} castShadow />

      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.1} />
      </mesh>

      <Grid
        renderOrder={-1}
        position={[0, 0, 0]}
        infiniteGrid
        cellSize={1}
        cellThickness={0.5}
        sectionSize={3}
        sectionThickness={1}
        sectionColor={[0.5, 0.5, 0.5]}
        fadeDistance={50}
      />

      {Array.from({ length: 16 }, (_, row) =>
        Array.from({ length: 16 }, (_, col) => {
          const isLightSquare = (row + col) % 2 === 1
          const cellX = -22.5 + col * 3
          const cellZ = -22.5 + row * 3
          const cellKey = `${cellX + 1.5},${cellZ + 1.5}` // Offset to match piece positioning
          const isOccupied = occupiedPositions.has(cellKey)

          if (isLightSquare) {
            return (
              <mesh
                key={`${row}-${col}`}
                position={[cellX, -0.01, cellZ]}
                rotation={[-Math.PI / 2, 0, 0]}
                receiveShadow
              >
                <planeGeometry args={[3, 3]} />
                <meshStandardMaterial
                  color={isOccupied ? "#ffff00" : "#999999"}
                  opacity={isOccupied ? 0.8 : 0.3}
                  transparent
                />
              </mesh>
            )
          }
          return null
        }),
      )}

      {initialPositions.map((position, index) => (
        <AnimatedChessPiece key={index} initialPosition={position} pieceId={index} />
      ))}
    </>
  )
}

export default function Component() {
  return (
    <div className={`relative w-full h-screen bg-black text-white overflow-hidden ${manrope.className}`}>
      <header className="absolute top-0 left-0 right-0 z-10 p-4">
        <nav className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="flex items-center">
            <div className="w-20 h-20">
              <Canvas camera={{ position: [0, 0, 5] }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <SpinningLogo />
              </Canvas>
            </div>
            <span className="text-2xl font-bold">{"ChessOn"}</span>
          </div>
          <ul className="flex space-x-6">
            <li></li>
            <li></li>
            <li></li>
            <li></li>
          </ul>
        </nav>
      </header>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 text-center">
        <h1 className="font-bold mb-8 max-w-4xl mx-auto text-7xl">Онлайн шахматы — играй бесплатно с друзьями</h1>
        <h2 className="mb-10 font-normal text-2xl">Создай комнату за секунду и начни партию без регистрации</h2>
        <a href="/game">
          <button className="bg-white text-black font-bold py-3 px-6 rounded-md hover:bg-gray-200 transition duration-300 text-lg">
            {"Создать комнату"}
          </button>
        </a>
      </div>
      <Canvas shadows camera={{ position: [30, 30, 30], fov: 50 }} className="absolute inset-0">
        <Scene />
      </Canvas>
    </div>
  )
}
