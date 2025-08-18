// src/router/RouteChangeTracker.jsx

import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import ReactGA from "react-ga4";

// COLOQUE SEU ID DO GOOGLE ANALYTICS AQUI
const GOOGLE_ANALYTICS_ID = "G-BBQD2176G1";

const RouteChangeTracker = () => {
    const location = useLocation();
    const [initialized, setInitialized] = useState(false);

    // Inicializa o GA apenas uma vez e em ambiente de produção
    useEffect(() => {
        if (process.env.NODE_ENV === 'production' && GOOGLE_ANALYTICS_ID) {
            ReactGA.initialize(GOOGLE_ANALYTICS_ID);
            setInitialized(true);
        }
    }, []);

    // Envia o evento de pageview a cada mudança de rota
    useEffect(() => {
        if (initialized) {
            ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
        }
    }, [initialized, location]);

    // Este componente não renderiza nada na tela
    return null; 
};

export default RouteChangeTracker;