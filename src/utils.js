import {clients} from "./routes/routes.js";

export function getClientById(clientId) {
    return Object.values(clients).find(c => c.authStrategy.clientId === clientId) || null;
}
