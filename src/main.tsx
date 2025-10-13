import { createRoot } from "react-dom/client";
import { Amplify } from 'aws-amplify';
import App from "./App.tsx";
import "./index.css";
import { amplifyConfig } from './config/amplify-config';

Amplify.configure(amplifyConfig);

createRoot(document.getElementById("root")!).render(<App />);
