import { createBrowserRouter, RouterProvider, useParams } from 'react-router-dom'
import { HomeScreen } from './screens/HomeScreen'
import { GameScreen } from './screens/GameScreen'
import { EntryScreen } from './screens/EntryScreen'
import './App.css'

function GameRoute() { const { roomId } = useParams(); return <GameScreen key={roomId} /> }
const router = createBrowserRouter([
  { path: '/', element: <HomeScreen /> },
  { path: '/main', element: <HomeScreen /> },
  { path: '/create-room', element: <EntryScreen /> },
  { path: '/game/:roomId', element: <GameRoute /> },
  { path: '*', element: <HomeScreen /> },
])
export default function App() { return <RouterProvider router={router} /> }
