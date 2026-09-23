import './App.css';
import AppRoutes from './AppRoutes';
import { Navbar } from './shared';

function App() {

  return (
    <>
      <Navbar/>
      <main>
        <AppRoutes/>
      </main>
    </>
  )
}

export default App
