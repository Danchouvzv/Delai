import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ChatProvider } from './context/ChatContext'
import { initializeTheme } from './utils/theme'
import { ChakraProvider } from '@chakra-ui/react'
import theme from './theme'

// Initialize theme before rendering
initializeTheme()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <ChatProvider>
        <App />
      </ChatProvider>
    </ChakraProvider>
  </React.StrictMode>,
)
