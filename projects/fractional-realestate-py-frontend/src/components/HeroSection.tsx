import { useWallet } from '@txnlab/use-wallet-react'
import { HeartIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

export default function HeroSection() {
  const { activeAddress } = useWallet()

  return (
    <div className="text-center max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
            <HeartIcon className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-gradient-elegant mb-6">
          Responsive Donations
        </h1>
        <p className="text-xl md:text-2xl text-slate-600 leading-relaxed font-light max-w-3xl mx-auto">
          Where sophisticated philanthropy meets cutting-edge technology to create meaningful, measurable charitable impact
        </p>
      </div>

      {!activeAddress ? (
        <div className="card-elegant p-10 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-sage-100 to-sage-200 rounded-2xl flex items-center justify-center mx-auto">
                <span className="text-3xl">💎</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-800">Instant Impact</h3>
              <p className="text-slate-600 leading-relaxed">
                Direct charitable contributions with immediate processing and transparent impact tracking
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-navy-100 to-navy-200 rounded-2xl flex items-center justify-center mx-auto">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-800">Responsive Giving</h3>
              <p className="text-slate-600 leading-relaxed">
                Conditional donations that activate based on verified real-world events and outcomes
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto">
                <span className="text-3xl">🔬</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-800">Verified Outcomes</h3>
              <p className="text-slate-600 leading-relaxed">
                Decentralized oracle network ensures accuracy and prevents manipulation of event data
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card-elegant p-8 mb-10">
          <div className="flex items-center justify-center space-x-6">
            <div className="w-16 h-16 bg-gradient-to-br from-sage-500 to-sage-700 rounded-2xl flex items-center justify-center">
              <ShieldCheckIcon className="h-8 w-8 text-white" />
            </div>
            <div className="text-left">
              <p className="text-xl font-semibold text-slate-800">Wallet Connected</p>
              <p className="text-slate-600 font-mono">
                {activeAddress.slice(0, 12)}...{activeAddress.slice(-12)}
              </p>
              <p className="text-sm text-sage-600 font-medium mt-1">Ready for philanthropic action</p>
            </div>
          </div>
        </div>
      )}

      {/* Philanthropic Use Cases */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
        <div className="card-elegant p-6 text-center group hover:scale-105 transition-transform duration-200">
          <div className="text-3xl mb-4">🌍</div>
          <h4 className="font-semibold text-slate-800 mb-2">Climate Action</h4>
          <p className="text-sm text-slate-600 leading-relaxed">Respond to environmental milestones and climate events</p>
        </div>
        
        <div className="card-elegant p-6 text-center group hover:scale-105 transition-transform duration-200">
          <div className="text-3xl mb-4">🏥</div>
          <h4 className="font-semibold text-slate-800 mb-2">Medical Research</h4>
          <p className="text-sm text-slate-600 leading-relaxed">Support breakthrough research and healthcare initiatives</p>
        </div>
        
        <div className="card-elegant p-6 text-center group hover:scale-105 transition-transform duration-200">
          <div className="text-3xl mb-4">🎓</div>
          <h4 className="font-semibold text-slate-800 mb-2">Educational Excellence</h4>
          <p className="text-sm text-slate-600 leading-relaxed">Fund academic achievements and educational programs</p>
        </div>
        
        <div className="card-elegant p-6 text-center group hover:scale-105 transition-transform duration-200">
          <div className="text-3xl mb-4">🕊️</div>
          <h4 className="font-semibold text-slate-800 mb-2">Humanitarian Aid</h4>
          <p className="text-sm text-slate-600 leading-relaxed">Provide critical assistance during global crises</p>
        </div>
      </div>
    </div>
  )
}
