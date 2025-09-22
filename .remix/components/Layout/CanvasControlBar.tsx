import React from 'react'
import { useDashboard } from '../../contexts'
import { sendRemixCommand } from '../../utils'
import { cn, tw } from '../../utils/tw'
import '../../styles/app.css'

interface CanvasControlBarProps {
  playerId: '1' | '2'
  iframeId: string
  isActive?: boolean
}

export const CanvasControlBar: React.FC<CanvasControlBarProps> = ({ playerId, iframeId, isActive = false }) => {
  const { state, dispatch } = useDashboard()

  const handleRefresh = () => {
    // Refresh only this specific iframe
    const iframe = document.getElementById(iframeId) as HTMLIFrameElement
    if (iframe) {
      iframe.src = iframe.src
    }
    
    // Reset game state for this player in dashboard
    dispatch({
      type: 'GAME_UPDATE',
      payload: {
        isGameOver: false,
        score: 0,
        playerId: playerId
      }
    })
  }

  const handleMuteToggle = () => {
    const newMutedState = !state.sdk.isMuted
    
    // Send command to this specific game iframe
    const iframe = document.getElementById(iframeId) as HTMLIFrameElement
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'remix_command',
        command: 'toggle_mute',
        data: { isMuted: newMutedState }
      }, '*')
    }

    // Update dashboard state
    dispatch({
      type: 'SDK_SET_MUTED',
      payload: newMutedState
    })
  }

  return (
    <div className={tw`
      w-full
      flex justify-between items-center gap-2
      mb-2
      px-2
    `}>
      {/* Player label with status indicator */}
      <div className={tw`
        flex items-center gap-2
        text-sm font-medium text-gray-300
      `}>
        <span>Player {playerId}</span>
        <div className={tw`
          w-2 h-2 rounded-full
          ${isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}
        `} />
      </div>

      {/* Control buttons */}
      <div className={tw`flex items-center gap-2`}>
        <button 
          type="button" 
          className={tw`
            group inline-flex items-center justify-center
            w-8 h-8 rounded-md
            border border-[#99999920]
            bg-transparent text-white cursor-pointer
            transition-all duration-fast
            hover:border-[#99999940] hover:bg-[rgba(255,255,255,0.02)]
          `}
          onClick={handleRefresh}
          title={`Refresh Player ${playerId} game`}
          aria-label={`Refresh Player ${playerId} game`}
        >
          <svg 
            className="w-4 h-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] fill-white opacity-80 group-hover:opacity-100 transition-opacity"
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            aria-hidden="true"
          >
            <path d="M13.5 2c-5.621 0-10.211 4.443-10.475 10h-3.025l5 6.625 5-6.625h-2.975c.257-3.351 3.06-6 6.475-6 3.584 0 6.5 2.916 6.5 6.5s-2.916 6.5-6.5 6.5c-1.863 0-3.542-.793-4.728-2.053l-2.427 3.216c1.877 1.754 4.389 2.837 7.155 2.837 5.79 0 10.5-4.71 10.5-10.5s-4.71-10.5-10.5-10.5z"/>
          </svg>
        </button>
        
        <button 
          type="button" 
          className={tw`
            group inline-flex items-center justify-center
            w-8 h-8 rounded-md
            border border-[#99999920]
            bg-transparent text-white cursor-pointer
            transition-all duration-fast
            hover:border-[#99999940] hover:bg-[rgba(255,255,255,0.02)]
          `}
          onClick={handleMuteToggle}
          title={state.sdk.isMuted ? `Unmute Player ${playerId} audio` : `Mute Player ${playerId} audio`}
          aria-label={state.sdk.isMuted ? `Unmute Player ${playerId} audio` : `Mute Player ${playerId} audio`}
          aria-pressed={state.sdk.isMuted}
        >
          <svg 
            className="w-4 h-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] fill-white opacity-80 group-hover:opacity-100 transition-opacity"
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            aria-hidden="true"
          >
            {state.sdk.isMuted ? (
              // Muted icon
              <path d="M19 7.358v15.642l-8-5v-.785l8-9.857zm3-6.094l-1.548-1.264-3.446 4.247-6.006 3.753v3.646l-2 2.464v-6.11h-4v10h.843l-3.843 4.736 1.548 1.264 18.452-22.736z" />
            ) : (
              // Unmuted icon
              <path d="M6 7l8-5v20l-8-5v-10zm-6 10h4v-10h-4v10zm20.264-13.264l-1.497 1.497c1.847 1.783 2.983 4.157 2.983 6.767 0 2.61-1.135 4.984-2.983 6.766l1.498 1.498c2.305-2.153 3.735-5.055 3.735-8.264s-1.43-6.11-3.736-8.264zm-.489 8.264c0-2.084-.915-3.967-2.384-5.391l-1.503 1.503c1.011 1.049 1.637 2.401 1.637 3.888 0 1.488-.623 2.841-1.634 3.891l1.503 1.503c1.468-1.424 2.381-3.309 2.381-5.394z" />
            )}
          </svg>
        </button>
      </div>
    </div>
  )
}