// Service to handle notification storage and state using localStorage for persistence
class NotificationService {
    getNotifications(role) {
        const key = `notifications_${role}`;
        const data = localStorage.getItem(key);
        
        if (!data) {
            // Default mock data based on role if nothing exists yet
            let defaultNotifs = [];
            if (role === 'ADMINISTRATOR') {
                defaultNotifs = [
                    { id: 1, text: "L'entreprise 'WebNova' a demandé un accès partenaire.", time: "10 min ago", unread: true },
                    { id: 2, text: "Alerte système : Sauvegarde de la base de données terminée.", time: "2 hours ago", unread: true },
                    { id: 3, text: "5 nouveaux étudiants attendent l'activation de leur compte.", time: "1 day ago", unread: false }
                ];
            } else if (role === 'TEACHER') {
                defaultNotifs = [
                    { id: 4, text: "Emma LEFEVRE a soumis son rapport de stage. En attente de notation.", time: "1 hour ago", unread: true },
                    { id: 5, text: "Lucas DUPOND a mis à jour sa convention de stage.", time: "4 hours ago", unread: false }
                ];
            } else if (role === 'STUDENT') {
                defaultNotifs = [
                    { id: 6, text: "Félicitations ! Votre rapport de stage a été noté par votre tuteur.", time: "5 min ago", unread: true },
                    { id: 7, text: "Votre soutenance a été programmée pour le 15 Juin en Amphi A.", time: "2 days ago", unread: false }
                ];
            }
            localStorage.setItem(key, JSON.stringify(defaultNotifs));
            return defaultNotifs;
        }
        return JSON.parse(data);
    }

    saveNotifications(role, notifications) {
        localStorage.setItem(`notifications_${role}`, JSON.stringify(notifications));
    }
}

export default new NotificationService();