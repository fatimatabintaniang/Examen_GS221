
// Fonction pour charger les données depuis data.json
async function loadData() {
    try {
        const response = await fetch('../../../BACK/data.json');
        if (!response.ok) {
            throw new Error('Erreur de chargement des données');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erreur:', error);
        return null;
    }
}

// Fonction pour afficher les statistiques
async function displayStats() {
    const data = await loadData();
    if (data) {
        // Afficher le nom de l'utilisateur 
        const user = data.utilisateur.find(u => u.role === "Attaché");
        if (user) {
            document.getElementById('user-name').textContent = user.prenom;
        }

        // Calculer les statistiques
        const totalStudents = data.etudiant.length;
        const totalClasses = data.classe.length;
        const totalRegistrations = data.inscription.length;

        // Afficher les statistiques
        document.getElementById('total-students').textContent = totalStudents.toLocaleString();
        document.getElementById('total-classes').textContent = totalClasses.toLocaleString();
        document.getElementById('total-registrations').textContent = totalRegistrations.toLocaleString();
    }
}

// Fonction pour afficher la date actuelle
function displayCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = now.toLocaleDateString('fr-FR', options);
}

// Initialiser le dashboard
document.addEventListener('DOMContentLoaded', () => {
    displayCurrentDate();
    displayStats();
});
