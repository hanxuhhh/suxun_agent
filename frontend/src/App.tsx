import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import HomePage from './pages/Home'
import ChatPage from './pages/Chat'
import Translator from './pages/Translator'
import FoodPage from './pages/Food'
import FoodAgentPage from './pages/FoodAgent'
import NewsPage from './pages/News'
import EnglishPage from './pages/English'
import VocabHubPage from './pages/English/Vocab'
import StudyPage from './pages/English/VocabStudy'
import QuizPage from './pages/English/VocabQuiz'
import WordbookPage from './pages/English/VocabBook'
import SpeakingPage from './pages/English/Speaking'
import WritingPage from './pages/English/Writing'
import ReadingPage from './pages/English/Reading'
import BottomTabBar from './components/BottomTabBar'
import './App.css'

/* 全屏沉浸式页面：自身有顶栏/返回逻辑，不显示底部 TabBar */
const IMMERSIVE_ROUTES = ['/chat', '/food-agent', '/english/vocab/study', '/english/vocab/quiz', '/english/speaking', '/english/writing', '/english/reading']

function AppLayout() {
  const { pathname } = useLocation()
  const showTabBar = !IMMERSIVE_ROUTES.some((r) => pathname.startsWith(r))

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/translate" element={<Translator />} />
        <Route path="/food" element={<FoodPage />} />
        <Route path="/food-agent" element={<FoodAgentPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/english" element={<EnglishPage />} />
        <Route path="/english/vocab" element={<VocabHubPage />} />
        <Route path="/english/vocab/study" element={<StudyPage />} />
        <Route path="/english/vocab/quiz" element={<QuizPage />} />
        <Route path="/english/vocab/book" element={<WordbookPage />} />
        <Route path="/english/speaking" element={<SpeakingPage />} />
        <Route path="/english/writing" element={<WritingPage />} />
        <Route path="/english/reading" element={<ReadingPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
      {showTabBar && <BottomTabBar />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}
