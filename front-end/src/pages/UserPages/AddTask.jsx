import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { createGoal } from '@/store/task'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

const MicIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
)

const StopIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
)

// Animated sound-wave bars shown while recording
const SoundWave = () => (
  <span className="inline-flex items-end space-x-0.5 h-4">
    {[1, 2, 3, 4, 3].map((h, i) => (
      <span
        key={i}
        className="w-0.5 bg-red-400 rounded-full animate-pulse"
        style={{
          height: `${h * 4}px`,
          animationDelay: `${i * 0.1}s`,
          animationDuration: '0.6s'
        }}
      />
    ))}
  </span>
)

const useSpeechToText = () => {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setIsSupported(!!SpeechRecognition)
  }, [])

  const startListening = ({ onResult, onEnd, continuous = false }) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    // Stop any existing session
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = continuous
    recognition.maxAlternatives = 1

    recognition.onstart = () => setIsListening(true)

    recognition.onresult = (e) => {
      let interim = ''
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript
        if (e.results[i].isFinal) final += transcript
        else interim += transcript
      }
      onResult({ interim, final })
    }

    recognition.onerror = (e) => {
      if (e.error === 'not-allowed') {
        toast.error('Microphone access denied. Please allow microphone in your browser settings.')
      } else if (e.error !== 'aborted') {
        toast.error(`Speech recognition error: ${e.error}`)
      }
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      onEnd?.()
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  return { isListening, isSupported, startListening, stopListening }
}

const VoiceInput = ({ fieldName, value, onChange, isSubmitting, loading, children }) => {
  const { isListening, isSupported, startListening, stopListening } = useSpeechToText()
  const [activeField, setActiveField] = useState(null)
  const interimRef = useRef('')

  const handleMicClick = (field) => {
    if (isListening) {
      stopListening()
      setActiveField(null)
      return
    }

    setActiveField(field)
    const originalValue = value

    startListening({
      onResult: ({ interim, final }) => {
        if (final) {
          // Append confirmed final text
          interimRef.current = ''
          onChange({ target: { name: field, value: originalValue + (originalValue ? ' ' : '') + final } })
        } else {
          // Show interim text as a preview (non-destructive)
          interimRef.current = interim
          onChange({ target: { name: field, value: originalValue + (originalValue ? ' ' : '') + interim } })
        }
      },
      onEnd: () => setActiveField(null),
    })
  }

  if (!isSupported) return children(null)

  const micButton = (field) => (
    <button
      type="button"
      onClick={() => handleMicClick(field)}
      disabled={isSubmitting || loading}
      title={isListening && activeField === field ? 'Stop recording' : 'Speak your goal'}
      className={`
        flex items-center justify-center w-10 h-10 rounded-xl border-2 transition-all duration-200 flex-shrink-0
        ${isListening && activeField === field
          ? 'bg-red-50 border-red-400 text-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]'
          : 'bg-white border-gray-200 text-gray-400 hover:border-green-400 hover:text-green-500 hover:bg-green-50'}
        ${isSubmitting || loading ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {isListening && activeField === field
        ? <StopIcon className="w-4 h-4" />
        : <MicIcon className="w-4 h-4" />}
    </button>
  )

  return children({ micButton, isListening, activeField })
}

const AddTask = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const { loading } = useSelector((state) => state.task)

  const [formData, setFormData] = useState({ task: '', duration: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { isListening, isSupported, startListening, stopListening } = useSpeechToText()
  const [activeField, setActiveField] = useState(null)
  const baseValueRef = useRef({ task: '', duration: '' })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleMicClick = (field) => {
    if (isListening && activeField === field) {
      stopListening()
      setActiveField(null)
      return
    }

    // Save the current value as the base before we start appending
    baseValueRef.current = { ...formData }
    setActiveField(field)

    startListening({
      onResult: ({ interim, final }) => {
        const base = baseValueRef.current[field]
        const prefix = base ? base + ' ' : ''
        if (final) {
          const newVal = prefix + final
          baseValueRef.current = { ...baseValueRef.current, [field]: newVal }
          setFormData(prev => ({ ...prev, [field]: newVal }))
        } else {
          setFormData(prev => ({ ...prev, [field]: prefix + interim }))
        }
      },
      onEnd: () => setActiveField(null),
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.task.trim() || !formData.duration.trim()) {
      toast.error('Please fill in all fields')
      return
    }
    if (!user || !user.id) {
      toast.error('User authentication required')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await dispatch(createGoal({
        goal: formData.task.trim(),
        duration: formData.duration.trim(),
        user,
      })).unwrap()

      const taskId = result.taskId
      toast.success(
        <div className="flex flex-col space-y-2">
          <span className="font-semibold">🎉 Goal created successfully!</span>
          <div className="flex space-x-2">
            <button
              onClick={() => { navigate(`/user/goal/${taskId}`); toast.dismiss() }}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
            >
              View Goal
            </button>
            <button
              onClick={() => navigate('/user/home')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>,
        { duration: 8000, dismissible: true }
      )

      setFormData({ task: '', duration: '' })
    } catch (error) {
      toast.error(error.message || 'Failed to create goal')
      console.error('Failed to create goal:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isBusy = isSubmitting || loading.createGoal

  const micBtn = (field) => isSupported ? (
    <button
      type="button"
      onClick={() => handleMicClick(field)}
      disabled={isBusy}
      title={isListening && activeField === field ? 'Stop recording' : `Speak your ${field}`}
      className={`
        flex-shrink-0 flex items-center gap-1.5 px-3 h-10 rounded-xl border-2 text-xs font-medium
        transition-all duration-200 select-none
        ${isListening && activeField === field
          ? 'bg-red-50 border-red-400 text-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.12)]'
          : 'bg-white border-gray-200 text-gray-400 hover:border-green-400 hover:text-green-600 hover:bg-green-50'}
        ${isBusy ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {isListening && activeField === field ? (
        <>
          <SoundWave />
          <StopIcon className="w-3 h-3" />
          <span className="hidden sm:inline">Stop</span>
        </>
      ) : (
        <>
          <MicIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Speak</span>
        </>
      )}
    </button>
  ) : null

  return (
    <div className="w-full px-4 py-6 sm:px-6 sm:py-8 md:bg-transparent bg-gray-50 min-h-screen md:min-h-0 pt-20 md:pt-0">
      <div className="w-full max-w-2xl md:max-w-none mx-auto md:mx-0">
        <div className="mb-6 sm:mb-8 text-center sm:text-left md:text-left">
          <h2 className="text-2xl sm:text-3xl md:text-3xl font-bold text-gray-900 mb-2">
            Add New Task
          </h2>
          <p className="text-gray-600 text-sm sm:text-base md:text-base">
            Create a new goal and set your timeline
          </p>
        </div>

        <div className="w-full bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-6 md:p-8">
            <div className="space-y-5 sm:space-y-6">

              {/* Goal field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="task" className="block text-sm font-semibold text-gray-700">
                    What's your goal? *
                  </label>
                  {isListening && activeField === 'task' && (
                    <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse inline-block" />
                      Listening…
                    </span>
                  )}
                </div>

                {/* Mobile: textarea */}
                <div className="md:hidden space-y-2">
                  <textarea
                    id="task"
                    name="task"
                    value={formData.task}
                    onChange={handleChange}
                    placeholder="e.g., Learn React.js, Get fit, Write a book"
                    rows={3}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all duration-200 text-gray-900 placeholder-gray-400 resize-none text-sm
                      ${isListening && activeField === 'task' ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-200'}`}
                    disabled={isBusy}
                  />
                  {micBtn('task')}
                </div>

                {/* Desktop: single line + mic button inline */}
                <div className="hidden md:flex items-center gap-2">
                  <input
                    type="text"
                    id="task-desktop"
                    name="task"
                    value={formData.task}
                    onChange={handleChange}
                    placeholder="e.g., Learn React.js, Get fit, Write a book"
                    className={`flex-1 px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all duration-200 text-gray-900 placeholder-gray-400
                      ${isListening && activeField === 'task' ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-200'}`}
                    disabled={isBusy}
                  />
                  {micBtn('task')}
                </div>
              </div>

              {/* Duration field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="duration" className="block text-sm font-semibold text-gray-700">
                    Duration *
                  </label>
                  {isListening && activeField === 'duration' && (
                    <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse inline-block" />
                      Listening…
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    placeholder="e.g., 1 month, 3 weeks, 90 days"
                    className={`flex-1 px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all duration-200 text-gray-900 placeholder-gray-400 text-sm md:text-base
                      ${isListening && activeField === 'duration' ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-200'}`}
                    disabled={isBusy}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Recommended: Try "1 week", "1 month", "3 months", or "6 months"
                </p>
              </div>

              {/* Browser support notice */}
              {!isSupported && (
                <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2.5 rounded-xl">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <span>Voice input isn't supported in your browser. Try Chrome or Edge for the best experience.</span>
                </div>
              )}

              {/* User badge */}
              {user && (
                <div className="flex items-center space-x-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-semibold">
                      {(user.name || user.email || user.userName || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs">Creating goal for:</span>
                    <div className="font-medium text-gray-900 truncate text-sm">
                      {user.name || user.userName || user.email || user.id}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={isBusy || !formData.task.trim() || !formData.duration.trim()}
                className={`w-full py-3 md:py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 transform text-sm md:text-base ${
                  isBusy
                    ? 'bg-gray-400 cursor-not-allowed'
                    : formData.task.trim() && formData.duration.trim()
                    ? 'bg-green-500 hover:bg-green-600 active:bg-green-700 md:hover:scale-[1.02] shadow-lg hover:shadow-xl active:scale-[0.98]'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {isBusy ? (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Creating Goal...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Create Goal</span>
                  </div>
                )}
              </button>

              <div className="text-center">
                <div className="inline-flex items-start space-x-2 text-xs sm:text-sm text-gray-500 bg-green-50 px-3 sm:px-4 py-2 sm:py-3 rounded-lg max-w-full">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-left">Your goal will be broken down into manageable daily tasks</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-8 sm:h-12" />
      </div>
    </div>
  )
}

export default AddTask