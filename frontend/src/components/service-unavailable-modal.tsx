import { X } from "lucide-react"

interface ServiceUnavailableModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ServiceUnavailableModal({ isOpen, onClose }: ServiceUnavailableModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Service Temporarily Unavailable
          </h2>
          
          <p className="text-gray-600 mb-4 leading-relaxed">
            CoachDeck is currently not running as the Supabase instance has been shut down due to inactivity.
          </p>
          
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              If you'd like to use this service or learn more:
            </p>
            
            <div className="space-y-2">
              <a
                href="https://www.linkedin.com/in/joshua-ndala/"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Contact me on LinkedIn
              </a>
              
              <a
                href="https://github.com/joshndala/var-vendetta"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-gray-800 text-white py-2 px-4 rounded-md hover:bg-gray-900 transition-colors text-sm font-medium"
              >
                Set it up yourself (GitHub)
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
