import SpeedInsights from "@vercel/speed-insights";

export default function Home() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>CoachDeck Backend API</h1>
      <p>This is the backend API server for CoachDeck. All endpoints are available under /api/</p>
      <SpeedInsights />
    </div>
  );
} 