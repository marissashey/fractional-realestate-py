import React from 'react'
import { useTheme, themes } from '../context/ThemeContext'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme()

  return (
    <div className="dropdown dropdown-end">
      <label tabIndex={0} className="btn btn-ghost btn-sm gap-2">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
        <span className="hidden sm:inline">Theme</span>
        <ChevronDownIcon className="w-4 h-4" />
      </label>
      <ul
        tabIndex={0}
        className="dropdown-content z-[1] p-2 shadow-2xl bg-base-300 rounded-box w-52 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-base-content/20"
      >
        {themes.map((t) => (
          <li key={t.name}>
            <button
              className={`btn btn-ghost btn-sm btn-block justify-start ${theme === t.name ? 'btn-active' : ''}`}
              onClick={() => setTheme(t.name)}
            >
              <div className="flex items-center gap-2 w-full">
                <span className="flex-1 text-left">{t.label}</span>
                {theme === t.name && (
                  <svg
                    className="w-4 h-4 text-success"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ThemeSwitcher