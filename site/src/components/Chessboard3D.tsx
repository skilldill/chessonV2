import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const occupiedPositions = new Set<string>()


const ChessPawn = ({ color }: { color: string }) => {
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

const ChessRook = ({ color }: { color: string }) => {
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

const ChessQueen = ({ color }: { color: string }) => {
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
            <mesh position={[0, 0.32, 0]} castShadow>
                <cylinderGeometry args={[0.7, 0.75, 0.08, 20]} />
                <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.65, 0]} castShadow>
                <cylinderGeometry args={[0.45, 0.65, 0.8, 20]} />
                <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
            </mesh>
            <mesh position={[0, 1.15, 0]} castShadow>
                <cylinderGeometry args={[0.52, 0.45, 0.3, 20]} />
                <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
            </mesh>
            <mesh position={[0, 1.35, 0]} castShadow>
                <cylinderGeometry args={[0.48, 0.52, 0.1, 20]} />
                <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
            </mesh>
            <mesh position={[0, 1.8, 0]} castShadow>
                <cylinderGeometry args={[0.35, 0.45, 0.8, 20]} />
                <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
            </mesh>
            <mesh position={[0, 2.35, 0]} castShadow>
                <cylinderGeometry args={[0.55, 0.35, 0.4, 20]} />
                <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
            </mesh>
            <mesh position={[0, 2.6, 0]} castShadow>
                <cylinderGeometry args={[0.58, 0.55, 0.08, 20]} />
                <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
            </mesh>
            <mesh position={[0, 2.72, 0]} castShadow>
                <cylinderGeometry args={[0.56, 0.58, 0.06, 20]} />
                <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
            </mesh>
            <mesh position={[0, 2.95, 0]} castShadow>
                <cylinderGeometry args={[0.45, 0.56, 0.3, 20]} />
                <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
            </mesh>
            <mesh position={[0, 3.25, 0]} castShadow>
                <sphereGeometry args={[0.2, 16, 12]} />
                <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
            </mesh>
        </group>
    )
}

const ChessKing = ({ color }: { color: string }) => {
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
            <mesh position={[0, 0.32, 0]} castShadow>
                <cylinderGeometry args={[0.7, 0.75, 0.08, 20]} />
                <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.75, 0]} castShadow>
                <cylinderGeometry args={[0.45, 0.65, 1.0, 20]} />
                <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
            </mesh>
            <mesh position={[0, 1.35, 0]} castShadow>
                <cylinderGeometry args={[0.52, 0.45, 0.12, 20]} />
                <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
            </mesh>
            <mesh position={[0, 1.8, 0]} castShadow>
                <cylinderGeometry args={[0.38, 0.48, 0.8, 20]} />
                <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
            </mesh>
            <mesh position={[0, 2.3, 0]} castShadow>
                <cylinderGeometry args={[0.45, 0.38, 0.15, 20]} />
                <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
            </mesh>
            <mesh position={[0, 2.7, 0]} castShadow>
                <cylinderGeometry args={[0.32, 0.42, 0.6, 20]} />
                <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
            </mesh>
            <mesh position={[0, 3.2, 0]} castShadow>
                <sphereGeometry args={[0.55, 20, 16]} />
                <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
            </mesh>
            <mesh position={[0, 3.6, 0]} castShadow>
                <cylinderGeometry args={[0.42, 0.45, 0.08, 20]} />
                <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
            </mesh>
            <mesh position={[0, 3.85, 0]} castShadow>
                <cylinderGeometry args={[0.35, 0.42, 0.3, 20]} />
                <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
            </mesh>
            <mesh position={[0, 4.2, 0]} castShadow>
                <boxGeometry args={[0.08, 0.6, 0.08]} />
                <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
            </mesh>
            <mesh position={[0, 4.35, 0]} castShadow>
                <boxGeometry args={[0.35, 0.08, 0.08]} />
                <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
            </mesh>
            <mesh position={[0, 4.35, 0]} castShadow>
                <boxGeometry args={[0.12, 0.12, 0.12]} />
                <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
            </mesh>
        </group>
    )
}

const AnimatedChessPiece = ({
    initialPosition,
    pieceId,
}: { initialPosition: [number, number, number]; pieceId: number }) => {
    const meshRef = useRef<THREE.Group>(null)
    const highlightMatRef = useRef<THREE.MeshStandardMaterial>(null)

    const snappedInitial: [number, number, number] = [
        Math.round(initialPosition[0] / 3) * 3 + 1.5,
        initialPosition[1],
        Math.round(initialPosition[2] / 3) * 3 + 1.5,
    ]
    const [targetPosition, setTargetPosition] = useState(new THREE.Vector3(...snappedInitial))
    const currentPosition = useRef(new THREE.Vector3(...snappedInitial))
    const [pieceType] = useState(() => Math.floor(Math.random() * 4))
    const pieceColor = pieceId % 2 === 0 ? "#8b5cf6" : "#ffffff"

    const cellSize = 3
    const min = -13.5
    const max = 13.5

    const getPositionKey = (pos: THREE.Vector3) => `${pos.x},${pos.z}`

    // список всех клеток 10×10
    const allCells = useRef<string[]>([])
    if (allCells.current.length === 0) {
        for (let x = min; x <= max; x += cellSize) {
            for (let z = min; z <= max; z += cellSize) {
                allCells.current.push(`${x + 1.5},${z + 1.5}`)
            }
        }
    }

    useEffect(() => {
        const initialKey = getPositionKey(currentPosition.current)
        occupiedPositions.add(initialKey)
        return () => {
            occupiedPositions.delete(initialKey)
        }
    }, [])

    const clampSnap = (v: THREE.Vector3) => {
        v.x = Math.max(min, Math.min(max, Math.round((v.x - 1.5) / cellSize) * cellSize + 1.5))
        v.z = Math.max(min, Math.min(max, Math.round((v.z - 1.5) / cellSize) * cellSize + 1.5))
        v.y = 0.5
        return v
    }

    // ходы бесконечные: если нет «шахматных» — прыжок на любую свободную клетку
    const getChessMove = (current: THREE.Vector3, _type: number) => {
        const steps: [number, number][] = [
            [cellSize, 0], [-cellSize, 0], [0, cellSize], [0, -cellSize],
            [cellSize, cellSize], [-cellSize, -cellSize], [cellSize, -cellSize], [-cellSize, cellSize],
            [cellSize * 2, 0], [-cellSize * 2, 0], [0, cellSize * 2], [0, -cellSize * 2],
            [cellSize * 2, cellSize], [-cellSize * 2, -cellSize], [cellSize, cellSize * 2], [-cellSize, -cellSize * 2],
        ]
        const shuffled = [...steps].sort(() => Math.random() - 0.5)

        for (const [dx, dz] of shuffled) {
            const np = clampSnap(new THREE.Vector3(current.x + dx, 0.5, current.z + dz))
            const key = getPositionKey(np)
            if (!occupiedPositions.has(key)) return np
        }

        const freeCells = allCells.current.filter((k) => !occupiedPositions.has(k))
        if (freeCells.length) {
            const notCurrent = freeCells.filter((k) => k !== getPositionKey(current))
            const pool = notCurrent.length ? notCurrent : freeCells
            const [xStr, zStr] = pool[Math.floor(Math.random() * pool.length)].split(",")
            return new THREE.Vector3(parseFloat(xStr), 0.5, parseFloat(zStr))
        }

        return new THREE.Vector3(current.x, 0.5, current.z)
    }

    // плавное движение + анимация яркости подсветки
    useFrame(() => {
        if (!meshRef.current) return

        currentPosition.current.lerp(targetPosition, 0.06)
        const dist = currentPosition.current.distanceTo(targetPosition)

        if (highlightMatRef.current) {
            const targetOpacity = dist < 0.02 ? 0.85 : 0.0
            highlightMatRef.current.opacity = THREE.MathUtils.lerp(
                highlightMatRef.current.opacity ?? 0,
                targetOpacity,
                0.2
            )
        }

        if (dist < 0.01) currentPosition.current.copy(targetPosition)
        meshRef.current.position.copy(currentPosition.current)
    })

    // рекурсивный таймер хода
    useEffect(() => {
        let cancelled = false

        const scheduleNextMove = () => {
            const delay = 1000 + Math.random() * 1500
            const t = setTimeout(() => {
                if (cancelled) return
                const currentKey = getPositionKey(currentPosition.current)
                const next = getChessMove(currentPosition.current, pieceType)
                const nextKey = getPositionKey(next)
                if (currentKey !== nextKey) {
                    occupiedPositions.delete(currentKey)
                    occupiedPositions.add(nextKey)
                    setTargetPosition(next)
                }
                scheduleNextMove()
            }, delay)
            return () => clearTimeout(t)
        }

        const clear = scheduleNextMove()
        return () => {
            cancelled = true
            clear()
        }
    }, [pieceType])

    const renderChessPiece = () => {
        switch (pieceType) {
            case 0: return <ChessPawn color={pieceColor} />
            case 1: return <ChessRook color={pieceColor} />
            case 2: return <ChessQueen color={pieceColor} />
            case 3: return <ChessKing color={pieceColor} />
            default: return <ChessPawn color={pieceColor} />
        }
    }

    return (
        <group ref={meshRef} position={snappedInitial}>
            {/* подсветка клетки под фигурой */}
            <mesh position={[0, -0.49, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
                <planeGeometry args={[3, 3]} />
                <meshStandardMaterial
                    ref={highlightMatRef}
                    color={"#6a6a6a"}
                    emissive={"#6a6a6a"}
                    emissiveIntensity={0.1}
                    transparent
                    opacity={0}
                    depthWrite={false}
                />
            </mesh>

            {renderChessPiece()}
        </group>
    )
}

const Scene = () => {
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
                sectionColor={new THREE.Color(0.5, 0.5, 0.5)}
                fadeDistance={50}
            />

            {Array.from({ length: 16 }, (_, row) =>
                Array.from({ length: 16 }, (_, col) => {
                    const isLightSquare = (row + col) % 2 === 1
                    const cellX = -22.5 + col * 3
                    const cellZ = -22.5 + row * 3
                    const cellKey = `${cellX + 1.5},${cellZ + 1.5}`
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

export const Chessboard3D = () => {
    return (
        <Canvas camera={{ position: [30, 30, 30], fov: 50 }} className="absolute inset-0">
            <Scene />
        </Canvas>
    )
}