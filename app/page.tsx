'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useRef, useState, useEffect } from 'react'
import { Points, PointMaterial, OrbitControls, useGLTF } from '@react-three/drei'
import * as random from 'maath/random'
import { Vector3 } from 'three'
import * as THREE from 'three'
import { Howl } from 'howler'


const StarBackground = () => {
  const ref = useRef<THREE.Points>(null)
  const pointCount = 5000
  const [sphere] = useState(() => {
    const arr = random.inSphere(new Float32Array(pointCount * 3), { radius: 20 })
    return new Float32Array(arr.buffer)
  })

  useFrame((_state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10
      ref.current.rotation.y -= delta / 15
    }
  })

  return (
    <group rotation={[0, 0, 0]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled>
        <PointMaterial transparent color="#ffffff" size={0.003} sizeAttenuation depthWrite={false} />
      </Points>
    </group>
  )
}

const BonusItem = ({ onCollect }: { onCollect: () => void }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState<Vector3>(() => new Vector3())

  useEffect(() => {
    const interval = setInterval(() => {
      const x = (Math.random() - 0.5) * 20
      const y = (Math.random() - 0.5) * 10
      const z = (Math.random() - 0.5) * 10
      setPosition(new Vector3(x, y, z))
      setVisible(true)

      setTimeout(() => setVisible(false), 3000)
    }, 7000)

    return () => clearInterval(interval)
  }, [])

  return visible ? (
    <mesh
      ref={meshRef}
      position={position}
      onClick={() => {
        onCollect()
        setVisible(false)
        new Howl({ src: ['/bonus.mp3'] }).play()
      }}
    >
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshStandardMaterial color="gold" emissive="yellow" />
    </mesh>
  ) : null
}

const DuckModel = ({ onHit }: { onHit: () => void }) => {
  const { scene } = useGLTF('/Duck.glb')
  const [position, setPosition] = useState<Vector3>(() => new Vector3(0, 0, 0))

  const moveDuck = () => {
    const x = (Math.random() - 0.5) * 15
    const y = (Math.random() - 0.5) * 8
    const z = (Math.random() - 0.5) * 8
    setPosition(new Vector3(x, y, z))
  }

  const handleClick = () => {
    onHit()
    const sound = new Howl({ src: ['/quack_5.mp3'] })
    sound.play()
    moveDuck()
  }

  useEffect(() => {
    moveDuck()
  }, [])

  return (
    <primitive
      object={scene}
      scale={1}
      position={position}
      onClick={handleClick}
    />
  )
}

export default function Home() {
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [gameOver, setGameOver] = useState(false)
const [topScore, setTopScore] = useState(0)

useEffect(() => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('topScore')
    if (stored) setTopScore(parseInt(stored, 10))
  }
}, [])

useEffect(() => {
  if (gameOver && score > topScore) {
    setTopScore(score)
    localStorage.setItem('topScore', score.toString())
  }
}, [gameOver])

  const incrementScore = () => {
    if (!gameOver) setScore((prev) => prev + 1)
  }

  const collectBonus = () => {
    if (!gameOver) setScore((prev) => prev + 5)
  }

  // Timer
  useEffect(() => {
    if (gameOver) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setGameOver(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [gameOver])

  // Save top score if higher
  useEffect(() => {
    if (score > topScore) {
      setTopScore(score)
      localStorage.setItem('topScore', score.toString())
    }
  }, [score, topScore])

  return (
    <div style={{ height: '100%', width: '100%', overflow: 'hidden' }}>
      {/* Score */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        color: 'white',
        fontSize: '2rem',
        zIndex: 10,
        fontFamily: 'monospace'
      }}>
        Score: {score}
      </div>

      <div style={{
        position: 'absolute',
        top: 60,
        left: 20,
        color: 'yellow',
        fontSize: '1.5rem',
        zIndex: 10,
        fontFamily: 'monospace'
      }}>
        Top Score: {topScore}
      </div>

      {/* Timer bar */}
      <div style={{
        position: 'absolute',
        top: 100,
        left: 20,
        right: 20,
        height: '10px',
        backgroundColor: '#555',
        zIndex: 10,
        borderRadius: '5px',
      }}>
        <div style={{
          width: `${(timeLeft / 30) * 100}%`,
          height: '100%',
          backgroundColor: '#0f0',
          transition: 'width 1s linear',
          borderRadius: '5px'
        }} />
      </div>

      {/* Game Over UI */}
      {gameOver && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'red',
          fontSize: '3rem',
          fontFamily: 'monospace',
          zIndex: 10,
          textAlign: 'center',
        }}>
          GAME OVER<br />Final Score: {score}
          <br />
          <button
            onClick={() => {
              setScore(0)
              setTimeLeft(30)
              setGameOver(false)
            }}
            style={{
              marginTop: '1rem',
              padding: '10px 20px',
              fontSize: '1.5rem',
              backgroundColor: 'white',
              color: 'black',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Replay
          </button>
        </div>
      )}

      {/* Canvas */}
      <Canvas
        camera={{ position: [0, 0, 15], fov: 75 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'black',
        }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <StarBackground />
          {!gameOver && <DuckModel onHit={incrementScore} />}
          {!gameOver && <BonusItem onCollect={collectBonus} />}
          <OrbitControls />
        </Suspense>
      </Canvas>
    </div>
  )
}