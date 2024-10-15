export default function Home() {
  const username = localStorage.getItem('username')

  return (
    <div>
    <header className="w-full bg-gradient-to-br from-blue-500 to-purple-600 p-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="text-4xl font-bold text-white">
          Welcome, {username}!
        </h1>
        <div className="flex gap-5">
        <button
          onClick={() => {
            localStorage.removeItem('token')
            localStorage.removeItem('userId')
            localStorage.removeItem('username')
            localStorage.removeItem('email')
            window.location.href = '/login'
          }}
          className="py-2 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition duration-200"
        >
          Logout
        </button>
        <button
            onClick={() => (window.location.href = '/edit-account')}
            className="py-2 px-6 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition duration-200">
        Edit Account
        </button>
        </div>
      </div>
    </header>

          <div className="max-w-[1200px] grid grid-cols-12 gap-4">
  {/* First Row: Box one (600px), Box two (300px), Box three (300px) */}
  <div className="col-span-6 bg-red-500 p-4">Box 1 (600px)</div>
  <div className="col-span-3 bg-green-500 p-4">Box 2 (300px)</div>
  <div className="col-span-3 bg-blue-500 p-4">Box 3 (300px)</div>
  
  {/* Second Row: Box four (1200px) */}
  <div className="col-span-12 bg-yellow-500 p-4">Box 4 (1200px)</div>
  
  {/* Third Row: Box five (400px), Box six (400px), Box seven (400px) */}
  <div className="col-span-4 bg-purple-500 p-4">Box 5 (400px)</div>
  <div className="col-span-4 bg-pink-500 p-4">Box 6 (400px)</div>
  <div className="col-span-4 bg-indigo-500 p-4">Box 7 (400px)</div>
  
  {/* Fourth Row: Box eight (600px), Box nine (600px) */}
  <div className="col-span-6 bg-teal-500 p-4">Box 8 (600px)</div>
  <div className="col-span-6 bg-orange-500 p-4">Box 9 (600px)</div>
</div>


    </div>
  )
}

