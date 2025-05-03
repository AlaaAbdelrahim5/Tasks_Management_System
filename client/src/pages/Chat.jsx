import React, { useContext } from "react";
import { ThemeContext } from "../App";

const Chat = () => {
    const { darkMode } = useContext(ThemeContext);

    return (
        <div className={`flex flex-col md:flex-row min-h-screen pt-20 gap-6 p-4 ${
            darkMode ? 'bg-gray-900 text-gray-200' : 'bg-white text-gray-800'
        }`}>
            {/* Students List */}
            <div className={`w-full md:w-64 p-4 rounded-lg shadow-lg ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border border-gray-200'
            }`}>
                <h2 className={`text-lg font-bold mb-4 ${
                    darkMode ? 'text-white' : 'text-gray-800'
                }`}>
                    List of Students
                </h2>
                <div className="space-y-2">
                    {[1, 2, 3].map((_, i) => (
                        <div
                            key={i}
                            className={`px-4 py-3 rounded-lg cursor-pointer transition ${
                                darkMode 
                                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                                    : 'bg-gray-50 text-gray-800 hover:bg-gray-100 border border-gray-100'
                            }`}
                        >
                            Student {i + 1}
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Window */}
            <div className={`flex-1 flex flex-col rounded-lg shadow-lg overflow-hidden ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border border-gray-200'
            }`}>
                <div className={`text-lg font-semibold px-4 py-3 border-b ${
                    darkMode ? 'border-gray-700 text-white' : 'border-gray-200 text-gray-800'
                }`}>
                    Chatting with (Name)...
                </div>
                <div className={`flex-1 p-4 overflow-y-auto ${
                    darkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 text-gray-800'
                }`}>
                    {/* Sample messages */}
                    <div className={`mb-3 p-3 rounded-lg max-w-xs ${
                        darkMode ? 'bg-gray-700' : 'bg-blue-100'
                    }`}>
                        Hello, how are you?
                    </div>
                    <div className={`mb-3 p-3 rounded-lg max-w-xs ml-auto ${
                        darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                    }`}>
                        I'm fine, thanks!
                    </div>
                </div>
                <div className={`flex items-center border-t p-3 ${
                    darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                }`}>
                    <input
                        type="text"
                        placeholder="Type your message..."
                        className={`flex-1 px-4 py-2 rounded-lg mr-3 text-sm focus:outline-none focus:ring-2 ${
                            darkMode 
                                ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500' 
                                : 'bg-white border border-gray-300 text-gray-800 focus:ring-blue-500'
                        }`}
                    />
                    <button className={`px-5 py-2 rounded-lg transition ${
                        darkMode 
                            ? 'bg-blue-600 text-white hover:bg-blue-500' 
                            : 'bg-blue-600 text-white hover:bg-blue-500'
                    }`}>
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chat;