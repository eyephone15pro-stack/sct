import PredictForm from '@/components/Predictform';
import Chat from '@/components/Chat';

export default function Home() {
  return (
    <main>
      <header className="hero">
        <h1>What is your car really worth?</h1>
        <p>A machine-learning valuation trained on Indian used-car sales, with an assistant that can explain it, compare cars and plan the loan.</p>
      </header>
      <div className="layout">
        <PredictForm />
        <Chat />
      </div>
    </main>
  );
}