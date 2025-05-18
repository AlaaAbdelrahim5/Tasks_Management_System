import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.jsx'

// Test if backend is accessible
console.log("🔄 Testing connection to backend server at http://localhost:4000/graphql...");
fetch("http://localhost:4000/graphql", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ 
    query: `query { __schema { types { name } } }` 
  }),
})
.then(res => {
  console.log("📡 Backend response status:", res.status);
  return res.json();
})
.then(data => {
  if (data.errors) {
    console.error("❌ GraphQL Error:", data.errors);
  } else {
    console.log("✅ Backend connection successful");
    console.log("📊 GraphQL schema types found:", data.data?.__schema?.types?.length || 0);
  }
})
.catch(error => {
  console.error("❌ Backend connection failed:", error);
  console.log("💡 Tip: Make sure the backend server is running on port 4000");
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <App />
  </StrictMode>,
)
