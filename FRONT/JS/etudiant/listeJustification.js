// Chargement des composants
async function loadComponent(path) {
    try {
        const script = document.createElement('script');
        script.src = path;
        document.body.appendChild(script);
        return new Promise((resolve) => {
            script.onload = resolve;
        });
    } catch (error) {
        console.error('Erreur de chargement du composant:', error);
        showAlert('Erreur de chargement des composants', 'error');
    }
}

// Chargement et affichage des justifications
async function loadAndDisplayJustifications(userId) {
    try {
        // 1. Trouver l'étudiant correspondant à l'utilisateur
        const response = await fetch('../../../BACK/data.json');
        const data = await response.json();
        
        const etudiant = data.etudiant.find(e => e.id_utilisateur == userId);
        if (!etudiant) {
            showAlert('Étudiant non trouvé', 'error');
            return;
        }

        // 2. Trouver toutes les absences de l'étudiant
        const absencesEtudiant = data.absence.filter(a => a.id_etudiant == etudiant.id_etudiant);

        // 3. Trouver les justifications pour ces absences
        const justifications = data.justification
            .filter(j => absencesEtudiant.some(a => a.id_absence == j.id_absence))
            .map(j => {
                const absence = absencesEtudiant.find(a => a.id_absence == j.id_absence);
                const cours = data.cours.find(c => c.id_cours == absence.id_cours);
                const module = data.module.find(m => m.id_module == cours.id_module);
                
                return {
                    id: j.id_justification,
                    date: formatDate(j.date),
                    motif: j.motif,
                    etat: j.etat,
                    cours: module?.libelle || 'Cours inconnu',
                    date_absence: formatDate(absence.date),
                    heure: `${formatTime(cours.heure_debut)} - ${formatTime(cours.heure_fin)}`
                };
            });

        // 4. Afficher les justifications
        displayJustifications(justifications);
        
    } catch (error) {
        console.error('Erreur:', error);
        showAlert('Erreur de chargement des justifications', 'error');
    }
}

// Affichage des justifications dans le DOM
function displayJustifications(justifications) {
    const container = document.getElementById('justificationsContainer');
    
    if (!justifications || justifications.length === 0) {
        container.innerHTML = noJustificationMessage();
        return;
    }

    container.innerHTML = justifications.map(j => createJustificationCard(j)).join('');

    // Ajout des écouteurs d'événements
    addCardEventListeners();
}

// Création du message quand il n'y a pas de justification
function noJustificationMessage() {
    return `
        <div class="col-span-full py-16 text-center animate-pulse">
            <div class="mx-auto w-28 h-28 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mb-6 shadow-inner">
                <i class="fas fa-file-signature text-4xl text-gray-300"></i>
            </div>
            <h3 class="text-xl font-medium text-gray-700">Aucune justification</h3>
            <p class="text-gray-400 mt-2">Les justifications apparaîtront ici</p>
        </div>
    `;
}

// Création d'une carte de justification
function createJustificationCard(justification) {
    return `
        <div class="relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 group transform hover:-translate-y-2 border border-gray-100">
            <!-- Bandeau coloré selon l'état -->
            <div class="absolute top-0 left-0 w-full h-2 ${getStatusColorClass(justification.etat)}"></div>
            
            <!-- Contenu -->
            <div class="p-5 pt-6">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <span class="inline-block px-3 py-1 text-xs font-semibold rounded-full ${getStatusBgClass(justification.etat)}">
                            ${justification.etat}
                        </span>
                        <h3 class="text-xl font-bold text-gray-800 mt-2">
                            ${justification.cours}
                        </h3>
                        <p class="text-sm text-gray-500 mt-1">
                            <i class="far fa-calendar-alt mr-1"></i> ${justification.date_absence} • ${justification.heure}
                        </p>
                    </div>
                    <span class="bg-white shadow-md rounded-lg px-2.5 py-1 text-sm font-bold text-primary border border-gray-100">
                        ${justification.date}
                    </span>
                </div>

                <!-- Motif -->
                <div class="mb-5">
                    <h4 class="text-sm font-medium text-gray-500 mb-1">Motif :</h4>
                    <p class="text-gray-700 line-clamp-3">
                        ${justification.motif}
                    </p>
                </div>

                <!-- Actions -->
                <div class="flex space-x-3">
                    ${justification.etat === 'En attente' ? `
                        <button class="edit-btn flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5" data-id="${justification.id}">
                            <i class="fas fa-edit mr-1"></i> Modifier
                        </button>
                    ` : ''}
                    
                    <button class="details-btn flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5" data-id="${justification.id}">
                        <i class="fas fa-eye mr-1"></i> Détails
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Ajout des écouteurs d'événements aux cartes
function addCardEventListeners() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            editJustification(id);
        });
    });

    document.querySelectorAll('.details-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            showDetails(id);
        });
    });
}

// Fonctions utilitaires
function getStatusColorClass(status) {
    switch(status.toLowerCase()) {
        case 'validé':
        case 'acceptée': return 'bg-gradient-to-r from-green-500 to-emerald-500';
        case 'en attente': return 'bg-gradient-to-r from-yellow-500 to-amber-500';
        case 'refusée': 
        case 'rejetée': return 'bg-gradient-to-r from-red-500 to-orange-500';
        default: return 'bg-gradient-to-r from-gray-500 to-gray-400';
    }
}

function getStatusBgClass(status) {
    switch(status.toLowerCase()) {
        case 'validé':
        case 'acceptée': return 'bg-green-100 text-green-800';
        case 'en attente': return 'bg-yellow-100 text-yellow-800';
        case 'refusée': 
        case 'rejetée': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function formatDate(dateString) {
    if (!dateString) return '--/--/----';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
}

function formatTime(timeString) {
    if (!timeString) return '--:--';
    return timeString.substring(0, 5);
}

function editJustification(id) {
    showAlert(`Modification de la justification #${id}`, 'info');
    // Implémenter la logique de modification ici
}

function showDetails(id) {
    showAlert(`Détails de la justification #${id}`, 'info');
    // Implémenter l'affichage des détails ici
}

function showAlert(message, type) {
    const alertDiv = document.getElementById('alertMessage');
    alertDiv.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : 'info-circle'} mr-3"></i>
            <span>${message}</span>
        </div>
    `;
    alertDiv.className = `mb-6 p-4 rounded-lg flex ${
        type === 'error' ? 'bg-red-100 text-red-800' : 
        type === 'success' ? 'bg-green-100 text-green-800' : 
        'bg-blue-100 text-blue-800'
    }`;
    alertDiv.classList.remove('hidden');
    
    setTimeout(() => {
        alertDiv.classList.add('hidden');
    }, 5000);
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    // Charger les composants UI
    await Promise.all([
        loadComponent('../composant/sidebar/sidebarEtudiant.js'),
        loadComponent('../composant/navbar/navbar.js'),
        loadComponent('../../JS/auth/deconnexion.js')
    ]);

    // Vérifier l'utilisateur connecté
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'Étudiant') {
        window.location.href = '../../HTML/connexion/connexion.html';
        return;
    }

    // Charger les justifications
    await loadAndDisplayJustifications(currentUser.id_utilisateur);
});