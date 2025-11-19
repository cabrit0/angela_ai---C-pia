import React, { useEffect, useMemo, useRef, useState } from 'react'

interface AudioNarratorProps {
  text?: string
  label?: string
  className?: string
  variant?: 'ghost' | 'solid'
}

const isBrowser = typeof window !== 'undefined'

const AudioNarrator: React.FC<AudioNarratorProps> = ({
  text = '',
  label = 'Ouvir conteúdo',
  className = '',
  variant = 'ghost',
}) => {
  const [isSupported, setIsSupported] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (!isBrowser || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      setIsSupported(false)
      return
    }
    setIsSupported(true)
    const synth = window.speechSynthesis

    const handleVoicesChanged = () => {
      const available = synth.getVoices()
      if (available.length > 0) {
        setVoices(available)
      }
    }

    handleVoicesChanged()
    synth.addEventListener('voiceschanged', handleVoicesChanged)
    return () => {
      synth.removeEventListener('voiceschanged', handleVoicesChanged)
      synth.cancel()
    }
  }, [])

  const preferredVoice = useMemo(() => {
    if (!voices.length) return undefined
    return (
      voices.find((voice) => voice.lang?.toLowerCase().startsWith('pt')) ??
      voices.find((voice) => voice.lang?.toLowerCase().startsWith('en')) ??
      voices[0]
    )
  }, [voices])

  const stopSpeaking = () => {
    if (!isBrowser || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
    utteranceRef.current = null
  }

  const startSpeaking = () => {
    if (!isSupported || !text.trim()) return
    const synth = window.speechSynthesis
    synth.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = preferredVoice?.lang || 'pt-PT'
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }
    utterance.rate = 1
    utterance.pitch = 1

    utterance.onend = () => {
      setIsSpeaking(false)
      utteranceRef.current = null
    }

    utterance.onerror = () => {
      setIsSpeaking(false)
      utteranceRef.current = null
    }

    utteranceRef.current = utterance
    synth.speak(utterance)
    setIsSpeaking(true)
  }

  const handleToggle = () => {
    if (!isSupported || !text.trim()) return
    if (isSpeaking) {
      stopSpeaking()
    } else {
      startSpeaking()
    }
  }

  if (!isSupported) {
    return (
      <button
        type="button"
        className={`inline-flex items-center rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-400 dark:border-gray-700 dark:text-gray-500 ${className}`}
        disabled
        aria-disabled="true"
      >
        Áudio indisponível
      </button>
    )
  }

  const variantClasses =
    variant === 'solid'
      ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
      : 'border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-500/40 dark:text-blue-300 dark:hover:bg-blue-500/10'

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 ${variantClasses} ${className}`}
      aria-pressed={isSpeaking}
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {isSpeaking ? (
          <>
            <path d="M10 9v6M14 9v6" />
            <circle cx="12" cy="12" r="10" />
          </>
        ) : (
          <>
            <path d="M11 5 6 9H3v6h3l5 4V5z" />
            <path d="M19 5a9 9 0 0 1 0 14" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          </>
        )}
      </svg>
      {isSpeaking ? 'Parar áudio' : label}
    </button>
  )
}

export default AudioNarrator
