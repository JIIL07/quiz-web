import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { QuizPage } from './pages/QuizPage'

function QuizPageRoute() {
  const { title } = useParams()
  return <QuizPage key={title ?? ''} />
}

function App() {
  return (
    <Routes>
      <Route path="/:title" element={<QuizPageRoute />} />
      <Route path="*" element={<Navigate to="/mindflow-v1" replace />} />
    </Routes>
  )
}

export default App
